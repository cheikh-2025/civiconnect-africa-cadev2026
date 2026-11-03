<?php
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
header('Content-Type: text/html; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!hash_equals($_SESSION['csrf'], (string) ($_POST['csrf'] ?? ''))) {
        http_response_code(419);
        exit(
            'La session a changé. Actualisez CiviConnect puis cliquez de nouveau sur Se déconnecter.'
        );
    }
    $cookie = session_get_cookie_params();
    $_SESSION = [];
    session_destroy();
    setcookie(session_name(), '', [
        'expires' => time() - 3600,
        'path' => $cookie['path'],
        'domain' => $cookie['domain'],
        'secure' => $cookie['secure'],
        'httponly' => true,
        'samesite' => $cookie['samesite'] ?? 'Lax',
    ]);
    header('Location: index.php#connexion', true, 303);
    exit();
}
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET, POST');
    exit();
}
$csrf = htmlspecialchars($_SESSION['csrf'], ENT_QUOTES, 'UTF-8');
?>
<!doctype html>
<html lang="fr">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Se déconnecter · CiviConnect</title>
        <link rel="stylesheet" href="assets/styles.css" />
    </head>
    <body>
        <main id="main" class="public-section" style="max-width: 600px">
            <section class="panel panel-pad">
                <h1>Quitter votre session ?</h1>
                <p class="prose" style="margin: 16px 0 24px">
                    Vous pourrez ensuite vous connecter avec un autre compte ou créer un compte
                    personnel.
                </p>
                <form action="logout.php" method="post">
                    <input type="hidden" name="csrf" value="<?= $csrf ?>" />
                    <div class="row">
                        <a class="btn" href="index.php#dashboard">Revenir à mon espace</a>
                        <button class="btn primary" type="submit">Se déconnecter</button>
                    </div>
                </form>
            </section>
        </main>
    </body>
</html>
