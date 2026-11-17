"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/` } });
        if (authError) throw authError;
        if (!data.session) setMessage("Account creato. Controlla la tua email per confermare l'indirizzo e poi accedi.");
        else router.push("/");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.push("/"); router.refresh();
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Autenticazione non riuscita."); }
    finally { setLoading(false); }
  }

  return <div className="login-wrap">
    <div className="login-card">
      <Link href="/" className="muted small" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 25 }}><ArrowLeft size={13}/> Back to FITDAY</Link>
      <div className="brand" style={{ padding: 0, marginBottom: 30 }}><span className="brand-mark">f.</span><span>fitday</span></div>
      <span className="pill pill-green"><Sparkles size={11} style={{ marginRight: 5 }}/> YOUR DIGITAL WARDROBE</span>
      <h1 style={{ fontSize: 31, lineHeight: 1.05, letterSpacing: "-.06em", margin: "17px 0 8px" }}>{mode === "signin" ? "Welcome back." : "Make it personal."}</h1>
      <p className="muted small" style={{ lineHeight: 1.7, marginBottom: 22 }}>{mode === "signin" ? "Accedi per ritrovare i tuoi capi e il tuo stile." : "Crea il tuo account e inizia a costruire il guardaroba digitale."}</p>
      <form onSubmit={submit} style={{ display: "grid", gap: 13 }}>
        {mode === "signup" && <div className="field"><label htmlFor="name">Your name</label><input className="input" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required/></div>}
        <div className="field"><label htmlFor="email">Email</label><input className="input" type="email" id="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"/></div>
        <div className="field"><label htmlFor="password">Password</label><input className="input" type="password" id="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 8 characters"/></div>
        {error && <div className="notice error">{error}</div>}{message && <div className="notice">{message}</div>}
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: 4 }}>{loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
      </form>
      <p className="muted small" style={{ textAlign: "center", marginTop: 20 }}>{mode === "signin" ? "New to FITDAY?" : "Already have an account?"} <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); setError(""); }} style={{ fontWeight: 800, color: "#505b3b", background: "transparent", border: 0 }}>{mode === "signin" ? "Create an account" : "Sign in"}</button></p>
    </div>
  </div>;
}
