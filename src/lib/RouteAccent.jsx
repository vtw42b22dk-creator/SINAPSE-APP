import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { moduleFromPath, moduleColor, COLORS } from "./theme";

/** Injeta --mc / --accent no documento consoante a rota activa. */
export default function RouteAccent() {
  var loc = useLocation();
  useEffect(function() {
    var id = moduleFromPath(loc.pathname);
    var c = moduleColor(id);
    var root = document.documentElement;
    root.style.setProperty("--mc", c);
    root.style.setProperty("--accent", c);
    if (id) root.dataset.module = id;
    else delete root.dataset.module;
    return function() {
      root.style.setProperty("--mc", COLORS.accent);
      root.style.setProperty("--accent", COLORS.accent);
      delete root.dataset.module;
    };
  }, [loc.pathname]);
  return null;
}
