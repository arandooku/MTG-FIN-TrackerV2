import { SyncPayload, safeParse } from './schemas';

const GIST_FILE = 'fin-binder-data.json';
const API = 'https://api.github.com';

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

export interface GistHandle {
  token: string;
  gistId: string;
}

export async function findExistingGist(token: string): Promise<string | null> {
  const resp = await fetch(`${API}/gists?per_page=100`, { headers: headers(token) });
  if (!resp.ok) throw new Error(`GitHub ${resp.status}`);
  const gists = (await resp.json()) as Array<{ id: string; files: Record<string, unknown> }>;
  const match = gists.find((g) => g.files && GIST_FILE in g.files);
  return match?.id ?? null;
}

export async function createGist(token: string, payload: unknown): Promise<string> {
  const resp = await fetch(`${API}/gists`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      description: 'FIN Binder Tracker Data',
      public: false,
      files: { [GIST_FILE]: { content: JSON.stringify(payload, null, 2) } },
    }),
  });
  if (!resp.ok) throw new Error(`GitHub ${resp.status}`);
  const data = (await resp.json()) as { id: string };
  return data.id;
}

export async function pullGist(h: GistHandle): Promise<unknown> {
  const resp = await fetch(`${API}/gists/${h.gistId}`, { headers: headers(h.token) });
  if (!resp.ok) throw new Error(`GitHub ${resp.status}`);
  const data = (await resp.json()) as {
    files?: Record<string, { content: string } | undefined>;
  };
  const file = data.files?.[GIST_FILE];
  if (!file) throw new Error('No data file in Gist');
  const raw = JSON.parse(file.content);
  const parsed = safeParse(SyncPayload, raw);
  if (!parsed) throw new Error('Invalid sync payload shape');
  return parsed;
}

export async function pushGist(h: GistHandle, payload: unknown): Promise<void> {
  const resp = await fetch(`${API}/gists/${h.gistId}`, {
    method: 'PATCH',
    headers: headers(h.token),
    body: JSON.stringify({
      files: { [GIST_FILE]: { content: JSON.stringify(payload, null, 2) } },
    }),
  });
  if (!resp.ok) throw new Error(`GitHub ${resp.status}`);
}

export function isValidGistId(id: string): boolean {
  return /^[a-f0-9]{20,40}$/i.test(id);
}
