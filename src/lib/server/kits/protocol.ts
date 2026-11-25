import 'server-only';
import type { Decision, ManifestItem } from './content-core';

/**
 * MCP over Streamable HTTP, stateless, read-only (#67). JSON-RPC 2.0 messages in,
 * one JSON response out (no SSE, no sessions). Every content call asks
 * deps.decide, so access is checked per call, not at sign-in.
 */

export const PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

export interface McpDeps {
  serverVersion: string;
  /** Where an account gets a kit it does not have. */
  storeUrl: string;
  catalog(): Promise<{ latest: string; items: ManifestItem[] }>;
  decide(item: ManifestItem, latest: string): Decision;
  /** SKILL.md and the names of the skill's other files, from release `ref`. */
  readSkill(item: ManifestItem, ref: string): Promise<{ text: string; files: string[] } | null>;
  readFile(item: ManifestItem, ref: string, relPath: string): Promise<string | null>;
  packTitle(pack: string): string;
  audit(kind: string, detail: Record<string, unknown>): Promise<void>;
}

type Id = string | number | null;
export interface RpcResponse {
  jsonrpc: '2.0';
  id: Id;
  result?: unknown;
  error?: { code: number; message: string };
}

const ok = (id: Id, result: unknown): RpcResponse => ({ jsonrpc: '2.0', id, result });
const fail = (id: Id, code: number, message: string): RpcResponse => ({ jsonrpc: '2.0', id, error: { code, message } });

const URI_PREFIX = 'emruz-kits://skill/';

