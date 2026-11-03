<?php
declare(strict_types=1);

/** Le rôle admin est conservé pour rester compatible avec les comptes existants. */
function is_super_admin(?array $account): bool
{
    return ($account['role'] ?? '') === 'admin' &&
        !empty($account['is_super_admin']) &&
        ($account['status'] ?? '') === 'verified';
}

function require_super_admin(): array
{
    $account = require_user('admin');
    if (!is_super_admin($account)) {
        fail('Cette décision est réservée au super administrateur.', 403);
    }
    return $account;
}

function super_admins_notice(string $title, string $body): void
{
    foreach (
        query(
            "SELECT id FROM cc_users WHERE role='admin' AND is_super_admin=1 AND status='verified'",
        )->fetchAll()
        as $account
    ) {
        notification((int) $account['id'], $title, $body, 'administration');
    }
}

/** Appelée dans une transaction : le membre est verrouillé avant toute décision. */
function change_account_status(array $actor, int $targetId, string $status, string $reason): void
{
    if (!is_super_admin($actor)) {
        fail('L’accord du super administrateur est nécessaire.', 403);
    }
    if (!in_array($status, ['verified', 'suspended'], true)) {
        fail('Statut invalide.');
    }
    $target = query('SELECT * FROM cc_users WHERE id=? FOR UPDATE', [$targetId])->fetch();
    if (!$target) {
        fail('Compte introuvable.', 404);
    }
    if ($targetId === (int) $actor['id'] || !empty($target['is_super_admin'])) {
        fail('Le compte super administrateur est protégé.', 403);
    }
    // Une vérification d’organisation n’est pas une réactivation de compte.
    if ($status === 'verified' && $target['status'] !== 'suspended') {
        fail('Seul un compte suspendu peut être réactivé ici.', 409);
    }
    if ($target['status'] === $status) {
        fail('Ce compte possède déjà ce statut.', 409);
    }
    query('UPDATE cc_users SET status=?,auth_version=auth_version+1 WHERE id=?', [
        $status,
        $targetId,
    ]);
    query('INSERT INTO cc_admin_audit (actor_id,target_id,action,reason) VALUES (?,?,?,?)', [
        $actor['id'],
        $targetId,
        'account.' . $status,
        $reason,
    ]);
    notification(
        $targetId,
        $status === 'suspended' ? 'Accès suspendu' : 'Accès réactivé',
        $reason,
        'support',
    );
}

function request_account_status(array $data): void
{
    $actor = require_user('admin');
    $targetId = (int) ($data['id'] ?? 0);
    $status = $data['status'] ?? '';
    $reason = text($data, 'reason', 10, 1500, 'Motif');
    if (!in_array($status, ['verified', 'suspended'], true)) {
        fail('Statut invalide.');
    }
    transaction(function () use ($actor, $targetId, $status, $reason): void {
        $target = query('SELECT * FROM cc_users WHERE id=? FOR UPDATE', [$targetId])->fetch();
        if (!$target || !in_array($target['role'], ['developer', 'organisation'], true)) {
            fail('Cette demande concerne uniquement un développeur ou une organisation.', 403);
        }
        if (
            $target['status'] === $status ||
            ($status === 'verified' && $target['status'] !== 'suspended')
        ) {
            fail('Cette demande ne correspond pas au statut actuel du compte.', 409);
        }
        query(
            'INSERT INTO cc_account_requests (requester_id,target_id,desired_status,reason,pending_key) VALUES (?,?,?,?,?)',
            [$actor['id'], $targetId, $status, $reason, (string) $targetId],
        );
        super_admins_notice(
            'Décision sur un compte',
            $actor['name'] . ' demande une modification de l’accès de ' . $target['name'] . '.',
        );
    });
}

function decide_account_request(array $data): void
{
    $actor = require_super_admin();
    $decision = $data['decision'] ?? '';
    if (!in_array($decision, ['approved', 'rejected'], true)) {
        fail('Décision invalide.');
    }
    $note = text($data, 'note', 5, 1500, 'Décision');
    transaction(function () use ($actor, $data, $decision, $note): void {
        $request = query('SELECT * FROM cc_account_requests WHERE id=? FOR UPDATE', [
            (int) ($data['id'] ?? 0),
        ])->fetch();
        if (!$request || $request['status'] !== 'pending') {
            fail('Cette demande a déjà été traitée ou n’existe pas.', 409);
        }
        if ($decision === 'approved') {
            change_account_status(
                $actor,
                (int) $request['target_id'],
                $request['desired_status'],
                $note,
            );
        }
        query(
            'UPDATE cc_account_requests SET status=?,decision_note=?,decided_by=?,decided_at=NOW(),pending_key=NULL WHERE id=?',
            [$decision, $note, $actor['id'], $request['id']],
        );
        notification(
            (int) $request['requester_id'],
            'Votre demande a été traitée',
            $note,
            'administration',
        );
    });
}
