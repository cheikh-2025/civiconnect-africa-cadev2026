<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit();
}
require dirname(__DIR__) . '/lib/bootstrap.php';
$mail = strtolower(trim((string) ($argv[1] ?? '')));
if (!filter_var($mail, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Usage : php tools/reset-password.php adresse@exemple.com\n");
    exit(1);
}
$u = query('SELECT id,name FROM cc_users WHERE email=?', [$mail])->fetch();
if (!$u) {
    fwrite(STDERR, "Compte introuvable.\n");
    exit(1);
}
fwrite(
    STDOUT,
    'Compte : ' . $u['name'] . "\nNouveau mot de passe (saisie visible dans cette console) : ",
);
$password = rtrim((string) fgets(STDIN), "\r\n");
if (strlen($password) < 12 || strlen($password) > 72) {
    fwrite(STDERR, "Utilisez entre 12 et 72 octets.\n");
    exit(1);
}
fwrite(STDOUT, 'Confirmez le nouveau mot de passe : ');
if (!hash_equals($password, rtrim((string) fgets(STDIN), "\r\n"))) {
    fwrite(STDERR, "Les mots de passe ne correspondent pas.\n");
    exit(1);
}
transaction(function () use ($u, $password) {
    query('UPDATE cc_users SET password_hash=?,auth_version=auth_version+1 WHERE id=?', [
        password_hash($password, PASSWORD_DEFAULT),
        $u['id'],
    ]);
    query('UPDATE cc_password_tokens SET used_at=NOW() WHERE user_id=?', [$u['id']]);
});
fwrite(STDOUT, "Mot de passe modifié. Les sessions précédentes sont révoquées.\n");
