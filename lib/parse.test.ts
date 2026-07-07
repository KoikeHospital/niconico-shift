import { describe, expect, test } from 'vitest';
import { parseReservations } from './parse';

// 実データ（2026-07-07 出発表）の貼り付けを想定した1行1予約テキスト。
const DEPARTURES_2026_07_07 = `
8時 [S] ライズ - ブラック系 佐賀 500 わ 6398 07月07日 08:00 ～ 07月07日 17:30
[K] スペーシア - ホワイト系 佐賀 580 わ 6565 07月07日 08:00 ～ 07月07日 18:30
[S] ライズ - ブラック系 佐賀 500 わ 6397 07月07日 08:00 ～ 07月07日 20:00
[K] スペーシア - ホワイト系 佐賀 580 わ 6566 07月07日 08:00 ～ 07月07日 20:00
[K] スペーシア - ホワイト系 佐賀 580 わ 6567 07月07日 08:00 ～ 07月08日 20:00
[S] ヤリス - ブラック系 佐賀 500 わ 6787 07月07日 08:30 ～ 07月07日 20:00
9時 [K] N-BOX - ホワイト系 佐賀 580 わ 6428 07月07日 09:00 ～ 07月07日 20:00
10時 [K] スペーシア - グレー系 佐賀 580 わ 7120 07月07日 10:00 ～ 07月07日 17:00
[K] N-BOX - ホワイト系 佐賀 580 わ 6427 07月07日 10:30 ～ 07月07日 17:00
11時 該当予約なし
12時 該当予約なし
13時 [K] スペーシア - グレー系 佐賀 580 わ 7123 07月07日 13:00 ～ 07月14日 13:00
14時 該当予約なし
`;

describe('parseReservations', () => {
  test('「該当予約なし」と見出し行を除いた予約だけ抽出する', () => {
    const res = parseReservations(DEPARTURES_2026_07_07, 2026);
    expect(res).toHaveLength(10);
  });

  test('車番・車種・色を正しく抽出する', () => {
    const res = parseReservations(DEPARTURES_2026_07_07, 2026);
    const first = res[0];
    expect(first.plateShort).toBe('6398');
    expect(first.carId).toBe('佐賀 500 わ 6398');
    expect(first.klass).toBe('S');
    expect(first.model).toBe('ライズ');
    expect(first.color).toBe('ブラック');
  });

  test('出庫時刻(departAt)と帰庫時刻(returnAt)を分けて取る', () => {
    const [first] = parseReservations(DEPARTURES_2026_07_07, 2026);
    expect(first.departAt).toEqual(new Date(2026, 6, 7, 8, 0));
    expect(first.returnAt).toEqual(new Date(2026, 6, 7, 17, 30));
  });

  test('翌日帰庫（またぎ）を正しく翌日として解釈する', () => {
    const res = parseReservations(DEPARTURES_2026_07_07, 2026);
    const car6567 = res.find((r) => r.plateShort === '6567')!;
    expect(car6567.returnAt).toEqual(new Date(2026, 6, 8, 20, 0));
  });

  test('車種が取れない行はナンバー表から補完する', () => {
    const line = '佐賀 580 わ 6428 07月07日 09:00 ～ 07月07日 20:00';
    const [res] = parseReservations(line, 2026);
    expect(res.model).toBe('N-BOX');
  });

  test('全角チルダ・半角チルダ両方を許容する', () => {
    const a = parseReservations('佐賀 500 わ 6398 07月07日 08:00 ~ 07月07日 17:30', 2026);
    const b = parseReservations('佐賀 500 わ 6398 07月07日 08:00 〜 07月07日 17:30', 2026);
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
  });
});
