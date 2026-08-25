/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect } from "react";

var ThemeContext = createContext(null);

/** Tema fixo: dark minimalista. */
export function ThemeProvider(props) {
  useEffect(function() {
    document.documentElement.setAttribute("data-theme", "dark");
    try { localStorage.setItem("sinapse-theme-v1", "dark"); } catch (e) {}
  }, []);

  return <ThemeContext.Provider value={{ theme: "dark" }}>{props.children}</ThemeContext.Provider>;
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
