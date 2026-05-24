import { useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";

/**
 * Carrega da nuvem ao abrir o módulo e quando voltas ao separador
 * (se não estiveres a editar — evita apagar texto a meio).
 */
export function useCloudSync(loadFn, opts) {
  opts = opts || {};
  var auth = useAuth();
  var userId = auth && auth.user ? auth.user.id : null;
  var loadRef = useRef(loadFn);
  var didLoad = useRef(false);
  var optsRef = useRef(opts);
  loadRef.current = loadFn;
  optsRef.current = opts;

  useEffect(
    function() {
      if (!userId) {
        didLoad.current = false;
        return;
      }
      if (didLoad.current) return;
      didLoad.current = true;
      Promise.resolve()
        .then(function() { return loadRef.current(); })
        .catch(function() {});
    },
    [userId]
  );

  useEffect(
    function() {
      if (!userId) return;
      function pullIfVisible() {
        if (document.visibilityState === "hidden") return;
        var o = optsRef.current;
        if (o.shouldSkip && o.shouldSkip()) return;
        loadRef.current().catch(function() {});
      }
      document.addEventListener("visibilitychange", pullIfVisible);
      window.addEventListener("focus", pullIfVisible);
      return function() {
        document.removeEventListener("visibilitychange", pullIfVisible);
        window.removeEventListener("focus", pullIfVisible);
      };
    },
    [userId]
  );

  return {
    reload: function() {
      return loadRef.current();
    },
  };
}
