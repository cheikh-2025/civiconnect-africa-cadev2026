<?php
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_name('civiconnect_real');
session_set_cookie_params([
    'httponly' => true,
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'samesite' => 'Lax',
    'path' => rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/'), '/') . '/',
]);
session_start();
if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');
date_default_timezone_set('UTC');

function config(): array
{
    static $config;
    if ($config === null) {
        $file = dirname(__DIR__) . '/config/local.php';
        if (!is_file($file)) {
            throw new RuntimeException('NOT_INSTALLED');
        }
        $config = require $file;
    }
    return $config;
}
function db(): PDO
{
    static $db;
    if (!$db) {
        $c = config();
        $db = new PDO(
            'mysql:host=' .
                $c['host'] .
                ';port=' .
                (int) $c['port'] .
                ';dbname=' .
                $c['database'] .
                ';charset=utf8mb4',
            $c['username'],
            $c['password'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ],
        );
        $db->exec("SET time_zone = '+00:00'");
    }
    return $db;
}
function query(string $sql, array $params = []): PDOStatement
{
    $s = db()->prepare($sql);
    $s->execute($params);
    return $s;
}
function user(): ?array
{
    $id = (int) ($_SESSION['user_id'] ?? 0);
    if (!$id) {
        return null;
    }
    $u = query('SELECT * FROM cc_users WHERE id=?', [$id])->fetch();
    if (
        !$u ||
        $u['status'] === 'suspended' ||
        (int) $u['auth_version'] !== (int) ($_SESSION['auth_version'] ?? -1)
    ) {
        unset($_SESSION['user_id']);
        return null;
    }
    return $u;
}
function require_user(?string $role = null): array
{
    $u = user();
    if (!$u) {
        fail('Connectez-vous pour continuer.', 401);
    }
    if ($role && $u['role'] !== $role) {
        fail('Cette action n’est pas autorisée pour votre compte.', 403);
    }
    return $u;
}
require_once __DIR__ . '/access.php';
require_once __DIR__ . '/mailer.php';

