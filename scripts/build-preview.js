#!/usr/bin/env node
// Génère infolettre/preview-XX.html en injectant contenu-XX.md dans index.html
// Si photo_id est défini, l'URL et l'alt sont récupérés depuis l'API WordPress.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT          = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHOP_URL      = 'https://shop.stephanewagner.com';
const WP_MEDIA      = 'https://www.photographie.stephanewagner.com/wp-json/wp/v2/media';
const WPLR_API      = 'https://www.photographie.stephanewagner.com/wp-json/wplr/v1';
const WPLR_TOKEN    = 'EDNusnA0Q8TW';
const CACHE_FILE    = resolve(ROOT, 'infolettre/.photo-cache.json');
const HIER_CACHE    = resolve(ROOT, 'infolettre/.hierarchy-cache.json');

// --- Cache hiérarchie (noms collections) ---
let _hierCache = null;
async function getCollectionName(collectionId) {
    if (!collectionId || collectionId.includes('[')) return null;
    if (!_hierCache) {
        if (existsSync(HIER_CACHE)) {
            try { _hierCache = JSON.parse(readFileSync(HIER_CACHE, 'utf8')); } catch { _hierCache = {}; }
        } else {
            const resp = await fetch(`${WPLR_API}/hierarchy`, { headers: { Authorization: `Bearer ${WPLR_TOKEN}` } });
            const data = await resp.json();
            _hierCache = {};
            function walk(node) {
                if (Array.isArray(node)) { node.forEach(walk); return; }
                if (!node || typeof node !== 'object') return;
                if (node.id && node.name) _hierCache[String(node.id)] = node.name;
                for (const k of ['children','items','galleries','collections']) if (node[k]) walk(node[k]);
            }
            walk(data);
            writeFileSync(HIER_CACHE, JSON.stringify(_hierCache, null, 2));
        }
    }
    return _hierCache[String(collectionId)] || null;
}

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
// Supporte les champs simples et les blocs multilignes (intro: |)
function parseFrontmatter(raw) {
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) throw new Error('Frontmatter introuvable');
    const meta = {};
    const lines = match[1].split('\n');
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) { i++; continue; }
        const key   = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim();
        if (value === '|' || value === '') {
            // Bloc multiligne : lire les lignes indentées suivantes (2 ou 4 espaces)
            const block = [];
            i++;
            while (i < lines.length && (lines[i].match(/^ {2,}/) || lines[i] === '')) {
                block.push(lines[i].replace(/^ {2,}/, ''));
                i++;
            }
            meta[key] = block.join('\n').trim() || value;
        } else {
            meta[key] = value;
            i++;
        }
    }
    return { meta, body: match[2].trim() };
}

function mdInline(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g,     '<em>$1</em>');
}

function toHtml(text) {
    if (!text || !text.trim()) return '';
    return text.trim().split(/\n\n+/).map((p, i, arr) => {
        const style = i < arr.length - 1 ? 'margin:0 0 16px;' : 'margin:0;';
        return `<p style="${style}">${mdInline(p.replace(/\n/g, ' '))}</p>`;
    }).join('\n                ');
}

function buildCtaUrl(meta) {
    const id = meta.collection_id;
    if (id && !id.includes('[')) {
        return `${SHOP_URL}/phototheque.html#album-${id}`;
    }
    return meta.cta_url || SHOP_URL;
}

const BTN = (url, label) =>
    `<a href="${url}" style="display:inline-block;margin:0 8px 8px;padding:14px 28px;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;">${label}</a>`;

function buildOptionalBtn(meta, field, label, style = 'filled') {
    const url = meta[field];
    if (!url || url.includes('[')) return '';
    if (style === 'outline') {
        return `<a href="${url}" style="display:block;padding:14px 28px;background:#ffffff;color:#1f1f1f;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;border:1px solid #1f1f1f;text-align:center;font-family:'General Sans Variable','General Sans','Helvetica Neue',sans-serif;font-weight:500;border-radius:2px;">${label}</a>`;
    }
    return BTN(url, label);
}

