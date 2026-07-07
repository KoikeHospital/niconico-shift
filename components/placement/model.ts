// 確認グリッド用の編集可能な行モデルと Reservation との変換。

import type { CarClass, Reservation } from '@/lib/types';
import { fmtTime, withTime } from '@/lib/format';
import { modelForPlate } from '@/lib/plates';

export interface EditableDeparture {
  key: string;
  carId: string;
  plateShort: string;
  klass: CarClass;
  model: string;
  color: string;
  /** 出庫日（日付部分。時刻は departTime 側で編集する）。 */
  departDate: Date;
  /** 出庫時刻 "HH:MM"（編集用の生文字列）。 */
  departTime: string;
  /** 帰庫予定（タイブレーク用。MVPでは編集不可）。 */
  returnAt: Date;
  /** false = 貸出中などで店前に置けない（計算から除外）。 */
  included: boolean;
}

function newKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `row-${Math.random().toString(36).slice(2)}`;
}

export function reservationToRow(r: Reservation): EditableDeparture {
  return {
    key: newKey(),
    carId: r.carId,
    plateShort: r.plateShort,
    klass: r.klass,
    model: r.model,
    color: r.color,
    departDate: r.departAt,
    departTime: fmtTime(r.departAt),
    returnAt: r.returnAt,
    included: true,
  };
}

export function rowToReservation(row: EditableDeparture): Reservation {
  const departAt = withTime(row.departDate, row.departTime);
  return {
    carId: row.carId || `不明 ${row.plateShort}`,
    plateShort: row.plateShort,
    klass: row.klass,
    model: row.model || modelForPlate(row.plateShort),
    color: row.color,
    departAt,
    // 帰庫が出庫より前になってしまう編集は、同時刻扱いにしてタイブレークを壊さない。
    returnAt: row.returnAt < departAt ? departAt : row.returnAt,
  };
}

export function blankRow(): EditableDeparture {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0);
  return {
    key: newKey(),
    carId: '',
    plateShort: '',
    klass: 'K',
    model: '',
    color: '',
    departDate: date,
    departTime: '08:00',
    returnAt: date,
    included: true,
  };
}
