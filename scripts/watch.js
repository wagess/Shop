#!/usr/bin/env node
// Hot reload — surveille tous les contenu-XX.md + index.html

import { watch, readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import bs from 'browser-sync';

const ROOT      = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INFOLETTRE = resolve(ROOT, 'infolettre');

function build() {
    return new Promise((res, rej) => {
        const p = spawn('node', ['scripts/build-preview.js'], { cwd: ROOT, stdio: 'inherit' });
        p.on('close', code => code === 0 ? res() : rej(new Error(`build exit ${code}`)));
    });
}

// Build initial
await build();

// Démarrer browser-sync
const server = bs.create();
server.init({
    proxy: 'localhost:8888',
    startPath: '/Shop/infolettre/index-previews.html',
    port: 3000,
    open: true,
    notify: false,
    logLevel: 'silent',
});

let debounce;
function onChange(filename) {
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
        console.log(`♻️  ${filename} modifié — reconstruction...`);
        try {
            await build();
            server.reload();
            console.log('✅  Rechargé');
        } catch (e) {
            console.error('❌ ', e.message);
        }
    }, 200);
}

// Surveiller index.html (template)
watch(resolve(INFOLETTRE, 'index.html'), () => onChange('index.html'));

// Surveiller tous les contenu-XX.md existants + nouveaux
function watchContenuFiles() {
    const files = readdirSync(INFOLETTRE).filter(f => /^contenu-\d+\.md$/.test(f));
    files.forEach(f => {
        watch(resolve(INFOLETTRE, f), () => onChange(f));
    });
    console.log(`👁  Surveillance active sur ${files.length} fichiers contenu + index.html`);
}

watchContenuFiles();
console.log('🌐  http://localhost:3000/Shop/infolettre/index-previews.html');
