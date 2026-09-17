<?php
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    errorResponse('Méthode non autorisée', 405);
}

$idclasse = $_GET['id'] ?? null;
$semaine = $_GET['semaine'] ?? null;

if (!$idclasse) {
    errorResponse('ID de classe requis', 400);
}

try {
    $classe = fetchOne("SELECT idclasse, niveau FROM classe WHERE idclasse = ?", [$idclasse]);
    if (!$classe) {
        errorResponse('Classe non trouvée', 404);
    }

    $weekDates = getWeekDates($semaine);
    $debut = $weekDates['debut'];
    $fin = $weekDates['fin'];

    $sql = "SELECT e.*, s.design as salle_design, p.nom as prof_nom, p.prenoms AS \"prof_prenoms\"
            FROM emploi_du_temps e
            LEFT JOIN salle s ON e.idsalle = s.idsalle
            LEFT JOIN professeur p ON e.idprof = p.idprof
            WHERE e.idclasse = ?
            AND CAST(e.date AS DATE) BETWEEN ? AND ?
            ORDER BY e.date";

    $emplois = fetchAll($sql, [$idclasse, $debut, $fin]);

    // Le frontend attend un tableau JSON brut (pas d'enveloppe success/data)
    jsonResponse($emplois);

} catch (PDOException $e) {
    errorResponse('❌ Erreur: ' . $e->getMessage(), 500);
}
?>
