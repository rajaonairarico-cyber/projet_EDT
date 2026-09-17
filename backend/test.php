<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    require_once __DIR__ . '/config/database.php';
    $pdo = getPDO();
    echo json_encode([
        'status' => 'OK',
        'message' => 'API Projet EDT fonctionne',
        'driver' => isPgsql() ? 'pgsql' : 'mysql',
        'time' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'ERROR', 'message' => $e->getMessage()]);
}
