<?php
/**
 * Verrou : l'admin (admin.html + *-save.php) ne doit modifier du contenu
 * qu'en local. La version en ligne est une sortie finale non modifiable —
 * tout contenu publié passe par un commit + push, jamais par une écriture
 * directe sur le serveur de prod.
 */
function is_local_request() {
    $host = $_SERVER['SERVER_NAME'] ?? '';
    return $host === 'localhost' || $host === '127.0.0.1' || substr($host, -6) === '.local';
}

function require_local_write() {
    if (!is_local_request()) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => "Écriture désactivée en production. L'admin ne peut modifier du contenu qu'en local."]);
        exit;
    }
}
