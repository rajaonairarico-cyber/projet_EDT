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
    $classe = fetchOne("SELECT * FROM CLASSE WHERE idclasse = ?", [$idclasse]);
    if (!$classe) {
        errorResponse('Classe non trouvée', 404);
    }

    $weekDates = getWeekDates($semaine);
    $debut = $weekDates['debut'];
    $fin = $weekDates['fin'];

    $sql = "SELECT e.*, s.design as salle_design, p.Nom as prof_nom, p.`Prénoms` as prof_prenoms
            FROM EMPLOI_DU_TEMPS e
            LEFT JOIN SALLE s ON e.idsalle = s.idsalle
            LEFT JOIN PROFESSEUR p ON e.idprof = p.idprof
            WHERE e.idclasse = ?
            AND DATE(e.date) BETWEEN ? AND ?
            ORDER BY e.date";

    $emplois = fetchAll($sql, [$idclasse, $debut, $fin]);

    // Le frontend attend un tableau JSON brut (pas d'enveloppe success/data)
    jsonResponse($emplois);

} catch (PDOException $e) {
    errorResponse('❌ Erreur: ' . $e->getMessage(), 500);
}
?>
