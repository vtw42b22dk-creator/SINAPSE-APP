import { useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";

/** Carrega da nuvem só ao abrir o módulo (não sobrescreve enquanto escreves). */
export function useCloudSync(loadFn) {
  var auth = useAuth();
  var userId = auth && auth.user ? auth.user.id : null;
  var loadRef = useRef(loadFn);
  var didLoad = useRef(false);
  loadRef.current = loadFn;

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

  return {
    reload: function() {
      return loadRef.current();
    },
  };
}
