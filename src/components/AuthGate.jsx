import { useState } from "react";
import { useAuth } from "../lib/AuthContext";

export default function AuthGate(props) {
  var auth = useAuth();
  var eS = useState("");
  var email = eS[0], setEmail = eS[1];
  var pS = useState("");
  var password = pS[0], setPassword = pS[1];
  var mS = useState("login");
  var mode = mS[0], setMode = mS[1];
  var errS = useState("");
  var error = errS[0], setError = errS[1];
  var busyS = useState(false);
  var busy = busyS[0], setBusy = busyS[1];

  if (auth && auth.loading) {
    return (
      <div style={{minHeight:"100vh",background:"#0A0A0B",display:"flex",alignItems:"center",justifyContent:"center",color:"#A0A0A8",fontFamily:"'JetBrains Mono',monospace"}}>
        A carregar...
      </div>
    );
  }

  if (auth && auth.user) return props.children;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      var res = mode === "login" ? await auth.signIn(email, password) : await auth.signUp(email, password);
      if (res.error) setError(res.error.message);
      else if (mode === "signup") setError("Conta criada. Se o Supabase pedir confirmação, confirma o email antes de entrar.");
    } catch (ex) {
      setError(ex.message || "Não foi possível autenticar.");
    }
    setBusy(false);
  }

  return (
    <div style={{minHeight:"100vh",background:"#0A0A0B",display:"flex",alignItems:"center",justifyContent:"center",padding:24,color:"#EDEDEF",fontFamily:"'IBM Plex Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
      <form onSubmit={submit} style={{width:"min(420px,94vw)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:24,background:"#141416",boxShadow:"0 16px 48px rgba(0,0,0,0.55)",padding:28}}>
        <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,letterSpacing:2,color:"#6E6E76",margin:"0 0 10px"}}>SINAPSE APP</p>
        <h1 style={{fontFamily:"'JetBrains Mono',monospace",fontSize:28,margin:"0 0 8px"}}>{mode === "login" ? "Entrar" : "Criar conta"}</h1>
        <p style={{fontSize:13,color:"#A0A0A8",lineHeight:1.7,margin:"0 0 22px"}}>Usa a tua conta para sincronizar calendário, tarefas, sinapses e diário entre iOS e Windows.</p>
        <input value={email} onChange={function(e){setEmail(e.target.value);}} type="email" placeholder="Email" required style={fieldStyle()}/>
        <input value={password} onChange={function(e){setPassword(e.target.value);}} type="password" placeholder="Password" required minLength={6} style={fieldStyle()}/>
        {error && <p style={{fontSize:12,color:error.indexOf("Conta criada")>=0?"#8FB39B":"#C08C8C",lineHeight:1.5}}>{error}</p>}
        <button disabled={busy} type="submit" style={{width:"100%",padding:"12px 14px",borderRadius:14,border:"1px solid rgba(255,255,255,0.14)",background:"#1A1A1D",color:"#EDEDEF",fontFamily:"'JetBrains Mono',monospace",cursor:busy?"default":"pointer",marginTop:8}}>
          {busy ? "Aguarda..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
        <button type="button" onClick={function(){setMode(mode==="login"?"signup":"login");setError("");}} style={{width:"100%",background:"none",border:"none",color:"#6E6E76",fontSize:12,marginTop:14,cursor:"pointer"}}>
          {mode === "login" ? "Ainda não tenho conta" : "Já tenho conta"}
        </button>
        {!auth.configured && <p style={{fontSize:11,color:"#C4A57C",lineHeight:1.5,marginTop:14}}>Supabase não está configurado no .env.</p>}
      </form>
    </div>
  );
}

function fieldStyle() {
  return {width:"100%",boxSizing:"border-box",padding:"12px 14px",borderRadius:14,border:"1px solid rgba(255,255,255,0.07)",background:"#0E0E10",color:"#EDEDEF",outline:"none",fontSize:14,marginBottom:10};
}
