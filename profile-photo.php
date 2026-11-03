<?php
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/data.php';
header('Content-Type: application/json; charset=utf-8');
$newFile = '';
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        fail('Méthode non autorisée.', 405);
    }
    $u = require_user();
    if (!hash_equals($_SESSION['csrf'], (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''))) {
        fail('Session expirée. Rechargez la page.', 419);
    }
    $features = feature_status();
    if (!$features['photos']) {
        fail('La base choisie est incomplète. Vérifiez les paramètres de votre installation.', 503);
    }
    $remove = ($_POST['action'] ?? '') === 'remove';
    if (!$remove) {
        if (!$features['imageUpload']) {
            fail('Activez les extensions PHP GD et fileinfo, puis redémarrez Apache.', 503);
        }
        $f = $_FILES['photo'] ?? null;
        if (!$f || !is_array($f) || !is_int($f['error'] ?? null)) {
            fail('Choisissez une photo à envoyer.');
        }
        if (in_array($f['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
            fail(
                'La photo dépasse la limite d’envoi du serveur (3 Mo au maximum). Essayez une image plus légère.',
                413,
            );
        }
        if ($f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) {
            fail('L’envoi a échoué. Choisissez à nouveau votre photo.');
        }
        if ($f['size'] > 3 * 1024 * 1024) {
            fail('La photo est trop volumineuse. Maximum : 3 Mo.', 413);
        }
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
        $info = @getimagesize($f['tmp_name']);
        if (
            !in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true) ||
            !$info ||
            $mime !== $info['mime']
        ) {
            fail('Utilisez une véritable image JPEG, PNG ou WebP.');
        }
        [$w, $h] = $info;
        if ($w < 16 || $h < 16 || $w > 4096 || $h > 4096 || $w * $h > 16000000) {
            fail('Dimensions autorisées : 16 à 4096 pixels, jusqu’à 16 mégapixels.');
        }
        $src = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($f['tmp_name']),
            'image/png' => @imagecreatefrompng($f['tmp_name']),
            default => function_exists('imagecreatefromwebp')
                ? @imagecreatefromwebp($f['tmp_name'])
                : false,
        };
        if (!$src) {
            fail('Cette image ne peut pas être lue. Essayez un JPEG ou un PNG.');
        }
        $scale = min(1, 640 / max($w, $h));
        $out = imagecreatetruecolor(
            max(1, (int) round($w * $scale)),
            max(1, (int) round($h * $scale)),
        );
        imagefill($out, 0, 0, imagecolorallocate($out, 255, 255, 255));
        imagecopyresampled($out, $src, 0, 0, 0, 0, imagesx($out), imagesy($out), $w, $h);
        if (
            !is_dir(photo_directory()) &&
            !@mkdir(photo_directory(), 0755, true) &&
            !is_dir(photo_directory())
        ) {
            throw new RuntimeException('PHOTO_DIRECTORY');
        }
        $newFile = bin2hex(random_bytes(20)) . '.jpg';
        if (!imagejpeg($out, photo_directory() . '/' . $newFile, 88)) {
            throw new RuntimeException('PHOTO_WRITE');
        }
        imagedestroy($src);
        imagedestroy($out);
    }
    $old = transaction(function () use ($u, $newFile) {
        $old = (string) query('SELECT avatar_path FROM cc_users WHERE id=? FOR UPDATE', [
            $u['id'],
        ])->fetchColumn();
        query('UPDATE cc_users SET avatar_path=? WHERE id=?', [$newFile, $u['id']]);
        return $old;
    });
    $newFile = ''; // Le fichier est désormais référencé en base.
    delete_photo($old);
    respond(['data' => bootstrap_data()]);
}
 catch (Throwable $e) {
    delete_photo($newFile);
    error_log('CiviConnect photo: ' . $e->getMessage());
    fail(
        'La photo n’a pas été enregistrée. Vérifiez les droits d’écriture du dossier uploads/avatars et la connexion MySQL.',
        500,
    );
}
