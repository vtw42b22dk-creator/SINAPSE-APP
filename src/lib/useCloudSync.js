import { useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabase";

var POLL_MS = 10000;

/** Recarrega da nuvem ao abrir, ao voltar à app, a cada ~10s e via Supabase Realtime. */
export function useCloudSync(loadFn, tables) {
  var auth = useAuth();
  var userId = auth && auth.user ? auth.user.id : null;
  var syncingRef = useRef(false);
  var readyRef = useRef(false);
  var loadRef = useRef(loadFn);
  loadRef.current = loadFn;

  function runLoad() {
    syncingRef.current = true;
    return Promise.resolve()
      .then(function() { return loadRef.current(); })
      .catch(function() {})
      .finally(function() {
        syncingRef.current = false;
        readyRef.current = true;
      });
  }

  useEffect(
    function() {
      if (!userId) return;
      runLoad();
    },
    [userId]
  );

  useEffect(
    function() {
      if (!userId) return;
      function refresh() {
        if (!readyRef.current) return;
        if (document.visibilityState && document.visibilityState !== "visible") return;
        runLoad();
      }
      window.addEventListener("focus", refresh);
      document.addEventListener("visibilitychange", refresh);
      return function() {
        window.removeEventListener("focus", refresh);
        document.removeEventListener("visibilitychange", refresh);
      };
    },
    [userId]
  );

  useEffect(
    function() {
      if (!userId) return;
      var interval = setInterval(function() {
        if (document.visibilityState === "hidden") return;
        if (!readyRef.current) return;
        runLoad();
      }, POLL_MS);
      return function() { clearInterval(interval); };
    },
    [userId]
  );

  useEffect(
    function() {
      if (!userId || !supabase || !tables || !tables.length) return;
      var debounce;
      function bump() {
        if (!readyRef.current) return;
        clearTimeout(debounce);
        debounce = setTimeout(runLoad, 500);
      }
      var channel = supabase.channel("sinapse-" + userId + "-" + tables.join("-"));
      tables.forEach(function(table) {
        channel.on(
          "postgres_changes",
          { event: "*", schema: "public", table: table, filter: "user_id=eq." + userId },
          bump
        );
      });
      channel.subscribe();
      return function() {
        clearTimeout(debounce);
        supabase.removeChannel(channel);
      };
    },
    [userId, tables.join(",")]
  );

  return syncingRef;
}
