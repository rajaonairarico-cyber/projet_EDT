<?php
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

$joinSQL = "SELECT e.*, s.design as salle_design, p.nom as prof_nom, p.prenoms AS \"prof_prenoms\", c.niveau as classe_niveau
            FROM emploi_du_temps e
            LEFT JOIN salle s ON e.idsalle = s.idsalle
            LEFT JOIN professeur p ON e.idprof = p.idprof
            LEFT JOIN classe c ON e.idclasse = c.idclasse";

switch ($method) {
    case 'GET':
        if ($id) {
            $emploi = fetchOne("$joinSQL WHERE e.id = ?", [$id]);
            if ($emploi) jsonResponse($emploi);
            else errorResponse('Cours non trouvé', 404);
        } else {
            jsonResponse(fetchAll("$joinSQL ORDER BY e.date DESC"));
        }
        break;

    case 'POST':
        $data = getInputData();
        $errors = validateRequired($data, ['idsalle', 'idprof', 'idclasse', 'cours', 'date']);
        if (!empty($errors)) errorResponse(implode(', ', $errors), 400);

        $duree = (isset($data['duree']) && is_numeric($data['duree']) && $data['duree'] > 0) ? (float)$data['duree'] : 1.0;

        if (!strtotime($data['date'])) errorResponse('❌ Date invalide', 400);
        if (date('Y-m-d', strtotime($data['date'])) < date('Y-m-d')) {
            errorResponse('❌ Impossible de programmer un cours dans le passé', 400);
        }

        $conflit = checkConflit($data['idsalle'], $data['idprof'], $data['idclasse'], $data['date'], $duree);
        if ($conflit['conflit']) errorResponse($conflit['message'], 409);

        try {
            executeInsert("INSERT INTO emploi_du_temps (idsalle, idprof, idclasse, cours, date, duree) VALUES (?, ?, ?, ?, ?, ?)",
                [$data['idsalle'], $data['idprof'], $data['idclasse'], $data['cours'], $data['date'], $duree]);

            $salle = fetchOne("SELECT design FROM salle WHERE idsalle = ?", [$data['idsalle']]);
            $prof = fetchOne("SELECT nom, prenoms FROM professeur WHERE idprof = ?", [$data['idprof']]);
            $classe = fetchOne("SELECT niveau FROM classe WHERE idclasse = ?", [$data['idclasse']]);

            $finTimestamp = strtotime($data['date']) + ($duree * 3600);
            $heureFin = date('H:i', $finTimestamp);

            $message = "✅ Cours programmé avec succès ! Salle libre à partir de $heureFin"
                . " — " . $data['cours']
                . " | " . ($salle['design'] ?? '')
                . " | " . trim(($prof['nom'] ?? '') . ' ' . ($prof['prenoms'] ?? ''))
                . " | " . ($classe['niveau'] ?? '');

            successResponse($data, $message);
        } catch (PDOException $e) {
            errorResponse('❌ Erreur: ' . $e->getMessage(), 500);
        }
        break;

    case 'PUT':
        if (!$id) errorResponse('ID requis pour la modification', 400);
        $data = getInputData();
        $errors = validateRequired($data, ['idsalle', 'idprof', 'idclasse', 'cours', 'date']);
        if (!empty($errors)) errorResponse(implode(', ', $errors), 400);

        $duree = (isset($data['duree']) && is_numeric($data['duree']) && $data['duree'] > 0) ? (float)$data['duree'] : 1.0;

        if (!strtotime($data['date'])) errorResponse('❌ Date invalide', 400);
        if (date('Y-m-d', strtotime($data['date'])) < date('Y-m-d')) {
            errorResponse('❌ Impossible de programmer un cours dans le passé', 400);
        }

        $conflit = checkConflit($data['idsalle'], $data['idprof'], $data['idclasse'], $data['date'], $duree, $id);
        if ($conflit['conflit']) errorResponse($conflit['message'], 409);

        try {
            executeUpdate("UPDATE emploi_du_temps SET idsalle=?, idprof=?, idclasse=?, cours=?, date=?, duree=? WHERE id=?",
                [$data['idsalle'], $data['idprof'], $data['idclasse'], $data['cours'], $data['date'], $duree, $id]);
            successResponse(null, '✅ Cours modifié avec succès !');
        } catch (PDOException $e) {
            errorResponse('❌ Erreur: ' . $e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        if (!$id) errorResponse('ID requis pour la suppression', 400);
        try {
            $affected = executeDelete("DELETE FROM emploi_du_temps WHERE id = ?", [$id]);
            if ($affected > 0) successResponse(null, '✅ Cours supprimé avec succès !');
            else errorResponse('❌ Cours non trouvé', 404);
        } catch (PDOException $e) {
            errorResponse('❌ Erreur: ' . $e->getMessage(), 500);
        }
        break;

    default:
        errorResponse('Méthode non autorisée', 405);
}
?>