function buildSondageBlock(meta, ctaUrl, titre, photoUrl) {
    const url = meta.sondage_url;
    const social = `<p style="margin:20px 0 8px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#1a1a1a;opacity:0.5;">Partager</p>
              <a href="https://www.facebook.com/sharer/sharer.php?u=${ctaUrl}" style="display:inline-block;margin:0 4px;padding:7px 14px;border:1px solid rgba(0,0,0,0.25);color:#1a1a1a;text-decoration:none;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Facebook</a>
              <a href="https://x.com/intent/tweet?url=${ctaUrl}&text=${encodeURIComponent(titre)}" style="display:inline-block;margin:0 4px;padding:7px 14px;border:1px solid rgba(0,0,0,0.25);color:#1a1a1a;text-decoration:none;font-size:11px;letter-spacing:1px;text-transform:uppercase;">X</a>
              <a href="https://pinterest.com/pin/create/button/?url=${ctaUrl}&media=${encodeURIComponent(photoUrl)}&description=${encodeURIComponent(titre)}" style="display:inline-block;margin:0 4px;padding:7px 14px;border:1px solid rgba(0,0,0,0.25);color:#1a1a1a;text-decoration:none;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Pinterest</a>`;

    if (!url || url.includes('[')) {
        return `<tr>
            <td style="padding:24px 40px;text-align:center;background:#f5c842;">
              ${social}
            </td>
          </tr>`;
    }
    return `<tr>
            <td style="padding:24px 40px;text-align:center;background:#f5c842;">
              <p style="margin:0 0 12px;font-size:12px;letter-spacing:1px;color:#1a1a1a;">Participez au sondage et obtenez un rabais exclusif sur votre prochaine commande.</p>
              ${BTN(url, 'Répondre au sondage')}
              ${social}
            </td>
          </tr>`;
}

const template = readFileSync(resolve(ROOT, 'infolettre/index.html'), 'utf8');

async function buildOne(contenFile) {
    const srcPath = resolve(ROOT, `infolettre/${contenFile}`);
    const slug    = contenFile.replace('.md', '');
    const outName = `preview-${slug.split('-')[1]}.html`;
    const { meta, body } = parseFrontmatter(readFileSync(srcPath, 'utf8'));

    const photo       = await resolvePhoto(meta);
    const ctaUrl      = buildCtaUrl(meta);
    const albumName   = await getCollectionName(meta.collection_id);
    const ctaTexte    = albumName
        ? `Voir la série "${albumName}" sur Shop`
        : (meta.cta_texte || 'Voir la série');

    let html = template
        .replace(/{{SUJET}}/g,           meta.sujet           || '')
        .replace(/{{SERIE}}/g,           meta.serie           || '')
        .replace(/{{TITRE}}/g,           meta.titre           || '')
        .replace(/{{NUMERO}}/g,          meta.numero          || '')
        .replace(/{{PHOTO_URL}}/g,       photo.url)
        .replace(/{{PHOTO_ALT}}/g,       photo.alt)
        .replace(/{{INTRO}}/g,           toHtml(meta.intro    || ''))
        .replace(/{{CORPS}}/g,           toHtml(meta.corps || body))
        .replace(/{{CTA_TEXTE}}/g,       ctaTexte)
        .replace(/{{CTA_URL}}/g,         ctaUrl)
        .replace(/{{ARTICLE_BTN}}/g,     buildOptionalBtn(meta, 'article_url', `${meta.cta_episode || 'Lire l\'article'} — Épisode ${(meta.numero || '').replace(/^[^\d]*/, '')} →`, 'outline'))
        .replace(/{{SONDAGE_BTN}}/g,     buildSondageBlock(meta, ctaUrl, meta.titre || '', photo.url))
        .replace(/{{INSCRIPTION_URL}}/g, meta.inscription_url || '#');

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
