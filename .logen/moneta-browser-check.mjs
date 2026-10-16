import { chromium } from './browser-check/node_modules/playwright/index.mjs';
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
const page = await browser.newPage({viewport:{width:1440,height:1000}});
page.on('pageerror', error => console.log('PAGE ERROR',error.message));
page.on('console', message => {if(message.type()==='error')console.log('CONSOLE ERROR',message.text());});
const origin = process.env.LOGEN_APP_ORIGIN;
for (const path of ['/','/cards','/accounts','/company']) {
  await page.goto(origin+path,{waitUntil:'networkidle'});
  console.log(path, await page.title(), await page.locator('body').innerText());
  console.log('LAYOUT', await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,h1:document.querySelector('h1')?.getBoundingClientRect().toJSON(),root:document.querySelector('#root')?.getBoundingClientRect().toJSON(),images:[...document.images].map(i=>({src:i.src,complete:i.complete,width:i.naturalWidth}))})));
}
await browser.close();
