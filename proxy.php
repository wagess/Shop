<?php
/**
 * Proxy local — contourne le CORS en dev (localhost:8888)
 * Toutes les requêtes vers /wp-json/* sont relayées vers photographie.stephanewagner.com
 */

const WP_BASE    = 'https://www.photographie.stephanewagner.com';
const BEARER     = 'EDNusnA0Q8TW';

// Chemin WP demandé : ?path=/wp-json/wplr/v1/hierarchy
$path = $_GET['path'] ?? '';
if (!$path || !str_starts_with($path, '/wp-json/')) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid path']);
    exit;
}

$url    = WP_BASE . $path;
$method = $_SERVER['REQUEST_METHOD'];

$headers = [
    'Authorization: Bearer ' . BEARER,
    'Accept: application/json',
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

if ($method === 'POST') {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    $headers[] = 'Content-Type: application/json';
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
http_response_code($httpCode);
echo $response;
