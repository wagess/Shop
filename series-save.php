<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

$file = __DIR__ . '/series-content.md';

/**
 * Parse series-content.md → { id: { nom, format, periode, description } }
 * Format attendu par bloc :
 *   ## [id]
 *   [nom] ...
 *   [format] ...
 *   [periode] ...
 *   [description]
 *   texte multi-lignes...
 *   ---
 */
function parseSeriesMd($content) {
    $result = [];
    preg_match_all('/^## \[([^\]]+)\]\s*\n(.*?)(?=^## \[|\z)/ms', $content, $matches, PREG_SET_ORDER);
    foreach ($matches as $m) {
        $id    = trim($m[1]);
        $block = preg_replace('/\n?-{3,}\s*$/s', '', $m[2]);

        $fields = ['nom' => '', 'format' => '', 'periode' => '', 'description' => ''];
        if (preg_match('/^\[nom\][ \t]*(.*)$/m', $block, $mm))            $fields['nom']         = trim($mm[1]);
        if (preg_match('/^\[format\][ \t]*(.*)$/m', $block, $mm))         $fields['format']      = trim($mm[1]);
        if (preg_match('/^\[periode\][ \t]*(.*)$/m', $block, $mm))        $fields['periode']     = trim($mm[1]);
        if (preg_match('/^\[description\]\s*\n?(.*)$/ms', $block, $mm)) $fields['description'] = trim($mm[1]);

        $result[$id] = $fields;
    }
    return $result;
}

function serializeSeriesMd($data) {
    $out  = "# Séries — Contenus\n\n";
    $out .= "<!-- Fichier généré et modifié depuis l'admin (admin.html). Modifiable ici aussi : respecter le format `## [id]` et les clés entre crochets. -->\n\n";
    foreach ($data as $id => $fields) {
        $out .= "## [$id]\n\n";
        $out .= "[nom] "     . ($fields['nom']     ?? '') . "\n";
        $out .= "[format] "  . ($fields['format']  ?? '') . "\n";
        $out .= "[periode] " . ($fields['periode'] ?? '') . "\n";
        $out .= "[description]\n" . ($fields['description'] ?? '') . "\n\n---\n\n";
    }
    return $out;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $content = file_exists($file) ? file_get_contents($file) : '';
    echo json_encode(parseSeriesMd($content));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);
    if ($data === null) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON invalide']);
        exit;
    }
    file_put_contents($file, serializeSeriesMd($data));
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Méthode non autorisée']);
