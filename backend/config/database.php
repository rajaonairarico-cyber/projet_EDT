<?php
// ============================================
// Configuration de la base de données
// Portable : MySQL (développement local) et PostgreSQL (Render + Neon)
// ============================================
define('DB_HOST', 'localhost');
define('DB_NAME', 'gestion_emploi_temps');
define('DB_USER', 'root');
define('DB_PASS', 'bakay@@2005');

function isPgsql() {
    return getenv('DB_DRIVER') === 'pgsql';
}

// Connexion PostgreSQL à partir de l'URL Neon (DATABASE_URL)
function connectPgsql() {
    $url = getenv('DATABASE_URL');
    if (!$url) {
        throw new PDOException('La variable DATABASE_URL est manquante');
    }

    $u = parse_url($url);
    $host = $u['host'] ?? 'localhost';
    $port = $u['port'] ?? 5432;
    $db   = ltrim($u['path'] ?? '/db', '/');
    $user = isset($u['user']) ? urldecode($u['user']) : '';
    $pass = isset($u['pass']) ? urldecode($u['pass']) : '';

    // ✅ TOUJOURS ajouter sslmode=require pour Neon
    $dsn = "pgsql:host=$host;port=$port;dbname=$db;sslmode=require";

    return new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
}

// Crée les tables PostgreSQL (exécuté au démarrage, idempotent)
function initSchemaPgsql($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS professeur (
        idprof  TEXT PRIMARY KEY,
        nom     TEXT NOT NULL,
        prenoms TEXT NOT NULL DEFAULT '',
        grade   TEXT
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS salle (
        idsalle    INTEGER PRIMARY KEY,
        design     TEXT NOT NULL,
        occupation TEXT NOT NULL DEFAULT 'libre'
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS classe (
        idclasse TEXT PRIMARY KEY,
        niveau   TEXT NOT NULL
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS emploi_du_temps (
        id       SERIAL PRIMARY KEY,
        idsalle  INTEGER NOT NULL,
        idprof   TEXT    NOT NULL,
        idclasse TEXT    NOT NULL,
        cours    TEXT    NOT NULL,
        date     TIMESTAMP NOT NULL,
        duree    NUMERIC(3,1) NOT NULL DEFAULT 1.0
    )");
}

// Connexion PDO unique, réutilisée par toutes les fonctions ci-dessous
function getPDO() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            if (isPgsql()) {
                $pdo = connectPgsql();
                initSchemaPgsql($pdo);
            } else {
                $pdo = new PDO(
                    "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                    DB_USER,
                    DB_PASS,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false
                    ]
                );
                ensureDureeColumn($pdo);
            }
        } catch (PDOException $e) {
            die(json_encode([
                'success' => false,
                'error' => 'Erreur de connexion à la base de données',
                'details' => $e->getMessage()
            ]));
        }
    }
    return $pdo;
}

// Ajoute automatiquement la colonne "duree" si elle n'existe pas encore (migration silencieuse)
function ensureDureeColumn($pdo) {
    if (isPgsql()) {
        // Le schéma PG (initSchemaPgsql) contient déjà la colonne
        return;
    }
    try {
        $check = $pdo->query("SHOW COLUMNS FROM emploi_du_temps LIKE 'duree'");
        if ($check && $check->rowCount() === 0) {
            $pdo->exec("ALTER TABLE emploi_du_temps ADD COLUMN duree DECIMAL(3,1) NOT NULL DEFAULT 1.0 COMMENT 'Durée du cours en heures'");
        }
    } catch (PDOException $e) {
        // La table n'existe peut-être pas encore : on laisse les erreurs SQL normales gérer ça ailleurs
    }
}

// ---- Fonctions d'accès aux données (sans paramètre $pdo, connexion gérée en interne) ----

