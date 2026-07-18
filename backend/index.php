<?php
// Point d'entrée unique de l'API.
// Toutes les requêtes (via .htaccess en Apache, ou "php -S localhost:8001 index.php" en dev) passent ici.
require_once __DIR__ . '/includes/router.php';
handleRequest();
?>
