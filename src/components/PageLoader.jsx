export var PAGE_LOADER_CSS = [
  "@keyframes plSpin{to{transform:rotate(360deg)}}",
  "@keyframes plBreathe{0%,100%{transform:scale(.86);opacity:.72}50%{transform:scale(1);opacity:1}}",
  ".pl-screen{flex:1;width:100%;min-height:100%;height:100%;display:flex;align-items:center;justify-content:center;background:transparent}",
  ".pl-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;",
  "padding:var(--pl-pad,72px 20px);min-height:var(--pl-min,240px);width:100%}",
  ".pl-wrap.is-compact{--pl-pad:28px 12px;--pl-min:140px;gap:12px}",
  ".pl-mark{position:relative;width:54px;height:54px;display:grid;place-items:center}",
  ".pl-arc,.pl-arc2{position:absolute;border-radius:50%;",
  "-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 2.4px));",
  "mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 2.4px))}",
  ".pl-arc{inset:0;background:conic-gradient(from 200deg,transparent 0 42%,var(--mc,#7BA3B8) 78%,#fff 100%);animation:plSpin .85s linear infinite}",
  ".pl-arc2{inset:9px;background:conic-gradient(from 30deg,transparent 0 55%,color-mix(in srgb,var(--mc,#7BA3B8) 75%,#fff) 100%);animation:plSpin 1.35s linear infinite reverse;opacity:.9}",
  ".pl-core{width:12px;height:12px;border-radius:50%;background:linear-gradient(160deg,#fff,var(--mc,#7BA3B8));animation:plBreathe 1.6s ease-in-out infinite}",
  ".pl-label{margin:0;font-family:'Manrope',sans-serif;font-size:13px;font-weight:600;letter-spacing:-.01em;color:rgba(255,255,255,.72)}",
].join("");

export function PageLoader(props) {
  var accent = props.accent || "#7BA3B8";
  return (
    <div
      className={"pl-wrap" + (props.compact ? " is-compact" : "")}
      style={{ "--mc": accent }}
      aria-busy="true"
      aria-label="A carregar"
    >
      <style>{PAGE_LOADER_CSS}</style>
      <div className="pl-mark" aria-hidden="true">
        <span className="pl-arc" />
        <span className="pl-arc2" />
        <span className="pl-core" />
      </div>
      <p className="pl-label">{props.label || "A carregar"}</p>
    </div>
  );
}
