import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(process.env.PUPPETEER_DIR || 'C:/Users/atifa/AppData/Local/Temp/claude/e--My-Folder-Atif-Side-5--Website/9e25a89c-c9e9-4b6d-9564-419db08fe6ec/scratchpad/');
const puppeteer = require('puppeteer');

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3];
const width = Number(process.env.WIDTH) || 1677;
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'temporary screenshots');
fs.mkdirSync(dir, { recursive: true });
const n = fs.readdirSync(dir).map(f => +(f.match(/^screenshot-(\d+)/) || [])[1] || 0).reduce((a, b) => Math.max(a, b), 0) + 1;
const out = path.join(dir, `screenshot-${n}${label ? '-' + label : ''}.png`);

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out);
