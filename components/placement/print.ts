// 指定した1枚のカードだけを印刷する共通処理。
// 押されたカードに .printing-target を付け、body に .printing-layout を付ける。
// @media print 側で「.printing-target 以外を隠す」ことで、そのカードだけを1枚に印刷する。
// 複数の印刷ボタン（配置図・保存済み配置）が同居しても、押した方だけが対象になる。

export function printCard(el: HTMLElement | null): void {
  if (!el) return;
  const body = document.body;
  el.classList.add("printing-target");
  body.classList.add("printing-layout");
  const cleanup = () => {
    el.classList.remove("printing-target");
    body.classList.remove("printing-layout");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}
