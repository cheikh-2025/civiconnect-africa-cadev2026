-- CiviConnect Africa — schéma consolidé le 2 novembre 2026.
-- INSTALLATION NEUVE UNIQUEMENT : ne met pas à niveau une base existante.
-- Aucune donnée de démonstration ni aucun compte par défaut.
CREATE TABLE IF NOT EXISTS cc_users (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 is_super_admin TINYINT(1) NOT NULL DEFAULT 0,
 email_verified_at DATETIME NULL,
 org_address VARCHAR(255) NOT NULL DEFAULT '',
 org_contact_name VARCHAR(180) NOT NULL DEFAULT '',
 org_phone VARCHAR(60) NOT NULL DEFAULT '',
 org_website VARCHAR(255) NOT NULL DEFAULT '',
 org_review_note TEXT NULL,
 org_reviewed_by BIGINT UNSIGNED NULL,
 org_reviewed_at DATETIME NULL,
 org_is_demo TINYINT(1) NOT NULL DEFAULT 0,
 role ENUM('developer','organisation','admin') NOT NULL,
 name VARCHAR(180) NOT NULL,
 email VARCHAR(180) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 auth_version INT NOT NULL DEFAULT 0,
 status ENUM('pending','verified','rejected','suspended') NOT NULL DEFAULT 'verified',
 avatar_path VARCHAR(255) NOT NULL DEFAULT '',
 org_type VARCHAR(100) NOT NULL DEFAULT '',
 city VARCHAR(120) NOT NULL DEFAULT '',
 country VARCHAR(100) NOT NULL DEFAULT 'Sénégal',
 specialty VARCHAR(120) NOT NULL DEFAULT '',
 bio TEXT NOT NULL,
 skills TEXT NOT NULL,
 available TINYINT(1) NOT NULL DEFAULT 1,
 preferences TEXT NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_users_role_status (role,status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS cc_projects (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 title VARCHAR(150) NOT NULL,
 description TEXT NOT NULL,
 category VARCHAR(80) NOT NULL,
 categories_json TEXT NULL,
 skills TEXT NOT NULL,
 status ENUM('draft','review','published') NOT NULL DEFAULT 'draft',
 github_url VARCHAR(255) NOT NULL DEFAULT '',
 demo_url VARCHAR(255) NOT NULL DEFAULT '',
 review_note TEXT NULL,
 published_at DATETIME NULL,
 seeking_collaborators TINYINT(1) NOT NULL DEFAULT 0,
 wanted_skills VARCHAR(500) NOT NULL DEFAULT '',
 views BIGINT UNSIGNED NOT NULL DEFAULT 0,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES cc_users(id),
 INDEX idx_project_status (status,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS cc_needs (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 title VARCHAR(150) NOT NULL,
 description TEXT NOT NULL,
 category VARCHAR(80) NOT NULL,
 categories_json TEXT NULL,
 skills TEXT NOT NULL,
 budget VARCHAR(120) NOT NULL DEFAULT '',
 deadline DATE NULL,
 status ENUM('open','closed') NOT NULL DEFAULT 'open',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES cc_users(id),
 INDEX idx_need_status (status,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS cc_conversations (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 participant_a BIGINT UNSIGNED NOT NULL,
 participant_b BIGINT UNSIGNED NOT NULL,
 context VARCHAR(180) NOT NULL DEFAULT '',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (participant_a) REFERENCES cc_users(id),
 FOREIGN KEY (participant_b) REFERENCES cc_users(id),
 UNIQUE KEY uq_conversation_pair (participant_a,participant_b)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS cc_collaborations (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 requester_id BIGINT UNSIGNED NOT NULL,
 recipient_id BIGINT UNSIGNED NOT NULL,
 project_id BIGINT UNSIGNED NULL,
 need_id BIGINT UNSIGNED NULL,
 conversation_id BIGINT UNSIGNED NOT NULL,
 subject VARCHAR(180) NOT NULL,
 status ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (requester_id) REFERENCES cc_users(id),
 FOREIGN KEY (recipient_id) REFERENCES cc_users(id),
 FOREIGN KEY (project_id) REFERENCES cc_projects(id),
 FOREIGN KEY (need_id) REFERENCES cc_needs(id),
 FOREIGN KEY (conversation_id) REFERENCES cc_conversations(id),
 INDEX idx_collab_recipient (recipient_id,status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS cc_messages (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 conversation_id BIGINT UNSIGNED NOT NULL,
 sender_id BIGINT UNSIGNED NOT NULL,
 body TEXT NOT NULL,
 read_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (conversation_id) REFERENCES cc_conversations(id),
 FOREIGN KEY (sender_id) REFERENCES cc_users(id),
 INDEX idx_messages_conversation (conversation_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS cc_notifications (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 title VARCHAR(180) NOT NULL,
 body TEXT NOT NULL,
 route VARCHAR(120) NOT NULL,
 is_read TINYINT(1) NOT NULL DEFAULT 0,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES cc_users(id),
 INDEX idx_notification_user (user_id,is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS cc_saves (
 user_id BIGINT UNSIGNED NOT NULL,
 kind ENUM('project','developer') NOT NULL,
 item_id BIGINT UNSIGNED NOT NULL,
 PRIMARY KEY (user_id,kind,item_id),
 FOREIGN KEY (user_id) REFERENCES cc_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS cc_login_attempts (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 account_key CHAR(64) NOT NULL,
 ip_key CHAR(64) NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_attempt_account (account_key,created_at),
 INDEX idx_attempt_ip (ip_key,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS cc_password_tokens (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 token_hash CHAR(64) NOT NULL UNIQUE,
 expires_at DATETIME NOT NULL,
 used_at DATETIME NULL,
 FOREIGN KEY (user_id) REFERENCES cc_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cc_support_tickets (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NULL,
 name VARCHAR(180) NOT NULL,
 email VARCHAR(180) NOT NULL,
 subject VARCHAR(180) NOT NULL,
 body TEXT NOT NULL,
 access_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
 status ENUM('open','answered','closed') NOT NULL DEFAULT 'open',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES cc_users(id),
 INDEX idx_support_user (user_id,updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS cc_support_replies (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 ticket_id BIGINT UNSIGNED NOT NULL,
 author_id BIGINT UNSIGNED NULL,
 body TEXT NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (ticket_id) REFERENCES cc_support_tickets(id),
 FOREIGN KEY (author_id) REFERENCES cc_users(id),
 INDEX idx_support_reply (ticket_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS cc_account_requests (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 requester_id BIGINT UNSIGNED NOT NULL,
 target_id BIGINT UNSIGNED NOT NULL,
 desired_status ENUM('verified','suspended') NOT NULL,
 reason TEXT NOT NULL,
 pending_key VARCHAR(20) NULL UNIQUE,
 status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
 decision_note TEXT NULL,
 decided_by BIGINT UNSIGNED NULL,
 decided_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (requester_id) REFERENCES cc_users(id),
 FOREIGN KEY (target_id) REFERENCES cc_users(id),
 FOREIGN KEY (decided_by) REFERENCES cc_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS cc_admin_audit (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 actor_id BIGINT UNSIGNED NOT NULL,
 target_id BIGINT UNSIGNED NOT NULL,
 action VARCHAR(100) NOT NULL,
 reason TEXT NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (actor_id) REFERENCES cc_users(id),
 FOREIGN KEY (target_id) REFERENCES cc_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS cc_email_confirmations (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 email VARCHAR(180) NOT NULL,
 token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
 expires_at DATETIME NOT NULL,
 used_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES cc_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cc_chat_activity (
    conversation_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    typing_until DATETIME NOT NULL,
    PRIMARY KEY (conversation_id,user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Une clé stable empêche de doubler un message lors d’une nouvelle tentative.
CREATE TABLE IF NOT EXISTS cc_chat_requests (
    user_id BIGINT UNSIGNED NOT NULL,
    client_key VARCHAR(36) NOT NULL,
    conversation_id BIGINT UNSIGNED NOT NULL,
    message_id BIGINT UNSIGNED NULL,
    PRIMARY KEY (user_id,client_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cc_email_changes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    old_email VARCHAR(180) NOT NULL,
    new_email VARCHAR(180) NOT NULL,
    auth_version BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_change_user (user_id, used_at),
    FOREIGN KEY (user_id) REFERENCES cc_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
