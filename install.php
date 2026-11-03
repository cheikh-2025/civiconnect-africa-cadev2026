<?php
declare(strict_types=1);
if (is_file(__DIR__ . '/config/local.php')) {
    http_response_code(403);
    exit('CiviConnect est déjà installé. Ouvrez index.php.');
}
if (!in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true)) {
    http_response_code(403);
    exit('L’installation initiale doit être exécutée depuis localhost. Consultez la notice.');
}
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/installer.php';
$error = '';
$missing = [];
foreach (['pdo_mysql', 'mbstring'] as $extension) {
    if (!extension_loaded($extension)) {
        $missing[] = $extension;
    }
}
if (PHP_VERSION_ID < 80100) {
    $missing[] = 'PHP 8.1 ou supérieur';
}
if (!is_writable(__DIR__ . '/config')) {
    $missing[] = 'Dossier config accessible en écriture';
}
$environmentChecks = [
    ['PHP 8.1 ou supérieur', PHP_VERSION_ID >= 80100],
    ['PDO MySQL', extension_loaded('pdo_mysql')],
    ['mbstring', extension_loaded('mbstring')],
    ['GD pour les photos', extension_loaded('gd')],
    ['fileinfo pour les photos', extension_loaded('fileinfo')],
    ['Configuration enregistrable', is_writable(__DIR__ . '/config')],
];
$photosReady = extension_loaded('gd') && extension_loaded('fileinfo');
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$missing) {
    if (!hash_equals($_SESSION['csrf'], (string) ($_POST['csrf'] ?? ''))) {
        $error = 'Session expirée. Actualisez la page.';
    } else {
        try {
            install_app(
                [
                    'host' => trim((string) ($_POST['host'] ?? '')),
                    'port' => (int) ($_POST['port'] ?? 3306),
                    'database' => trim((string) ($_POST['database'] ?? '')),
                    'username' => trim((string) ($_POST['username'] ?? '')),
                    'password' => (string) ($_POST['db_password'] ?? ''),
                    'create_database' => isset($_POST['create_database']),
                    'app_url' => '',
                    'mail_enabled' => false,
                    'mail_from' => '',
                ],
                trim((string) ($_POST['name'] ?? '')),
                trim((string) ($_POST['email'] ?? '')),
                (string) ($_POST['password'] ?? ''),
            );
            header('Location: index.php#connexion');
            exit();
        } catch (Throwable $e) {
            error_log('CiviConnect installation: ' . $e->getMessage());
            $error =
                $e instanceof PDOException
                    ? 'Connexion ou installation MySQL impossible. Vérifiez les paramètres et les droits de la base.'
                    : $e->getMessage();
        }
    }
}
function e(string $v): string
{
    return htmlspecialchars($v, ENT_QUOTES, 'UTF-8');
}
function val(string $key, string $default = ''): string
{
    return e((string) ($_POST[$key] ?? $default));
}
?>
<!doctype html>
<html lang="fr">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Installer CiviConnect</title>
        <link rel="stylesheet" href="assets/styles.css" />
    </head>
    <body>
        <main class="public-section" style="max-width: 850px">
            <a class="brand" href="index.php">
                <span class="brand-mark">C</span>
                CiviConnect Africa
            </a>
            <div class="spacer"></div>
            <h1>Installez CiviConnect en une seule fois.</h1>
            <p class="prose" style="margin: 12px 0 25px">
                Version 1 complète pour XAMPP. Les comptes, photos, messages et collaborations sont inclus dès l’installation.
            </p>
            <details class="panel panel-pad" style="margin-bottom:20px" open>
                <summary>Vérification de votre XAMPP</summary>
                <?php foreach ($environmentChecks as [$label, $ready]): ?>
                    <div class="detail-stat">
                        <span><?= e($label) ?></span>
                        <span class="badge <?= $ready ? 'green' : 'orange' ?>">
                            <?= $ready ? 'Prêt' : 'À activer' ?>
                        </span>
                    </div>
                <?php endforeach; ?>
                <?php if (!$photosReady): ?>
                    <p class="notice orange" style="margin-top:16px">
                        Pour les photos, ouvrez Apache &gt; Config &gt; PHP (php.ini) dans XAMPP.
                        Activez extension=gd et extension=fileinfo, puis redémarrez Apache.
                        Vous pouvez installer les autres fonctions dès maintenant.
                    </p>
                <?php endif; ?>
            </details>
            <section class="panel panel-pad">
                <?php if ($missing): ?>
                <p class="notice orange">
                    Extensions ou version manquantes : <?= e(implode(', ', $missing)) ?>
                </p>
                <?php else: ?>
                <?php if ($error): ?>
                <div class="notice orange" role="alert" style="margin-bottom: 20px">
                    <?= e($error) ?>
                </div>
                <?php endif; ?>
                <form method="post">
                    <input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>" />
                    <h2>1. Connexion MySQL</h2>
                    <div class="form-grid" style="margin: 20px 0">
                        <div class="field">
                            <label for="host">Serveur</label>
                            <input
                                class="input"
                                id="host"
                                name="host"
                                value="<?= val('host', '127.0.0.1') ?>"
                                required
                            />
                        </div>
                        <div class="field">
                            <label for="port">Port</label>
                            <input
                                class="input"
                                id="port"
                                name="port"
                                type="number"
                                value="<?= val('port', '3306') ?>"
                                required
                            />
                        </div>
                        <div class="field full">
                            <label for="database">Base de données</label>
                            <input
                                class="input"
                                id="database"
                                name="database"
                                value="<?= val('database', 'civiconnect_v1') ?>"
                                pattern="[a-zA-Z0-9_]{1,64}"
                                required
                            />
                            <small>Utilisez une nouvelle base pour cette version.</small>
                        </div>
                        <div class="field">
                            <label for="username">Utilisateur MySQL</label>
                            <input
                                class="input"
                                id="username"
                                name="username"
                                value="<?= val('username', 'root') ?>"
                                required
                            />
                        </div>
                        <div class="field">
                            <label for="db-password">Mot de passe MySQL</label>
                            <input
                                class="input"
                                id="db-password"
                                name="db_password"
                                type="password"
                                autocomplete="off"
                            />
                            <small>Souvent vide sur une installation XAMPP locale standard.</small>
                        </div>
                    </div>
                    <label class="check-label">
                        <input type="checkbox" name="create_database" checked />
                        Créer la base si elle n’existe pas (droit MySQL requis).
                    </label>
                    <div class="divider"></div>
                    <h2>2. Premier administrateur</h2>
                    <div class="form-grid" style="margin-top: 20px">
                        <div class="field full">
                            <label for="name">Nom complet</label>
                            <input
                                class="input"
                                id="name"
                                name="name"
                                maxlength="180"
                                value="<?= val('name') ?>"
                                required
                            />
                        </div>
                        <div class="field">
                            <label for="email">E-mail</label>
                            <input
                                class="input"
                                id="email"
                                name="email"
                                type="email"
                                maxlength="180"
                                value="<?= val('email') ?>"
                                required
                            />
                        </div>
                        <div class="field">
                            <label for="password">Mot de passe administrateur</label>
                            <input
                                class="input"
                                id="password"
                                name="password"
                                type="password"
                                minlength="12"
                                maxlength="72"
                                required
                                autocomplete="new-password"
                            />
                            <small>12 caractères minimum.</small>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="btn primary" type="submit">Installer CiviConnect</button>
                    </div>
                </form>
                <?php endif; ?>
            </section>
        </main>
    </body>
</html>
