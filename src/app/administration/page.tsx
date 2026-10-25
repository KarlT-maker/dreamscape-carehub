"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui";
import { useBarn } from "@/components/provider";
import { validateSnapshot } from "@/lib/data/workspace";

export default function Page() {
  const { resetWorkspace, undoReset, canUndoReset, exportBackup, restoreBackup, savedAt, today, shared, isAdmin, saving, uncertain } = useBarn();
  const [pending, setPending] = useState<"blank" | "roster" | "examples" | "restore" | null>(null);
  const [backup, setBackup] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  function download() {
    try {
      const url = URL.createObjectURL(new Blob([exportBackup()], { type: "application/json" }));
      const a = document.createElement("a"); a.href = url; a.download = `BarnCareHub-backup-${today}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Backup downloaded. Keep it somewhere safe."); setError("");
    } catch { setError("The backup could not be downloaded. Your records have not been changed."); }
  }
  return <>
    <PageHeader eyebrow="RANCH WORKSPACE" title="Administration" description="Backups and practice workspace controls" />
    <section className="panel"><div className="panel-heading"><h2>Your saved records</h2></div><div className="padded">
      <p>{shared ? "Saved changes are kept online and shared with approved staff. Other open screens check for changes every 10 seconds. Wait for saving to finish before closing the page. Download backups for an extra copy." : "Your entries stay in this browser on this device when you refresh or close the page. They are not yet shared with other phones, tablets or computers. Clearing browser data can remove them, so download a backup after entering information you want to keep."}</p>
      <p className="muted">{savedAt ? `Last saved: ${new Date(savedAt).toLocaleString()}` : "The horse names and paddocks are ready. No care details have been entered yet."}</p>
      <div className="workspace-actions"><button className="button" onClick={download}>Download backup</button>
      {isAdmin && <label className="button secondary backup-input">Choose backup to restore<input type="file" accept="application/json,.json" disabled={saving || uncertain} onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
        try { if (file.size > 10000000) throw new Error("This backup is too large."); const text = await file.text(); validateSnapshot(JSON.parse(text)); setBackup(text); setPending("restore"); setError(""); setMessage(""); }
        catch { setError("That file is not a valid BarnCareHub backup. Your current records have not changed."); }
      }} /></label>}</div>
    </div></section>
    {shared && isAdmin && <section className="panel"><div className="panel-heading"><h2>Staff access</h2></div><p className="padded">Create each helper’s own account in your website’s Users area and choose the <strong>BarnCareHub tester</strong> role. Testers can edit horses and care and use the checklists. Only administrators can reset or restore all records. <a href="/wp-admin/user-new.php" target="_blank" rel="noreferrer">Open website Users</a>.</p></section>}
    {isAdmin && <section className="panel"><div className="panel-heading"><h2>{shared ? "Clear or restore shared records" : "Clear or restore the practice workspace"}</h2></div><div className="padded">
      <p>Keep horse names and paddocks while clearing other profile details, care plans, appointments, history, crew and checkmarks. The previous workspace is kept so you can undo the last reset or restore.</p>
      <div className="workspace-actions">
        <button className="button secondary" onClick={() => { setPending("roster"); setMessage(""); }}>Clear data, keep horse names</button>
        <button className="button secondary" onClick={() => { setPending("blank"); setMessage(""); }}>Start completely blank</button>
        <button className="button secondary" onClick={() => { setPending("examples"); setMessage(""); }}>Load example roster</button>
        {canUndoReset && <button className="button secondary" disabled={saving || uncertain} onClick={async () => { if (await undoReset()) { setPending(null); setMessage("Previous workspace restored."); } }}>Undo last reset or restore</button>}
      </div>
      {pending && <div className="workspace-confirm" role="region" aria-label="Confirm workspace replacement">
        {shared && <p><strong>This changes the shared records for everyone.</strong> {pending === "restore" && backup ? `Selected backup: ${validateSnapshot(JSON.parse(backup)).data.horses.length} horses, ${validateSnapshot(JSON.parse(backup)).data.care.length} care instructions.` : ""}</p>}
        <p>{pending === "roster" ? "Keep your horse names and paddocks, and clear all other information?" : pending === "blank" ? "Remove every horse and all other records from this browser’s workspace?" : pending === "examples" ? "Replace your workspace with the example roster? Its care, profile and staff details are invented." : "Replace this browser’s workspace with the selected backup?"} Download a backup first if you want to keep an extra copy.</p>
        <div className="workspace-actions"><button className="button" disabled={saving || uncertain} onClick={async () => {
          try { const ok = await (pending === "restore" ? restoreBackup(backup) : resetWorkspace(pending));
            if (ok) { setMessage("Workspace updated. You can undo this here."); setPending(null); setError(""); }
          } catch { setError("The backup could not be restored. Your current records have not changed."); }
        }}>Confirm {pending === "roster" ? "clear data" : pending === "blank" ? "start blank" : pending === "examples" ? "load examples" : "restore backup"}</button>
        <button className="button secondary" onClick={() => setPending(null)}>Cancel</button></div>
      </div>}
      <p role="status">{message}</p>{error && <p role="alert" className="workspace-error">{error}</p>}
    </div></section>}
    <section className="panel"><div className="panel-heading"><h2>Still to come</h2></div><p className="padded">Offline uploads, appointment entry, crew scheduling, photos and client access are not connected yet. For now, you can edit horse profiles, enter and change care plans, and use the feed boards and daily checklists.{shared ? " An internet connection is needed to save." : " Shared staff accounts are available in the online beta once set up."}</p></section>
  </>;
}
