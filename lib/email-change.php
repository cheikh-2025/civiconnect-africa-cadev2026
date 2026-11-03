<?php
declare(strict_types=1);

/** Le changement d’adresse reste désactivé tant que la configuration et la base ne sont pas prêtes. */
function email_change_ready(): bool
{
    if (empty(config()['email_change_enabled']) || !mail_ready() || !feature_status()['emailChangeSchema']) return false;
    // La contrainte unique protège aussi deux confirmations concurrentes vers la même adresse.
    return (bool) query("SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cc_users' AND NON_UNIQUE=0 GROUP BY INDEX_NAME HAVING COUNT(*)=1 AND MAX(COLUMN_NAME)='email'")->fetch();
}
function request_email_change(array $data): void
{
    $actor = require_user();
    if (!email_change_ready()) {
        fail('Le changement d’adresse par e-mail n’est pas encore disponible. Utilisez Aide et support.', 503);
    }
    rate_limit('email-change:' . $actor['id'], 3);
    $newEmail = email($data);
    $currentPassword = is_string($data['current_password'] ?? null) ? $data['current_password'] : '';
    $token = bin2hex(random_bytes(32));
    $hash = hash('sha256', $token);
    transaction(function () use ($actor, $newEmail, $currentPassword, $hash): void {
        $account = query('SELECT * FROM cc_users WHERE id=? FOR UPDATE', [$actor['id']])->fetch();
        if (!$account || $account['status'] === 'suspended' || (int) $account['auth_version'] !== (int) $actor['auth_version']) {
            fail('Reconnectez-vous avant de continuer.', 401);
        }
        if (!password_verify($currentPassword, $account['password_hash'])) {
            fail('Mot de passe actuel incorrect.', 422, ['current_password' => 'Mot de passe actuel incorrect.']);
        }
        if (mb_strtolower($account['email']) === $newEmail) {
            fail('Choisissez une adresse différente de votre adresse actuelle.');
        }
        if (query('SELECT id FROM cc_users WHERE email=?', [$newEmail])->fetch()) {
            fail('Cette adresse ne peut pas être utilisée.');
        }
        query('UPDATE cc_email_changes SET used_at=NOW() WHERE user_id=? AND used_at IS NULL', [$actor['id']]);
        query('DELETE FROM cc_email_changes WHERE user_id=? AND expires_at<DATE_SUB(NOW(),INTERVAL 7 DAY)', [$actor['id']]);
        query('INSERT INTO cc_email_changes (user_id,old_email,new_email,auth_version,token_hash,expires_at) VALUES (?,?,?,?,?,DATE_ADD(NOW(),INTERVAL 30 MINUTE))', [
            $actor['id'], $account['email'], $newEmail, $account['auth_version'], $hash,
        ]);
    });
    $url = rtrim(config()['app_url'], '/') . '/#changer-email/' . $token;
    if (!send_app_mail($newEmail, 'CiviConnect Africa — confirmer votre nouvelle adresse',
        "Bonjour,\n\nConnectez-vous à votre compte avec votre adresse actuelle, puis ouvrez ce lien pour confirmer le changement :\n" . $url .
        "\n\nLien personnel valable 30 minutes et utilisable une seule fois. Votre ancienne adresse reste active jusqu’à cette confirmation. Si vous n’avez pas demandé ce changement, ignorez ce message.")) {
        query('UPDATE cc_email_changes SET used_at=NOW() WHERE token_hash=?', [$hash]);
        fail('L’envoi a échoué. Votre adresse actuelle reste inchangée. Réessayez plus tard.', 503);
    }
    respond(['message' => 'Un lien a été envoyé à votre nouvelle adresse. Votre adresse actuelle reste active jusqu’à confirmation.']);
}
function confirm_email_change(array $data): void
{
    $actor = require_user();
    if (!email_change_ready()) fail('Le changement d’adresse est momentanément indisponible.', 503);
    rate_limit('email-change-confirm:' . $actor['id'], 10);
    $token = text($data, 'token', 64, 64);
    if (!preg_match('/^[a-f0-9]{64}$/D', $token)) fail('Lien invalide ou expiré.');
    try {
        $result = transaction(function () use ($actor, $token): array {
            // Verrou du compte avant celui du jeton, comme pour les demandes de changement.
            $account = query('SELECT * FROM cc_users WHERE id=? FOR UPDATE', [$actor['id']])->fetch();
            $row = query('SELECT * FROM cc_email_changes WHERE user_id=? AND token_hash=? AND used_at IS NULL AND expires_at>NOW() FOR UPDATE', [$actor['id'], hash('sha256', $token)])->fetch();
            if (!$row || !$account || $account['status'] === 'suspended' ||
                (int) $account['auth_version'] !== (int) $row['auth_version'] ||
                (int) $account['auth_version'] !== (int) $actor['auth_version'] ||
                !hash_equals($account['email'], $row['old_email'])) {
                fail('Ce lien est invalide, expiré ou ne correspond plus à votre compte.');
            }
            if (query('SELECT id FROM cc_users WHERE email=? AND id<>?', [$row['new_email'], $actor['id']])->fetch()) {
                fail('Cette adresse ne peut plus être utilisée. Demandez un nouveau changement.');
            }
            query('UPDATE cc_users SET email=?,email_verified_at=NOW(),auth_version=auth_version+1 WHERE id=?', [$row['new_email'], $actor['id']]);
            query('UPDATE cc_email_changes SET used_at=NOW() WHERE user_id=? AND used_at IS NULL', [$actor['id']]);
            query('UPDATE cc_password_tokens SET used_at=NOW() WHERE user_id=? AND used_at IS NULL', [$actor['id']]);
            query('UPDATE cc_email_confirmations SET used_at=NOW() WHERE user_id=? AND used_at IS NULL', [$actor['id']]);
            return ['old' => $account['email'], 'new' => $row['new_email']];
        });
    } catch (PDOException $error) {
        if ($error->getCode() === '23000') fail('Cette adresse ne peut plus être utilisée. Demandez un nouveau changement.');
        throw $error;
    }
    unset($_SESSION['user_id'], $_SESSION['auth_version']);
    session_regenerate_id(true);
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    // Avertissement sur l’ancienne adresse ; un échec ne revient pas sur le changement confirmé.
    send_app_mail($result['old'], 'CiviConnect Africa — adresse de connexion modifiée',
        "Votre adresse de connexion vient d’être modifiée et vos sessions ont été fermées. Si vous n’êtes pas à l’origine de cette opération, contactez le support de la plateforme.");
    respond(['data' => bootstrap_data(), 'message' => 'Adresse modifiée. Connectez-vous avec votre nouvelle adresse.']);
}
