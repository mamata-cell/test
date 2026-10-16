import { createRequire } from 'node:module';
const require = createRequire(new URL('../frontend/package.json', import.meta.url));
for (const name of ['playwright','@playwright/test','puppeteer']) {
  try { console.log('BROWSER PACKAGE',name,require.resolve(name)); } catch { console.log('No package', name); }
}
const origin = process.env.LOGEN_APP_ORIGIN;
if (!origin) throw new Error('LOGEN_APP_ORIGIN missing');
for (const path of ['/cards','/src/pages/Cards.tsx','/moneta/team-cards.svg']) {
  const r = await fetch(origin+path);
  console.log(path, r.status, r.headers.get('content-type'), (await r.text()).slice(0,12000));
}
