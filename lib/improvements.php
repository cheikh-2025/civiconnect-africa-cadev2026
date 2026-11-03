<?php
declare(strict_types=1);

/** Compatibilité : la catégorie historique reste le premier domaine choisi. */
function stored_domains(array $record): array
{
    $domains = json_decode($record['categories_json'] ?? 'null', true);
    return is_array($domains) && $domains ? $domains : [$record['category']];
}

function input_domains(array $data): array
{
    if (!array_key_exists('categories', $data)) {
        return [category($data)];
    }
    $values = $data['categories'];
    if (!is_array($values) || count($values) < 1 || count($values) > 6) {
        fail('Choisissez entre un et six domaines.', 422, ['categories' => 'Choisissez au moins un domaine.']);
    }
    $domains = [];
    foreach ($values as $value) {
        if (!is_string($value)) {
            fail('Domaine invalide.', 422);
        }
        $domains[] = category(['category' => $value]);
    }
    $domains = array_values(array_unique($domains));
    if (!feature_status()['multipleDomains']) {
        fail('Importez la mise à jour SQL avant d’enregistrer les domaines.', 503);
    }
    return $domains;
}

function save_domains(string $table, int $id, array $domains): void
{
    if (!in_array($table, ['cc_projects', 'cc_needs'], true)) {
        throw new InvalidArgumentException('Table de domaines inconnue.');
    }
    if (feature_status()['multipleDomains']) {
        query("UPDATE $table SET categories_json=? WHERE id=?", [
            json_encode($domains, JSON_UNESCAPED_UNICODE), $id,
        ]);
    }
}

function require_dossier_schema(): void
{
    if (!feature_status()['reviewDetails']) {
        fail('Importez la mise à jour SQL du dossier organisation avant cette action.', 503);
    }
}

/** Ces données ne sont exposées qu’au titulaire et aux administrateurs. */
function organisation_private_details(array $user): array
{
    return [
        'org_address' => $user['org_address'] ?? '',
        'org_contact_name' => $user['org_contact_name'] ?? '',
        'org_phone' => $user['org_phone'] ?? '',
        'org_website' => $user['org_website'] ?? '',
        'org_review_note' => $user['org_review_note'] ?? '',
        'org_reviewed_at' => $user['org_reviewed_at'] ?? '',
        'org_is_demo' => (bool) ($user['org_is_demo'] ?? false),
        'email_verified_at' => $user['email_verified_at'] ?? '',
    ];
}

function validate_org_details(array $data): array
{
    require_dossier_schema();
    $type = text($data, 'org_type', 1, 100, 'Type d’organisation');
    if (!in_array($type, ['Association', 'Entreprise', 'Administration', 'ONG', 'Établissement public', 'Autre'], true)) {
        fail('Choisissez un type d’organisation.', 422, ['org_type' => 'Choisissez un type dans la liste.']);
    }
    // Un dossier incomplet peut être enregistré, mais ne peut pas être approuvé.
    return [
        text($data, 'org_address', 0, 255, 'Adresse'),
        text($data, 'org_contact_name', 0, 180, 'Responsable'),
        text($data, 'org_phone', 0, 60, 'Téléphone'),
        url_field($data, 'org_website'),
    ];
}

