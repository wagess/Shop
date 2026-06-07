#!/usr/bin/env node
/**
 * Envoie une campagne Mailchimp à partir de :
 *   - infolettre/contenu.md  — texte + métadonnées (frontmatter)
 *   - infolettre/index.html  — template avec {{PLACEHOLDERS}}
 *
 * Usage :
 *   node scripts/send-newsletter.js           → envoie à la liste
 *   node scripts/send-newsletter.js --draft   → crée un brouillon Mailchimp sans envoyer
 *
 * Variables d'environnement requises (.env) :
 *   MAILCHIMP_API_KEY    — clé API Mailchimp (ex: xxxxxxxx-us2)
 *   MAILCHIMP_LIST_ID    — ID de l'audience
 *   MAILCHIMP_FROM_NAME  — Nom de l'expéditeur
 *   MAILCHIMP_FROM_EMAIL — Courriel de l'expéditeur
 */

import 'dotenv/config';
import * as readline from 'node:readline/promises';
import { readFile, writeFile } from 'node:fs/promises';
import { stdin as input, stdout as output } from 'node:process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = resolve(__dir, '..');
const HIER_CACHE = resolve(ROOT, 'infolettre/.hierarchy-cache.json');
const WPLR_API   = 'https://www.photographie.stephanewagner.com/wp-json/wplr/v1';
const WPLR_TOKEN = 'EDNusnA0Q8TW';

let _hierCache = null;
async function getCollectionName(collectionId) {
    if (!collectionId || collectionId.includes('[')) return null;
    if (!_hierCache) {
        try {
            const { readFileSync, existsSync, writeFileSync } = await import('node:fs');
            if (existsSync(HIER_CACHE)) {
                _hierCache = JSON.parse(readFileSync(HIER_CACHE, 'utf8'));
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
        } catch { _hierCache = {}; }
    }
    return _hierCache[String(collectionId)] || null;
}

const { MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID, MAILCHIMP_FROM_NAME, MAILCHIMP_FROM_EMAIL } = process.env;

if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID || !MAILCHIMP_FROM_NAME || !MAILCHIMP_FROM_EMAIL) {
    console.error('❌  Variables manquantes dans .env');
    process.exit(1);
}

