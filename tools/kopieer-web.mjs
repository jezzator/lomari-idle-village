// Kopieert de web-app naar www/ voor de Android-app (zonder service worker: de app heeft hem niet nodig).
import { cpSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
rmSync('www', { recursive: true, force: true }); mkdirSync('www');
const mee = f => /\.(html|js|jpg|png|webmanifest)$/.test(f) && f !== 'sw.js';
for (const f of readdirSync('.')) if (mee(f)) cpSync(f, 'www/' + f);
cpSync('portret', 'www/portret', { recursive: true });
cpSync('muziek', 'www/muziek', { recursive: true });
cpSync('gebouw', 'www/gebouw', { recursive: true });
console.log('www klaar');
