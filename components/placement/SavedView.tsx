"use client";

import { lotConfig } from "@/lot.config";
import type { SavedCar, SavedLayout } from "./persist";
import styles from "./placement.module.css";

type Props = {
  saved: SavedLayout;
};

function SavedCell({ car, row }: { car: SavedCar | null; row: "front" | "back" }) {
  if (!car) {
    return (
      <div className={`${styles.cell} ${styles.cellEmpty}`} aria-label="空マス">
        空
      </div>
    );
  }
  return (
    <div className={`${styles.cell} ${styles[row]}`}>
      <span className={styles.cellPlate}>{car.plateShort}</span>
      <span className={styles.cellModel}>{car.model}</span>
      <span className={styles.cellTime}>{car.departTime}</span>
    </div>
  );
}

export function SavedView({ saved }: Props) {
  return (
    <div className={styles.savedView}>
      <div className={styles.lot}>
        <div className={styles.rowLabel}>後列</div>
        <div className={styles.lanesScroll}>
          <div
            className={styles.lanes}
            style={{
              gridTemplateColumns: `repeat(${saved.lanes.length}, minmax(72px, 1fr))`,
            }}
          >
            {saved.lanes.map((lane) => (
              <SavedCell key={`b-${lane.lane}`} car={lane.back} row="back" />
            ))}
            {saved.lanes.map((lane) => (
              <SavedCell key={`f-${lane.lane}`} car={lane.front} row="front" />
            ))}
          </div>
        </div>
        <div className={styles.rowLabel}>前列</div>
        <div className={styles.exit}>{lotConfig.exitLabel}</div>
      </div>

      <ol className={styles.pullList}>
        {saved.pullOrder.map((car, i) => (
          <li key={`${car.plateShort}-${i}`} className={styles.pullItem}>
            <span className={styles.pullNo}>{i + 1}</span>
            <span className={styles.pullTime}>{car.departTime}</span>
            <span className={styles.pullCar}>
              {`${car.plateShort} ${car.model} ${car.color}`.trim()}
            </span>
            <span className={i < 4 ? styles.tagFront : styles.tagBack}>
              {i < 4 ? "前列" : "後列"}
            </span>
          </li>
        ))}
      </ol>

      {saved.overflow.length > 0 && (
        <p className={styles.muted}>
          車庫から手配 {saved.overflow.length} 台：
          {saved.overflow.map((c) => c.plateShort).join("、")}
        </p>
      )}
    </div>
  );
}
