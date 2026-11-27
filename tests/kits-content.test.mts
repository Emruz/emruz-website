// Emruz kits content and MCP protocol (#67): release choice, manifest checks,
// the tarball reader, entitlement decisions on every call, and the JSON-RPC handler.
// Run: node --conditions=react-server --experimental-strip-types tests/kits-content.test.mts
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import {
  asText, compareRefs, decide, isRef, parseSums, publishedRefs, readTarGz, sha256, skillFiles, validateManifest,
  type Bundle, type Entitlement, type ManifestItem,
} from '../src/lib/server/kits/content-core.ts';
import { handleMessage, type McpDeps } from '../src/lib/server/kits/protocol.ts';

// ---------- Release tags ----------
assert.ok(isRef('v2026.11.5'));
assert.ok(!isRef('v2026.11'), 'needs three parts');
assert.ok(!isRef('2026.11.5'));
assert.ok(compareRefs('v2026.11.10', 'v2026.11.9') > 0, 'numeric, not text, order');
assert.ok(compareRefs('v2027.1.1', 'v2026.12.9') > 0);
assert.deepEqual(
  publishedRefs([
    { tag_name: 'v2026.11.4', draft: false, prerelease: false },
    { tag_name: 'v2026.11.6', draft: true, prerelease: false },
    { tag_name: 'v2026.11.7', draft: false, prerelease: true },
    { tag_name: 'v2026.11.10', draft: false, prerelease: false },
    { tag_name: 'nightly', draft: false, prerelease: false },
  ]),
  ['v2026.11.10', 'v2026.11.4'],
  'drafts, pre-releases and odd tags are ignored; newest first',
);

// ---------- Manifest ----------
const item = (name: string, pack: string, access: 'free' | 'full', group = 'testing') => ({
  type: 'skill', name, group, pack, access, description: `${name} description`, path: `skills/${group}/${name}`, hash: 'sha256:x',
});
const manifest = {
  format: 'emruz-content-manifest/1',
  source: 'emruz-kits',
  repository: 'Emruz/emruz-kits',
  packs: ['release', 'founder', 'marketing', 'product'],
  items: [item('testing-kit', 'release', 'free'), item('web-app-security', 'release', 'full', 'security'), item('founder-kit', 'founder', 'full', 'founder'), item('marketing-kit', 'marketing', 'full', 'marketing'), item('architecture-panel', 'product', 'full', 'architecture')],
};
assert.ok(validateManifest(manifest).ok);
const problem = (m: unknown) => { const v = validateManifest(m); return v.ok ? null : v.problem; };
assert.match(problem({ ...manifest, source: 'claude-skills' })!, /source/, 'old claude-skills releases are rejected');
assert.match(problem({ ...manifest, items: [{ ...manifest.items[0], pack: undefined }] })!, /pack/, 'every item needs a pack');
assert.match(problem({ ...manifest, items: [{ ...manifest.items[0], pack: 'enterprise' }] })!, /pack/, 'pack must be listed');
assert.match(problem({ ...manifest, items: [{ ...manifest.items[0], path: '../../etc' }] })!, /path/);
assert.match(problem({ ...manifest, items: [manifest.items[0], manifest.items[0]] })!, /duplicate/);
assert.match(problem({ ...manifest, items: [manifest.items[0], { ...manifest.items[0], name: 'free-copy', access: 'free' }] })!, /duplicate path/,
  'two items cannot share a folder (#68 review inj-1)');
assert.match(problem({ ...manifest, packs: ['all', 'release'] })!, /reserved/);
assert.match(problem({ ...manifest, format: 'other/1' })!, /format/);

