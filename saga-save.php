<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

require __DIR__ . '/admin-guard.php';

$file = __DIR__ . '/saga-content.md';

/**
 * Parse saga-content.md → { id: { nom, format, periode, lieu, description } }
 * Une saga = un dossier (folder) regroupant plusieurs séries, mise en avant
 * sur l'accueil (remplace l'ancien système "Collections vedettes" basé sur
 * une collection arbitraire). Format attendu par bloc :
 *   ## [id]
 *   [nom] ...
 *   [format] ...
 *   [periode] ...
 *   [lieu] ...
 *   [couleur] ...
 *   [description]
 *   texte multi-lignes...
 *   [note]
 *   texte multi-lignes...
 *   ---
 *
 * [couleur] : une des familles "primary" du design system (blue, red, green,
 * yellow, orange, purple, pink — jamais noir/gris), voir SAGA_COLORS dans
 * admin.html. Sa version "secondary" (--color-core-secondary-{couleur}) sert
 * d'accent pour les séries enfants de la saga côté front-end.
 *
 * [note] : second paragraphe éditorial, plus discret (ton atténué), affiché
 * sous [description] sur l'accueil — masqué si vide (pas de contenu inventé).
 */
function parseSagaMd($content) {
    $result = [];
    preg_match_all('/^## \[([^\]]+)\]\s*\n(.*?)(?=^## \[|\z)/ms', $content, $matches, PREG_SET_ORDER);
    foreach ($matches as $m) {
        $id    = trim($m[1]);
        $block = preg_replace('/\n?-{3,}\s*$/s', '', $m[2]);

        $fields = ['nom' => '', 'format' => '', 'periode' => '', 'lieu' => '', 'couleur' => '', 'description' => '', 'note' => ''];
        if (preg_match('/^\[nom\][ \t]*(.*)$/m', $block, $mm))            $fields['nom']         = trim($mm[1]);
        if (preg_match('/^\[format\][ \t]*(.*)$/m', $block, $mm))         $fields['format']      = trim($mm[1]);
        if (preg_match('/^\[periode\][ \t]*(.*)$/m', $block, $mm))        $fields['periode']     = trim($mm[1]);
        if (preg_match('/^\[lieu\][ \t]*(.*)$/m', $block, $mm))           $fields['lieu']        = trim($mm[1]);
        if (preg_match('/^\[couleur\][ \t]*(.*)$/m', $block, $mm))        $fields['couleur']     = trim($mm[1]);
        if (preg_match('/^\[description\]\s*\n?(.*?)(?=^\[note\]|\z)/ms', $block, $mm)) $fields['description'] = trim($mm[1]);
        if (preg_match('/^\[note\]\s*\n?(.*)$/ms', $block, $mm))        $fields['note']        = trim($mm[1]);

        $result[$id] = $fields;
    }
    return $result;
}

function serializeSagaMd($data) {
    $out  = "# Sagas — Contenus\n\n";
    $out .= "<!-- Fichier généré et modifié depuis l'admin (admin.html). Modifiable ici aussi : respecter le format `## [id]` et les clés entre crochets. -->\n\n";
    foreach ($data as $id => $fields) {
        $out .= "## [$id]\n\n";
        $out .= "[nom] "     . ($fields['nom']     ?? '') . "\n";
        $out .= "[format] "  . ($fields['format']  ?? '') . "\n";
        $out .= "[periode] " . ($fields['periode'] ?? '') . "\n";
        $out .= "[lieu] "    . ($fields['lieu']    ?? '') . "\n";
        $out .= "[couleur] " . ($fields['couleur'] ?? '') . "\n";
        $out .= "[description]\n" . ($fields['description'] ?? '') . "\n\n";
        $out .= "[note]\n" . ($fields['note'] ?? '') . "\n\n---\n\n";
    }
    return $out;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $content = file_exists($file) ? file_get_contents($file) : '';
    echo json_encode(parseSagaMd($content));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_local_write();
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);
    if ($data === null) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON invalide']);
        exit;
    }
    file_put_contents($file, serializeSagaMd($data));
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Méthode non autorisée']);