function verified_org(): array
{
    $u = require_user('organisation');
    if ($u['status'] !== 'verified') {
        fail('Votre organisation doit être vérifiée par un administrateur.', 403);
    }
    return $u;
}
function fail(string $message, int $status = 422, array $fields = []): never
{
    http_response_code($status);
    echo json_encode(
        ['success' => false, 'message' => $message, 'fields' => $fields],
        JSON_UNESCAPED_UNICODE,
    );
    exit();
}
function respond(array $data = []): never
{
    echo json_encode(
        ['success' => true] + $data,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE,
    );
    exit();
}
function input(): array
{
    $raw = file_get_contents('php://input');
    if (strlen($raw) > 50000) {
        fail('La requête est trop volumineuse.', 413);
    }
    try {
        $v = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        fail('La requête est invalide.', 400);
    }
    if (!is_array($v)) {
        fail('La requête est invalide.', 400);
    }
    return $v;
}
function text(array $d, string $key, int $min, int $max, string $label = ''): string
{
    $v = $d[$key] ?? '';
    if (!is_string($v)) {
        fail('Le champ est invalide.', 422, [$key => 'Saisissez du texte.']);
    }
    $v = trim($v);
    $n = mb_strlen($v);
    if ($n < $min || $n > $max) {
        fail('Vérifiez les champs du formulaire.', 422, [
            $key => ($label ?: $key) . ' : ' . $min . ' à ' . $max . ' caractères.',
        ]);
    }
    return $v;
}
function email(array $d): string
{
    $email = mb_strtolower(text($d, 'email', 3, 180, 'E-mail'));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fail('Adresse e-mail invalide.', 422, ['email' => 'Saisissez une adresse e-mail valide.']);
    }
    return $email;
}
function password(array $d, string $key = 'password'): string
{
    $v = $d[$key] ?? '';
    if (!is_string($v) || strlen($v) < 10 || strlen($v) > 72) {
        fail('Mot de passe invalide.', 422, [
            $key => 'Utilisez entre 10 et 72 octets (lettres, chiffres ou symboles).',
        ]);
    }
    return $v;
}
function skills(array $d): string
{
    $v = $d['skills'] ?? '';
    if (is_array($v)) {
        $v = implode(', ', $v);
    }
    return text(['skills' => $v], 'skills', 0, 500, 'Compétences');
}
function split_skills(string $s): array
{
    return array_values(array_filter(array_map('trim', explode(',', $s))));
}
function ident(string $name): string
{
    $parts = preg_split('/\s+/u', trim($name));
    return mb_strtoupper(
        implode('', array_map(fn($s) => mb_substr($s, 0, 1), array_slice($parts, 0, 2))),
    );
}
function category(array $d): string
{
    $v = text($d, 'category', 1, 80, 'Secteur');
    if (
        !in_array(
            $v,
            ['Administration', 'Éducation', 'Santé', 'Agriculture', 'Citoyenneté', 'Environnement'],
            true,
        )
    ) {
        fail('Secteur invalide.');
    }
    return $v;
}
function url_field(array $d, string $key): string
{
    $v = text($d, $key, 0, 255);
    if (
        $v !== '' &&
        (!filter_var($v, FILTER_VALIDATE_URL) ||
            !in_array(strtolower((string) parse_url($v, PHP_URL_SCHEME)), ['http', 'https'], true))
    ) {
        fail('Lien invalide.', 422, [$key => 'Utilisez une URL HTTP ou HTTPS.']);
    }
    return $v;
}
function notification(int $id, string $title, string $body, string $route): void
{
    query('INSERT INTO cc_notifications (user_id,title,body,route) VALUES (?,?,?,?)', [
        $id,
        $title,
        $body,
        $route,
    ]);
}
function admins_notice(string $title, string $body, string $route): void
{
    foreach (
        query("SELECT id FROM cc_users WHERE role='admin' AND status='verified'")->fetchAll()
        as $u
    ) {
        notification((int) $u['id'], $title, $body, $route);
    }
}
function conversation(int $a, int $b, string $context = ''): int
{
    if ($a === $b) {
        fail('Vous ne pouvez pas créer une discussion avec vous-même.');
    }
    [$a, $b] = [min($a, $b), max($a, $b)];
    query(
        'INSERT INTO cc_conversations (participant_a,participant_b,context) VALUES (?,?,?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
        [$a, $b, mb_substr($context, 0, 180)],
    );
    return (int) db()->lastInsertId();
}
function own_conversation(int $id, array $u): array
{
    $c = query(
        'SELECT * FROM cc_conversations WHERE id=? AND (participant_a=? OR participant_b=?)',
        [$id, $u['id'], $u['id']],
    )->fetch();
    if (!$c) {
        fail('Conversation introuvable.', 404);
    }
    return $c;
}
function transaction(callable $fn): mixed
{
    db()->beginTransaction();
    try {
        $result = $fn();
        db()->commit();
        return $result;
    } catch (Throwable $e) {
        if (db()->inTransaction()) {
            db()->rollBack();
        }
        throw $e;
    }
}
function rate_limit(string $key, int $limit): void
{
    $account = hash('sha256', $key);
    // Chaque parcours a son propre quota : ouvrir le support ne bloque pas la connexion.
    $scope = explode(':', $key, 2)[0];
    $ip = hash('sha256', $scope . ':' . (string) ($_SERVER['REMOTE_ADDR'] ?? ''));
    query('DELETE FROM cc_login_attempts WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 DAY)');
    $n = query(
        'SELECT COUNT(*) FROM cc_login_attempts WHERE (account_key=? OR ip_key=?) AND created_at > DATE_SUB(NOW(),INTERVAL 15 MINUTE)',
        [$account, $ip],
    )->fetchColumn();
    if ((int) $n >= $limit) {
        fail('Trop de tentatives. Réessayez dans 15 minutes.', 429);
    }
    query('INSERT INTO cc_login_attempts (account_key,ip_key) VALUES (?,?)', [$account, $ip]);
}
