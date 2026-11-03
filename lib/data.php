<?php
declare(strict_types=1);
require_once __DIR__ . '/features.php';
require_once __DIR__ . '/photos.php';
require_once __DIR__ . '/improvements.php';
require_once __DIR__ . '/email-change.php';
/** Construit un profil public ; les champs privés ne sont ajoutés que pour soi-même. */
function public_profile(array $currentUser, bool $self = false): array
{
    $p = [
        'avatarUrl' => avatar_url($currentUser),
        'id' => (string) $currentUser['id'],
        'name' => $currentUser['name'],
        'initials' => ident($currentUser['name']),
        'city' => $currentUser['city'],
        'country' => $currentUser['country'],
        'specialty' => $currentUser['specialty'],
        'bio' => $currentUser['bio'],
        'skills' => split_skills($currentUser['skills']),
        'available' => (bool) $currentUser['available'],
        'color' => '',
        'role' => $currentUser['role'],
        'status' => $currentUser['status'],
    ];
    if ($self) {
        $p = array_merge($p, organisation_private_details($currentUser));
        $p['email'] = $currentUser['email'];
        $p['org_type'] = $currentUser['org_type'];
        $p['preferences'] = json_decode($currentUser['preferences'], true) ?: [
            'collabs' => true,
            'messages' => true,
            'news' => false,
        ];
    }
    return $p;
}
/** Prépare les données visibles par le visiteur ou le compte connecté. */
function bootstrap_data(): array
{
    $currentUser = user();
    $currentUserId = (int) ($currentUser['id'] ?? 0);
    $admin = ($currentUser['role'] ?? '') === 'admin';
    $features = feature_status();
    $photos = [];
    if ($features['photos']) {
        foreach (query('SELECT id,avatar_path FROM cc_users')->fetchAll() as $photo) {
            $photos[(int) $photo['id']] = avatar_url($photo);
        }
    }
    $projects = [];
    $sql =
        'SELECT p.*,u.name,u.country,u.city FROM cc_projects p JOIN cc_users u ON u.id=p.user_id WHERE ' .
        ($admin ? '1=1' : "(p.status='published' AND u.status='verified') OR p.user_id=?") .
        ' ORDER BY p.created_at DESC,p.id DESC';
    foreach (query($sql, $admin ? [] : [$currentUserId])->fetchAll() as $p) {
        $projects[] = [
            'id' => (string) $p['id'],
            'avatarUrl' => $photos[(int) $p['user_id']] ?? '',
            'seekingCollaborators' => (bool) ($p['seeking_collaborators'] ?? false),
            'wantedSkills' => split_skills($p['wanted_skills'] ?? ''),
            'ownerId' => (string) $p['user_id'],
            'title' => $p['title'],
            'brand' => mb_strtolower(mb_substr($p['title'], 0, 18)),
            'em' => '',
            'description' => $p['description'],
            'category' => $p['category'],
            'categories' => stored_domains($p),
            'skills' => split_skills($p['skills']),
            'status' => [
                'draft' => 'Brouillon',
                'review' => 'En validation',
                'published' => 'Publié',
            ][$p['status']],
            'owner' => $p['name'],
            'country' => $p['country'],
            'city' => $p['city'],
            'createdAt' => substr($p['created_at'], 0, 10),
            'createdTimestamp' => $p['created_at'],
            'publishedAt' => $p['published_at'] ?? null,
            'initials' => ident($p['name']),
            'color' => ['', 'orange', 'blue', 'dark'][(int) $p['id'] % 4],
            'mine' => (int) $p['user_id'] === $currentUserId,
            'views' => (int) $p['views'],
            'github_url' => $p['github_url'],
            'demo_url' => $p['demo_url'],
            'reviewNote' => $p['review_note'] ?? '',
        ];
    }
    $developers = [];
    foreach (
        query(
            "SELECT u.*,(SELECT COUNT(*) FROM cc_projects p WHERE p.user_id=u.id AND p.status='published') AS projects FROM cc_users u WHERE u.role='developer' AND u.status='verified' ORDER BY u.id DESC",
        )->fetchAll()
        as $d
    ) {
        $p = public_profile($d);
        $p['projects'] = (int) $d['projects'];
        $developers[] = $p;
    }
    $needs = [];
    foreach (
        query(
            'SELECT n.*,u.name,u.status AS org_status FROM cc_needs n JOIN cc_users u ON u.id=n.user_id WHERE ' .
                ($admin ? '1=1' : "u.status='verified' OR n.user_id=?") .
                ' ORDER BY n.created_at DESC,n.id DESC',
            $admin ? [] : [$currentUserId],
        )->fetchAll()
        as $n
    ) {
        $needs[] = [
            'id' => (string) $n['id'],
            'avatarUrl' => $photos[(int) $n['user_id']] ?? '',
            'ownerId' => (string) $n['user_id'],
            'mine' => (int) $n['user_id'] === $currentUserId,
            'title' => $n['title'],
            'description' => $n['description'],
            'org' => $n['name'],
            'category' => $n['category'],
            'categories' => stored_domains($n),
            'skills' => split_skills($n['skills']),
            'budget' => $n['budget'] ?: 'À définir ensemble',
            'deadline' => $n['deadline'] ?: 'À convenir ensemble',
            'dateValue' => $n['deadline'] ?? '',
            'createdAt' => $n['created_at'],
            'publicVisible' => $n['org_status'] === 'verified',
            'status' => $n['status'] === 'open' ? 'Ouvert' : 'Clôturé',
            'color' => '',
        ];
    }
    $collaborations = [];
    $conversations = [];
    $notifications = [];
    $favorites = [];
    $talents = [];
    $organisations = [];
    $accounts = [];
    $administrators = [];
    if ($currentUser) {
        foreach (
            query(
                'SELECT c.*,a.name AS requester_name,b.name AS recipient_name,COALESCE(p.title,n.title) AS project_title FROM cc_collaborations c JOIN cc_users a ON a.id=c.requester_id JOIN cc_users b ON b.id=c.recipient_id LEFT JOIN cc_projects p ON p.id=c.project_id LEFT JOIN cc_needs n ON n.id=c.need_id WHERE c.requester_id=? OR c.recipient_id=? ORDER BY c.id DESC',
                [$currentUserId, $currentUserId],
            )->fetchAll()
            as $c
        ) {
            $incoming = (int) $c['recipient_id'] === $currentUserId;
            $name = $incoming ? $c['requester_name'] : $c['recipient_name'];
            $collaborations[] = [
                'id' => (string) $c['id'],
                'name' => $name,
                'avatarUrl' =>
                    $photos[(int) ($incoming ? $c['requester_id'] : $c['recipient_id'])] ?? '',
                'initials' => ident($name),
                'project' => $c['project_title'],
                'projectId' => $c['project_id'] ? (string) $c['project_id'] : '',
                'subject' => $c['subject'],
                'status' => [
                    'pending' => $incoming ? 'À répondre' : 'En attente',
                    'accepted' => 'Acceptée',
                    'declined' => 'Refusée',
                ][$c['status']],
                'date' => substr($c['created_at'], 0, 10),
                'incoming' => $incoming,
                'color' => '',
                'conversationId' => (string) $c['conversation_id'],
            ];
        }
        foreach (
            query(
                'SELECT c.*,a.name AS name_a,b.name AS name_b FROM cc_conversations c JOIN cc_users a ON a.id=c.participant_a JOIN cc_users b ON b.id=c.participant_b WHERE participant_a=? OR participant_b=? ORDER BY (SELECT MAX(m.id) FROM cc_messages m WHERE m.conversation_id=c.id) DESC',
                [$currentUserId, $currentUserId],
            )->fetchAll()
            as $c
        ) {
            $name = (int) $c['participant_a'] === $currentUserId ? $c['name_b'] : $c['name_a'];
            $m = query('SELECT * FROM cc_messages WHERE conversation_id=? ORDER BY id', [
                $c['id'],
            ])->fetchAll();
            $conversations[] = [
                'id' => (string) $c['id'],
                'name' => $name,
                'avatarUrl' =>
                    $photos[
                        (int) ((int) $c['participant_a'] === $currentUserId
                            ? $c['participant_b']
                            : $c['participant_a'])
                    ] ?? '',
                'initials' => ident($name),
                'context' => $c['context'],
                'color' => '',
                'unread' => count(
                    array_filter(
                        $m,
                        fn($v) => (int) $v['sender_id'] !== $currentUserId && !$v['read_at'],
                    ),
                ),
                'messages' => array_map(
                    fn($v) => [
                        'id' => (string) $v['id'],
                        'text' => $v['body'],
                        'mine' => (int) $v['sender_id'] === $currentUserId,
                        'time' => substr($v['created_at'], 11, 5),
                        'date' => substr($v['created_at'], 0, 10),
                        'read' => (bool) $v['read_at'],
                    ],
                    $m,
                ),
            ];
        }
        $notifications = query(
            'SELECT id,title,body,route,is_read,created_at FROM cc_notifications WHERE user_id=? ORDER BY id DESC LIMIT 50',
            [$currentUserId],
        )->fetchAll();
        foreach (
            query('SELECT kind,item_id FROM cc_saves WHERE user_id=?', [$currentUserId])->fetchAll()
            as $s
        ) {
            if ($s['kind'] === 'project') {
                $favorites[] = (string) $s['item_id'];
            } else {
                $talents[] = (string) $s['item_id'];
            }
        }
        if ($admin) {
            foreach (
                query(
                    "SELECT * FROM cc_users WHERE role='organisation' ORDER BY id DESC",
                )->fetchAll()
                as $o
            ) {
                $organisations[] = [
                    ...organisation_private_details($o),
                    'bio' => $o['bio'],
                    'country' => $o['country'],
                    'city' => $o['city'],
                    'id' => (string) $o['id'],
                    'name' => $o['name'],
                    'avatarUrl' => $photos[(int) $o['id']] ?? '',
                    'type' => $o['org_type'],
                    'email' => $o['email'],
                    'status' => [
                        'pending' => 'En attente',
                        'verified' => 'Vérifiée',
                        'rejected' => 'Refusée',
                        'suspended' => 'Suspendue',
                    ][$o['status']],
                ];
            }
            foreach (
                query("SELECT * FROM cc_users WHERE role='developer' ORDER BY id DESC")->fetchAll()
                as $a
            ) {
                $accounts[] = [
                    'id' => (string) $a['id'],
                    'name' => $a['name'],
                    'email' => $a['email'],
                    'status' => $a['status'],
                ];
            }
        }
    }
    if ($admin) {
        foreach (
            query("SELECT * FROM cc_users WHERE role='admin' ORDER BY id")->fetchAll()
            as $administrator
        ) {
            $administrators[] = [
                'id' => (string) $administrator['id'],
                'name' => $administrator['name'],
                'email' => $administrator['email'],
                'status' => $administrator['status'],
                'createdAt' => $administrator['created_at'],
                'self' => (int) $administrator['id'] === $currentUserId,
                'isSuperAdmin' => is_super_admin($administrator),
            ];
        }
    }
    $profile = $currentUser
        ? public_profile($currentUser, true)
        : [
            'name' => 'Visiteur',
            'email' => '',
            'skills' => [],
            'bio' => '',
            'city' => '',
            'country' => 'Sénégal',
            'specialty' => '',
            'available' => false,
            'status' => 'guest',
        ];
    $profile['skills'] = implode(', ', $profile['skills']);
    return [
        'features' => $features,
        'csrf' => $_SESSION['csrf'],
        'authenticated' => (bool) $currentUser,
        'role' => $currentUser['role'] ?? 'guest',
        'profile' => $profile,
        'projects' => $projects,
        'developers' => $developers,
        'needs' => $needs,
        'collaborations' => $collaborations,
        'conversations' => $conversations,
        'notifications' => $notifications,
        'notificationUnreadCount' => $currentUser
            ? (int) query('SELECT COUNT(*) FROM cc_notifications WHERE user_id=? AND is_read=0', [$currentUserId])->fetchColumn()
            : 0,
        'notificationsRead' => !count(array_filter($notifications, fn($n) => !$n['is_read'])),
        'favorites' => $favorites,
        'talents' => $talents,
        'organisations' => $organisations,
        'accounts' => $accounts,
        'administrators' => $administrators,
        'preferences' => $profile['preferences'] ?? [],
        'isSuperAdmin' => is_super_admin($currentUser),
        'hasSuperAdmin' =>
            $admin && $features['evolutionReady']
                ? (bool) query(
                    "SELECT COUNT(*) FROM cc_users WHERE role='admin' AND is_super_admin=1 AND status='verified'",
                )->fetchColumn()
                : false,
        'mailEnabled' => mail_ready(),
        'emailChangeEnabled' => email_change_ready(),
        'supportTickets' =>
            $currentUser && $features['evolutionReady']
                ? query(
                    'SELECT id,subject,status,updated_at,name FROM cc_support_tickets' .
                        ($admin ? '' : ' WHERE user_id=?') .
                        ' ORDER BY updated_at DESC LIMIT 100',
                    $admin ? [] : [$currentUserId],
                )->fetchAll()
                : [],
        'accountRequests' =>
            $admin && $features['evolutionReady']
                ? query(
                    'SELECT r.*,u.name AS target_name,a.name AS requester_name FROM cc_account_requests r JOIN cc_users u ON u.id=r.target_id JOIN cc_users a ON a.id=r.requester_id' .
                        (is_super_admin($currentUser) ? '' : ' WHERE requester_id=?') .
                        ' ORDER BY r.id DESC LIMIT 100',
                    is_super_admin($currentUser) ? [] : [$currentUserId],
                )->fetchAll()
                : [],
    ];
}
