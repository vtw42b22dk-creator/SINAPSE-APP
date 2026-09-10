import { useEffect, useRef, useState } from "react";

export function InlineName(props) {
  var editingS = useState(false);
  var editing = editingS[0], setEditing = editingS[1];
  var valS = useState(props.value || "");
  var val = valS[0], setVal = valS[1];
  var lastTap = useRef(0);
  var inputRef = useRef(null);

  useEffect(function() {
    if (!editing) setVal(props.value || "");
  }, [props.value, editing]);

  useEffect(function() {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function commit() {
    var next = (val || "").trim();
    setEditing(false);
    if (!next || next === props.value) {
      setVal(props.value || "");
      return;
    }
    if (props.onSave) props.onSave(next);
  }

  function startEdit(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setVal(props.value || "");
    setEditing(true);
  }

  function onPointerUp(e) {
    e.stopPropagation();
    var now = Date.now();
    if (now - lastTap.current < 480) startEdit(e);
    lastTap.current = now;
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={props.inputClassName || ""}
        style={Object.assign({
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
          margin: 0,
          padding: "2px 0",
          border: "none",
          borderBottom: "1px solid rgba(255,255,255,0.28)",
          background: "transparent",
          color: "inherit",
          font: "inherit",
          outline: "none",
        }, props.inputStyle || {})}
        value={val}
        onClick={function(e) { e.stopPropagation(); }}
        onPointerUp={function(e) { e.stopPropagation(); }}
        onChange={function(e) { setVal(e.target.value); }}
        onBlur={commit}
        onKeyDown={function(e) {
          e.stopPropagation();
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { setEditing(false); setVal(props.value || ""); }
        }}
      />
    );
  }

  var Tag = props.tag || "span";
  return (
    <Tag
      className={props.className}
      style={Object.assign({ cursor: "text" }, props.style || {})}
      title="Duplo clique para editar o nome"
      onDoubleClick={startEdit}
      onPointerUp={onPointerUp}
    >
      {props.value}
    </Tag>
  );
}
