<?php
declare(strict_types=1);

/**
 * Crée un compte depuis l’administration sans remplacer la session en cours.
 * Une inscription publique ne passe jamais par cette fonction.
 */
function create_account_by_admin(array $data): int
{
    $administrator = require_user('admin');
    $role = $data['role'] ?? '';

    if (!in_array($role, ['developer', 'organisation', 'admin'], true)) {
        fail('Sélectionnez un type de compte valide.');
    }

    $name = text($data, 'name', 2, 180, 'Nom');
    $mail = email($data);
    $newPassword = password($data);
    $country = text($data, 'country', 2, 100, 'Pays');

    if ($role === 'admin') {
        require_super_admin();
        // Confirme que la personne devant l’écran est bien l’administrateur.
        $currentPassword = $data['current_password'] ?? null;

        if (
            !is_string($currentPassword) ||
            !password_verify($currentPassword, $administrator['password_hash'])
        ) {
            fail('Confirmez la création avec votre mot de passe actuel.', 422, [
                'current_password' => 'Votre mot de passe actuel est requis et doit être correct.',
            ]);
        }

        if (strlen($newPassword) < 12) {
            fail('Choisissez un mot de passe administrateur plus long.', 422, [
                'password' => 'Utilisez entre 12 et 72 octets.',
            ]);
        }
    }

    if (query('SELECT id FROM cc_users WHERE email=?', [$mail])->fetch()) {
        fail('Cette adresse est déjà utilisée.', 409, [
            'email' => 'Cette adresse est déjà utilisée.',
        ]);
    }

    return transaction(function () use (
        $administrator,
        $role,
        $name,
        $mail,
        $newPassword,
        $country,
    ): int {
        query(
            'INSERT INTO cc_users (role,name,email,password_hash,status,country,bio,skills,preferences) VALUES (?,?,?,?,?,?,?,?,?)',
            [
                $role,
                $name,
                $mail,
                password_hash($newPassword, PASSWORD_DEFAULT),
                $role === 'organisation' ? 'pending' : 'verified',
                $country,
                '',
                '',
                '{"collabs":true,"messages":true,"news":false}',
            ],
        );

        $newId = (int) db()->lastInsertId();

        if ($role === 'admin') {
            admins_notice(
                'Nouvel administrateur',
                $administrator['name'] . ' a créé le compte administrateur de ' . $name . '.',
                'administration',
            );
        }

        return $newId;
    });
}