function fetchAll($sql, $params = []) {
    $pdo = getPDO();
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function fetchOne($sql, $params = []) {
    $pdo = getPDO();
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $result = $stmt->fetch();
    return $result ?: null;
}

function executeInsert($sql, $params = []) {
    $pdo = getPDO();
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $pdo->lastInsertId();
}

function executeUpdate($sql, $params = []) {
    $pdo = getPDO();
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->rowCount();
}

function executeDelete($sql, $params = []) {
    $pdo = getPDO();
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->rowCount();
}

// --- Gestion des erreurs de doublon (indépendant du SGBD) ----
// MySQL : code 1062 (ER_DUP_ENTRY) — PostgreSQL : SQLSTATE 23505
function isDuplicateEntry($e) {
    if (isset($e->errorInfo[1]) && $e->errorInfo[1] == 1062) return true;
    return $e->getCode() === '23505';
}

// ---- Fonctions utilitaires HTTP / JSON ----

function getInputData() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function jsonResponse($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function successResponse($data = null, $message = 'Succès') {
    echo json_encode(['success' => true, 'message' => $message, 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}

function errorResponse($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

// Vérifie que tous les champs requis sont présents et non vides.
function validateRequired($data, $fields) {
    $errors = [];
    foreach ($fields as $f) {
        if (!isset($data[$f]) || trim((string)$data[$f]) === '') {
            $errors[] = "Le champ '$f' est requis";
        }
    }
    return $errors;
}

// Vérifie qu'un identifiant n'est pas un nombre négatif.
function idEstValide($id) {
    if ($id === null || trim((string)$id) === '') return false;
    if (is_numeric($id) && (float)$id < 0) return false;
    return true;
}

// Calcule les bornes (lundi -> dimanche) de la semaine ISO demandée.
function getWeekDates($semaine) {
    if (!$semaine || strpos($semaine, '-W') === false) {
        return ['debut' => '1970-01-01', 'fin' => '2999-12-31'];
    }
    list($annee, $sem) = explode('-W', $semaine);
    $dto = new DateTime();
    $dto->setISODate((int)$annee, (int)$sem);
    $debut = $dto->format('Y-m-d');
    $dto->modify('+6 days');
    $fin = $dto->format('Y-m-d');
    return ['debut' => $debut, 'fin' => $fin];
}

// Vérifie les conflits de créneau (salle / professeur / classe) en tenant compte de la durée.
function checkConflit($idsalle, $idprof, $idclasse, $date, $duree = 1.0, $excludeId = null) {
    $minutes = (int) round(((float)$duree) * 60);
    $fin = date('Y-m-d H:i:s', strtotime($date . ' +' . $minutes . ' minutes'));
    $excludeSql = $excludeId ? "AND id != ?" : "";

    $checks = [
        ['champ' => 'idsalle',  'valeur' => $idsalle,  'message' => '❌ Cette salle est déjà occupée sur ce créneau'],
        ['champ' => 'idprof',   'valeur' => $idprof,   'message' => '❌ Ce professeur est déjà occupé sur ce créneau'],
        ['champ' => 'idclasse', 'valeur' => $idclasse, 'message' => '❌ Cette classe a déjà un cours sur ce créneau'],
    ];

    foreach ($checks as $c) {
        if (isPgsql()) {
            $sql = "SELECT id FROM emploi_du_temps
                    WHERE {$c['champ']} = ?
                    AND ? < date + (duree * interval '1 minute')
                    AND ? > date
                    $excludeSql";
            $params = [$c['valeur'], $date, $fin];
        } else {
            $sql = "SELECT id FROM emploi_du_temps
                    WHERE {$c['champ']} = ?
                    AND ? < DATE_ADD(date, INTERVAL (duree*60) MINUTE)
                    AND DATE_ADD(?, INTERVAL $minutes MINUTE) > date
                    $excludeSql";
            $params = [$c['valeur'], $date, $date];
        }
        if ($excludeId) $params[] = $excludeId;
        $found = fetchOne($sql, $params);
        if ($found) {
            return ['conflit' => true, 'message' => $c['message']];
        }
    }
    return ['conflit' => false, 'message' => ''];
}

// Met à jour le statut "occupation" de toutes les salles selon l'heure actuelle.
function rafraichirOccupationSalles() {
    $pdo = getPDO();
    $now = date('Y-m-d H:i:s');
    if (isPgsql()) {
        $stmt = $pdo->prepare("SELECT DISTINCT idsalle FROM emploi_du_temps
                                WHERE date <= ? AND date + (duree * interval '1 minute') > ?");
    } else {
        $stmt = $pdo->prepare("SELECT DISTINCT idsalle FROM emploi_du_temps
                                WHERE date <= ? AND DATE_ADD(date, INTERVAL (duree*60) MINUTE) > ?");
    }
    $stmt->execute([$now, $now]);
    $occupees = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (!empty($occupees)) {
        $in = implode(',', array_fill(0, count($occupees), '?'));
        $pdo->prepare("UPDATE salle SET occupation = 'occupée' WHERE idsalle IN ($in)")->execute($occupees);
        $pdo->prepare("UPDATE salle SET occupation = 'libre' WHERE idsalle NOT IN ($in)")->execute($occupees);
    } else {
        $pdo->exec("UPDATE salle SET occupation = 'libre'");
    }
}
