<?php
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/photos.php';
try {
    if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'HEAD'], true)) {
        http_response_code(405);
        exit();
    }
    $id = (int) ($_GET['user'] ?? 0);
    $u = query('SELECT * FROM cc_users WHERE id=?', [$id])->fetch();
    $viewer = user();
    $public =
        $u &&
        $u['status'] === 'verified' &&
        in_array($u['role'], ['developer', 'organisation'], true);
    if (
        !$u ||
        (!$public && ($viewer['role'] ?? '') !== 'admin' && (int) ($viewer['id'] ?? 0) !== $id)
    ) {
        http_response_code(404);
        exit();
    }
    $name = (string) ($u['avatar_path'] ?? '');
    if (!photo_filename($name) || !is_file(photo_directory() . '/' . $name)) {
        http_response_code(404);
        exit();
    }
    header('Content-Type: image/jpeg');
    header('Content-Length: ' . filesize(photo_directory() . '/' . $name));
    // La visibilité suit immédiatement la suspension ou la suppression du profil.
    header('Cache-Control: private, no-store');
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        readfile(photo_directory() . '/' . $name);
    }
} catch (Throwable $e) {
    http_response_code(404);
}
