
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/config/database.php';

try {
    $pdo = getPDO();
    
    // Vérifier que la connexion fonctionne
    $stmt = $pdo->query("SELECT 1 as test");
    $stmt->fetch();
    
    // Compter les tables
    $tables = $pdo->query("
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    ")->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode([
        'status' => 'OK',
        'message' => 'API Projet EDT fonctionne',
        'driver' => isPgsql() ? 'pgsql' : 'mysql',
        'database' => 'connected',
        'tables' => $tables,
        'time' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'ERROR',
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
