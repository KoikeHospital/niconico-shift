// 出発表・帰着表の貼り付けテキストを Reservation[] にパースする。
// 1行 ＝ 1予約 を基本とし、行内に「車番」と「予約日時」が両方見つかった行だけ採用する。

import type { CarClass, Reservation } from './types';
import { modelForPlate } from './plates';

// [S] スペーシア - ホワイト系  → klass / model / color
const VEHICLE_RE = /\[(S|K|G)\]\s*(.+?)\s*[-‐−ー]\s*(.+?)系/;
// 佐賀 500 わ 6398 → placename / class3 / kana / serial4
const PLATE_RE = /([^\s\d]+)\s+(\d{3})\s+([ぁ-ん])\s+(\d{4})/;
// 07月07日 08:00 ～ 07月07日 17:30
const DATETIME_RE =
  /(\d{1,2})月(\d{1,2})日\s+(\d{1,2}):(\d{2})\s*[〜~～]\s*(\d{1,2})月(\d{1,2})日\s+(\d{1,2}):(\d{2})/;

const SKIP_RE = /該当予約なし/;

/** MM/DD/HH/mm と基準年から Date を作る。 */
function makeDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

/**
 * 貼り付けテキストを予約配列に変換する。
 * @param text 出発表または帰着表の貼り付け
 * @param baseYear 年（表記に無いため外から与える。既定は今年）
 */
export function parseReservations(
  text: string,
  baseYear: number = new Date().getFullYear(),
): Reservation[] {
  const results: Reservation[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\t/g, ' ').trim();
    if (!line || SKIP_RE.test(line)) continue;

    const plateMatch = line.match(PLATE_RE);
    const dtMatch = line.match(DATETIME_RE);
    // 車番と日時が揃わない行（見出し・時刻バケット等）は無視。
    if (!plateMatch || !dtMatch) continue;

    const [, placename, class3, kana, serial] = plateMatch;
    const plateShort = serial;
    const carId = `${placename} ${class3} ${kana} ${serial}`;

    const departAt = makeDate(
      baseYear,
      Number(dtMatch[1]),
      Number(dtMatch[2]),
      Number(dtMatch[3]),
      Number(dtMatch[4]),
    );
    let returnAt = makeDate(
      baseYear,
      Number(dtMatch[5]),
      Number(dtMatch[6]),
      Number(dtMatch[7]),
      Number(dtMatch[8]),
    );
    // 年跨ぎ（12月→1月など）の補正。
    if (returnAt < departAt) {
      returnAt = makeDate(
        baseYear + 1,
        Number(dtMatch[5]),
        Number(dtMatch[6]),
        Number(dtMatch[7]),
        Number(dtMatch[8]),
      );
    }

    const vehicleMatch = line.match(VEHICLE_RE);
    const klass = (vehicleMatch?.[1] ?? 'K') as CarClass;
    const parsedModel = vehicleMatch?.[2]?.trim() ?? '';
    const color = vehicleMatch?.[3]?.trim() ?? '';
    const model = parsedModel || modelForPlate(plateShort);

    results.push({
      carId,
      plateShort,
      klass,
      model,
      color,
      departAt,
      returnAt,
      raw: line,
    });
  }

  return results;
}
