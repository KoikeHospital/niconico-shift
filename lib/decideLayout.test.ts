import { describe, expect, test } from 'vitest';
import { decideLayout } from './decideLayout';
import { parseReservations } from './parse';

const DEPARTURES = `
[S] ライズ - ブラック系 佐賀 500 わ 6398 07月07日 08:00 ～ 07月07日 17:30
[K] スペーシア - ホワイト系 佐賀 580 わ 6565 07月07日 08:00 ～ 07月07日 18:30
[S] ライズ - ブラック系 佐賀 500 わ 6397 07月07日 08:00 ～ 07月07日 20:00
[K] スペーシア - ホワイト系 佐賀 580 わ 6566 07月07日 08:00 ～ 07月07日 20:00
[K] スペーシア - ホワイト系 佐賀 580 わ 6567 07月07日 08:00 ～ 07月08日 20:00
[S] ヤリス - ブラック系 佐賀 500 わ 6787 07月07日 08:30 ～ 07月07日 20:00
[K] N-BOX - ホワイト系 佐賀 580 わ 6428 07月07日 09:00 ～ 07月07日 20:00
[K] スペーシア - グレー系 佐賀 580 わ 7120 07月07日 10:00 ～ 07月07日 17:00
[K] N-BOX - ホワイト系 佐賀 580 わ 6427 07月07日 10:30 ～ 07月07日 17:00
[K] スペーシア - グレー系 佐賀 580 わ 7123 07月07日 13:00 ～ 07月14日 13:00
`;

const RETURNS = `
[K] スペーシア - グレー系 佐賀 580 わ 7120 07月07日 10:00 ～ 07月07日 17:00
[K] N-BOX - ホワイト系 佐賀 580 わ 6427 07月07日 10:30 ～ 07月07日 17:00
[K] スペーシア - ホワイト系 佐賀 580 わ 6568 06月21日 17:30 ～ 07月07日 17:30
[S] ライズ - ブラック系 佐賀 500 わ 6398 07月07日 08:00 ～ 07月07日 17:30
[K] スペーシア - グレー系 佐賀 580 わ 7124 07月03日 18:30 ～ 07月07日 18:30
[K] スペーシア - ホワイト系 佐賀 580 わ 6565 07月07日 08:00 ～ 07月07日 18:30
[S] ライズ - ブラック系 佐賀 500 わ 6399 07月06日 15:30 ～ 07月07日 19:30
[S] ライズ - ブラック系 佐賀 500 わ 6397 07月07日 08:00 ～ 07月07日 20:00
[K] スペーシア - ホワイト系 佐賀 580 わ 6566 07月07日 08:00 ～ 07月07日 20:00
[S] ヤリス - ブラック系 佐賀 500 わ 6787 07月07日 08:30 ～ 07月07日 20:00
[K] N-BOX - ホワイト系 佐賀 580 わ 6428 07月07日 09:00 ～ 07月07日 20:00
`;

describe('decideLayout', () => {
  const departures = parseReservations(DEPARTURES, 2026);

  test('先頭8台を店前(staged)、残りを車庫(overflow)にする', () => {
    const r = decideLayout({ departures });
    expect(r.pullOrder).toHaveLength(8);
    expect(r.overflow).toHaveLength(2);
    expect(r.overflow.map((c) => c.reservation.plateShort)).toEqual(['6427', '7123']);
  });

  test('4レーン。前列=早い出庫 / 後列=遅い出庫', () => {
    const r = decideLayout({ departures });
    expect(r.lanes).toHaveLength(4);
    // 各レーンで front の出庫時刻 <= back の出庫時刻
    for (const lane of r.lanes) {
      if (lane.front && lane.back) {
        expect(lane.front.reservation.departAt.getTime()).toBeLessThanOrEqual(
          lane.back.reservation.departAt.getTime(),
        );
      }
    }
  });

  test('取り出し順は出庫時刻の昇順', () => {
    const r = decideLayout({ departures });
    const times = r.pullOrder.map((c) => c.reservation.departAt.getTime());
    const sorted = [...times].sort((a, b) => a - b);
    expect(times).toEqual(sorted);
  });

  test('帰着リストがあると在店ステータスを付与する', () => {
    const returns = parseReservations(RETURNS, 2026);
    const r = decideLayout({ departures, returns });
    const car6565 = r.pullOrder.find((c) => c.reservation.plateShort === '6565')!;
    expect(car6565.presence).toBe('returned_tonight');
    expect(car6565.returnedAt).toEqual(new Date(2026, 6, 7, 18, 30));
  });

  test('帰着リストに無い出庫車は要確認(unconfirmed_stock)警告を出す', () => {
    // 6565 を帰着から抜くと、在店未確認の警告が立つ。
    const returns = parseReservations(RETURNS, 2026).filter(
      (r) => r.plateShort !== '6565',
    );
    const r = decideLayout({ departures, returns });
    const warn = r.warnings.find(
      (w) => w.kind === 'unconfirmed_stock' && w.plateShort === '6565',
    );
    expect(warn).toBeDefined();
  });

  test('遅い帰着(19時以降)は late_return 警告を出す', () => {
    const returns = parseReservations(RETURNS, 2026);
    const r = decideLayout({ departures, returns });
    // 6397 は 20:00、6566 は 20:00、6787 は 20:00、6428 は 20:00 帰着 → staged 内の該当に警告
    const late = r.warnings.filter((w) => w.kind === 'late_return');
    expect(late.length).toBeGreaterThan(0);
  });

  test('8台以下なら空マスができ、overflowは空', () => {
    const few = departures.slice(0, 5);
    const r = decideLayout({ departures: few });
    expect(r.overflow).toHaveLength(0);
    const filled = r.lanes.flatMap((l) => [l.front, l.back]).filter(Boolean);
    expect(filled).toHaveLength(5);
  });
});