const datacenter = MAILCHIMP_API_KEY.split('-')[1];
const BASE = `https://${datacenter}.api.mailchimp.com/3.0`;
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString('base64')}`,
};

async function mailchimp(method, path, body) {
    const resp = await fetch(`${BASE}${path}`, {
        method, headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    if (resp.status === 204) return null;
    const json = await resp.json();
    if (!resp.ok) throw new Error(json.detail || json.title || `HTTP ${resp.status}`);
    return json;
}

// Parse frontmatter — supporte blocs multilignes (intro:, corps:)
function parseFrontmatter(raw) {
    const match = raw.match(/^---\n([\s\S]*?)\n---(?:\n([\s\S]*))?$/);
    if (!match) throw new Error('Frontmatter introuvable dans contenu.md');
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
    const body = (match[2] || '').trim();
    return { meta, body };
}

function mdInline(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g,     '<em>$1</em>');
}

// Convertit les paragraphes Markdown en <p> HTML
function bodyToHtml(text) {
    if (!text || !text.trim()) return '';
    return text.trim().split(/\n\n+/).map((p, i, arr) => {
        const style = i < arr.length - 1 ? 'margin:0 0 16px;' : 'margin:0;';
        return `<p style="${style}">${mdInline(p.replace(/\n/g, ' '))}</p>`;
    }).join('\n                ');
}

async function main() {
    const draftOnly = process.argv.includes('--draft');
    const skipConfirm = process.argv.includes('--yes');
    const testIdx   = process.argv.indexOf('--test');
    const testEmail = testIdx !== -1 ? process.argv[testIdx + 1] : null;
    const rl = readline.createInterface({ input, output });

    console.log('\n📸  Infolettre — Stéphane Wagner\n');

    // Lire contenu.md
    const raw = await readFile(resolve(ROOT, 'infolettre/contenu-01.md'), 'utf8');
    const { meta, body } = parseFrontmatter(raw);

    // Lire template HTML
    let html = await readFile(resolve(ROOT, 'infolettre/index.html'), 'utf8');

    // Résoudre photo_id → url + alt via WP API (avec cache)
    const SHOP_URL   = 'https://shop.stephanewagner.com';
    const WP_MEDIA   = 'https://www.photographie.stephanewagner.com/wp-json/wp/v2/media';
    const CACHE_FILE = resolve(ROOT, 'infolettre/.photo-cache.json');
    let photoUrl = meta.photo_url || '';
    let photoAlt = meta.photo_alt || '';
    const photoId = meta.photo_id;
    if (photoId && !photoId.includes('[')) {
        let cache = {};
        try { cache = JSON.parse(await readFile(CACHE_FILE, 'utf8')); } catch {}
        if (cache[photoId]) {
            ({ url: photoUrl, alt: photoAlt } = cache[photoId]);
        } else {
            const r = await fetch(`${WP_MEDIA}/${photoId}`);
            if (r.ok) {
                const d = await r.json();
                photoUrl = d.source_url || '';
                photoAlt = d.alt_text || d.title?.rendered || '';
                cache[photoId] = { url: photoUrl, alt: photoAlt };
                await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
            }
        }
    }

    // Construire l'URL CTA : collection_id a priorité sur cta_url
    const collId = meta.collection_id;
    const ctaUrl = (collId && !collId.includes('['))
        ? `${SHOP_URL}/phototheque.html#album-${collId}`
        : (meta.cta_url || SHOP_URL);

    // Boutons optionnels
    const btn = (url, label) => url && !url.includes('[')
        ? `<a href="${url}" style="display:inline-block;margin:0 8px 8px;padding:14px 28px;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;">${label}</a>`
        : '';

    const social = `<p style="margin:20px 0 8px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#1a1a1a;opacity:0.5;">Partager</p>
              <a href="https://www.facebook.com/sharer/sharer.php?u=${ctaUrl}" style="display:inline-block;margin:0 4px;padding:7px 14px;border:1px solid rgba(0,0,0,0.25);color:#1a1a1a;text-decoration:none;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Facebook</a>
              <a href="https://x.com/intent/tweet?url=${ctaUrl}&text=${encodeURIComponent(meta.titre || '')}" style="display:inline-block;margin:0 4px;padding:7px 14px;border:1px solid rgba(0,0,0,0.25);color:#1a1a1a;text-decoration:none;font-size:11px;letter-spacing:1px;text-transform:uppercase;">X</a>
              <a href="https://pinterest.com/pin/create/button/?url=${ctaUrl}&media=${encodeURIComponent(photoUrl)}&description=${encodeURIComponent(meta.titre || '')}" style="display:inline-block;margin:0 4px;padding:7px 14px;border:1px solid rgba(0,0,0,0.25);color:#1a1a1a;text-decoration:none;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Pinterest</a>`;

    const sondageBlock = (url) => {
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
              ${btn(url, 'Répondre au sondage')}
              ${social}
            </td>
          </tr>`;
    };

    // CTA texte avec nom de collection
    const albumName = await getCollectionName(meta.collection_id);
    const ctaTexte  = albumName
        ? `Voir la série "${albumName}" sur Shop`
        : (meta.cta_texte || 'Voir la série');

    // Injecter les placeholders
    html = html
        .replace(/{{SUJET}}/g,      meta.sujet      || '')
        .replace(/{{SERIE}}/g,      meta.serie      || '')
        .replace(/{{TITRE}}/g,      meta.titre      || '')
        .replace(/{{NUMERO}}/g,     meta.numero     || '')
        .replace(/{{INTRO}}/g,      bodyToHtml(meta.intro || ''))
        .replace(/{{PHOTO_URL}}/g,  photoUrl)
        .replace(/{{PHOTO_ALT}}/g,  photoAlt)
        .replace(/{{CTA_TEXTE}}/g,       ctaTexte)
        .replace(/{{CTA_URL}}/g,         ctaUrl)
        .replace(/{{ARTICLE_BTN}}/g,     meta.article_url && !meta.article_url.includes('[')
            ? `<a href="${meta.article_url}" style="display:inline-block;margin:0 8px 8px;padding:14px 28px;background:transparent;color:#1a1a1a;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;border:1px solid #1a1a1a;">Lire la suite sur le blog →</a>`
            : '')
        .replace(/{{SONDAGE_BTN}}/g,     sondageBlock(meta.sondage_url))
        .replace(/{{INSCRIPTION_URL}}/g, meta.inscription_url || '#')
        .replace(/{{CORPS}}/g,      bodyToHtml(meta.corps || body));

    console.log(`📋  Résumé :`);
    console.log(`   Objet    : ${meta.sujet}`);
    console.log(`   Aperçu   : ${meta.apercu}`);
    console.log(`   Photo    : ${meta.photo_url}`);
    console.log(`   Liste    : ${MAILCHIMP_LIST_ID}`);
    console.log(`   De       : ${MAILCHIMP_FROM_NAME} <${MAILCHIMP_FROM_EMAIL}>\n`);

    const action = testEmail ? `Envoyer un test à ${testEmail}` : draftOnly ? 'Créer un brouillon' : 'Envoyer maintenant';
    if (skipConfirm) {
        rl.close();
        console.log(`${action} — confirmé via --yes`);
    } else {
        const confirm = await rl.question(`${action} ? (oui/non) : `);
        rl.close();
        if (confirm.trim().toLowerCase() !== 'oui') { console.log('Annulé.'); return; }
    }

    // Créer la campagne
    console.log('\n⏳  Création de la campagne...');
    const campaign = await mailchimp('POST', '/campaigns', {
        type: 'regular',
        recipients: { list_id: MAILCHIMP_LIST_ID },
        settings: {
            subject_line: meta.sujet,
            preview_text: meta.apercu || undefined,
            from_name:    MAILCHIMP_FROM_NAME,
            reply_to:     MAILCHIMP_FROM_EMAIL,
        },
    });
    console.log(`✅  Campagne créée : ${campaign.id}`);

    // Définir le contenu HTML
    console.log('⏳  Envoi du contenu HTML...');
    await mailchimp('PUT', `/campaigns/${campaign.id}/content`, { html });
    console.log('✅  Contenu défini.');

    if (testEmail) {
        console.log(`⏳  Envoi du test à ${testEmail}...`);
        await mailchimp('POST', `/campaigns/${campaign.id}/actions/test`, {
            test_emails: [testEmail],
            send_type: 'html',
        });
        console.log(`\n✅  Mail test envoyé à ${testEmail} !\n`);
        // Supprimer la campagne brouillon créée pour le test
        await mailchimp('DELETE', `/campaigns/${campaign.id}`);
    } else if (draftOnly) {
        console.log(`\n📝  Brouillon disponible sur Mailchimp :`);
        console.log(`    https://us2.admin.mailchimp.com/campaigns/edit?id=${campaign.web_id}\n`);
    } else {
        console.log('⏳  Envoi en cours...');
        await mailchimp('POST', `/campaigns/${campaign.id}/actions/send`);
        console.log(`\n🎉  Infolettre envoyée à tous les abonnés !\n    Campagne : ${campaign.id}\n`);
    }
}

main().catch(err => {
    console.error('❌ ', err.message);
    process.exit(1);
});
