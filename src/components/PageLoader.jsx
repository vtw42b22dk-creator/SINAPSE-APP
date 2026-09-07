export var PAGE_LOADER_CSS = [
  "@keyframes plSpin{to{transform:rotate(360deg)}}",
  "@keyframes plPulse{0%,100%{opacity:.35;transform:scale(.92)}50%{opacity:1;transform:scale(1)}}",
  "@keyframes plOrbit{to{transform:rotate(360deg)}}",
  ".pl-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;",
  "padding:var(--pl-pad,72px 20px);min-height:var(--pl-min,240px)}",
  ".pl-wrap.is-compact{--pl-pad:36px 12px;--pl-min:160px;gap:16px}",
  ".pl-mark{position:relative;width:64px;height:64px}",
  ".pl-ring{position:absolute;inset:0;border-radius:50%;border:1px solid color-mix(in srgb,var(--mc,#E6E6E9) 35%,transparent);",
  "animation:plSpin 3.2s linear infinite}",
  ".pl-ring::after{content:'';position:absolute;top:-3px;left:50%;width:6px;height:6px;margin-left:-3px;",
  "border-radius:50%;background:var(--mc,#E6E6E9);box-shadow:0 0 10px var(--mc,#E6E6E9)}",
  ".pl-core{position:absolute;inset:18px;border-radius:50%;background:color-mix(in srgb,var(--mc,#E6E6E9) 18%,transparent);",
  "animation:plPulse 1.6s ease-in-out infinite}",
  ".pl-dot{position:absolute;width:7px;height:7px;border-radius:50%;background:var(--mc,#E6E6E9);",
  "top:50%;left:50%;margin:-3.5px 0 0 -3.5px;animation:plPulse 1.6s ease-in-out infinite}",
  ".pl-label{margin:0;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:2.4px;",
  "text-transform:uppercase;color:#6E6E76}",
].join("");

export function PageLoader(props) {
  var accent = props.accent || "#E6E6E9";
  return (
    <div
      className={"pl-wrap" + (props.compact ? " is-compact" : "")}
      style={{ "--mc": accent }}
      aria-busy="true"
      aria-label="A carregar"
    >
      <style>{PAGE_LOADER_CSS}</style>
      <div className="pl-mark" aria-hidden="true">
        <span className="pl-ring" />
        <span className="pl-core" />
        <span className="pl-dot" />
      </div>
      <p className="pl-label">{props.label || "A carregar"}</p>
    </div>
  );
}
