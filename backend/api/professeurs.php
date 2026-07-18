<?php
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $prof = fetchOne("SELECT * FROM PROFESSEUR WHERE idprof = ?", [$id]);
            if ($prof) jsonResponse($prof);
            else errorResponse('Professeur non trouvé', 404);
        } else {
            jsonResponse(fetchAll("SELECT * FROM PROFESSEUR ORDER BY Nom"));
        }
        break;

    case 'POST':
        $data = getInputData();
        $errors = validateRequired($data, ['idprof', 'Nom', 'Prénoms', 'Grade']);
        if (!empty($errors)) errorResponse(implode(', ', $errors), 400);
        if (!idEstValide($data['idprof'])) errorResponse("❌ L'ID du professeur ne peut pas être un nombre négatif", 400);

        try {
            executeInsert("INSERT INTO PROFESSEUR (idprof, Nom, `Prénoms`, Grade) VALUES (?, ?, ?, ?)",
                [$data['idprof'], $data['Nom'], $data['Prénoms'], $data['Grade']]);
            successResponse($data, '✅ Professeur ajouté avec succès !');
        } catch (PDOException $e) {
            if ($e->errorInfo[1] == 1062) errorResponse('❌ Un professeur avec cet ID existe déjà', 409);
            else errorResponse('❌ Erreur: ' . $e->getMessage(), 500);
        }
        break;

    case 'PUT':
        if (!$id) errorResponse('ID requis', 400);
        $data = getInputData();
        $errors = validateRequired($data, ['Nom', 'Prénoms', 'Grade']);
        if (!empty($errors)) errorResponse(implode(', ', $errors), 400);

        try {
            $affected = executeUpdate("UPDATE PROFESSEUR SET Nom = ?, `Prénoms` = ?, Grade = ? WHERE idprof = ?",
                [$data['Nom'], $data['Prénoms'], $data['Grade'], $id]);
            successResponse(null, '✅ Professeur modifié avec succès !');
        } catch (PDOException $e) {
            errorResponse('❌ Erreur: ' . $e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        if (!$id) errorResponse('ID requis', 400);
        try {
            $affected = executeDelete("DELETE FROM PROFESSEUR WHERE idprof = ?", [$id]);
            if ($affected > 0) successResponse(null, '✅ Professeur supprimé avec succès !');
            else errorResponse('❌ Professeur non trouvé', 404);
        } catch (PDOException $e) {
            errorResponse('❌ Erreur: ' . $e->getMessage(), 500);
        }
        break;

    default:
        errorResponse('Méthode non autorisée', 405);
}
?>
