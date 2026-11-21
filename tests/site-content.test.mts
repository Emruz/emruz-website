// Site content rules for navigation, managed security and contact links. Run: npm test
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { mainNav } from '../src/content/navigation.ts';
import { addOnLines, capabilities } from '../src/content/packages.ts';

// Changelog has a section for the current version (#52)
const version = JSON.parse(readFileSync('package.json', 'utf8')).version.replace(/\.0$/, '');
assert.match(readFileSync('CHANGELOG.md', 'utf8'), new RegExp(`^## v${version.replace(/\./g, '\\.')}\\s*$`, 'm'), `CHANGELOG.md needs ## v${version}`);

// Services menu: the label links to /services and All services comes first (#54)
const services = mainNav.find((g) => g.label === 'Services');
assert.ok(services?.children?.length);
assert.equal(services.href, '/services');
assert.equal(services.overview?.href, '/services');

// Individual services: every line has a page and a glossary line, none called an add-on (#55, #56)
assert.deepEqual(addOnLines.map((l) => l.slug).sort(), ['DRM', 'DSB', 'PSA', 'SPM', 'ZTI', 'ZTNA']);
for (const l of addOnLines) {
  assert.ok(l.path && l.brief, `${l.slug} needs a path and a brief`);
}
for (const [code, c] of Object.entries(capabilities)) {
  assert.doesNotMatch(c.description, /add-on/i, `${code} still says add-on`);
}
assert.doesNotMatch(services.children!.map((c) => c.description ?? '').join(' '), /add-on/i);

// Pages: every Schedule link opens the contact form with a topic (#57), and the home
// assessment tiles have no Learn More buttons (#53)
const files: string[] = [];
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx')) files.push(p);
  }
};
walk('src/app');
walk('src/components');
for (const f of files) {
  if (/\/(admin|workbench|contact)\//.test(f)) continue;
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/label: '([^']*Schedule[^']*)',\s*href: ([^}\n]+)/g)) {
    assert.match(m[2], /\/contact\?topic=/, `${f}: "${m[1]}" should open /contact?topic=`);
  }
}
const home = readFileSync('src/app/page.tsx', 'utf8');
const diagnostic = home.slice(home.indexOf('Start With a Diagnostic'), home.indexOf('Explore All Assessments'));
assert.doesNotMatch(diagnostic, /Learn More/, 'home assessment tiles should not have Learn More buttons');

console.log('site content tests passed');
