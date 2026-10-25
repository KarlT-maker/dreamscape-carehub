import { validateSnapshot, type Snapshot } from "./data/workspace";
export const SHARED_API = process.env.NEXT_PUBLIC_BARN_SHARED_API ?? "";
export type SharedSession = { user: { name: string; admin: boolean } | null; nonce: string; ready: boolean; loginUrl: string };
export type SharedWorkspace = { snapshot: Snapshot; canUndoReset: boolean };
export class SharedError extends Error {
  constructor(message: string, public status: number, public workspace?: SharedWorkspace) { super(message); }
}
export async function sharedRequest(action: string, nonce?: string, body?: unknown) {
  const response = await fetch(`${SHARED_API}?action=${action}`, {
    method: body === undefined ? "GET" : "POST", credentials: "same-origin", cache: "no-store",
    headers: body === undefined ? {} : { "Content-Type": "application/json", "X-Barn-Nonce": nonce ?? "" },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000),
  });
  const value = await response.json();
  if (value.snapshot) validateSnapshot(value.snapshot);
  if (!response.ok) throw new SharedError(value.error ?? "The online store could not be reached.", response.status, value.snapshot ? value : undefined);
  return value;
}