function save_org_details(array $previous, array $data, array $details): void
{
    query('UPDATE cc_users SET org_address=?,org_contact_name=?,org_phone=?,org_website=? WHERE id=?', [
        ...$details, $previous['id'],
    ]);
    $changed = false;
    foreach (['name', 'country', 'org_type'] as $key) {
        if (trim((string) ($previous[$key] ?? '')) !== trim((string) ($data[$key] ?? ''))) {
            $changed = true;
        }
    }
    if ($changed && $previous['status'] === 'verified') {
        query("UPDATE cc_users SET status='pending',org_review_note=?,org_reviewed_at=NULL,org_reviewed_by=NULL WHERE id=?", [
            'L’identité de votre organisation a changé. Une nouvelle validation est en attente.', $previous['id'],
        ]);
        admins_notice('Organisation à valider', $data['name'] . ' a modifié son identité.', 'administration');
    }

    // Une sauvegarde complète transmet le profil sans seconde démarche.
    // Une suspension ne peut jamais être levée par une modification du profil.
    $updated = array_replace($previous, $data);
    if (in_array($previous['status'], ['pending', 'rejected'], true)
        && !dossier_missing($updated)
        && (dossier_missing($previous) || $previous['status'] === 'rejected')) {
        query("UPDATE cc_users SET status='pending',org_review_note='',org_reviewed_at=NULL,org_reviewed_by=NULL WHERE id=?", [$previous['id']]);
        admins_notice('Organisation à valider', $data['name'] . ' a complété sa présentation.', 'administration');
    }
}

function dossier_missing(array $org): array
{
    $missing = [];
    foreach (['name' => 'nom', 'org_type' => 'type', 'country' => 'pays',
        'bio' => 'courte présentation', 'email' => 'adresse e-mail'] as $key => $label) {
        if (trim((string) ($org[$key] ?? '')) === '') {
            $missing[] = $label;
        }
    }
    if (!in_array($org['org_type'] ?? '', ['Association', 'Entreprise', 'Administration', 'ONG', 'Établissement public', 'Autre'], true)) {
        $missing[] = 'type à sélectionner dans le profil';
    }
    return $missing;
}

function submit_organisation_dossier(): void
{
    require_dossier_schema();
    $org = require_user('organisation');
    $missing = dossier_missing($org);
    if ($missing) {
        fail('Complétez votre profil : ' . implode(', ', $missing) . '.', 422);
    }
    if ($org['status'] === 'verified') {
        fail('Votre organisation est déjà approuvée.', 409);
    }
    if ($org['status'] === 'suspended') {
        fail('Un compte suspendu doit être examiné par le super administrateur.', 403);
    }
    rate_limit('dossier:' . $org['id'], 5);
    transaction(function () use ($org): void {
        query("UPDATE cc_users SET status='pending' WHERE id=?", [$org['id']]);
        admins_notice('Dossier organisation soumis', $org['name'] . ' demande un examen de son dossier.', 'administration');
    });
}

function review_organisation_dossier(array $data): void
{
    require_dossier_schema();
    $actor = require_user('admin');
    $id = (int) ($data['id'] ?? 0);
    $status = $data['status'] ?? '';
    if (!in_array($status, ['verified', 'rejected', 'pending'], true)) {
        fail('Décision invalide.', 422);
    }
    $reason = text($data, 'reason', 10, 1500, 'Motif de la décision');
    $demo = !empty($data['is_demo']);
    if ($demo && !is_super_admin($actor)) {
        fail('Seul le super administrateur peut autoriser un compte de démonstration.', 403);
    }
    transaction(function () use ($actor, $id, $status, $reason, $demo): void {
        $org = query("SELECT * FROM cc_users WHERE id=? AND role='organisation' FOR UPDATE", [$id])->fetch();
        if (!$org) {
            fail('Organisation introuvable.', 404);
        }
        if (!in_array($org['status'], ['pending', 'rejected'], true)) {
            fail('Une organisation déjà approuvée se gère par une décision du super administrateur.', 403);
        }
        if ($status === 'verified') {
            $missing = dossier_missing($org);
            if ($missing) {
                fail('Dossier incomplet : ' . implode(', ', $missing) . '.', 422);
            }
            if (mail_ready() && empty($org['email_verified_at']) && !$demo) {
                fail('L’organisation doit confirmer son adresse e-mail avant approbation.', 422);
            }
        }
        query('UPDATE cc_users SET status=?,org_review_note=?,org_reviewed_by=?,org_reviewed_at=NOW(),org_is_demo=? WHERE id=?', [
            $status, $reason, $actor['id'], $demo ? 1 : 0, $id,
        ]);
        query('INSERT INTO cc_admin_audit (actor_id,target_id,action,reason) VALUES (?,?,?,?)', [
            $actor['id'], $id, 'organisation.' . $status, $reason . ($demo ? ' [Compte de démonstration]' : ''),
        ]);
        notification($id, 'Examen de votre organisation', [
            'verified' => 'Votre organisation est approuvée.',
            'rejected' => 'Votre demande a été refusée.',
            'pending' => 'Des informations complémentaires sont demandées.',
        ][$status] . ' ' . $reason, 'profil');
    });
}

