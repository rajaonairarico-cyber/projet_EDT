<?php
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $classe = fetchOne("SELECT * FROM classe WHERE idclasse = ?", [$id]);
            if ($classe) jsonResponse($classe);
            else errorResponse('Classe non trouvée', 404);
        } else {
            jsonResponse(fetchAll("SELECT * FROM classe ORDER BY niveau"));
        }
        break;

    case 'POST':
        $data = getInputData();
        $errors = validateRequired($data, ['idclasse', 'niveau']);
        if (!empty($errors)) errorResponse(implode(', ', $errors), 400);
        if (!idEstValide($data['idclasse'])) errorResponse("❌ L'ID de la classe ne peut pas être un nombre négatif", 400);

        try {
            executeInsert("INSERT INTO classe (idclasse, niveau) VALUES (?, ?)",
                [$data['idclasse'], $data['niveau']]);
            successResponse($data, '✅ Classe ajoutée avec succès !');
        } catch (PDOException $e) {
            if (isDuplicateEntry($e)) errorResponse('❌ Une classe avec cet ID existe déjà', 409);
            else errorResponse('❌ Erreur: ' . $e->getMessage(), 500);
        }
        break;

    case 'PUT':
        if (!$id) errorResponse('ID requis pour la modification', 400);
        $data = getInputData();
        $errors = validateRequired($data, ['niveau']);
        if (!empty($errors)) errorResponse(implode(', ', $errors), 400);

        try {
            $affected = executeUpdate("UPDATE classe SET niveau = ? WHERE idclasse = ?", [$data['niveau'], $id]);
            successResponse(null, '✅ Classe modifiée avec succès !');
        } catch (PDOException $e) {
            errorResponse('❌ Erreur: ' . $e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        if (!$id) errorResponse('ID requis pour la suppression', 400);
        try {
            $affected = executeDelete("DELETE FROM classe WHERE idclasse = ?", [$id]);
            if ($affected > 0) successResponse(null, '✅ Classe supprimée avec succès !');
            else errorResponse('❌ Classe non trouvée', 404);
        } catch (PDOException $e) {
            errorResponse('❌ Erreur: ' . $e->getMessage(), 500);
        }
        break;

    default:
        errorResponse('Méthode non autorisée', 405);
}
?>
