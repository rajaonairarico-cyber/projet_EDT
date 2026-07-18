<?php
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

$joinSQL = "SELECT e.*, s.design as salle_design, p.Nom as prof_nom, p.`Prénoms` as prof_prenoms, c.niveau as classe_niveau
            FROM EMPLOI_DU_TEMPS e
            LEFT JOIN SALLE s ON e.idsalle = s.idsalle
            LEFT JOIN PROFESSEUR p ON e.idprof = p.idprof
            LEFT JOIN CLASSE c ON e.idclasse = c.idclasse";

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

        $conflit = checkConflit($data['idsalle'], $data['idprof'], $data['idclasse'], $data['date'], $duree);
        if ($conflit['conflit']) errorResponse($conflit['message'], 409);

        try {
            executeInsert("INSERT INTO EMPLOI_DU_TEMPS (idsalle, idprof, idclasse, cours, date, duree) VALUES (?, ?, ?, ?, ?, ?)",
                [$data['idsalle'], $data['idprof'], $data['idclasse'], $data['cours'], $data['date'], $duree]);

            $salle = fetchOne("SELECT design FROM SALLE WHERE idsalle = ?", [$data['idsalle']]);
            $prof = fetchOne("SELECT Nom, `Prénoms` FROM PROFESSEUR WHERE idprof = ?", [$data['idprof']]);
            $classe = fetchOne("SELECT niveau FROM CLASSE WHERE idclasse = ?", [$data['idclasse']]);

            $finTimestamp = strtotime($data['date']) + ($duree * 3600);
            $heureFin = date('H:i', $finTimestamp);

            $message = "✅ Cours programmé avec succès ! Salle libre à partir de $heureFin"
                . " — " . $data['cours']
                . " | " . ($salle['design'] ?? '')
                . " | " . trim(($prof['Nom'] ?? '') . ' ' . ($prof['Prénoms'] ?? ''))
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

        $conflit = checkConflit($data['idsalle'], $data['idprof'], $data['idclasse'], $data['date'], $duree, $id);
        if ($conflit['conflit']) errorResponse($conflit['message'], 409);

        try {
            executeUpdate("UPDATE EMPLOI_DU_TEMPS SET idsalle=?, idprof=?, idclasse=?, cours=?, date=?, duree=? WHERE id=?",
                [$data['idsalle'], $data['idprof'], $data['idclasse'], $data['cours'], $data['date'], $duree, $id]);
            successResponse(null, '✅ Cours modifié avec succès !');
        } catch (PDOException $e) {
            errorResponse('❌ Erreur: ' . $e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        if (!$id) errorResponse('ID requis pour la suppression', 400);
        try {
            $affected = executeDelete("DELETE FROM EMPLOI_DU_TEMPS WHERE id = ?", [$id]);
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
