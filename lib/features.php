<?php
declare(strict_types=1);

function feature_status(): array
{
    $columns = query(
        "SELECT TABLE_NAME,COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('cc_users','cc_projects','cc_support_tickets','cc_support_replies','cc_account_requests','cc_admin_audit','cc_needs','cc_email_confirmations','cc_email_changes','cc_password_tokens')",
    )->fetchAll();
    $found = [];
    foreach ($columns as $c) {
        $found[$c['TABLE_NAME'] . '.' . $c['COLUMN_NAME']] = true;
    }
    $photos = isset($found['cc_users.avatar_path']);
    $peers = isset(
        $found['cc_projects.seeking_collaborators'],
        $found['cc_projects.wanted_skills'],
    );
    return [
        'evolutionReady' => isset(
            $found['cc_users.is_super_admin'],
            $found['cc_projects.review_note'],
            $found['cc_support_tickets.id'],
            $found['cc_support_replies.id'],
            $found['cc_account_requests.id'],
            $found['cc_admin_audit.id'],
        ),
        'reviewDetails' => isset(
            $found['cc_users.org_address'], $found['cc_users.org_contact_name'],
            $found['cc_users.org_phone'], $found['cc_users.org_website'],
            $found['cc_users.org_review_note'], $found['cc_users.org_reviewed_by'],
            $found['cc_users.org_reviewed_at'], $found['cc_users.org_is_demo'],
            $found['cc_users.email_verified_at'], $found['cc_email_confirmations.id']
        ),
        'multipleDomains' => isset($found['cc_projects.categories_json'], $found['cc_needs.categories_json']),
        'publicationDates' => isset($found['cc_projects.published_at']),
        'emailChangeSchema' => isset($found['cc_email_changes.id'], $found['cc_users.email_verified_at'], $found['cc_users.auth_version'], $found['cc_password_tokens.id'], $found['cc_email_confirmations.id']),
        'photos' => $photos,
        'peerCollaboration' => $peers,
        'databaseReady' => $photos && $peers,
        'imageUpload' => $photos && extension_loaded('gd') && extension_loaded('fileinfo'),
    ];
}
