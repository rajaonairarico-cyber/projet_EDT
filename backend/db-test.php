<?php
header('Content-Type: application/json');

require_once __DIR__ . '/config/database.php';

try {
    $pdo = getPDO();
    echo json_encode([
        'status' => 'OK',
        'message' => 'Connexion DB réussie',
        'driver' => isPgsql() ? 'pgsql' : 'mysql'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'ERROR',
        'message' => $e->getMessage()
    ]);
}
