/**
 * Mas'ul shaxslar uchun API klient.
 * Backend mavjud bo'lsa → API, yo'q bo'lsa → localStorage.
 */
import type { BotConfig, ResponsiblePerson } from '@/types';
import {
  loadPersons as lsLoad, savePersons as lsSave,
  loadBotConfig as lsBotLoad, saveBotConfig as lsBotSave,
} from './personStore';

function base() { return localStorage.getItem('jhet_backend_url') || ''; }
function tok()  { return localStorage.getItem('jhet_token') || ''; }

async function apiFetch(path: string, opts: RequestInit = {}) {
  const r = await fetch(`${base()}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tok()}`,
      ...(opts.headers || {}),
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(err.detail || `Xato: ${r.status}`);
  }
  return r.json();
}

export const hasBackend = () => !!(base() && tok());

// ── Persons ───────────────────────────────────────────────

export async function apiGetPersons(): Promise<ResponsiblePerson[]> {
  if (hasBackend()) {
    return apiFetch('/persons');
  }
  return lsLoad();
}

export async function apiSavePerson(p: ResponsiblePerson): Promise<ResponsiblePerson> {
  if (hasBackend()) {
    return apiFetch('/persons', {
      method: 'POST',
      body: JSON.stringify(p),
    });
  }
  const all = lsLoad();
  const idx = all.findIndex(x => x.id === p.id);
  if (idx >= 0) all[idx] = p; else all.push(p);
  lsSave(all);
  return p;
}

export async function apiDeletePerson(id: string): Promise<void> {
  if (hasBackend()) {
    await apiFetch(`/persons/${id}`, { method: 'DELETE' });
    return;
  }
  const all = lsLoad().filter(p => p.id !== id);
  lsSave(all);
}

export async function apiTestPerson(id: string): Promise<boolean> {
  if (hasBackend()) {
    const r = await apiFetch(`/persons/${id}/test`, { method: 'POST' });
    return r.ok;
  }
  return false;
}

// ── Bot config ────────────────────────────────────────────

export async function apiGetBotStatus(): Promise<{
  ok: boolean; token_set: boolean; enabled: boolean;
  persons_total: number; persons_active: number;
} | null> {
  if (!hasBackend()) return null;
  try { return await apiFetch('/config/bot-status'); }
  catch { return null; }
}

export async function apiUpdateBotConfig(key: string, value: string): Promise<void> {
  if (hasBackend()) {
    await apiFetch('/config', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
    return;
  }
  // localStorage fallback
  const cfg: BotConfig = lsBotLoad();
  if (key === 'tg_token')   cfg.token      = value;
  if (key === 'tg_enabled') cfg.enabled    = value === 'true';
  if (key === 'casnet_url') cfg.serverUrl  = value;
  lsBotSave(cfg);
}

export async function apiBulkSyncPersons(persons: ResponsiblePerson[]): Promise<void> {
  if (!hasBackend()) return;
  await apiFetch('/persons/bulk', {
    method: 'POST',
    body: JSON.stringify(persons),
  }).catch(() => {/* bulk yokchilsa oddiy sync */});
}
