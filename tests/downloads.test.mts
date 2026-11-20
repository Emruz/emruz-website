// Download page picks the right installer. Run: npm run test:downloads
import assert from 'node:assert/strict';
import { detectPlatform, parseRelease } from '../src/lib/motiv-downloads.ts';

const names = [
  'Motiv_0.32.0_aarch64.dmg', 'Motiv_0.32.0_aarch64.dmg.sha256',
  'Motiv_0.32.0_amd64.AppImage', 'Motiv_0.32.0_amd64.AppImage.sha256',
  'Motiv_0.32.0_amd64.deb', 'Motiv_0.32.0_x64-setup.exe', 'Motiv_0.32.0_x64-setup.exe.sha256',
  'Motiv_0.32.0_x64_en-US.msi', 'Motiv_0.32.0_x64_en-US.msi.sha256',
];
const r = parseRelease('v0.32.0', names.map((name) => ({ name, url: `https://x/${name}`, size: 1 })));
assert.equal(r.version, '0.32.0');
assert.equal(r.primary.mac?.name, 'Motiv_0.32.0_aarch64.dmg');
assert.equal(r.primary.windows?.name, 'Motiv_0.32.0_x64-setup.exe');
assert.equal(r.primary.linux?.name, 'Motiv_0.32.0_amd64.AppImage');
assert.equal(r.all.length, 5, 'checksums are not offered as downloads');

assert.equal(detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15'), 'mac');
assert.equal(detectPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36'), 'windows');
assert.equal(detectPlatform('Mozilla/5.0 (X11; Linux x86_64) Firefox/131.0'), 'linux');
assert.equal(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1'), null);
assert.equal(detectPlatform('Mozilla/5.0 (Linux; Android 15) Chrome/130.0 Mobile'), null);
assert.equal(detectPlatform(null), null);
console.log('downloads: ok');
