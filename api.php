<?php
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/data.php';
require __DIR__ . '/lib/accounts.php';
require __DIR__ . '/lib/support.php';
require __DIR__ . '/lib/chat.php';
require_once __DIR__ . '/lib/email-change.php';
header('Content-Type: application/json; charset=utf-8');
// Chaque action vérifie le rôle et le propriétaire avant de modifier MySQL.
try {
    $action = (string) ($_GET['action'] ?? 'bootstrap');
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action !== 'bootstrap') {
            fail('Action introuvable.', 404);
        }
        respond(['data' => bootstrap_data()]);
    }
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        fail('Méthode non autorisée.', 405);
    }
    $token = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!hash_equals($_SESSION['csrf'], $token)) {
        fail('Session expirée. Rechargez la page.', 419);
    }
    $data = input();
    $currentUser = user();
    $resourceId = (int) ($data['id'] ?? 0);
    // Les formulaires envoient le nom de l’action dans ?action=...
    if (
        in_array(
            $action,
            [
                'account.request',
                'account.decide',
                'support.create',
                'support.read',
                'support.reply',
                'support.close',
            ],
            true,
        ) &&
        !feature_status()['evolutionReady']
    ) {
        fail('La mise à jour de la base doit être terminée avant cette action.', 503);
    }
    switch ($action) {
        case 'email.change.request':
            request_email_change($data);
            break;
        case 'email.change.confirm':
            confirm_email_change($data);
            break;
        case 'email.confirm.request':
            request_email_confirmation();
            break;
        case 'email.confirm':
            confirm_email_address($data);
            break;
        case 'organisation.submit':
            submit_organisation_dossier();
            break;
        case 'mail.test':
            $actor = require_super_admin();
            rate_limit('mail-test:' . $actor['id'], 3);
            if (
                !send_app_mail(
                    $actor['email'],
                    'CiviConnect Africa — test de livraison',
                    'Ce message confirme que CiviConnect a pu remettre un e-mail à votre service SMTP. Vérifiez aussi vos courriers indésirables.',
                )
            ) {
                fail('Le service SMTP n’a pas accepté le message. Vérifiez sa configuration.', 503);
            }
            respond([
                'message' =>
                    'Message accepté par le service SMTP. Vérifiez sa réception dans votre boîte e-mail.',
            ]);
        case 'account.request':
            request_account_status($data);
            break;
        case 'account.decide':
            decide_account_request($data);
            break;
        case 'support.create':
            create_support_ticket($data);
        case 'support.read':
            rate_limit('support-read:' . ($_SERVER['REMOTE_ADDR'] ?? ''), 60);
            respond(['ticket' => support_ticket_public(support_ticket_access($data))]);
        case 'support.reply':
            reply_support_ticket($data);
            break;
        case 'support.close':
            $ticket = support_ticket_access($data);
            query("UPDATE cc_support_tickets SET status='closed',updated_at=NOW() WHERE id=?", [
                $ticket['id'],
            ]);
            break;
        case 'register':
            if ($currentUser) {
                fail('Déconnectez-vous avant de créer un autre compte.', 409);
            }
            rate_limit('register:' . ($_SERVER['REMOTE_ADDR'] ?? ''), 30);
            $role = $data['role'] ?? '';
            if (!in_array($role, ['developer', 'organisation'], true)) {
                fail('Type de compte invalide.');
            }
            $name = text($data, 'name', 2, 180, 'Nom');
            $mail = email($data);
            $pass = password($data);
            $country = text($data, 'country', 2, 100, 'Pays');
            if (query('SELECT id FROM cc_users WHERE email=?', [$mail])->fetch()) {
                fail('Cette adresse est déjà utilisée.', 409, [
                    'email' => 'Cette adresse est déjà utilisée.',
                ]);
            }
            $userId = transaction(function () use ($role, $name, $mail, $pass, $country) {
                query(
                    'INSERT INTO cc_users (role,name,email,password_hash,status,country,bio,skills,preferences) VALUES (?,?,?,?,?,?,?,?,?)',
                    [
                        $role,
                        $name,
                        $mail,
                        password_hash($pass, PASSWORD_DEFAULT),
                        $role === 'organisation' ? 'pending' : 'verified',
                        $country,
                        '',
                        '',
                        '{"collabs":true,"messages":true,"news":false}',
                    ],
                );
                $new = (int) db()->lastInsertId();
                if ($role === 'organisation') {
                    admins_notice(
                        'Organisation à vérifier',
                        $name . ' a demandé son inscription.',
                        'administration',
                    );
                }
                return $new;
            });
            session_regenerate_id(true);
            $_SESSION['user_id'] = $userId;
            $_SESSION['auth_version'] = 0;
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
            break;
        case 'login':
            if ($currentUser) {
                fail('Vous êtes déjà connecté.', 409);
            }
            $mail = email($data);
            rate_limit('login:' . $mail, 25);
            $account = query('SELECT * FROM cc_users WHERE email=?', [$mail])->fetch();
            $pass = is_string($data['password'] ?? null) ? $data['password'] : '';
            if (
                !$account ||
                !password_verify($pass, $account['password_hash']) ||
                $account['status'] === 'suspended'
            ) {
                fail('E-mail ou mot de passe incorrect.', 401);
            }
            if (password_needs_rehash($account['password_hash'], PASSWORD_DEFAULT)) {
                query('UPDATE cc_users SET password_hash=? WHERE id=?', [
                    password_hash($pass, PASSWORD_DEFAULT),
                    $account['id'],
                ]);
            }
            query('DELETE FROM cc_login_attempts WHERE account_key=?', [
                hash('sha256', 'login:' . $mail),
            ]);
            session_regenerate_id(true);
            $_SESSION['user_id'] = (int) $account['id'];
            $_SESSION['auth_version'] = (int) $account['auth_version'];
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
            break;
        case 'logout':
            $_SESSION = [];
            session_regenerate_id(true);
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
            break;
        case 'account.create':
            create_account_by_admin($data);
            break;
        case 'profile.save':
            $currentUser = require_user();
            $orgDetails = $currentUser['role'] === 'organisation' ? validate_org_details($data) : null;
            $name = text($data, 'name', 2, 180, 'Nom');
            $country = text($data, 'country', 2, 100, 'Pays');
            transaction(function () use ($data, $currentUser, $name, $country, $orgDetails): void {
                if ($orgDetails !== null) {
                    $currentUser = query('SELECT * FROM cc_users WHERE id=? FOR UPDATE', [$currentUser['id']])->fetch();
                }
                query(
                    'UPDATE cc_users SET name=?,country=?,city=?,specialty=?,bio=?,skills=?,available=?,org_type=? WHERE id=?',
                    [
                        $name,
                        $country,
                        text($data, 'city', 0, 120),
                        text($data, 'specialty', 0, 120),
                        text($data, 'bio', 0, 1500),
                        skills($data),
                        !empty($data['available']) ? 1 : 0,
                        text($data, 'org_type', 0, 100),
                        $currentUser['id'],
                    ],
                );
                if ($orgDetails !== null) {
                    save_org_details($currentUser, $data, $orgDetails);
                }
            });
            break;
        case 'preferences.save':
            $currentUser = require_user();
            query('UPDATE cc_users SET preferences=? WHERE id=?', [
                json_encode([
                    'collabs' => !empty($data['collabs']),
                    'messages' => !empty($data['messages']),
                    'news' => false,
                ]),
                $currentUser['id'],
            ]);
            break;
        case 'password.change':
            $currentUser = require_user();
            if (
                !password_verify(
                    (string) ($data['current_password'] ?? ''),
                    $currentUser['password_hash'],
                )
            ) {
                fail('Le mot de passe actuel est incorrect.', 422, [
                    'current_password' => 'Mot de passe actuel incorrect.',
                ]);
            }
            $new = password($data);
            query('UPDATE cc_users SET password_hash=?,auth_version=auth_version+1 WHERE id=?', [
                password_hash($new, PASSWORD_DEFAULT),
                $currentUser['id'],
            ]);
            $_SESSION['auth_version'] = (int) $currentUser['auth_version'] + 1;
            session_regenerate_id(true);
            break;
        case 'project.save':
            $currentUser = require_user('developer');
            $p = $resourceId
                ? query('SELECT * FROM cc_projects WHERE id=? AND user_id=?', [
                    $resourceId,
                    $currentUser['id'],
                ])->fetch()
                : null;
            if ($resourceId && !$p) {
                fail('Projet introuvable.', 404);
            }
            $title = text($data, 'title', 3, 150, 'Nom du projet');
            $description = text($data, 'description', 20, 10000, 'Description');
            $domains = input_domains($data);
            $cat = $domains[0];
            $skills = skills($data);
            if (!$skills) {
                fail('Ajoutez au moins une technologie.', 422, [
                    'skills' => 'Ajoutez au moins une technologie.',
                ]);
            }
            $status = ($data['intent'] ?? '') === 'review' ? 'review' : 'draft';
            $gh = url_field($data, 'github_url');
            $demo = url_field($data, 'demo_url');
            $peerFeature = feature_status()['peerCollaboration'];
            $seeking = !empty($data['seeking_collaborators']) ? 1 : 0;
            $wanted = text($data, 'wanted_skills', 0, 500, 'Compétences recherchées');
            if (($seeking || $wanted !== '') && !$peerFeature) {
                fail(
                    'La base choisie est incomplète. Vérifiez les paramètres de votre installation.',
                    503,
                );
            }
            transaction(function () use (
                $resourceId,
                $p,
                $currentUser,
                $title,
                $description,
                $cat,
                $domains,
                $skills,
                $status,
                $gh,
                $demo,
                $peerFeature,
                $seeking,
                $wanted,
            ) {
                if ($p) {
                    query(
                        'UPDATE cc_projects SET title=?,description=?,category=?,skills=?,status=?,github_url=?,demo_url=? WHERE id=?',
                        [$title, $description, $cat, $skills, $status, $gh, $demo, $resourceId],
                    );
                } else {
                    query(
                        'INSERT INTO cc_projects (user_id,title,description,category,skills,status,github_url,demo_url) VALUES (?,?,?,?,?,?,?,?)',
                        [
                            $currentUser['id'],
                            $title,
                            $description,
                            $cat,
                            $skills,
                            $status,
                            $gh,
                            $demo,
                        ],
                    );
                }
                $projectId = $p ? $resourceId : (int) db()->lastInsertId();
                save_domains('cc_projects', $projectId, $domains);
                if ($peerFeature) {
                    query(
                        'UPDATE cc_projects SET seeking_collaborators=?,wanted_skills=? WHERE id=?',
                        [$seeking, $wanted, $projectId],
                    );
                }
                if ($status === 'review') {
                    admins_notice(
                        'Publication à examiner',
                        $title . ' attend une validation.',
                        'administration',
                    );
                }
            });
            break;
        case 'project.review':
            require_user('admin');
            $status = $data['status'] ?? '';
            if (!in_array($status, ['published', 'draft'], true)) {
                fail('Statut invalide.');
            }
            $reason =
                $status === 'draft' ? text($data, 'reason', 5, 1500, 'Motif de correction') : '';
            transaction(function () use ($resourceId, $status, $reason) {
                $p = query('SELECT * FROM cc_projects WHERE id=? FOR UPDATE', [
                    $resourceId,
                ])->fetch();
                if (!$p) {
                    fail('Projet introuvable.', 404);
                }
                query('UPDATE cc_projects SET status=?,review_note=? WHERE id=?', [
                    $status,
                    $reason,
                    $resourceId,
                ]);
                if ($status === 'published' && feature_status()['publicationDates']) {
                    query('UPDATE cc_projects SET published_at=COALESCE(published_at,NOW()) WHERE id=?', [$resourceId]);
                }
                notification(
                    (int) $p['user_id'],
                    $status === 'published'
                        ? 'Votre projet est publié'
                        : 'Projet renvoyé en brouillon',
                    $p['title'] . ($reason !== '' ? ' — ' . $reason : ''),
                    'projet/' . $resourceId,
                );
            });
            break;
        case 'project.view':
            $p = query(
                "SELECT p.* FROM cc_projects p JOIN cc_users u ON u.id=p.user_id WHERE p.id=? AND ((p.status='published' AND u.status='verified') OR p.user_id=?)",
                [$resourceId, $currentUser['id'] ?? 0],
            )->fetch();
            if (!$p) {
                fail('Projet introuvable.', 404);
            }
            if (empty($_SESSION['viewed'][$resourceId])) {
                query('UPDATE cc_projects SET views=views+1 WHERE id=?', [$resourceId]);
                $_SESSION['viewed'][$resourceId] = true;
            }
            break;
        case 'need.save':
            $currentUser = verified_org();
            $title = text($data, 'title', 5, 150, 'Titre');
            $desc = text($data, 'description', 20, 10000, 'Description');
            $domains = input_domains($data);
            $cat = $domains[0];
            $date = text($data, 'deadline', 0, 10);
            if (
                $date !== '' &&
                (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) ||
                    !DateTimeImmutable::createFromFormat('!Y-m-d', $date) ||
                    DateTimeImmutable::createFromFormat('!Y-m-d', $date)->format('Y-m-d') !== $date)
            ) {
                fail('Date invalide.', 422, ['deadline' => 'Choisissez une date valide.']);
            }
            $vals = [
                $title,
                $desc,
                $cat,
                skills($data),
                text($data, 'budget', 0, 120),
                $date ?: null,
            ];
            transaction(function () use ($resourceId, $currentUser, $vals, $domains): void {
                if ($resourceId) {
                    $n = query('SELECT id FROM cc_needs WHERE id=? AND user_id=?', [
                        $resourceId,
                        $currentUser['id'],
                    ])->fetch();
                    if (!$n) {
                        fail('Besoin introuvable.', 404);
                    }
                    query(
                        'UPDATE cc_needs SET title=?,description=?,category=?,skills=?,budget=?,deadline=? WHERE id=?',
                        [...$vals, $resourceId],
                    );
                } else {
                    query(
                        'INSERT INTO cc_needs (title,description,category,skills,budget,deadline,user_id) VALUES (?,?,?,?,?,?,?)',
                        [...$vals, $currentUser['id']],
                    );
                    $resourceId = (int) db()->lastInsertId();
                }
                save_domains('cc_needs', $resourceId, $domains);
            });
            break;
        case 'need.reopen':
            $currentUser = verified_org();
            $n = query('SELECT status FROM cc_needs WHERE id=? AND user_id=?', [
                $resourceId,
                $currentUser['id'],
            ])->fetch();
            if (!$n) fail('Besoin introuvable.', 404);
            if ($n['status'] !== 'closed') fail('Seul un besoin clôturé peut être réouvert.');
            query("UPDATE cc_needs SET status='open' WHERE id=? AND user_id=? AND status='closed'", [
                $resourceId, $currentUser['id'],
            ]);
            break;
        case 'conversation.activity':
            chat_activity($data, $resourceId);
            break;
        case 'need.close':
            $currentUser = require_user('organisation');
            $n = query('SELECT id FROM cc_needs WHERE id=? AND user_id=?', [
                $resourceId,
                $currentUser['id'],
            ])->fetch();
            if (!$n) {
                fail('Besoin introuvable.', 404);
            }
            query("UPDATE cc_needs SET status='closed' WHERE id=?", [$resourceId]);
            break;
        case 'organisation.review':
            review_organisation_dossier($data);
            break;
        case 'account.status':
            $actor = require_super_admin();
            $status = (string) ($data['status'] ?? '');
            $reason = text($data, 'reason', 10, 1500, 'Motif');
            transaction(function () use ($actor, $resourceId, $status, $reason): void {
                change_account_status($actor, $resourceId, $status, $reason);
            });
            break;
        case 'collaboration.create':
            $currentUser = require_user();
            $source = $data['source'] ?? '';
            $itemId = (int) ($data['item_id'] ?? 0);
            $subject = text($data, 'subject', 5, 180, 'Objet');
            $message = text($data, 'message', 10, 5000, 'Message');
            if ($source === 'project') {
                if ($currentUser['role'] === 'organisation') {
                    $currentUser = verified_org();
                } elseif ($currentUser['role'] !== 'developer') {
                    fail('Cette action est réservée aux développeurs et organisations.', 403);
                }
            } elseif ($source === 'need') {
                $currentUser = require_user('developer');
            } else {
                fail('Source invalide.');
            }
            transaction(function () use ($source, $itemId, $subject, $message, $currentUser) {
                $table = $source === 'project' ? 'cc_projects' : 'cc_needs';
                $requiredStatus = $source === 'project' ? 'published' : 'open';
                $item = query(
                    "SELECT p.* FROM $table p JOIN cc_users u ON u.id=p.user_id WHERE p.id=? AND p.status=? AND u.status='verified' FOR UPDATE",
                    [$itemId, $requiredStatus],
                )->fetch();
                if (!$item) {
                    fail('Cette publication n’est pas disponible.', 404);
                }
                $owner = (int) $item['user_id'];
                if ($owner === (int) $currentUser['id']) {
                    fail('Vous êtes propriétaire de cette publication.');
                }
                if (
                    $source === 'project' &&
                    $currentUser['role'] === 'developer' &&
                    empty($item['seeking_collaborators'])
                ) {
                    fail('Ce projet ne recherche pas de collaborateurs actuellement.', 403);
                }
                $column = $source === 'project' ? 'project_id' : 'need_id';
                $duplicate = query(
                    "SELECT id FROM cc_collaborations WHERE requester_id=? AND $column=? AND status IN ('pending','accepted')",
                    [$currentUser['id'], $itemId],
                )->fetch();
                if ($duplicate) {
                    fail('Vous avez déjà une demande active pour cette publication.', 409);
                }
                $conversation = conversation((int) $currentUser['id'], $owner, $item['title']);
                query(
                    'INSERT INTO cc_collaborations (requester_id,recipient_id,project_id,need_id,conversation_id,subject) VALUES (?,?,?,?,?,?)',
                    [
                        $currentUser['id'],
                        $owner,
                        $source === 'project' ? $itemId : null,
                        $source === 'need' ? $itemId : null,
                        $conversation,
                        $subject,
                    ],
                );
                query('INSERT INTO cc_messages (conversation_id,sender_id,body) VALUES (?,?,?)', [
                    $conversation,
                    $currentUser['id'],
                    $message,
                ]);
                notification(
                    $owner,
                    'Nouvelle demande de collaboration',
                    $currentUser['name'] . ' : ' . $subject,
                    'collaborations',
                );
            });
            break;
        case 'collaboration.respond':
            $currentUser = require_user();
            $status = $data['status'] ?? '';
            if (!in_array($status, ['accepted', 'declined'], true)) {
                fail('Réponse invalide.');
            }
            transaction(function () use ($currentUser, $resourceId, $status) {
                $c = query(
                    'SELECT * FROM cc_collaborations WHERE id=? AND recipient_id=? FOR UPDATE',
                    [$resourceId, $currentUser['id']],
                )->fetch();
                if (!$c) {
                    fail('Demande introuvable.', 404);
                }
                if ($c['status'] !== 'pending') {
                    fail('Cette demande a déjà reçu une réponse.', 409);
                }
                query('UPDATE cc_collaborations SET status=? WHERE id=?', [$status, $resourceId]);
                notification(
                    (int) $c['requester_id'],
                    $status === 'accepted' ? 'Collaboration acceptée' : 'Réponse à votre demande',
                    $c['subject'],
                    'collaborations',
                );
            });
            break;
        case 'conversation.open':
            $currentUser = require_user();
            $other = query("SELECT * FROM cc_users WHERE id=? AND status='verified'", [
                $resourceId,
            ])->fetch();
            if (!$other) {
                fail('Profil introuvable.', 404);
            }
            if ($currentUser['role'] === 'organisation') {
                verified_org();
            }
            if ($other['role'] === 'admin' || $currentUser['role'] === 'admin') {
                fail('La messagerie est réservée aux développeurs et aux organisations.');
            }
            $conversation = conversation(
                (int) $currentUser['id'],
                $resourceId,
                'Échange CiviConnect',
            );
            respond(['conversationId' => (string) $conversation, 'data' => bootstrap_data()]);
        case 'message.send':
            $currentUser = require_user();
            if ($currentUser['role'] === 'organisation') {
                verified_org();
            }
            $c = own_conversation($resourceId, $currentUser);
            $body = text($data, 'message', 1, 5000, 'Message');
            $other =
                (int) $c['participant_a'] === (int) $currentUser['id']
                    ? (int) $c['participant_b']
                    : (int) $c['participant_a'];
            $active = query("SELECT id FROM cc_users WHERE id=? AND status='verified'", [
                $other,
            ])->fetch();
            if (!$active) {
                fail('Le destinataire n’est pas disponible.', 403);
            }
            $clientKey = (string) ($data['client_key'] ?? '');
            if ($clientKey !== '' && !preg_match('/^[a-f0-9-]{36}$/i', $clientKey)) {
                fail('Identifiant du message invalide.');
            }
            if ($clientKey !== '' && !chat_ready()) {
                fail('Importez sql/messagerie-besoins.sql avant cet envoi.', 503);
            }
            transaction(function () use ($currentUser, $resourceId, $body, $other, $clientKey) {
                if ($clientKey !== '') {
                    query('INSERT IGNORE INTO cc_chat_requests (user_id,client_key,conversation_id) VALUES (?,?,?)', [
                        $currentUser['id'], $clientKey, $resourceId,
                    ]);
                    $request = query('SELECT * FROM cc_chat_requests WHERE user_id=? AND client_key=? FOR UPDATE', [
                        $currentUser['id'], $clientKey,
                    ])->fetch();
                    if ((int) $request['conversation_id'] !== $resourceId) fail('Identifiant déjà utilisé.');
                    if ($request['message_id']) return;
                }
                query('INSERT INTO cc_messages (conversation_id,sender_id,body) VALUES (?,?,?)', [
                    $resourceId,
                    $currentUser['id'],
                    $body,
                ]);
                if ($clientKey !== '') {
                    query('UPDATE cc_chat_requests SET message_id=? WHERE user_id=? AND client_key=?', [
                        (int) db()->lastInsertId(), $currentUser['id'], $clientKey,
                    ]);
                }
                notification(
                    $other,
                    'Nouveau message',
                    $currentUser['name'] . ' vous a écrit.',
                    'messages',
                );
            });
            break;
        case 'conversation.read':
            $currentUser = require_user();
            own_conversation($resourceId, $currentUser);
            query(
                'UPDATE cc_messages SET read_at=NOW() WHERE conversation_id=? AND sender_id<>? AND read_at IS NULL AND id<=?',
                [$resourceId, $currentUser['id'], max(0, (int) ($data['through_id'] ?? 0))],
            );
            break;
        case 'save.toggle':
            $currentUser = require_user();
            $kind = $data['kind'] ?? '';
            if (!in_array($kind, ['project', 'developer'], true)) {
                fail('Sélection invalide.');
            }
            $item =
                $kind === 'project'
                    ? query(
                        "SELECT p.id FROM cc_projects p JOIN cc_users u ON u.id=p.user_id WHERE p.id=? AND p.status='published' AND u.status='verified'",
                        [$resourceId],
                    )->fetch()
                    : query(
                        "SELECT id FROM cc_users WHERE id=? AND role='developer' AND status='verified'",
                        [$resourceId],
                    )->fetch();
            if (!$item) {
                fail('Élément introuvable.', 404);
            }
            $s = query('SELECT item_id FROM cc_saves WHERE user_id=? AND kind=? AND item_id=?', [
                $currentUser['id'],
                $kind,
                $resourceId,
            ])->fetch();
            if ($s) {
                query('DELETE FROM cc_saves WHERE user_id=? AND kind=? AND item_id=?', [
                    $currentUser['id'],
                    $kind,
                    $resourceId,
                ]);
            } else {
                query('INSERT IGNORE INTO cc_saves (user_id,kind,item_id) VALUES (?,?,?)', [
                    $currentUser['id'],
                    $kind,
                    $resourceId,
                ]);
            }
            break;
        case 'notifications.read':
            $currentUser = require_user();
            if (array_key_exists('id', $data)) {
                if ($resourceId < 1) {
                    fail('Notification invalide.', 422);
                }
                $notice = query('SELECT id FROM cc_notifications WHERE id=? AND user_id=?', [
                    $resourceId, $currentUser['id'],
                ])->fetch();
                if (!$notice) {
                    fail('Notification introuvable.', 404);
                }
                query('UPDATE cc_notifications SET is_read=1 WHERE id=? AND user_id=?', [
                    $resourceId, $currentUser['id'],
                ]);
            } else {
                query('UPDATE cc_notifications SET is_read=1 WHERE user_id=?', [$currentUser['id']]);
            }
            break;
        case 'password.request':
            request_password_reset($data);
        case 'password.reset':
            reset_password($data);
            break;
        default:
            fail('Action introuvable.', 404);
    }
    respond(['data' => bootstrap_data()]);
} catch (Throwable $e) {
    if (isset($e->errorInfo) && ($e->errorInfo[1] ?? 0) === 1062) {
        fail('Cette opération existe déjà. Actualisez et réessayez.', 409);
    }
    error_log('CiviConnect API: ' . $e->getMessage());
    if ($e->getMessage() === 'NOT_INSTALLED') {
        fail('Installez d’abord CiviConnect depuis install.php.', 503);
    }
    fail('Le service n’est pas disponible. Vérifiez la configuration MySQL.', 500);
}
