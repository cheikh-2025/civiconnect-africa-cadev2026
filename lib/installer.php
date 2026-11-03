<?php
declare(strict_types=1);
function install_app(array $c, string $name, string $email, string $password): void
{
    if (
        !preg_match('/^[a-zA-Z0-9_.:-]+$/', $c['host']) ||
        !preg_match('/^[a-zA-Z0-9_]{1,64}$/', $c['database'])
    ) {
        throw new RuntimeException('Nom de serveur ou de base invalide.');
    }
    if ((int) $c['port'] < 1 || (int) $c['port'] > 65535) {
        throw new RuntimeException('Port MySQL invalide.');
    }
    if (
        mb_strlen($name) < 2 ||
        mb_strlen($name) > 180 ||
        !filter_var($email, FILTER_VALIDATE_EMAIL) ||
        strlen($email) > 180 ||
        strlen($password) < 12 ||
        strlen($password) > 72
    ) {
        throw new RuntimeException(
            'Indiquez un nom, un e-mail valide et un mot de passe administrateur de 12 à 72 octets.',
        );
    }
    $pdo = new PDO(
        'mysql:host=' . $c['host'] . ';port=' . (int) $c['port'] . ';charset=utf8mb4',
        $c['username'],
        $c['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
    );
    $lock = 'civiconnect_install_' . $c['database'];
    $q = $pdo->prepare('SELECT GET_LOCK(?,10)');
    $q->execute([$lock]);
    if ((int) $q->fetchColumn() !== 1) {
        throw new RuntimeException('Une installation est déjà en cours.');
    }
    try {
        if (!empty($c['create_database'])) {
            $pdo->exec(
                'CREATE DATABASE IF NOT EXISTS `' .
                    $c['database'] .
                    '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
            );
        }
        $pdo->exec('USE `' . $c['database'] . '`');

        // Une installation neuve ne reprend ni ne réinitialise des comptes existants.
        $usersTableExists =
            (int) $pdo
                ->query(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cc_users'",
                )
                ->fetchColumn() > 0;

        if (
            $usersTableExists &&
            (int) $pdo->query('SELECT COUNT(*) FROM cc_users')->fetchColumn() > 0
        ) {
            throw new RuntimeException(
                'Cette base contient déjà des comptes CiviConnect. Choisissez un autre nom de base pour cette installation neuve. Les données existantes ont été conservées.',
            );
        }

        $schema = preg_replace(
            '/^\s*--.*$/m',
            '',
            file_get_contents(dirname(__DIR__) . '/sql/schema.sql'),
        );
        foreach (explode(';', $schema) as $sql) {
            if (trim($sql) !== '') {
                $pdo->exec($sql);
            }
        }
        if ((int) $pdo->query('SELECT COUNT(*) FROM cc_users')->fetchColumn() > 0) {
            throw new RuntimeException(
                'Cette base contient déjà des comptes. Choisissez un autre nom de base pour cette installation neuve.',
            );
        }
        $pdo->beginTransaction();
        $s = $pdo->prepare(
            'INSERT INTO cc_users (role,is_super_admin,name,email,password_hash,status,bio,skills,preferences) VALUES (?,1,?,?,?,?,?,?,?)',
        );
        $s->execute([
            'admin',
            $name,
            mb_strtolower($email),
            password_hash($password, PASSWORD_DEFAULT),
            'verified',
            '',
            '',
            '{"collabs":true,"messages":true,"news":false}',
        ]);
        unset($c['create_database']);
        $path = dirname(__DIR__) . '/config/local.php';
        $temp = $path . '.tmp';
        if (
            file_put_contents($temp, "<?php\nreturn " . var_export($c, true) . ";\n", LOCK_EX) ===
            false
        ) {
            throw new RuntimeException('Le dossier config doit être accessible en écriture.');
        }
        @chmod($temp, 0600);
        if (!rename($temp, $path)) {
            throw new RuntimeException('Impossible de sauvegarder la configuration.');
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    } finally {
        $s = $pdo->prepare('SELECT RELEASE_LOCK(?)');
        $s->execute([$lock]);
    }
}
