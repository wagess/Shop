<?php
/**
 * Endpoint génération d'histoire narrative pour le triptyque.
 * POST { photos: [{ title, keywords: [] }, ...] }
 * Retourne { story: "..." }
 */

ini_set('display_errors', 0);
error_reporting(0);
ob_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

function respond($data, $code = 200) {
    ob_clean();
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_clean(); http_response_code(204); exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Méthode non autorisée'], 405);
}

// Charger le .env
$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) $_ENV[trim($parts[0])] = trim($parts[1]);
    }
}

$apiKey = $_ENV['ANTHROPIC_API_KEY'] ?? '';
if (!$apiKey) {
    respond(['error' => 'Clé API Anthropic manquante'], 500);
}

$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);

if (!is_array($body) || empty($body['photos'])) {
    respond(['error' => 'Données manquantes'], 400);
}

$photos = array_slice($body['photos'], 0, 3);

// Construire le prompt
$photoParts = [];
foreach ($photos as $i => $p) {
    $title = trim($p['title'] ?? '');
    $kws   = array_filter(array_map('trim', (array)($p['keywords'] ?? [])));
    $kwStr = implode(', ', array_slice($kws, 0, 12));
    $photoParts[] = "Photo " . ($i + 1) . ($title ? " — $title" : '') . ($kwStr ? "\nMots-clés : $kwStr" : '');
}

$prompt = "À partir de ces mots-clés photographiques, génère directement une maxime philosophique en français. Réponds uniquement avec la maxime — aucune introduction, aucun commentaire, aucune explication.\n\nRègles :\n- 1 phrase uniquement\n- 100 caractères maximum\n- Contraste ou paradoxe\n- Ton contemplatif, suggestion plutôt qu'explication\n- Pas de guillemets\n\nMots-clés :\n" . implode("\n\n", $photoParts);

$payload = json_encode([
    'model'      => 'claude-haiku-4-5-20251001',
    'max_tokens' => 80,
    'system'     => 'Tu es un générateur de maximes photographiques. Tu réponds toujours avec une seule phrase, directement, sans introduction ni commentaire.',
    'messages'   => [['role' => 'user', 'content' => $prompt]],
], JSON_UNESCAPED_UNICODE);

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'x-api-key: ' . $apiKey,
        'anthropic-version: 2023-06-01',
    ],
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_SSL_VERIFYPEER => true,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($response === false) {
    respond(['error' => 'Erreur réseau : ' . $curlErr], 500);
}

$data = json_decode($response, true);

if ($httpCode !== 200) {
    $detail = $data['error']['message'] ?? "Erreur HTTP $httpCode";
    respond(['error' => $detail], 500);
}

$story = $data['content'][0]['text'] ?? '';
respond(['story' => trim($story)]);
