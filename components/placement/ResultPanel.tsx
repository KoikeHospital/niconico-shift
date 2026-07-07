"use client";

import { fmtTime } from "@/lib/format";
import type { LayoutWarning, StagedCar } from "@/lib/types";
import styles from "./placement.module.css";

type Props = {
  pullOrder: StagedCar[];
  overflow: StagedCar[];
  warnings: LayoutWarning[];
};

function carLine(car: StagedCar): string {
  const { reservation } = car;
  return `${reservation.plateShort} ${reservation.model} ${reservation.color}`.trim();
}

export function ResultPanel({ pullOrder, overflow, warnings }: Props) {
  return (
    <div className={styles.panelGrid}>
      <section className={styles.card} aria-labelledby="pull-heading">
        <h2 id="pull-heading" className={styles.cardTitle}>
          取り出し順（朝の手順）
        </h2>
        <ol className={styles.pullList}>
          {pullOrder.map((car, i) => (
            <li key={car.reservation.carId} className={styles.pullItem}>
              <span className={styles.pullNo}>{i + 1}</span>
              <span className={styles.pullTime}>
                {fmtTime(car.reservation.departAt)}
              </span>
              <span className={styles.pullCar}>{carLine(car)}</span>
              <span className={i < 4 ? styles.tagFront : styles.tagBack}>
                {i < 4 ? "前列" : "後列"}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className={styles.sideCol}>
        <section className={styles.card} aria-labelledby="garage-heading">
          <h2 id="garage-heading" className={styles.cardTitle}>
            車庫から手配
          </h2>
          {overflow.length === 0 ? (
            <p className={styles.muted}>なし（全台が店前に収まりました）。</p>
          ) : (
            <ul className={styles.garageList}>
              {overflow.map((car) => (
                <li key={car.reservation.carId}>
                  <span className={styles.pullTime}>
                    {fmtTime(car.reservation.departAt)}
                  </span>
                  <span>{carLine(car)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {warnings.length > 0 && (
          <section className={styles.card} aria-labelledby="warn-heading">
            <h2 id="warn-heading" className={styles.cardTitle}>
              在庫クロスチェック
            </h2>
            <ul className={styles.warnList}>
              {warnings.map((w, i) => (
                <li key={`${w.kind}-${w.plateShort ?? i}`} className={styles[w.kind]}>
                  {w.message}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
