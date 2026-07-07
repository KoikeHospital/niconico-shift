"use client";

import { fmtDayTime, fmtTime } from "@/lib/format";
import type { EditableDeparture } from "./model";
import styles from "./placement.module.css";

type Props = {
  rows: EditableDeparture[];
  returnsIndex: Map<string, Date>;
  hasReturns: boolean;
  includedCount: number;
  onRowChange: (key: string, patch: Partial<EditableDeparture>) => void;
  onRemoveRow: (key: string) => void;
  onAddRow: () => void;
  onCompute: () => void;
};

export function ConfirmGrid({
  rows,
  returnsIndex,
  hasReturns,
  includedCount,
  onRowChange,
  onRemoveRow,
  onAddRow,
  onCompute,
}: Props) {
  return (
    <section className={styles.card} aria-labelledby="grid-heading">
      <div className={styles.cardHead}>
        <h2 id="grid-heading" className={styles.cardTitle}>
          2. 確認・修正
        </h2>
        <span className={styles.count}>
          店前対象 {includedCount} 台 / 読み込み {rows.length} 台
        </span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">在店</th>
              <th scope="col">ナンバー</th>
              <th scope="col">車種</th>
              <th scope="col">出庫</th>
              <th scope="col">帰庫予定</th>
              <th scope="col" className={styles.srOnly}>
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const returnedAt = returnsIndex.get(row.plateShort) ?? null;
              return (
                <tr
                  key={row.key}
                  className={row.included ? undefined : styles.rowExcluded}
                >
                  <td>
                    <label className={styles.stockToggle}>
                      <input
                        type="checkbox"
                        checked={row.included}
                        onChange={(e) =>
                          onRowChange(row.key, { included: e.target.checked })
                        }
                      />
                      <span>{row.included ? "在店" : "貸出中"}</span>
                    </label>
                    {hasReturns && (
                      <span
                        className={
                          returnedAt ? styles.badgeReturned : styles.badgeUnknown
                        }
                      >
                        {returnedAt
                          ? `今夜 ${fmtTime(returnedAt)} 帰着`
                          : "帰着記録なし"}
                      </span>
                    )}
                  </td>
                  <td>
                    <input
                      className={styles.inPlate}
                      value={row.plateShort}
                      inputMode="numeric"
                      onChange={(e) =>
                        onRowChange(row.key, { plateShort: e.target.value })
                      }
                      aria-label="ナンバー末尾4桁"
                    />
                  </td>
                  <td>
                    <input
                      className={styles.inModel}
                      value={row.model}
                      onChange={(e) =>
                        onRowChange(row.key, { model: e.target.value })
                      }
                      aria-label="車種"
                    />
                  </td>
                  <td>
                    <input
                      className={styles.inTime}
                      value={row.departTime}
                      inputMode="numeric"
                      placeholder="HH:MM"
                      onChange={(e) =>
                        onRowChange(row.key, { departTime: e.target.value })
                      }
                      aria-label="出庫時刻"
                    />
                  </td>
                  <td className={styles.muted}>{fmtDayTime(row.returnAt)}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => onRemoveRow(row.key)}
                      aria-label={`${row.plateShort} を削除`}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.cardFoot}>
        <button type="button" className={styles.ghostBtn} onClick={onAddRow}>
          + 行を追加
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={onCompute}
          disabled={includedCount === 0}
        >
          配置を計算 →
        </button>
      </div>
    </section>
  );
}
