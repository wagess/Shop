#!/usr/bin/env node
// Hot reload — surveille contenu.md + index.html, reconstruit preview.html et recharge le navigateur

import { watch } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import bs from 'browser-sync';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function build() {
    return new Promise((res, rej) => {
        const p = spawn('node', ['scripts/build-preview.js'], { cwd: ROOT, stdio: 'inherit' });
        p.on('close', code => code === 0 ? res() : rej(new Error(`build exit ${code}`)));
    });
}

// Build initial
await build();

// Démarrer browser-sync sur un port dédié qui proxy MAMP
const server = bs.create();
server.init({
    proxy: 'localhost:8888',
    startPath: '/infolettre/preview.html',
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
            server.reload('infolettre/preview.html');
            console.log('✅  Rechargé');
        } catch (e) {
            console.error('❌ ', e.message);
        }
    }, 150);
}

watch(resolve(ROOT, 'infolettre/contenu-01.md'),  () => onChange('contenu-01.md'));
watch(resolve(ROOT, 'infolettre/index.html'),  () => onChange('index.html'));

console.log('👁  Surveillance active — http://localhost:3000/infolettre/preview.html');
