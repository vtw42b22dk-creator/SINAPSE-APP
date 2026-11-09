/* eslint-disable no-unused-vars, no-empty */
import { useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";

/** Entrega a sessão ao bot, no mesmo Chrome, para ele poder gravar no Supabase. */
export default function VintedLink() {
  var auth = useAuth();
  var userId = auth && auth.user ? auth.user.id : "";

  useEffect(function() {
    if (!userId || !supabase) return;
    var stopped = false;

    async function ping() {
      if (stopped) return;
      try {
        var res = await supabase.auth.getSession();
        var session = res && res.data ? res.data.session : null;
        if (!session || stopped) return;
        window.postMessage({
          source: "sinapse",
          type: "SINAPSE_VINTED_SESSION",
          session: {
            accessToken: session.access_token,
            refreshToken: session.refresh_token || "",
            expiresAt: (session.expires_at || 0) * 1000,
            userId: session.user.id,
            supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
            anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
          },
        }, window.location.origin);
      } catch (e) {}
    }

    ping();
    var id = setInterval(ping, 20000);
    return function() {
      stopped = true;
      clearInterval(id);
    };
  }, [userId]);

  return null;
}
