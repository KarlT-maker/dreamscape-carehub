"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { useBarn } from "./provider";
export type RecordField = {name: string; label: string; value?: string; type?: string; required?: boolean; options?: {value: string; label: string}[]; wide?: boolean; max?: string; min?: string};
export function RecordForm({title, fields, onSave, onClose, saveLabel = "Save"}: {title: string; fields: RecordField[]; onSave: (values: Record<string,string>) => Promise<boolean>; onClose: () => void; saveLabel?: string}) {
  const {saving, uncertain} = useBarn();
  const [error, setError] = useState("");
  return <section className="panel add-form record-form" aria-label={title}>
    <div className="panel-heading"><h2>{title}</h2><button type="button" className="icon-button" aria-label="Close form" onClick={onClose}><X /></button></div>
    <form onSubmit={async e => {
      e.preventDefault(); setError("");
      const values = Object.fromEntries([...new FormData(e.currentTarget)].map(([key,value])=>[key,String(value).trim()]));
      try { if (await onSave(values)) onClose(); else setError("Not saved yet. Check the message above before trying again. Your entries are still here."); }
      catch (err) { setError(err instanceof Error ? err.message : "This change could not be saved."); }
    }}>
      <fieldset disabled={saving || uncertain}>
        <div className="form-grid">{fields.map(field=><label className={field.wide ? "record-wide" : undefined} key={field.name}>{field.label}
          {field.options ? <select name={field.name} defaultValue={field.value ?? ""} required={field.required}>{field.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === "textarea" ? <textarea name={field.name} defaultValue={field.value ?? ""} rows={3} maxLength={3000} required={field.required} /> : <input name={field.name} type={field.type ?? "text"} defaultValue={field.value ?? ""} required={field.required} max={field.max} min={field.min} maxLength={1000} />}
        </label>)}</div>
        <div className="workspace-actions"><button className="button" type="submit">{saving ? "Saving…" : saveLabel}</button><button className="button secondary" type="button" onClick={onClose}>Cancel</button></div>
      </fieldset>
      {error && <p role="alert" className="workspace-error">{error}</p>}
    </form>
  </section>;
}
