import { useNavigate } from "react-router-dom";

export var HUB_BACK_CSS = [
  ".hub-back{display:inline-flex;align-items:center;gap:8px;flex-shrink:0;padding:7px 12px 7px 9px;",
  "border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);",
  "color:#A0A0A8;cursor:pointer;font-family:'Manrope',sans-serif;font-size:11px;letter-spacing:.6px;",
  "transition:color .2s ease,background .2s ease,border-color .2s ease,transform .15s ease}",
  ".hub-back:hover{color:#EDEDEF;background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.22)}",
  ".hub-back:active{transform:scale(.96)}",
  ".hub-back-ic{width:12px;height:12px;display:block}",
  "@media(max-width:719px){.hub-back{position:relative;z-index:3;pointer-events:auto;min-height:42px;padding:9px 14px 9px 12px;font-size:12px}",
  ".hub-back-ic{width:13px;height:13px}}",
].join("");

export function HubBack(props) {
  var navigate = useNavigate();
  if (!props.onClick) return null;
  return (
    <button
      type="button"
      className="hub-back"
      onClick={function() { if (props.onClick) props.onClick(); else navigate("/"); }}
      aria-label={props.label || "Voltar"}
    >
      <svg className="hub-back-ic" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M8 2 L4 6 L8 10" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      {props.label || "Voltar"}
    </button>
  );
}
