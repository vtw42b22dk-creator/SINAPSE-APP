import { useEffect, useRef, useState } from "react";

var TAP_MS = 520;

function stop(e) {
  if (!e) return;
  e.stopPropagation();
  if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
    e.nativeEvent.stopImmediatePropagation();
  }
}

export function InlineName(props) {
  var editingS = useState(false);
  var editing = editingS[0], setEditing = editingS[1];
  var valS = useState(props.value || "");
  var val = valS[0], setVal = valS[1];
  var inputRef = useRef(null);
  var timerRef = useRef(0);
  var ignoreBlurRef = useRef(false);
  var editingRef = useRef(false);
  editingRef.current = editing;

  useEffect(function() {
    if (!editing) setVal(props.value || "");
  }, [props.value, editing]);

  useEffect(function() {
    if (!editing || !inputRef.current) return;
    inputRef.current.focus();
    inputRef.current.select();
  }, [editing]);

  useEffect(function() {
    return function() { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  function commit() {
    var next = (val || "").trim();
    setEditing(false);
    editingRef.current = false;
    if (next === (props.value || "").trim()) {
      setVal(props.value || "");
      return;
    }
    if (!next && !props.allowEmpty) {
      setVal(props.value || "");
      return;
    }
    if (props.onSave) props.onSave(next);
  }

  function startEdit() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = 0;
    }
    ignoreBlurRef.current = true;
    setVal(props.value || "");
    setEditing(true);
    editingRef.current = true;
    setTimeout(function() { ignoreBlurRef.current = false; }, 280);
  }

  function onClick(e) {
    stop(e);
    if (editingRef.current) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = 0;
      startEdit();
      return;
    }
    timerRef.current = setTimeout(function() {
      timerRef.current = 0;
      if (props.onSingleClick) props.onSingleClick();
    }, TAP_MS);
  }

  var wrapStyle = Object.assign({
    display: "block",
    maxWidth: "100%",
    minWidth: 0,
    cursor: editing ? "text" : "text",
    position: "relative",
    zIndex: 3,
    touchAction: "manipulation",
  }, props.wrapStyle || {});

  if (editing) {
    var fieldStyle = Object.assign({
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
      letterSpacing: "inherit",
      outline: "none",
    }, props.inputStyle || {});
    var field = props.multiline ? (
      <textarea
        ref={inputRef}
        className={props.inputClassName || ""}
        rows={3}
        style={Object.assign(fieldStyle, { resize: "vertical", lineHeight: 1.5 })}
        value={val}
        onClick={stop}
        onPointerDown={stop}
        onMouseDown={stop}
        onChange={function(e) { setVal(e.target.value); }}
        onBlur={function() {
          if (ignoreBlurRef.current) {
            if (inputRef.current) inputRef.current.focus();
            return;
          }
          commit();
        }}
        onKeyDown={function(e) {
          e.stopPropagation();
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); }
          if (e.key === "Escape") {
            e.preventDefault();
            setEditing(false);
            editingRef.current = false;
            setVal(props.value || "");
          }
        }}
      />
    ) : (
      <input
        ref={inputRef}
        className={props.inputClassName || ""}
        style={fieldStyle}
        value={val}
        onClick={stop}
        onPointerDown={stop}
        onMouseDown={stop}
        onChange={function(e) { setVal(e.target.value); }}
        onBlur={function() {
          if (ignoreBlurRef.current) {
            if (inputRef.current) inputRef.current.focus();
            return;
          }
          commit();
        }}
        onKeyDown={function(e) {
          stop(e);
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") {
            e.preventDefault();
            setEditing(false);
            editingRef.current = false;
            setVal(props.value || "");
          }
        }}
      />
    );
    return (
      <span className={(props.className ? props.className + " " : "") + "is-editing"} style={wrapStyle} onClick={stop} onPointerDown={stop} onMouseDown={stop}>
        {field}
      </span>
    );
  }

  var Tag = props.tag || "span";
  return (
    <Tag
      className={props.className}
      style={Object.assign(wrapStyle, props.style || {})}
      title={props.title || "Duplo clique para editar"}
      onClick={onClick}
      onDoubleClick={function(e) {
        stop(e);
        e.preventDefault();
        startEdit();
      }}
      onPointerDown={stop}
      onMouseDown={stop}
    >
      {props.value || (props.placeholder ? <span style={{ opacity: 0.45 }}>{props.placeholder}</span> : null)}
    </Tag>
  );
}
