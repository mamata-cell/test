import { mkdir, writeFile } from 'node:fs/promises';

const base = 'https://staging.logen.io/design-assets/7a17e6d7-7d49-47fb-8092-a3aa910b46c0/';
const assets = [
  ['f195b015d4c949a2f5d504f7c3c098005f641743a735bf1bbc2694c49d5bc6ed.css', 'base.css'],
  ['e831ea6face07005b134af0a1b9af7e41a70827b962965536a8ee71c3b3c3caa.css', 'design.css'],
  ['4ef5f841f6f58cce1df50bda4c8cc7afdfddf02e9f615f190c0d05b3aae6a6c4.svg', 'team-cards.svg'],
];
await mkdir('frontend/public/moneta', { recursive: true });
for (const [remote, local] of assets) {
  const response = await fetch(base + remote);
  if (!response.ok) throw new Error(`Asset ${remote}: HTTP ${response.status}`);
  const content = await response.text();
  await writeFile(`frontend/public/moneta/${local}`, content);
  console.log(`Fetched ${local}: ${content.length} characters\n${content}`);
}
