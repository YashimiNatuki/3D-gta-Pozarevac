import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const config = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));

// Guard against the actual npm ERESOLVE regression seen in the older checkout.
test('npm lockfile and manifest agree on esbuild', () => {
  assert.equal(pkg.devDependencies.esbuild, lock.packages[''].devDependencies.esbuild);
  const [major, minor] = lock.packages['node_modules/esbuild'].version.split('.').map(Number);
  assert.equal(major, 0);
  assert.ok(minor >= 27, 'Vite 8 requires esbuild >= 0.27');
});

test('Vite configuration uses an ESM-compatible directory reference', () => {
  assert.doesNotMatch(config, /\b__dirname\b/);
  assert.match(config, /import\.meta\.dirname/);
});

const onDemand = {
  VeoStudioModal: 'isVeoOpen',
  GoogleDocsModal: 'isDocsOpen',
  GoogleMapsModal: 'isMapsOpen',
  GooglePickerModal: 'isPickerOpen',
  MasterPlanModal: 'isMasterPlanOpen',
  AiChatDrawer: 'isChatOpen',
};

for (const [name, state] of Object.entries(onDemand)) {
  test(`${name} is imported lazily and gated behind Suspense`, () => {
    const importRule = new RegExp(`const ${name} = React\\.lazy\\([\\s\\S]{0,160}import\\(['\"]\\./components/${name}['\"]\\)`);
    const renderRule = new RegExp(`\\{${state} && \\(\\s*<React\\.Suspense fallback=\\{null\\}>\\s*<${name}\\b`);
    assert.match(app, importRule);
    assert.match(app, renderRule);
  });
}
