"use client";

import { useEffect, useRef, useState } from "react";
import { lotConfig } from "@/lot.config";
import { listLayouts, type LayoutLogRow } from "./persist";
import { SavedView } from "./SavedView";
import { printCard } from "./print";
import styles from "./placement.module.css";

type Props = {
  /** SavePanel で保存されるたびに増える値。変わると最新配置を取り直す。 */
  reloadToken: number;
};

/**
 * ページを開いたときに、最後に保存した配置を上部へ自動表示する。
 * 保存が無い／取得に失敗した場合は何も表示しない（下の入力パネルへ進む）。
 */
export function CurrentLayout({ reloadToken }: Props) {
  const [row, setRow] = useState<LayoutLogRow | null>(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { rows } = await listLayouts(1);
      if (!active) return;
      setRow(rows[0] ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [reloadToken]);

  // 初回チラつき防止・保存が無い/失敗時は非表示。
  if (loading || !row) return null;

  const created = new Date(row.created_at);
  const meta = `${row.date}${row.label ? ` ・ ${row.label}` : ""} ・ ${created.toLocaleString(
    "ja-JP",
    { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" },
  )} 保存`;

  return (
    <section
      ref={cardRef}
      className={styles.card}
      aria-labelledby="current-heading"
    >
      <p className={`${styles.printCaption} print-only`}>
        {lotConfig.storeName}　店前配置
      </p>
      <div className={styles.cardHead}>
        <h2 id="current-heading" className={styles.cardTitle}>
          保存済みの配置
        </h2>
        <div className={styles.headActions}>
          <span className={styles.currentMeta}>{meta}</span>
          <button
            type="button"
            className={`${styles.printBtn} no-print`}
            onClick={() => printCard(cardRef.current)}
          >
            🖨 印刷
          </button>
        </div>
      </div>
      <SavedView saved={row.payload} />
    </section>
  );
}