const TOOLS = [
  {
    name: 'list_skills',
    title: 'List Emruz kit skills',
    description: 'List the skills in the Emruz kits, with their pack and whether this account can read them. Optional filters: pack, access.',
    inputSchema: {
      type: 'object',
      properties: {
        pack: { type: 'string', description: 'Pack id, for example release, founder or marketing' },
        access: { type: 'string', enum: ['free', 'full'] },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'search_skills',
    title: 'Search Emruz kit skills',
    description: 'Find skills by words in their name, group or description.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', minLength: 1, maxLength: 200 } },
      required: ['query'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_skill',
    title: 'Get a skill',
    description: "Return a skill's SKILL.md instructions and the list of its other files. Follow the instructions; fetch other files with get_skill_file when they are referenced.",
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', maxLength: 64 } },
      required: ['name'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_skill_file',
    title: 'Get a file from a skill',
    description: 'Return one supporting file of a skill (a reference, template or script), by its path inside the skill folder.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', maxLength: 64 }, path: { type: 'string', maxLength: 300 } },
      required: ['name', 'path'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
];

const text = (t: string, isError = false) => ({ content: [{ type: 'text', text: t }], ...(isError ? { isError: true } : {}) });

function summary(item: ManifestItem, d: Decision) {
  return { name: item.name, pack: item.pack, group: item.group, access: item.access, available: d.allowed, description: item.description };
}

async function callTool(deps: McpDeps, name: string, args: Record<string, unknown>) {
  const { latest, items } = await deps.catalog();
  const find = (n: unknown) => (typeof n === 'string' ? items.find((i) => i.name === n) : undefined);
  const locked = (item: ManifestItem) =>
    text(`${item.name} is part of the ${deps.packTitle(item.pack)}. This account does not have that kit. See ${deps.storeUrl} to get it.`, true);

  if (name === 'list_skills' || name === 'search_skills') {
    let list = items;
    if (name === 'list_skills') {
      if (typeof args.pack === 'string') list = list.filter((i) => i.pack === args.pack);
      if (args.access === 'free' || args.access === 'full') list = list.filter((i) => i.access === args.access);
    } else {
      const q = typeof args.query === 'string' ? args.query.toLowerCase().trim().slice(0, 200) : '';
      if (!q) return text('Give a search query.', true);
      const words = q.split(/\s+/);
      list = list.filter((i) => words.every((w) => `${i.name} ${i.group} ${i.pack} ${i.description}`.toLowerCase().includes(w)));
    }
    const rows = list.map((i) => summary(i, deps.decide(i, latest)));
    const lines = rows.map((r) => `- ${r.name} (${deps.packTitle(r.pack)}${r.access === 'free' ? ', free' : ''}${r.available ? '' : ', not in your kits'}): ${r.description}`);
    return {
      content: [{ type: 'text', text: rows.length ? `${rows.length} skills (release ${latest}):\n${lines.join('\n')}` : 'No skills match.' }],
      structuredContent: { release: latest, skills: rows },
    };
  }

  if (name === 'get_skill') {
    const item = find(args.name);
    if (!item) return text(`No skill named ${String(args.name)}. Use list_skills or search_skills.`, true);
    const d = deps.decide(item, latest);
    if (!d.allowed) {
      await deps.audit('content_denied', { skill: item.name, pack: item.pack });
      return locked(item);
    }
    const skill = await deps.readSkill(item, d.ref);
    if (!skill) return text(`${item.name} is not in release ${d.ref}, the version this account has.`, true);
    await deps.audit('content_read', { skill: item.name, ref: d.ref });
    const files = skill.files.length ? `\n\n---\nOther files in this skill (fetch with get_skill_file): ${skill.files.join(', ')}` : '';
    return text(`${skill.text}${files}`);
  }

  if (name === 'get_skill_file') {
    const item = find(args.name);
    if (!item) return text(`No skill named ${String(args.name)}.`, true);
    const rel = typeof args.path === 'string' ? args.path.replace(/^\.?\//, '') : '';
    if (!rel || rel.split('/').includes('..')) return text('Give a path inside the skill folder.', true);
    const d = deps.decide(item, latest);
    if (!d.allowed) {
      await deps.audit('content_denied', { skill: item.name, pack: item.pack, path: rel });
      return locked(item);
    }
    const body = await deps.readFile(item, d.ref, rel);
    if (body == null) return text(`No text file ${rel} in ${item.name}.`, true);
    await deps.audit('content_read', { skill: item.name, ref: d.ref, path: rel });
    return text(body);
  }

  return null;
}

export async function handleMessage(msg: unknown, deps: McpDeps): Promise<RpcResponse | null> {
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return fail(null, -32600, 'Invalid request');
  const m = msg as { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown };
  const id: Id = typeof m.id === 'string' || typeof m.id === 'number' ? m.id : null;
  const isNotification = !('id' in m);
  if (m.jsonrpc !== '2.0' || typeof m.method !== 'string') return isNotification ? null : fail(id, -32600, 'Invalid request');
  if (isNotification) return null; // initialized, cancelled and the rest need no answer
  const params = (m.params && typeof m.params === 'object' ? m.params : {}) as Record<string, unknown>;

  try {
    switch (m.method) {
      case 'initialize': {
        const asked = typeof params.protocolVersion === 'string' ? params.protocolVersion : '';
        return ok(id, {
          protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
          capabilities: { tools: { listChanged: false }, resources: { listChanged: false } },
          serverInfo: { name: 'emruz-kits', title: 'Emruz kits', version: deps.serverVersion },
          instructions:
            'Emruz kits are Claude skills for releasing software, validating a business and building customer decks. Use search_skills or list_skills to find one, get_skill to load its instructions, then follow them. Load supporting files with get_skill_file when the instructions reference them.',
        });
      }
      case 'ping':
        return ok(id, {});
      case 'tools/list':
        return ok(id, { tools: TOOLS });
      case 'tools/call': {
        const name = typeof params.name === 'string' ? params.name : '';
        const args = (params.arguments && typeof params.arguments === 'object' ? params.arguments : {}) as Record<string, unknown>;
        const r = await callTool(deps, name, args);
        return r ? ok(id, r) : fail(id, -32602, `Unknown tool ${name}`);
      }
      case 'resources/list': {
        const { latest, items } = await deps.catalog();
        const resources = items
          .filter((i) => deps.decide(i, latest).allowed)
          .map((i) => ({ uri: `${URI_PREFIX}${i.name}`, name: i.name, title: i.name, description: i.description, mimeType: 'text/markdown' }));
        return ok(id, { resources });
      }
      case 'resources/templates/list':
        return ok(id, { resourceTemplates: [] });
      case 'resources/read': {
        const uri = typeof params.uri === 'string' ? params.uri : '';
        const r = uri.startsWith(URI_PREFIX) ? await callTool(deps, 'get_skill', { name: uri.slice(URI_PREFIX.length) }) : null;
        if (!r || 'isError' in r) return fail(id, -32002, r && 'content' in r ? (r.content[0] as { text: string }).text : 'Resource not found');
        return ok(id, { contents: [{ uri, mimeType: 'text/markdown', text: (r.content[0] as { text: string }).text }] });
      }
      default:
        return fail(id, -32601, `Method not found: ${m.method}`);
    }
  } catch (e) {
    console.error('mcp handler failed', e);
    return fail(id, -32603, 'Internal error');
  }
}
