/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

var AuthContext = createContext(null);
var EMAIL_KEY = "sinapse-email";

export function lembrarEmail(email) {
  try {
    if (email) localStorage.setItem(EMAIL_KEY, String(email).trim());
  } catch (e) {}
}

export function emailLembrado() {
  try { return localStorage.getItem(EMAIL_KEY) || ""; } catch (e) { return ""; }
}

export function AuthProvider(props) {
  var sS = useState(null);
  var session = sS[0], setSession = sS[1];
  var lS = useState(true);
  var loading = lS[0], setLoading = lS[1];

  useEffect(function() {
    var vivo = true;
    if (!supabase) {
      setLoading(false);
      return;
    }

    function aplicar(proxima) {
      if (!vivo) return;
      if (proxima) {
        setSession(proxima);
        if (proxima.user && proxima.user.email) lembrarEmail(proxima.user.email);
      }
      setLoading(false);
    }

    supabase.auth.getSession().then(function(res) {
      aplicar(res && res.data ? res.data.session : null);
    }).catch(function() {
      if (vivo) setLoading(false);
    });

    var sub = supabase.auth.onAuthStateChange(function(event, nextSession) {
      if (!vivo) return;
      if (nextSession) {
        aplicar(nextSession);
        return;
      }
      if (event === "SIGNED_OUT") {
        supabase.auth.getSession().then(function(res) {
          if (!vivo) return;
          setSession(res && res.data ? res.data.session : null);
          setLoading(false);
        });
        return;
      }
      setLoading(false);
    });

    function aoVoltar() {
      if (document.visibilityState !== "visible") return;
      supabase.auth.getSession().then(function(res) {
        if (res && res.data && res.data.session) aplicar(res.data.session);
      });
    }
    document.addEventListener("visibilitychange", aoVoltar);

    return function() {
      vivo = false;
      document.removeEventListener("visibilitychange", aoVoltar);
      if (sub && sub.data && sub.data.subscription) sub.data.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    if (!supabase) throw new Error("Supabase não está configurado.");
    var res = await supabase.auth.signInWithPassword({ email: email, password: password });
    if (!res.error && res.data && res.data.session) {
      lembrarEmail(email);
      setSession(res.data.session);
    }
    return res;
  }

  async function signUp(email, password) {
    if (!supabase) throw new Error("Supabase não está configurado.");
    var res = await supabase.auth.signUp({ email: email, password: password });
    if (!res.error) lembrarEmail(email);
    if (!res.error && res.data && res.data.session) setSession(res.data.session);
    return res;
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut({ scope: "local" });
    setSession(null);
  }

  var value = useMemo(function() {
    return {
      session: session,
      user: session ? session.user : null,
      loading: loading,
      configured: !!supabase,
      signIn: signIn,
      signUp: signUp,
      signOut: signOut,
    };
  }, [session, loading]);

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
