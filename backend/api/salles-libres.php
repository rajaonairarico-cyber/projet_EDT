<?php
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    errorResponse('Méthode non autorisée', 405);
}

$date = $_GET['date'] ?? null;
$heure = $_GET['heure'] ?? null;

if (!$date || !$heure) {
    errorResponse('Date et heure requises', 400);
}

try {
    $datetime = $date . ' ' . $heure . ':00';

    // Une salle est libre si aucun cours ne couvre cet instant précis (en tenant compte de la durée)
    if (isPgsql()) {
        $sql = "SELECT s.* FROM salle s
                WHERE NOT EXISTS (
                    SELECT 1 FROM emploi_du_temps e
                    WHERE e.idsalle = s.idsalle
                    AND ? < e.date + (e.duree * interval '1 minute')
                    AND (? + interval '1 minute') > e.date
                )
                ORDER BY s.idsalle";
    } else {
        $sql = "SELECT s.* FROM salle s
                WHERE NOT EXISTS (
                    SELECT 1 FROM emploi_du_temps e
                    WHERE e.idsalle = s.idsalle
                    AND ? < DATE_ADD(e.date, INTERVAL (e.duree*60) MINUTE)
                    AND DATE_ADD(?, INTERVAL 1 MINUTE) > e.date
                )
                ORDER BY s.idsalle";
    }

    $salles = fetchAll($sql, [$datetime, $datetime]);

    $count = count($salles);
    $message = $count > 0 ? "✅ $count salle(s) libre(s) trouvée(s)" : "❌ Aucune salle libre à cette date et heure";

    jsonResponse([
        'success' => true,
        'message' => $message,
        'data' => $salles,
        'count' => $count
    ]);

} catch (PDOException $e) {
    errorResponse('❌ Erreur: ' . $e->getMessage(), 500);
}
?>