// ---------- Tarball and checksums ----------
function tarEntry(name: string, body: string | Buffer, type = '0'): Buffer {
  const data = Buffer.isBuffer(body) ? body : Buffer.from(body);
  const h = Buffer.alloc(512);
  h.write(name.slice(0, 100), 0);
  h.write('0000644\0', 100);
  h.write(data.length.toString(8).padStart(11, '0') + '\0', 124);
  h.write(type, 156);
  h.write('ustar\0', 257);
  return Buffer.concat([h, data, Buffer.alloc((512 - (data.length % 512)) % 512)]);
}
const long = `emruz-kits-v2026.11.5/skills/testing/testing-kit/${'deep/'.repeat(20)}notes.md`;
const tar = Buffer.concat([
  tarEntry('emruz-kits-v2026.11.5/', '', '5'),
  tarEntry('emruz-kits-v2026.11.5/manifest.json', JSON.stringify(manifest)),
  ...manifest.items.map((i) => tarEntry(`emruz-kits-v2026.11.5/${i.path}/SKILL.md`, `# ${i.name}\n`)),
  tarEntry('emruz-kits-v2026.11.5/skills/testing/testing-kit/lanes/one.md', 'lane one'),
  tarEntry('././@LongLink', long, 'L'),
  tarEntry('ignored', 'deep notes'),
  tarEntry('emruz-kits-v2026.11.5/../escape.md', 'nope'),
  tarEntry('emruz-kits-v2026.11.5/skills/testing/testing-kit/bin.dat', Buffer.from([0, 1, 2])),
  Buffer.alloc(1024),
]);
const gz = zlib.gzipSync(tar);
const files = readTarGz(gz);
assert.equal(files.get('manifest.json')?.toString(), JSON.stringify(manifest), 'top folder stripped');
assert.equal(files.get('skills/testing/testing-kit/SKILL.md')?.toString(), '# testing-kit\n');
assert.equal(files.get(long.split('/').slice(1).join('/'))?.toString(), 'deep notes', 'GNU long names');
assert.ok(![...files.keys()].some((k) => k.includes('..')), 'path traversal dropped');
assert.equal(asText(files.get('skills/testing/testing-kit/bin.dat')), null, 'binary files are not served');
const sums = parseSums(`${sha256(gz)}  emruz-kits-v2026.11.5.tar.gz\n`);
assert.equal(sums.get('emruz-kits-v2026.11.5.tar.gz'), sha256(gz));
const bundle: Bundle = { ref: 'v2026.11.5', manifest: validateManifest(manifest).ok ? (validateManifest(manifest) as { manifest: Bundle['manifest'] }).manifest : (null as never), files };
const testingKit = bundle.manifest.items.find((i) => i.name === 'testing-kit')!;
assert.deepEqual(skillFiles(bundle, testingKit).filter((f) => !f.startsWith('deep/')), ['lanes/one.md'], 'binary files are not listed');

// ---------- Access decisions ----------
const free = { pack: 'release', access: 'free' as const };
const paidRelease = { pack: 'release', access: 'full' as const };
const paidMarketing = { pack: 'marketing', access: 'full' as const };
const latest = 'v2026.12.1';
assert.deepEqual(decide(free, [], latest), { allowed: true, ref: latest }, 'free skills for any signed-in account');
assert.deepEqual(decide(paidRelease, [], latest), { allowed: false, reason: 'paid' });
const onlyMarketing: Entitlement[] = [{ pack: 'marketing', throughRef: null }];
assert.equal(decide(paidMarketing, onlyMarketing, latest).allowed, true, 'marketing buyer gets marketing');
assert.equal(decide(paidRelease, onlyMarketing, latest).allowed, false, '...and nothing else paid');
assert.equal(decide(paidRelease, [{ pack: 'all', throughRef: null }], latest).allowed, true, 'all kits');
assert.deepEqual(decide(paidRelease, [{ pack: 'release', throughRef: 'v2026.11.5' }], latest), { allowed: true, ref: 'v2026.11.5' }, 'held at the bought release');
assert.deepEqual(decide(paidRelease, [{ pack: 'release', throughRef: 'v2026.11.5' }, { pack: 'release', throughRef: 'v2026.11.9' }], latest), { allowed: true, ref: 'v2026.11.9' }, 'newest held release wins');
assert.deepEqual(decide(paidRelease, [{ pack: 'release', throughRef: 'v2027.1.1' }], latest), { allowed: true, ref: latest }, 'never newer than latest');

