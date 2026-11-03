<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

/** Les secrets SMTP restent dans config/local.php et ne sont jamais envoyés au navigateur. */
function mail_ready(): bool
{
    $config = config();
    $scheme = parse_url((string) ($config['app_url'] ?? ''), PHP_URL_SCHEME);
    $host = parse_url((string) ($config['app_url'] ?? ''), PHP_URL_HOST);
    $local = in_array($host, ['localhost', '127.0.0.1', '::1'], true);
    return extension_loaded('openssl') &&
        !empty($config['mail_enabled']) &&
        filter_var($config['mail_from'] ?? '', FILTER_VALIDATE_EMAIL) !== false &&
        !empty($config['smtp_host']) &&
        !empty($config['smtp_username']) &&
        !empty($config['smtp_password']) &&
        in_array($config['smtp_encryption'] ?? 'tls', ['tls', 'ssl'], true) &&
        ($scheme === 'https' || ($local && $scheme === 'http')) &&
        is_file(__DIR__ . '/phpmailer/PHPMailer.php');
}

function send_app_mail(string $recipient, string $subject, string $body): bool
{
    if (!mail_ready()) {
        return false;
    }
    require_once __DIR__ . '/phpmailer/Exception.php';
    require_once __DIR__ . '/phpmailer/PHPMailer.php';
    require_once __DIR__ . '/phpmailer/SMTP.php';
    $config = config();
    try {
        $mailer = new PHPMailer(true);
        $mailer->isSMTP();
        $mailer->Host = (string) $config['smtp_host'];
        $mailer->Port = (int) ($config['smtp_port'] ?? 587);
        $mailer->SMTPAuth = true;
        $mailer->Username = (string) $config['smtp_username'];
        $mailer->Password = (string) $config['smtp_password'];
        $mailer->SMTPSecure =
            ($config['smtp_encryption'] ?? 'tls') === 'ssl'
                ? PHPMailer::ENCRYPTION_SMTPS
                : PHPMailer::ENCRYPTION_STARTTLS;
        $mailer->Timeout = 12;
        $mailer->SMTPDebug = 0;
        $mailer->CharSet = 'UTF-8';
        $mailer->setFrom((string) $config['mail_from'], 'CiviConnect Africa');
        $mailer->addAddress($recipient);
        $mailer->Subject = $subject;
        $mailer->Body = $body;
        $mailer->send();
        return true;
    } catch (Throwable $error) {
        // Ne pas journaliser les échanges SMTP : ils peuvent contenir des secrets.
        error_log(
            'CiviConnect : envoi SMTP non effectué. Vérifiez la configuration et le fournisseur.',
        );
        return false;
    }
}

function request_password_reset(array $data): void
{
    $startedAt = microtime(true);
    $email = email($data);
    rate_limit('reset:' . $email, 5);
    if (!mail_ready()) {
        fail('L’envoi des liens est momentanément indisponible. Utilisez Aide et support.', 503);
    }
    $account = query("SELECT id FROM cc_users WHERE email=? AND status<>'suspended'", [
        $email,
    ])->fetch();
    if ($account) {
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        transaction(function () use ($account, $tokenHash): void {
            // Sérialise les demandes concurrentes pour un même compte.
            query('SELECT id FROM cc_users WHERE id=? FOR UPDATE', [$account['id']]);
            query(
                'UPDATE cc_password_tokens SET used_at=NOW() WHERE user_id=? AND used_at IS NULL',
                [$account['id']],
            );
            query(
                'INSERT INTO cc_password_tokens (user_id,token_hash,expires_at) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 20 MINUTE))',
                [$account['id'], $tokenHash],
            );
        });
        $url = rtrim(config()['app_url'], '/') . '/#reinitialiser/' . $token;
        $sent = send_app_mail(
            $email,
            'CiviConnect Africa — réinitialiser votre mot de passe',
            "Bonjour,\n\nPour choisir un nouveau mot de passe, ouvrez ce lien :\n" .
                $url .
                "\n\nCe lien est personnel, valable 20 minutes et utilisable une seule fois." .
                "\nSi vous n’avez pas demandé cette opération, ignorez ce message.\n\nL’équipe CiviConnect Africa",
        );
        if (!$sent) {
            query('UPDATE cc_password_tokens SET used_at=NOW() WHERE token_hash=?', [$tokenHash]);
        }
    }
    // Réponse identique et durée minimale ; les délais SMTP peuvent varier.
    $remaining = 1.0 - (microtime(true) - $startedAt);
    if ($remaining > 0) {
        usleep((int) ($remaining * 1000000));
    }
    respond([
        'message' =>
            'Si cette adresse correspond à un compte accessible, un lien lui sera envoyé. Vérifiez aussi les courriers indésirables. Si rien n’arrive, utilisez Aide et support.',
    ]);
}

function reset_password(array $data): void
{
    rate_limit('reset-confirm:' . ($_SERVER['REMOTE_ADDR'] ?? ''), 20);
    $token = text($data, 'token', 64, 64);
    $password = password($data);
    if (!preg_match('/^[a-f0-9]{64}$/D', $token)) {
        fail('Ce lien est invalide ou a expiré.');
    }
    if ($password !== ($data['confirm_password'] ?? null)) {
        fail('Les mots de passe ne correspondent pas.', 422, [
            'confirm_password' => 'Confirmez le nouveau mot de passe.',
        ]);
    }
    $account = transaction(function () use ($token, $password): array {
        $tokenHash = hash('sha256', $token);
        $candidate = query('SELECT user_id FROM cc_password_tokens WHERE token_hash=?', [
            $tokenHash,
        ])->fetch();
        if (!$candidate) {
            fail('Ce lien a expiré ou a déjà été utilisé.');
        }
        // Le verrou utilisateur précède toujours le verrou jeton.
        $account = query("SELECT * FROM cc_users WHERE id=? AND status<>'suspended' FOR UPDATE", [
            $candidate['user_id'],
        ])->fetch();
        $link = query(
            'SELECT id FROM cc_password_tokens WHERE token_hash=? AND used_at IS NULL AND expires_at>NOW() FOR UPDATE',
            [$tokenHash],
        )->fetch();
        if (!$account || !$link) {
            fail('Ce lien a expiré ou a déjà été utilisé.');
        }
        query('UPDATE cc_users SET password_hash=?,auth_version=auth_version+1 WHERE id=?', [
            password_hash($password, PASSWORD_DEFAULT),
            $account['id'],
        ]);
        query('UPDATE cc_password_tokens SET used_at=NOW() WHERE user_id=? AND used_at IS NULL', [
            $account['id'],
        ]);
        return $account;
    });
    // La réinitialisation ne connecte pas automatiquement l’utilisateur.
    if ((int) ($_SESSION['user_id'] ?? 0) === (int) $account['id']) {
        unset($_SESSION['user_id'], $_SESSION['auth_version']);
        session_regenerate_id(true);
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    send_app_mail(
        $account['email'],
        'CiviConnect Africa — mot de passe modifié',
        "Votre mot de passe vient d’être modifié.\nVos anciennes sessions ont été invalidées." .
            "\nSi vous n’êtes pas à l’origine de cette opération, contactez le support depuis la plateforme.",
    );
}
