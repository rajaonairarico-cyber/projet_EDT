<?php
require_once __DIR__ . '/../config/database.php';

function setCORSHeaders() {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

function handleRequest() {
    setCORSHeaders();

    $path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
    if (empty($path)) $path = 'professeurs';

    $parts = explode('/', $path);
    $resource = $parts[0];
    $id = $parts[1] ?? $_GET['id'] ?? null;
    if ($id !== null) $_GET['id'] = $id;

    // Recalcule l'occupation des salles à chaque requête (basé sur l'heure réelle)
    try {
        rafraichirOccupationSalles();
    } catch (PDOException $e) {
        // si la table n'existe pas encore, on laisse l'erreur normale du endpoint la gérer
    }

    $apiFile = __DIR__ . '/../api/' . $resource . '.php';

    if (file_exists($apiFile)) {
        require_once $apiFile;
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Ressource non trouvée: ' . $resource,
            'available' => ['professeurs', 'salles', 'classes', 'emplois', 'salles-libres', 'emploi-classe']
        ]);
    }
}
?>
