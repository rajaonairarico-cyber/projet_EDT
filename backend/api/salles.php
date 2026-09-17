<?php
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $salle = fetchOne("SELECT * FROM salle WHERE idsalle = ?", [$id]);
            if ($salle) jsonResponse($salle);
            else errorResponse('Salle non trouvée', 404);
        } else {
            jsonResponse(fetchAll("SELECT * FROM salle ORDER BY idsalle"));
        }
        break;

    case 'POST':
        $data = getInputData();
        $errors = validateRequired($data, ['idsalle', 'design']);
        if (!empty($errors)) errorResponse(implode(', ', $errors), 400);
        if (!idEstValide($data['idsalle'])) errorResponse("❌ L'ID de la salle ne peut pas être un nombre négatif", 400);

        try {
            $occupation = $data['occupation'] ?? 'libre';
            executeInsert("INSERT INTO salle (idsalle, design, occupation) VALUES (?, ?, ?)",
                [$data['idsalle'], $data['design'], $occupation]);
            successResponse($data, '✅ Salle ajoutée avec succès !');
        } catch (PDOException $e) {
            if (isDuplicateEntry($e)) errorResponse('❌ Une salle avec cet ID existe déjà', 409);
            else errorResponse('❌ Erreur: ' . $e->getMessage(), 500);
        }
        break;

    case 'PUT':
        if (!$id) errorResponse('ID requis pour la modification', 400);
        $data = getInputData();
        $errors = validateRequired($data, ['design']);
        if (!empty($errors)) errorResponse(implode(', ', $errors), 400);

        try {
            $occupation = $data['occupation'] ?? 'libre';
            $affected = executeUpdate("UPDATE salle SET design = ?, occupation = ? WHERE idsalle = ?",
                [$data['design'], $occupation, $id]);
            successResponse(null, '✅ Salle modifiée avec succès !');
        } catch (PDOException $e) {
            errorResponse('❌ Erreur: ' . $e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        if (!$id) errorResponse('ID requis pour la suppression', 400);
        try {
            $affected = executeDelete("DELETE FROM salle WHERE idsalle = ?", [$id]);
            if ($affected > 0) successResponse(null, '✅ Salle supprimée avec succès !');
            else errorResponse('❌ Salle non trouvée', 404);
        } catch (PDOException $e) {
            errorResponse('❌ Erreur: ' . $e->getMessage(), 500);
        }
        break;

    default:
        errorResponse('Méthode non autorisée', 405);
}
?>