function request_email_confirmation(): void
{
    require_dossier_schema();
    $org = require_user('organisation');
    if (!empty($org['email_verified_at'])) {
        fail('Cette adresse est déjà confirmée.', 409);
    }
    if (!mail_ready()) {
        fail('L’envoi des e-mails est indisponible. Votre dossier reste enregistré ; contactez le support.', 503);
    }
    rate_limit('email-confirm:' . $org['id'], 5);
    $token = bin2hex(random_bytes(32));
    $hash = hash('sha256', $token);
    transaction(function () use ($org, $hash): void {
        query('SELECT id FROM cc_users WHERE id=? FOR UPDATE', [$org['id']]);
        query('UPDATE cc_email_confirmations SET used_at=NOW() WHERE user_id=? AND used_at IS NULL', [$org['id']]);
        query('INSERT INTO cc_email_confirmations (user_id,email,token_hash,expires_at) VALUES (?,?,?,DATE_ADD(NOW(),INTERVAL 30 MINUTE))', [
            $org['id'], $org['email'], $hash,
        ]);
    });
    $url = rtrim(config()['app_url'], '/') . '/#confirmer-email/' . $token;
    $sent = send_app_mail($org['email'], 'CiviConnect Africa — confirmer votre adresse e-mail',
        "Bonjour,\n\nOuvrez ce lien et cliquez sur Confirmer mon adresse :\n" . $url .
        "\n\nLien valable 30 minutes, utilisable une seule fois. Cette confirmation ne remplace pas l’examen de votre organisation par un administrateur.");
    if (!$sent) {
        query('UPDATE cc_email_confirmations SET used_at=NOW() WHERE token_hash=?', [$hash]);
        fail('Le service d’envoi n’a pas accepté le message. Réessayez plus tard.', 503);
    }
}

function confirm_email_address(array $data): void
{
    require_dossier_schema();
    rate_limit('email-token:' . ($_SERVER['REMOTE_ADDR'] ?? ''), 30);
    $token = text($data, 'token', 64, 64, 'Lien de confirmation');
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
        fail('Lien invalide ou expiré.', 422);
    }
    transaction(function () use ($token): void {
        $row = query('SELECT * FROM cc_email_confirmations WHERE token_hash=? AND used_at IS NULL AND expires_at>NOW() FOR UPDATE', [hash('sha256', $token)])->fetch();
        if (!$row) {
            fail('Lien invalide, expiré ou déjà utilisé. Demandez un nouveau lien depuis votre profil.', 422);
        }
        $org = query("SELECT * FROM cc_users WHERE id=? AND role='organisation' AND status<>'suspended'", [$row['user_id']])->fetch();
        if (!$org || !hash_equals($org['email'], $row['email'])) {
            fail('Ce lien ne correspond plus au compte.', 422);
        }
        query('UPDATE cc_users SET email_verified_at=NOW() WHERE id=? AND email=?', [$org['id'], $row['email']]);
        query('UPDATE cc_email_confirmations SET used_at=NOW() WHERE id=?', [$row['id']]);
        notification((int) $org['id'], 'Adresse e-mail confirmée', 'Votre adresse a été confirmée. L’examen de votre organisation reste distinct.', 'profil');
    });
}
