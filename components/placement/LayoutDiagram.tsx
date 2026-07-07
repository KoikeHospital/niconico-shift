"use client";

import { fmtTime } from "@/lib/format";
import { lotConfig } from "@/lot.config";
import type { Lane, StagedCar } from "@/lib/types";
import styles from "./placement.module.css";

type Props = {
  lanes: Lane[];
};

/** 店前配置カードだけを印刷する。body にフラグを付け、@media print で対象以外を隠す。 */
function printLayout(): void {
  const body = document.body;
  body.classList.add("printing-layout");
  const cleanup = () => {
    body.classList.remove("printing-layout");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}

function Cell({ car, row }: { car: StagedCar | null; row: "front" | "back" }) {
  if (!car) {
    return (
      <div className={`${styles.cell} ${styles.cellEmpty}`} aria-label="空マス">
        空
      </div>
    );
  }
  const { reservation } = car;
  return (
    <div className={`${styles.cell} ${styles[row]}`}>
      <span className={styles.cellPlate}>{reservation.plateShort}</span>
      <span className={styles.cellModel}>{reservation.model}</span>
      <span className={styles.cellTime}>{fmtTime(reservation.departAt)}</span>
    </div>
  );
}

export function LayoutDiagram({ lanes }: Props) {
  return (
    <section
      className={`${styles.card} printable-layout`}
      aria-labelledby="diagram-heading"
    >
      <p className={`${styles.printCaption} print-only`}>
        {lotConfig.storeName}　店前配置
      </p>
      <div className={styles.cardHead}>
        <h2 id="diagram-heading" className={styles.cardTitle}>
          3. 店前配置
        </h2>
        <div className={styles.headActions}>
          <span className={styles.legend}>
            <span className={styles.legFront}>前列＝早い出庫</span>
            <span className={styles.legBack}>後列＝遅い出庫</span>
          </span>
          <button
            type="button"
            className={`${styles.printBtn} no-print`}
            onClick={printLayout}
          >
            🖨 印刷
          </button>
        </div>
      </div>

      <div className={styles.lot}>
        <div className={styles.rowLabel}>後列</div>
        <div className={styles.lanesScroll}>
          <div
            className={styles.lanes}
            style={{
              gridTemplateColumns: `repeat(${lanes.length}, minmax(72px, 1fr))`,
            }}
          >
            {lanes.map((lane) => (
              <Cell key={`b-${lane.lane}`} car={lane.back} row="back" />
            ))}
            {lanes.map((lane) => (
              <Cell key={`f-${lane.lane}`} car={lane.front} row="front" />
            ))}
          </div>
        </div>
        <div className={styles.rowLabel}>前列</div>
        <div className={styles.exit}>{lotConfig.exitLabel}</div>
      </div>
    </section>
  );
}
