<?php
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $prof = fetchOne("SELECT idprof, nom AS \"Nom\", prenoms AS \"Prénoms\", grade AS \"Grade\" FROM professeur WHERE idprof = ?", [$id]);
            if ($prof) jsonResponse($prof);
            else errorResponse('Professeur non trouvé', 404);
        } else {
            jsonResponse(fetchAll("SELECT idprof, nom AS \"Nom\", prenoms AS \"Prénoms\", grade AS \"Grade\" FROM professeur ORDER BY nom"));
        }
        break;

    case 'POST':
        $data = getInputData();
        $errors = validateRequired($data, ['idprof', 'Nom', 'Prénoms', 'Grade']);
        if (!empty($errors)) errorResponse(implode(', ', $errors), 400);
        if (!idEstValide($data['idprof'])) errorResponse("❌ L'ID du professeur ne peut pas être un nombre négatif", 400);

        try {
            executeInsert("INSERT INTO professeur (idprof, nom, prenoms, grade) VALUES (?, ?, ?, ?)",
                [$data['idprof'], $data['Nom'], $data['Prénoms'], $data['Grade']]);
            successResponse($data, '✅ Professeur ajouté avec succès !');
        } catch (PDOException $e) {
            if (isDuplicateEntry($e)) errorResponse('❌ Un professeur avec cet ID existe déjà', 409);
            else errorResponse('❌ Erreur: ' . $e->getMessage(), 500);
        }
        break;

    case 'PUT':
        if (!$id) errorResponse('ID requis', 400);
        $data = getInputData();
        $errors = validateRequired($data, ['Nom', 'Prénoms', 'Grade']);
        if (!empty($errors)) errorResponse(implode(', ', $errors), 400);

        try {
            $affected = executeUpdate("UPDATE professeur SET nom = ?, prenoms = ?, grade = ? WHERE idprof = ?",
                [$data['Nom'], $data['Prénoms'], $data['Grade'], $id]);
            successResponse(null, '✅ Professeur modifié avec succès !');
        } catch (PDOException $e) {
            errorResponse('❌ Erreur: ' . $e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        if (!$id) errorResponse('ID requis', 400);
        try {
            $affected = executeDelete("DELETE FROM professeur WHERE idprof = ?", [$id]);
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
