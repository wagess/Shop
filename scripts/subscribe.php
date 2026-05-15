<?php
/**
 * Endpoint d'inscription à la liste Mailchimp.
 * Appelé en POST avec { "email": "...", "fname": "..." }
 */

// Supprimer tout affichage d'erreurs PHP dans la réponse
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
    ob_clean();
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Méthode non autorisée'], 405);
}

// Charger le .env depuis la racine du projet
$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $_ENV[trim($parts[0])] = trim($parts[1]);
        }
    }
}

$apiKey = $_ENV['MAILCHIMP_API_KEY'] ?? '';
$listId = $_ENV['MAILCHIMP_LIST_ID'] ?? '';

if (!$apiKey || !$listId) {
    respond(['error' => 'Configuration serveur manquante'], 500);
}

$dcParts = explode('-', $apiKey);
$dc = count($dcParts) > 1 ? end($dcParts) : 'us2';

// Lire le corps JSON
$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);

if (!is_array($body)) {
    respond(['error' => 'Corps de requête invalide'], 400);
}

$email = trim($body['email'] ?? '');
$fname = trim($body['fname'] ?? '');

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(['error' => 'Adresse courriel invalide'], 400);
}

// Appel API Mailchimp
$url     = "https://{$dc}.api.mailchimp.com/3.0/lists/{$listId}/members";
$payload = json_encode([
    'email_address' => $email,
    'status'        => 'subscribed',
    'merge_fields'  => ['FNAME' => $fname],
], JSON_UNESCAPED_UNICODE);

$auth = base64_encode('anystring:' . $apiKey);

if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Basic ' . $auth,
        ],
        CURLOPT_TIMEOUT        => 10,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        respond(['error' => 'Erreur réseau : ' . $curlErr], 500);
    }
} else {
    // Fallback sans curl
    $opts = [
        'http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/json\r\nAuthorization: Basic {$auth}",
            'content' => $payload,
            'timeout' => 10,
            'ignore_errors' => true,
        ],
    ];
    $response = file_get_contents($url, false, stream_context_create($opts));
    $status   = $http_response_header[0] ?? '';
    preg_match('/HTTP\/\S+\s+(\d+)/', $status, $m);
    $httpCode = isset($m[1]) ? (int)$m[1] : 0;
}

$data = json_decode($response, true);

if ($httpCode === 200) {
    respond(['success' => true, 'message' => 'Inscription réussie !']);
} elseif ($httpCode === 400 && ($data['title'] ?? '') === 'Member Exists') {
    respond(['success' => true, 'message' => 'Vous êtes déjà inscrit !']);
} else {
    $detail = $data['detail'] ?? $data['title'] ?? "Erreur HTTP {$httpCode}";
    respond(['error' => $detail], 400);
}
