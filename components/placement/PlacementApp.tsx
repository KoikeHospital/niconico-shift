"use client";

import { useMemo, useState } from "react";
import { parseReservations } from "@/lib/parse";
import { decideLayout, indexReturns } from "@/lib/decideLayout";
import type { LayoutResult } from "@/lib/types";
import { InputPanel } from "./InputPanel";
import { ConfirmGrid } from "./ConfirmGrid";
import { LayoutDiagram } from "./LayoutDiagram";
import { ResultPanel } from "./ResultPanel";
import { SavePanel } from "./SavePanel";
import {
  blankRow,
  reservationToRow,
  rowToReservation,
  type EditableDeparture,
} from "./model";
import styles from "./placement.module.css";

export function PlacementApp() {
  const [departuresText, setDeparturesText] = useState("");
  const [returnsText, setReturnsText] = useState("");
  const [rows, setRows] = useState<EditableDeparture[] | null>(null);
  const [result, setResult] = useState<LayoutResult | null>(null);

  // 帰着リストの索引。グリッドの在店バッジ表示に使う（計算前でも見える）。
  const returnsIndex = useMemo(
    () => indexReturns(parseReservations(returnsText)),
    [returnsText],
  );

  const handleLoad = () => {
    const parsed = parseReservations(departuresText);
    setRows(parsed.map(reservationToRow));
    setResult(null);
  };

  const handleRowChange = (key: string, patch: Partial<EditableDeparture>) => {
    setRows((prev) =>
      prev
        ? prev.map((row) => (row.key === key ? { ...row, ...patch } : row))
        : prev,
    );
  };

  const handleRemoveRow = (key: string) => {
    setRows((prev) => (prev ? prev.filter((row) => row.key !== key) : prev));
  };

  const handleAddRow = () => {
    setRows((prev) => (prev ? [...prev, blankRow()] : [blankRow()]));
  };

  const handleCompute = () => {
    if (!rows) return;
    const departures = rows
      .filter((row) => row.included)
      .map(rowToReservation);
    const returns = parseReservations(returnsText);
    setResult(decideLayout({ departures, returns }));
  };

  const includedCount = rows?.filter((row) => row.included).length ?? 0;

  return (
    <div className={styles.app}>
      <InputPanel
        departuresText={departuresText}
        returnsText={returnsText}
        onDeparturesChange={setDeparturesText}
        onReturnsChange={setReturnsText}
        onLoad={handleLoad}
      />

      {rows && (
        <ConfirmGrid
          rows={rows}
          returnsIndex={returnsIndex}
          hasReturns={returnsIndex.size > 0}
          includedCount={includedCount}
          onRowChange={handleRowChange}
          onRemoveRow={handleRemoveRow}
          onAddRow={handleAddRow}
          onCompute={handleCompute}
        />
      )}

      {result && (
        <div className={styles.results}>
          <LayoutDiagram lanes={result.lanes} />
          <ResultPanel
            pullOrder={result.pullOrder}
            overflow={result.overflow}
            warnings={result.warnings}
          />
          <SavePanel result={result} />
        </div>
      )}
    </div>
  );
}
