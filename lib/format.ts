// 表示用のフォーマット補助。

import type { CarClass } from './types';

/** Date を "HH:MM" にする。 */
export function fmtTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Date を "M/D HH:MM" にする（翌日帰庫などの表示用）。 */
export function fmtDayTime(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()} ${fmtTime(d)}`;
}

/** "HH:MM" を元 Date の同じ日付に適用した新しい Date を返す。不正入力は元の Date。 */
export function withTime(base: Date, hhmm: string): Date {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return base;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return base;
  return new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    hour,
    minute,
    0,
    0,
  );
}

const KLASS_LABEL: Record<CarClass, string> = {
  S: '普通',
  K: '軽',
  G: 'グレード',
};

export function klassLabel(klass: CarClass): string {
  return KLASS_LABEL[klass] ?? klass;
}
