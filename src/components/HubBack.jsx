import { useNavigate } from "react-router-dom";

export var HUB_BACK_CSS = [
  ".hub-back{display:inline-flex;align-items:center;gap:8px;flex-shrink:0;padding:7px 12px 7px 9px;",
  "border:1px solid rgba(255,255,255,.1);border-radius:999px;background:rgba(255,255,255,.04);",
  "color:#A0A0A8;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.6px;",
  "transition:color .2s ease,background .2s ease,border-color .2s ease,transform .15s ease}",
  ".hub-back:hover{color:#EDEDEF;background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.22)}",
  ".hub-back:active{transform:scale(.96)}",
  ".hub-back-ic{display:grid;grid-template-columns:1fr 1fr;gap:2px;width:12px;height:12px}",
  ".hub-back-ic i{display:block;border-radius:1px;background:currentColor;opacity:.85}",
  "@media(max-width:719px){.hub-back{position:relative;z-index:3;pointer-events:auto;min-height:42px;padding:9px 14px 9px 12px;font-size:12px}",
  ".hub-back-ic{width:13px;height:13px}}",
].join("");

export function HubBack(props) {
  var navigate = useNavigate();
  return (
    <button
      type="button"
      className="hub-back"
      onClick={function() { if (props.onClick) props.onClick(); else navigate("/"); }}
      aria-label={props.label || "Voltar ao Hub"}
    >
      <span className="hub-back-ic" aria-hidden="true"><i /><i /><i /><i /></span>
      {props.label || "Hub"}
    </button>
  );
}
