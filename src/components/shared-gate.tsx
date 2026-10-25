"use client";
import { useEffect, useState } from "react";
import { BarnProvider } from "./provider";
import { sharedRequest, type SharedSession, type SharedWorkspace } from "@/lib/shared";
export function SharedGate({children, today}: {children: React.ReactNode; today: string}) {
  const [session, setSession] = useState<SharedSession | null>(null);
  const [workspace, setWorkspace] = useState<SharedWorkspace | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  function open() {
    return sharedRequest("session").then(async (s: SharedSession) => {
      setSession(s); setError("");
      if (s.user && s.ready) setWorkspace(await sharedRequest("workspace"));
    }).catch(() => setError("The shared barn could not be reached. Check your connection and try again."))
      .finally(() => setBusy(false));
  }
  useEffect(() => { void open(); }, []);
  if (session?.user && workspace) return <BarnProvider today={today} remote={{session, workspace}}>{children}</BarnProvider>;
  return <main className="login-page"><section className="panel padded">
    <p className="eyebrow">DREAMSCAPE RANCH</p><h1>BarnCareHub</h1>
    {busy ? <p role="status">Opening your shared barn…</p> : session?.user ? <>
      <h2>Open the shared beta</h2><p>The 43 horse names and paddocks are ready. Care and profile details start empty. Existing browser backups can be imported in Administration.</p>
      {session.user.admin ? <button className="button" onClick={async () => { setBusy(true); setError(""); try { setWorkspace(await sharedRequest("initialize", session.nonce, {})); } catch { setError("Setup could not finish. Please try again."); } finally { setBusy(false); } }}>Open shared barn</button> : <p>Your barn administrator needs to finish the first setup.</p>}
    </> : session ? <>
      <h2>Sign in to your barn</h2><p>Use your own approved account. Saved changes are shared with the rest of the team.</p>
      <a className="button" href={session.loginUrl}>Sign in</a><p className="muted">Ask Karl or Lea for a BarnCareHub tester account. Your ordinary website visitor account does not grant access.</p>
    </> : null}
    {error && <p role="alert" className="workspace-error">{error}</p>}
    {!busy && <button className="text-button" onClick={() => {setBusy(true); void open();}}>Check again</button>}
    <p className="muted">Beta · An internet connection is needed to save changes.</p>
  </section></main>;
}
