// ドメイン型定義。ツール全体で共有する。

/** 車番のブラケット表記。[S]=500 / [K]=580(軽) / [G]=その他 グレード表記。表示用のみ。 */
export type CarClass = 'S' | 'K' | 'G';

/** 予約1件（出発表・帰着表 共通の行データ）。 */
export interface Reservation {
  /** 一意キー。"佐賀 580 わ 6565" 全体。 */
  carId: string;
  /** 表示用の末尾4桁。"6565"。 */
  plateShort: string;
  /** ブラケット表記（表示のみ）。 */
  klass: CarClass;
  /** 車種名。"スペーシア"。パース失敗時はナンバー表から補完。 */
  model: string;
  /** 色。"ホワイト系"。 */
  color: string;
  /** 予約日時の左側（出発表なら出庫時刻／帰着表なら貸出開始）。 */
  departAt: Date;
  /** 予約日時の右側（出発表なら帰庫予定／帰着表なら帰着時刻）。 */
  returnAt: Date;
  /** パース元の生テキスト（デバッグ・確認グリッド用）。 */
  raw?: string;
}

/** 帰着リストと突き合わせた在店ステータス。 */
export type Presence =
  | 'returned_tonight' // 今夜帰着（帰着リストに存在＝在店確実）
  | 'assumed_present'; // 帰着リストに無い（おそらく待機車。要目視）

/** 店前に配置する1台分の情報。 */
export interface StagedCar {
  reservation: Reservation;
  presence: Presence;
  /** 帰着リストにあった場合の帰着時刻。 */
  returnedAt: Date | null;
}

/** 1レーン（前後ペア）。 */
export interface Lane {
  lane: number;
  front: StagedCar | null; // 前列＝早い出庫
  back: StagedCar | null; // 後列＝遅い出庫
}

/** 警告の種類。 */
export type WarningKind = 'late_return' | 'unconfirmed_stock' | 'overflow';

export interface LayoutWarning {
  kind: WarningKind;
  plateShort: string | null;
  message: string;
}

/** decideLayout の結果一式。 */
export interface LayoutResult {
  lanes: Lane[];
  /** 取り出し順（＝出庫時刻の昇順、店前ぶんのみ）。 */
  pullOrder: StagedCar[];
  /** 車庫から取りに行く車（9台目以降）。 */
  overflow: StagedCar[];
  warnings: LayoutWarning[];
}
