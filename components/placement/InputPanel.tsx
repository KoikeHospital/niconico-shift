"use client";

import styles from "./placement.module.css";
import { SAMPLE_DEPARTURES, SAMPLE_RETURNS } from "./sample";

type Props = {
  departuresText: string;
  returnsText: string;
  onDeparturesChange: (value: string) => void;
  onReturnsChange: (value: string) => void;
  onLoad: () => void;
};

export function InputPanel({
  departuresText,
  returnsText,
  onDeparturesChange,
  onReturnsChange,
  onLoad,
}: Props) {
  const handleSample = () => {
    onDeparturesChange(SAMPLE_DEPARTURES);
    onReturnsChange(SAMPLE_RETURNS);
  };

  return (
    <section className={styles.card} aria-labelledby="input-heading">
      <div className={styles.cardHead}>
        <h2 id="input-heading" className={styles.cardTitle}>
          1. 貼り付け
        </h2>
        <button
          type="button"
          className={styles.ghostBtn}
          onClick={handleSample}
        >
          サンプルを入れる
        </button>
      </div>

      <div className={styles.inputGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            翌朝の出庫（必須）
            <em>出発表を貼り付け</em>
          </span>
          <textarea
            className={styles.textarea}
            value={departuresText}
            onChange={(e) => onDeparturesChange(e.target.value)}
            placeholder="[S] ライズ - ブラック系 佐賀 500 わ 6398 07月07日 08:00 ～ 07月07日 17:30&#10;..."
            rows={8}
            spellCheck={false}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            前夜の帰着（任意）
            <em>在店チェックに使用</em>
          </span>
          <textarea
            className={styles.textarea}
            value={returnsText}
            onChange={(e) => onReturnsChange(e.target.value)}
            placeholder="帰着表を貼り付け（貼ると「今夜帰着」の車を判定します）"
            rows={8}
            spellCheck={false}
          />
        </label>
      </div>

      <div className={styles.cardFoot}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={onLoad}
          disabled={departuresText.trim().length === 0}
        >
          読み込む →
        </button>
        <p className={styles.hint}>
          読み込むと下に確認表が出ます。修正してから計算します。
        </p>
      </div>
    </section>
  );
}
