// コアロジック：翌朝の出庫リスト（＋任意で帰着リスト）から店前8マスの配置を決める。
//
// 配置ルール：店前はタンデム駐車（前後）。後ろを出すには前を先に動かす必要があるため
//   前列 ＝ 早い出庫 / 後列 ＝ 遅い出庫
// これを守れば朝は前の車から順に出すだけで、後ろを動かす手間がゼロになる。

import type {
  LayoutResult,
  LayoutWarning,
  Lane,
  Presence,
  Reservation,
  StagedCar,
} from './types';
import { LATE_RETURN_HOUR, STAGED_CAPACITY, lotConfig } from '@/lot.config';

/** 出庫時刻の昇順。同時刻タイは帰庫時刻の昇順で安定化。 */
function byDepartAsc(a: Reservation, b: Reservation): number {
  return (
    a.departAt.getTime() - b.departAt.getTime() ||
    a.returnAt.getTime() - b.returnAt.getTime()
  );
}

/** 帰着リストを「ナンバー → 最新の帰着時刻」の索引にする。 */
export function indexReturns(returns: Reservation[]): Map<string, Date> {
  const map = new Map<string, Date>();
  for (const r of returns) {
    const prev = map.get(r.plateShort);
    // 同一ナンバーが複数回帰着（玉突き）する場合は最も遅い帰着を採用。
    if (!prev || r.returnAt > prev) map.set(r.plateShort, r.returnAt);
  }
  return map;
}

/** 1台を帰着索引で注釈して StagedCar にする。 */
function annotate(res: Reservation, returnsIdx: Map<string, Date>): StagedCar {
  const returnedAt = returnsIdx.get(res.plateShort) ?? null;
  const presence: Presence = returnedAt ? 'returned_tonight' : 'assumed_present';
  return { reservation: res, presence, returnedAt };
}

export interface DecideLayoutInput {
  /** 翌朝の出庫予約。 */
  departures: Reservation[];
  /** 前夜の帰着予約（在店クロスチェック用。省略可）。 */
  returns?: Reservation[];
}

/**
 * 店前配置を決定する。純関数。
 * 呼び出し側で「貸出中」除外などの実在庫フィルタを済ませた departures を渡す想定。
 */
export function decideLayout({
  departures,
  returns = [],
}: DecideLayoutInput): LayoutResult {
  const returnsIdx = indexReturns(returns);

  const sorted = [...departures].sort(byDepartAsc).map((r) => annotate(r, returnsIdx));

  const staged = sorted.slice(0, STAGED_CAPACITY);
  const overflow = sorted.slice(STAGED_CAPACITY);

  const half = lotConfig.laneCount;
  const front = staged.slice(0, half); // 早い出庫
  const back = staged.slice(half, STAGED_CAPACITY); // 遅い出庫

  const lanes: Lane[] = lotConfig.laneOrder.map((laneNo, i) => ({
    lane: laneNo,
    front: front[i] ?? null,
    back: back[i] ?? null,
  }));

  const warnings = buildWarnings(staged, overflow, returnsIdx.size > 0);

  return { lanes, pullOrder: staged, overflow, warnings };
}

function buildWarnings(
  staged: StagedCar[],
  overflow: StagedCar[],
  hasReturns: boolean,
): LayoutWarning[] {
  const warnings: LayoutWarning[] = [];

  for (const car of staged) {
    // 遅い帰着：前夜遅くに戻る車は清掃・給油の段取りに注意。
    if (car.returnedAt && car.returnedAt.getHours() >= LATE_RETURN_HOUR) {
      const hh = String(car.returnedAt.getHours()).padStart(2, '0');
      const mm = String(car.returnedAt.getMinutes()).padStart(2, '0');
      warnings.push({
        kind: 'late_return',
        plateShort: car.reservation.plateShort,
        message: `${car.reservation.plateShort} は前夜 ${hh}:${mm} 帰着。清掃・給油の時間に注意。`,
      });
    }
    // 在店未確認：帰着リストがあるのにそこに無い＝おそらく待機車。念のため目視。
    if (hasReturns && car.presence === 'assumed_present') {
      warnings.push({
        kind: 'unconfirmed_stock',
        plateShort: car.reservation.plateShort,
        message: `${car.reservation.plateShort} は帰着リストに無し。在店（貸出中でない）か確認。`,
      });
    }
  }

  if (overflow.length > 0) {
    warnings.push({
      kind: 'overflow',
      plateShort: null,
      message: `${overflow.length}台は店前に収まらないため車庫から手配。`,
    });
  }

  return warnings;
}
