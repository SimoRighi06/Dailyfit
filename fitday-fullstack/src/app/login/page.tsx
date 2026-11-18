"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LanguageSwitcher, localizeApiMessage, useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const { t } = useI18n();
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
        if (!data.session) setMessage(t("login.confirmEmail"));
        else router.push("/");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.push("/"); router.refresh();
      }
    } catch (e) { setError(e instanceof Error ? localizeApiMessage(e.message, t) : t("login.authError")); }
    finally { setLoading(false); }
  }

  return <div className="login-wrap">
    <div className="login-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 25 }}>
        <Link href="/" className="muted small" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><ArrowLeft size={13}/> {t("login.back")}</Link>
        <LanguageSwitcher />
      </div>
      <div className="brand" style={{ padding: 0, marginBottom: 30 }}><span className="brand-mark">f.</span><span>fitday</span></div>
      <span className="pill pill-green"><Sparkles size={11} style={{ marginRight: 5 }}/> {t("login.eyebrow")}</span>
      <h1 style={{ fontSize: 31, lineHeight: 1.05, letterSpacing: "-.06em", margin: "17px 0 8px" }}>{mode === "signin" ? t("login.welcome") : t("login.personal")}</h1>
      <p className="muted small" style={{ lineHeight: 1.7, marginBottom: 22 }}>{mode === "signin" ? t("login.signInDescription") : t("login.signUpDescription")}</p>
      <form onSubmit={submit} style={{ display: "grid", gap: 13 }}>
        {mode === "signup" && <div className="field"><label htmlFor="name">{t("login.name")}</label><input className="input" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("login.namePlaceholder")} required/></div>}
        <div className="field"><label htmlFor="email">{t("login.email")}</label><input className="input" type="email" id="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@example.com"/></div>
        <div className="field"><label htmlFor="password">{t("login.password")}</label><input className="input" type="password" id="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder={t("login.passwordHint")}/></div>
        {error && <div className="notice error">{error}</div>}{message && <div className="notice">{message}</div>}
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: 4 }}>{loading ? t("login.wait") : mode === "signin" ? t("login.signIn") : t("login.signUp")}</button>
      </form>
      <p className="muted small" style={{ textAlign: "center", marginTop: 20 }}>{mode === "signin" ? t("login.newHere") : t("login.haveAccount")} <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); setError(""); }} style={{ fontWeight: 800, color: "#505b3b", background: "transparent", border: 0 }}>{mode === "signin" ? t("login.createAccount") : t("login.signIn")}</button></p>
    </div>
  </div>;
}
