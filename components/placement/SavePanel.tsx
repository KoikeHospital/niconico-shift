"use client";

import { useEffect, useState } from "react";
import type { LayoutResult } from "@/lib/types";
import {
  deleteLayout,
  inferTargetDate,
  listLayouts,
  saveLayout,
  toSavedLayout,
  type LayoutLogRow,
} from "./persist";
import { SavedView } from "./SavedView";
import styles from "./placement.module.css";

type Props = {
  result: LayoutResult;
  /** 保存・削除で保存ログが変わったとき、上部の「保存済みの配置」を取り直させる。 */
  onSaved?: () => void;
};

export function SavePanel({ result, onSaved }: Props) {
  const [date, setDate] = useState(() => inferTargetDate(result));
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState<LayoutLogRow[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logError, setLogError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  // 対象日は計算結果が変わったら追従（別の日を計算し直したとき）。
  useEffect(() => {
    setDate(inferTargetDate(result));
    setMessage("");
  }, [result]);

  const loadLogs = async () => {
    setLoadingLogs(true);
    const { rows, error } = await listLayouts();
    setLogs(rows);
    setLogError(error ?? "");
    setLoadingLogs(false);
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    const payload = toSavedLayout(result, date);
    const { error } = await saveLayout({ date, label, payload });
    if (error) {
      setMessage(`保存に失敗しました: ${error}`);
    } else {
      setMessage("保存しました。");
      setLabel("");
      await loadLogs();
      onSaved?.();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この保存ログを削除しますか？")) return;
    const { error } = await deleteLayout(id);
    if (error) {
      setLogError(`削除に失敗しました: ${error}`);
      return;
    }
    if (openId === id) setOpenId(null);
    await loadLogs();
    onSaved?.();
  };

  return (
    <section className={styles.card} aria-labelledby="save-heading">
      <div className={styles.cardHead}>
        <h2 id="save-heading" className={styles.cardTitle}>
          4. 保存（日次ログ）
        </h2>
      </div>

      <div className={styles.saveGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>対象日</span>
          <input
            type="date"
            className={styles.inDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            メモ<em>任意（担当者名など）</em>
          </span>
          <input
            className={styles.inLabel}
            value={label}
            placeholder="例：朝番 池田"
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
      </div>

      <div className={styles.cardFoot}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={handleSave}
          disabled={saving || !date}
        >
          {saving ? "保存中…" : "この配置を保存 →"}
        </button>
        {message && <p className={styles.hint}>{message}</p>}
      </div>

      <div className={styles.logHead}>
        <h3 className={styles.logTitle}>保存済みログ</h3>
        <button
          type="button"
          className={styles.ghostBtn}
          onClick={loadLogs}
          disabled={loadingLogs}
        >
          {loadingLogs ? "更新中…" : "再読込"}
        </button>
      </div>

      {logError && <p className={styles.hint}>{logError}</p>}

      {logs.length === 0 && !loadingLogs ? (
        <p className={styles.muted}>まだ保存はありません。</p>
      ) : (
        <ul className={styles.logList}>
          {logs.map((row) => {
            const isOpen = openId === row.id;
            const created = new Date(row.created_at);
            return (
              <li key={row.id} className={styles.logItem}>
                <div className={styles.logRow}>
                  <button
                    type="button"
                    className={styles.logOpen}
                    onClick={() => setOpenId(isOpen ? null : row.id)}
                    aria-expanded={isOpen}
                  >
                    <span className={styles.logDate}>{row.date}</span>
                    {row.label && (
                      <span className={styles.logLabel}>{row.label}</span>
                    )}
                    <span className={styles.logMeta}>
                      店前 {row.payload.pullOrder.length}台 ・{" "}
                      {created.toLocaleString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className={styles.logChevron}>{isOpen ? "▲" : "▼"}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => handleDelete(row.id)}
                    aria-label={`${row.date} のログを削除`}
                  >
                    ×
                  </button>
                </div>
                {isOpen && <SavedView saved={row.payload} />}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