// ---------- MCP protocol ----------
let ents: Entitlement[] = [];
const audits: string[] = [];
const deps: McpDeps = {
  serverVersion: '1.0.0',
  storeUrl: 'https://emruz.test/kits',
  catalog: async () => ({ latest: bundle.ref, items: bundle.manifest.items }),
  decide: (i, l) => decide(i, ents, l),
  readSkill: async (i: ManifestItem) => ({ text: asText(files.get(`${i.path}/SKILL.md`))!, files: skillFiles(bundle, i) }),
  readFile: async (i: ManifestItem, _ref, rel) => asText(files.get(`${i.path}/${rel}`)),
  packTitle: (p) => `Emruz ${p} kit`,
  audit: async (k) => void audits.push(k),
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test reads loosely shaped JSON-RPC results
type Loose = { result?: any; error?: any } | null;
const call = async (method: string, params?: unknown, id: number | null = 1) =>
  (await handleMessage(id === null ? { jsonrpc: '2.0', method, params } : { jsonrpc: '2.0', id, method, params }, deps)) as Loose;

const init = await call('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } });
assert.equal(init!.result.protocolVersion, '2025-06-18');
assert.equal((await call('initialize', { protocolVersion: '1999-01-01' }))!.result.protocolVersion, '2025-11-25', 'unknown version: offer ours');
assert.equal(await call('notifications/initialized', undefined, null), null, 'notifications get no reply');
assert.deepEqual((await call('ping'))!.result, {});
const tools = (await call('tools/list'))!.result.tools.map((t: { name: string; annotations: { readOnlyHint: boolean } }) => [t.name, t.annotations.readOnlyHint]);
assert.deepEqual(tools, [['list_skills', true], ['search_skills', true], ['get_skill', true], ['get_skill_file', true]], 'read-only tools only');
assert.equal((await call('tools/call', { name: 'delete_everything', arguments: {} }))!.error.code, -32602);
assert.equal((await call('nope'))!.error.code, -32601);
assert.equal((await handleMessage({ id: 1, method: 'ping' }, deps))!.error!.code, -32600, 'jsonrpc 2.0 required');

const tool = async (name: string, args: Record<string, unknown>) => (await call('tools/call', { name, arguments: args }))!.result;
// Signed in, no kits: lists everything, reads only free
const list = await tool('list_skills', {});
assert.equal(list.structuredContent.skills.length, 5);
assert.deepEqual(list.structuredContent.skills.filter((s: { available: boolean }) => s.available).map((s: { name: string }) => s.name), ['testing-kit']);
assert.equal((await tool('list_skills', { pack: 'marketing' })).structuredContent.skills.length, 1);
assert.equal((await tool('list_skills', { pack: 'product' })).structuredContent.skills.length, 1, 'Product Kit pack (#81)');
assert.deepEqual((await tool('search_skills', { query: 'founder' })).structuredContent.skills.map((s: { name: string }) => s.name), ['founder-kit']);
let got = await tool('get_skill', { name: 'testing-kit' });
assert.match(got.content[0].text, /^# testing-kit/);
assert.match(got.content[0].text, /lanes\/one\.md/, 'lists supporting files');
got = await tool('get_skill', { name: 'marketing-kit' });
assert.equal(got.isError, true);
assert.match(got.content[0].text, /Emruz marketing kit.*emruz\.test\/kits/s);
assert.ok(audits.includes('content_denied'));
assert.equal((await tool('get_skill_file', { name: 'marketing-kit', path: 'SKILL.md' })).isError, true, 'files are checked too');
assert.equal((await tool('get_skill_file', { name: 'testing-kit', path: '../security/web-app-security/SKILL.md' })).isError, true, 'no path traversal');
assert.equal((await tool('get_skill_file', { name: 'testing-kit', path: 'lanes/one.md' })).content[0].text, 'lane one');

// Entitlement is checked on every call, not at sign-in: grant, then revoke
ents = [{ pack: 'marketing', throughRef: null }];
assert.match((await tool('get_skill', { name: 'marketing-kit' })).content[0].text, /^# marketing-kit/);
assert.equal((await tool('get_skill', { name: 'web-app-security' })).isError, true, 'marketing only: no release kit');
ents = [];
assert.equal((await tool('get_skill', { name: 'marketing-kit' })).isError, true, 'revoked takes effect on the next call');

// Resources follow the same rule
ents = [{ pack: 'founder', throughRef: null }];
const res = (await call('resources/list'))!.result.resources.map((r: { name: string }) => r.name).sort();
assert.deepEqual(res, ['founder-kit', 'testing-kit']);
assert.match((await call('resources/read', { uri: 'emruz-kits://skill/founder-kit' }))!.result.contents[0].text, /^# founder-kit/);
assert.equal((await call('resources/read', { uri: 'emruz-kits://skill/marketing-kit' }))!.error.code, -32002);

// Product Kit (#81): its own entitlement or the bundle serves it
ents = [];
assert.equal((await tool('get_skill', { name: 'architecture-panel' })).isError, true, 'paid without an entitlement');
ents = [{ pack: 'product', throughRef: null }];
assert.match((await tool('get_skill', { name: 'architecture-panel' })).content[0].text, /^# architecture-panel/);
assert.equal((await tool('get_skill', { name: 'marketing-kit' })).isError, true, 'product only: no marketing kit');
ents = [{ pack: 'all', throughRef: null }];
assert.match((await tool('get_skill', { name: 'architecture-panel' })).content[0].text, /^# architecture-panel/, 'bundle covers product');

console.log('kits content passed');
