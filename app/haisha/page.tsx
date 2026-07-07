import Link from "next/link";
import { PlacementApp } from "@/components/placement/PlacementApp";
import { lotConfig } from "@/lot.config";
import styles from "./page.module.css";

export default function HaishaPage() {
  return (
    <div className={`${styles.page} placement-scope`}>
      <header className={styles.masthead}>
        <Link href="/" className={styles.back}>
          ← メニューに戻る
        </Link>
        <p className={styles.kicker}>{lotConfig.storeName}</p>
        <h1 className={styles.title}>店前配置ツール</h1>
        <p className={styles.lede}>
          翌朝の<strong>出庫</strong>予定（＋前夜の<strong>帰着</strong>）を貼り付けると、
          店前8マス（4列×前後）の理想配置を計算します。
          <span className={styles.rule}>前列＝早い出庫 / 後列＝遅い出庫</span>
        </p>
      </header>
      <main className={styles.main}>
        <PlacementApp />
      </main>
      <footer className={styles.footer}>
        MVP・保存なし（ステートレス）。計算はブラウザ内で完結します。
      </footer>
    </div>
  );
}
