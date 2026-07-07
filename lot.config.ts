// 現場に合わせて外出しする設定。4列の物理順・前後の向き・しきい値など。

export interface LotConfig {
  storeName: string;
  /** 店前レーン数（＝前後ペアの数）。 */
  laneCount: number;
  /** 出力図で左→右に並べるレーン番号。現場の物理並びに合わせる。 */
  laneOrder: number[];
  /** 図の下に出す出口方向のラベル。 */
  exitLabel: string;
}

export const lotConfig: LotConfig = {
  storeName: 'ニコニコレンタカー',
  laneCount: 4,
  laneOrder: [1, 2, 3, 4],
  exitLabel: '道路（出口）→',
};

/** 店前に置ける最大台数（laneCount × 前後2）。 */
export const STAGED_CAPACITY = lotConfig.laneCount * 2;

/** 帰着がこの時刻(時)以降なら「遅い帰着」として注意表示する。 */
export const LATE_RETURN_HOUR = 19;
