#!/usr/bin/env node
// Génère infolettre/preview-XX.html en injectant contenu-XX.md dans index.html
// Si photo_id est défini, l'URL et l'alt sont récupérés depuis l'API WordPress.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT      = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHOP_URL  = 'https://shop.stephanewagner.com';
const WP_MEDIA  = 'https://www.photographie.stephanewagner.com/wp-json/wp/v2/media';
const CACHE_FILE = resolve(ROOT, 'infolettre/.photo-cache.json');

// --- Cache photo ---
function loadPhotoCache() {
    if (existsSync(CACHE_FILE)) {
        try { return JSON.parse(readFileSync(CACHE_FILE, 'utf8')); } catch {}
    }
    return {};
}
function savePhotoCache(cache) {
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function resolvePhoto(meta) {
    const id = meta.photo_id;
    if (!id || id.includes('[')) {
        return { url: meta.photo_url || '', alt: meta.photo_alt || '' };
    }

    const cache = loadPhotoCache();
    if (cache[id]) return cache[id];

    process.stdout.write(`   📷  Résolution photo ID ${id}...`);
    const resp = await fetch(`${WP_MEDIA}/${id}`);
    if (!resp.ok) throw new Error(`WP media API HTTP ${resp.status} pour ID ${id}`);
    const data = await resp.json();

    const result = {
        url: data.source_url || '',
        alt: data.alt_text   || data.title?.rendered || '',
    };
    cache[id] = result;
    savePhotoCache(cache);
    console.log(` ${result.url.split('/').pop()}`);
    return result;
}

// --- Frontmatter ---
function parseFrontmatter(raw) {
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) throw new Error('Frontmatter introuvable');
    const meta = {};
    for (const line of match[1].split('\n')) {
        const [key, ...rest] = line.split(':');
        if (key) meta[key.trim()] = rest.join(':').trim();
    }
    return { meta, body: match[2].trim() };
}

function bodyToHtml(body) {
    const parts = body.split(/\n\n+/);
    return parts.map((p, i) => {
        const style = i < parts.length - 1 ? 'margin:0 0 16px;' : 'margin:0;';
        return `<p style="${style}">${p.replace(/\n/g, ' ')}</p>`;
    }).join('\n                ');
}

function buildCtaUrl(meta) {
    const id = meta.collection_id;
    if (id && !id.includes('[')) {
        return `${SHOP_URL}/phototheque.html#album-${id}`;
    }
    return meta.cta_url || SHOP_URL;
}

const template = readFileSync(resolve(ROOT, 'infolettre/index.html'), 'utf8');

async function buildOne(contenFile) {
    const srcPath = resolve(ROOT, `infolettre/${contenFile}`);
    const slug    = contenFile.replace('.md', '');
    const outName = `preview-${slug.split('-')[1]}.html`;
    const { meta, body } = parseFrontmatter(readFileSync(srcPath, 'utf8'));

    const photo  = await resolvePhoto(meta);
    const ctaUrl = buildCtaUrl(meta);

    let html = template
        .replace(/{{SUJET}}/g,           meta.sujet           || '')
        .replace(/{{SERIE}}/g,           meta.serie           || '')
        .replace(/{{TITRE}}/g,           meta.titre           || '')
        .replace(/{{NUMERO}}/g,          meta.numero          || '')
        .replace(/{{PHOTO_URL}}/g,       photo.url)
        .replace(/{{PHOTO_ALT}}/g,       photo.alt)
        .replace(/{{CTA_TEXTE}}/g,       meta.cta_texte       || '')
        .replace(/{{CTA_URL}}/g,         ctaUrl)
        .replace(/{{INSCRIPTION_URL}}/g, meta.inscription_url || '#')
        .replace(/{{CORPS}}/g,           bodyToHtml(body));

    writeFileSync(resolve(ROOT, `infolettre/${outName}`), html);
    const albumLabel = meta.collection_id && !meta.collection_id.includes('[')
        ? ` → album-${meta.collection_id}` : '';
    console.log(`✅  ${outName} généré${albumLabel}`);
    return { outName, meta };
}

// --- Main ---
const arg   = process.argv[2];
const files = arg
    ? [`${arg}.md`]
    : readdirSync(resolve(ROOT, 'infolettre')).filter(f => /^contenu-\d+\.md$/.test(f)).sort();

const results = [];
for (const f of files) results.push(await buildOne(f));

// preview.html → contenu-01 (compatibilité watch.js)
if (!arg) {
    const first = results[0];
    if (first) {
        writeFileSync(
            resolve(ROOT, 'infolettre/preview.html'),
            readFileSync(resolve(ROOT, `infolettre/${first.outName}`), 'utf8')
        );
        console.log('✅  preview.html mis à jour (→ contenu-01)');
    }

    // Index des previews
    const rows = results.map(({ outName, meta }) => `
    <tr>
      <td><a href="${outName}">${outName}</a></td>
      <td>${meta.sujet || ''}</td>
      <td>${meta.serie || ''}</td>
      <td>${meta.numero || ''}</td>
    </tr>`).join('');
    writeFileSync(resolve(ROOT, 'infolettre/index-previews.html'), `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Infolettres — previews</title>
<style>body{font-family:Georgia,serif;padding:40px;background:#f4f4f0;}
table{border-collapse:collapse;width:100%;background:#fff;}
th,td{padding:10px 16px;border:1px solid #ddd;text-align:left;}
th{background:#1a1a1a;color:#fff;font-size:11px;letter-spacing:2px;text-transform:uppercase;}
a{color:#1a1a1a;}tr:hover{background:#f9f9f7;}</style>
</head>
<body>
<h1 style="font-weight:400;letter-spacing:2px;font-size:18px;text-transform:uppercase;margin-bottom:24px;">Stéphane Wagner · Infolettres</h1>
<table><thead><tr><th>Fichier</th><th>Sujet</th><th>Série</th><th>Numéro</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`);
    console.log('✅  index-previews.html généré');
}
