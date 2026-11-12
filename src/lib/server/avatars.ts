import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';

// Profile photos: Netlify Blobs in production, a local folder in development.
const LOCAL_DIR = path.join(process.cwd(), '.data', 'avatars');
const isNetlify = () => !!(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);

async function store() {
  const { getStore } = await import('@netlify/blobs');
  return getStore({ name: 'avatars', consistency: 'strong' });
}

export async function putAvatar(accountId: string, data: ArrayBuffer) {
  if (isNetlify()) return void (await (await store()).set(accountId, data));
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, accountId), Buffer.from(data));
}

export async function getAvatar(accountId: string): Promise<ArrayBuffer | null> {
  if (isNetlify()) return (await (await store()).get(accountId, { type: 'arrayBuffer' })) ?? null;
  try {
    const b = await fs.readFile(path.join(LOCAL_DIR, accountId));
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

export async function deleteAvatar(accountId: string) {
  if (isNetlify()) return void (await (await store()).delete(accountId));
  await fs.rm(path.join(LOCAL_DIR, accountId), { force: true });
}

export const avatarUrl = (a: { id: string; avatarVersion: number | null }) =>
  a.avatarVersion ? `/api/avatar/${a.id}?v=${a.avatarVersion}` : null;
