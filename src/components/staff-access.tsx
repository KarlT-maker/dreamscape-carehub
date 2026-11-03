"use client";
import { useEffect, useRef, useState } from "react";
import { sharedRequest } from "@/lib/shared";

type Application = {id: string; name: string; email: string; created: number};
type HelperLogin = {id: number; name: string; email: string; canDelete: boolean; canResend: boolean};
type StaffList = {requests: Application[]; helpers: HelperLogin[]; reviewEmail: string; myEmail: string; nonce: string};
type Change =
  | {choice: "notify-me"}
  | {choice: "approve" | "decline"; requestId: string}
  | {choice: "delete" | "revoke" | "resend"; userId: number; email: string};

function failure(error: unknown) {
  return error instanceof Error ? error.message : "Please check your connection and try again.";
}

export function RequestAccess({nonce}: {nonce: string}) {
  const [open,setOpen] = useState(false);
  const [sent,setSent] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  if (sent) return <p role="status">Thank you. New requests go to Karl or Lea for review. Once approved, check your email for a link to choose your password. If you already have a login, choose Sign in above.</p>;
  if (!open) return <p>New helper? <button className="button secondary" onClick={()=>setOpen(true)}>Request access</button></p>;
  return <form className="access-application" onSubmit={async event=>{
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setError(""); setBusy(true);
    try {
      await sharedRequest("request-access",nonce,{name:fields.get("name"),email:fields.get("email")});
      setSent(true);
    } catch (error) {setError(failure(error));} finally {setBusy(false);}
  }}>
    <h2>Request helper access</h2>
    <p>Karl or Lea will review your request. Approval lets you edit the shared barn records.</p>
    <fieldset disabled={busy}>
      <label>Your name<input name="name" autoComplete="name" required maxLength={80}/></label>
      <label>Your email<input name="email" type="email" autoComplete="email" required maxLength={100}/></label>
      <div className="workspace-actions"><button className="button" type="submit">{busy ? "Sending…" : "Send request"}</button>
      <button className="button secondary" type="button" onClick={()=>setOpen(false)}>Cancel</button></div>
    </fieldset>
    {error && <p role="alert" className="workspace-error">{error}</p>}
  </form>;
}

export function StaffAccess() {
  const [list,setList] = useState<StaffList | null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");
  const [removing,setRemoving] = useState<HelperLogin | null>(null);
  const inFlight = useRef(false);
  async function refresh() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError("");
    try {setList(await sharedRequest("staff-list")); setRemoving(null);}
    catch (error) {setError(failure(error));}
    finally {inFlight.current=false; setBusy(false);}
  }
  useEffect(()=>{void refresh();},[]);
  async function change(body: Change) {
    if (!list || inFlight.current) return;
    inFlight.current=true; setBusy(true); setError(""); setMessage("");
    try {
      const result: StaffList & {message: string} = await sharedRequest("staff-change",list.nonce,body);
      setList(result); setMessage(result.message); setRemoving(null);
    } catch (error) {
      setError(failure(error) + " Refresh the list to check its current status.");
    } finally {inFlight.current=false; setBusy(false);}
  }
  return <section className="panel" id="staff-access" aria-labelledby="staff-access-heading">
    <div className="panel-heading"><h2 id="staff-access-heading">Helper access</h2>
      <button className="button secondary small" disabled={busy} onClick={refresh}>Refresh list</button></div>
    <div className="padded">
      {!list && busy && <p role="status">Opening helper access…</p>}
      {error && <p role="alert" className="workspace-error">{error}</p>}
      {message && <p role="status" className="workspace-notice">{message}</p>}
      {list && <>
        {list.reviewEmail ? <p>New helpers can choose <strong>Request access</strong> on the CareHub sign-in page. Request alerts go to <strong>{list.reviewEmail}</strong>.</p>
          : <p>Turn on access requests so helpers can apply from the CareHub sign-in page. Requests will go to your account email, <strong>{list.myEmail}</strong>.</p>}
        {list.reviewEmail !== list.myEmail && <button className="button secondary" disabled={busy} onClick={()=>change({choice:"notify-me"})}>{list.reviewEmail ? "Send request alerts to my email" : "Turn on access requests"}</button>}
        <h3>Waiting for approval</h3>
        {list.requests.length === 0 && <p className="muted">No helpers are waiting.</p>}
        {list.requests.map(request=><article className="access-person" key={request.id}>
          <div><strong>{request.name}</strong><br/>{request.email}</div>
          <div className="workspace-actions">
            <button className="button" disabled={busy} onClick={()=>change({choice:"approve",requestId:request.id})}>Approve &amp; send setup email</button>
            <button className="button secondary" disabled={busy} onClick={()=>change({choice:"decline",requestId:request.id})}>Decline</button>
          </div>
        </article>)}
        <h3>Approved helpers</h3><p className="muted">These helpers can edit barn records. Removing a login keeps their past entries and schedule.</p>
        {list.helpers.length === 0 && <p>No helper logins to manage.</p>}
        {list.helpers.map(helper=><article className="access-person" key={helper.id}>
          <div><strong>{helper.name}</strong><br/>{helper.email}</div>
          {removing?.id === helper.id ? <div className="workspace-confirm">
            <p>{helper.canDelete ? "Permanently delete this helper’s username and password?" : "Remove this helper’s access to CareHub?"} They will lose access on their devices.</p>
            <div className="workspace-actions"><button className="button" disabled={busy} onClick={()=>change({choice:helper.canDelete?"delete":"revoke",userId:helper.id,email:helper.email})}>{helper.canDelete ? "Yes, delete login" : "Yes, remove access"}</button>
            <button className="button secondary" disabled={busy} onClick={()=>setRemoving(null)}>Cancel</button></div>
          </div> : <div className="workspace-actions">
            {helper.canResend && <button className="button secondary small" disabled={busy} onClick={()=>change({choice:"resend",userId:helper.id,email:helper.email})}>Send setup email</button>}
            <button className="button secondary small" disabled={busy} onClick={()=>setRemoving(helper)}>{helper.canDelete ? "Delete login" : "Remove access"}</button>
          </div>}
        </article>)}
      </>}
    </div>
  </section>;
}
