<?php
declare(strict_types=1);

// Ces tables additionnelles ne modifient ni les comptes ni les messages existants.
function chat_ready(): bool
{
    static $ready = null;
    if ($ready === null) {
        $ready = (int) query(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('cc_chat_activity','cc_chat_requests')"
        )->fetchColumn() === 2;
    }
    return $ready;
}

function chat_activity(array $data, int $id): never
{
    $u = require_user();
    $c = own_conversation($id, $u);
    if (!chat_ready()) respond(['typing' => false, 'ready' => false]);
    $typing = !empty($data['typing']);
    if ($typing && $u['role'] === 'organisation') verified_org();
    if ($typing && $u['status'] !== 'verified') fail('Compte non disponible.', 403);
    query(
        'INSERT INTO cc_chat_activity (conversation_id,user_id,typing_until) VALUES (?,?,DATE_ADD(NOW(), INTERVAL ? SECOND)) ON DUPLICATE KEY UPDATE typing_until=VALUES(typing_until)',
        [$id, $u['id'], $typing ? 6 : -1]
    );
    $other = (int) $c['participant_a'] === (int) $u['id'] ? $c['participant_b'] : $c['participant_a'];
    $active = query(
        "SELECT a.user_id FROM cc_chat_activity a JOIN cc_users u ON u.id=a.user_id WHERE a.conversation_id=? AND a.user_id=? AND a.typing_until>NOW() AND u.status='verified'",
        [$id, $other]
    )->fetch();
    respond(['typing' => (bool) $active, 'ready' => true]);
}
