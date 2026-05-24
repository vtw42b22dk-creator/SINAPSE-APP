/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

var KEY = "sinapse-theme-v1";
var ThemeContext = createContext(null);

export var THEMES = {
  neon: { id: "neon", label: "Neon", desc: "Escuro com acentos neon" },
  minimal: { id: "minimal", label: "Claro", desc: "Preto e branco minimalista" },
};

export function ThemeProvider(props) {
  var tS = useState(function() {
    try { return localStorage.getItem(KEY) || "neon"; } catch (e) { return "neon"; }
  });
  var theme = tS[0], setTheme = tS[1];

  useEffect(function() {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(KEY, theme); } catch (e) {}
  }, [theme]);

  var value = useMemo(function() {
    return {
      theme: theme,
      setTheme: setTheme,
      toggle: function() { setTheme(function(t) { return t === "neon" ? "minimal" : "neon"; }); },
      isMinimal: theme === "minimal",
    };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{props.children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function pageBg() {
  return "var(--page-bg)";
}

export function pageText() {
  return "var(--page-text)";
}
