<?php
declare(strict_types=1);

/** Un visiteur suit uniquement son ticket grâce à un lien secret, jamais avec son seul numéro. */
function support_ticket_access(array $data): array
{
    $account = user();
    if ($account && (int) ($data['id'] ?? 0) > 0) {
        $ticket = query('SELECT * FROM cc_support_tickets WHERE id=?', [
            (int) $data['id'],
        ])->fetch();
        if (
            $ticket &&
            ($account['role'] === 'admin' || (int) $ticket['user_id'] === (int) $account['id'])
        ) {
            return $ticket;
        }
    }
    $token = $data['token'] ?? '';
    if (is_string($token) && preg_match('/^[a-f0-9]{64}$/D', $token)) {
        $ticket = query('SELECT * FROM cc_support_tickets WHERE access_hash=?', [
            hash('sha256', $token),
        ])->fetch();
        if ($ticket) {
            return $ticket;
        }
    }
    fail('Demande introuvable ou accès non autorisé.', 404);
}

function support_ticket_public(array $ticket): array
{
    $replies = query(
        'SELECT r.body,r.created_at,u.name,u.role FROM cc_support_replies r LEFT JOIN cc_users u ON u.id=r.author_id WHERE r.ticket_id=? ORDER BY r.id',
        [$ticket['id']],
    )->fetchAll();
    return [
        'id' => (string) $ticket['id'],
        'name' => $ticket['name'],
        'email' => $ticket['email'],
        'subject' => $ticket['subject'],
        'body' => $ticket['body'],
        'status' => $ticket['status'],
        'createdAt' => $ticket['created_at'],
        'replies' => $replies,
    ];
}

function create_support_ticket(array $data): void
{
    rate_limit('support-create:' . ($_SERVER['REMOTE_ADDR'] ?? ''), 5);
    $account = user();
    $name = $account ? $account['name'] : text($data, 'name', 2, 180, 'Nom');
    $email = $account ? $account['email'] : email($data);
    $subject = text($data, 'subject', 5, 180, 'Objet');
    $body = text($data, 'body', 10, 5000, 'Message');
    $token = bin2hex(random_bytes(32));
    $ticketId = transaction(function () use (
        $account,
        $name,
        $email,
        $subject,
        $body,
        $token,
    ): int {
        query(
            'INSERT INTO cc_support_tickets (user_id,name,email,subject,body,access_hash) VALUES (?,?,?,?,?,?)',
            [$account['id'] ?? null, $name, $email, $subject, $body, hash('sha256', $token)],
        );
        $id = (int) db()->lastInsertId();
        admins_notice('Nouvelle demande de support', $subject, 'support/' . $id);
        return $id;
    });
    if (mail_ready()) {
        $url = rtrim(config()['app_url'], '/') . '/#support/' . $token;
        send_app_mail(
            $email,
            'CiviConnect Africa — demande de support #' . $ticketId,
            "Votre demande a été enregistrée.\nConservez ce lien personnel pour suivre les réponses :\n" .
                $url,
        );
    }
    respond([
        'ticketId' => (string) $ticketId,
        'trackingToken' => $token,
        'data' => bootstrap_data(),
    ]);
}

function reply_support_ticket(array $data): void
{
    rate_limit('support-reply:' . ($_SERVER['REMOTE_ADDR'] ?? ''), 20);
    $account = user();
    $ticket = support_ticket_access($data);
    $body = text($data, 'body', 2, 5000, 'Réponse');
    transaction(function () use ($account, $ticket, $body): void {
        query('SELECT id FROM cc_support_tickets WHERE id=? FOR UPDATE', [$ticket['id']]);
        query('INSERT INTO cc_support_replies (ticket_id,author_id,body) VALUES (?,?,?)', [
            $ticket['id'],
            $account['id'] ?? null,
            $body,
        ]);
        $fromStaff = ($account['role'] ?? '') === 'admin';
        query('UPDATE cc_support_tickets SET status=?,updated_at=NOW() WHERE id=?', [
            $fromStaff ? 'answered' : 'open',
            $ticket['id'],
        ]);
        if ($fromStaff && $ticket['user_id']) {
            notification(
                (int) $ticket['user_id'],
                'Le support vous a répondu',
                $ticket['subject'],
                'support/' . $ticket['id'],
            );
        } elseif (!$fromStaff) {
            admins_notice(
                'Réponse à une demande de support',
                $ticket['subject'],
                'support/' . $ticket['id'],
            );
        }
    });
    if (($account['role'] ?? '') === 'admin' && mail_ready()) {
        send_app_mail(
            $ticket['email'],
            'CiviConnect Africa — réponse au support #' . $ticket['id'],
            $body .
                "\n\nRetrouvez aussi cette réponse avec votre lien de suivi ou dans Aide et support.",
        );
    }
}
