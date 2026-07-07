// Phase 3（保存だけ）：計算した店前配置のスナップショットを Supabase に保存／呼び出しする。
// LayoutResult は Date を含むため、保存時は文字列だけの serializable な形に落として jsonb に入れる。
// これにより呼び出し側は Date 復元を気にせず、そのまま読み取り専用ビューを描ける。

import { supabase } from '@/utils/supabase';
import { fmtTime } from '@/lib/format';
import type { LayoutResult, Lane, StagedCar } from '@/lib/types';

const TABLE = 'layouts';

/** 保存用に文字列化した1台分。 */
export interface SavedCar {
  plateShort: string;
  model: string;
  color: string;
  /** 出庫時刻 "HH:MM"。 */
  departTime: string;
  presence: 'returned_tonight' | 'assumed_present';
}

/** 保存用に文字列化した1レーン。 */
export interface SavedLane {
  lane: number;
  front: SavedCar | null;
  back: SavedCar | null;
}

/** jsonb に格納する配置スナップショット。 */
export interface SavedLayout {
  /** 対象日（翌朝の出庫日）。YYYY-MM-DD。 */
  date: string;
  lanes: SavedLane[];
  pullOrder: SavedCar[];
  overflow: SavedCar[];
  warnings: { kind: string; message: string }[];
}

/** layouts テーブルの1行。 */
export interface LayoutLogRow {
  id: string;
  date: string;
  label: string | null;
  payload: SavedLayout;
  created_at: string;
}

function toSavedCar(car: StagedCar): SavedCar {
  const { reservation, presence } = car;
  return {
    plateShort: reservation.plateShort,
    model: reservation.model,
    color: reservation.color,
    departTime: fmtTime(reservation.departAt),
    presence,
  };
}

function toSavedLane(lane: Lane): SavedLane {
  return {
    lane: lane.lane,
    front: lane.front ? toSavedCar(lane.front) : null,
    back: lane.back ? toSavedCar(lane.back) : null,
  };
}

/** LayoutResult を保存用スナップショットに変換する。純関数。 */
export function toSavedLayout(result: LayoutResult, date: string): SavedLayout {
  return {
    date,
    lanes: result.lanes.map(toSavedLane),
    pullOrder: result.pullOrder.map(toSavedCar),
    overflow: result.overflow.map(toSavedCar),
    warnings: result.warnings.map((w) => ({ kind: w.kind, message: w.message })),
  };
}

/** 配置の対象日（翌朝の出庫日）を pullOrder 先頭から推定。空なら今日。 */
export function inferTargetDate(result: LayoutResult): string {
  const first = result.pullOrder[0]?.reservation.departAt;
  const d = first ?? new Date();
  return d.toLocaleDateString('sv-SE'); // YYYY-MM-DD
}

function messageOf(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return '不明なエラー';
}

/** 配置を保存する。成功時 error=null。 */
export async function saveLayout(input: {
  date: string;
  label: string;
  payload: SavedLayout;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from(TABLE).insert([
    {
      date: input.date,
      label: input.label.trim() || null,
      payload: input.payload,
    },
  ]);
  return { error: error ? messageOf(error) : null };
}

/** 保存済みログを新しい順に取得。 */
export async function listLayouts(
  limit = 20,
): Promise<{ rows: LayoutLogRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, date, label, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  return {
    rows: (data as LayoutLogRow[] | null) ?? [],
    error: error ? messageOf(error) : null,
  };
}

/** ログを1件削除。 */
export async function deleteLayout(
  id: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  return { error: error ? messageOf(error) : null };
}
