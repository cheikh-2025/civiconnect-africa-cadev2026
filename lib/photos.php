<?php
declare(strict_types=1);
function photo_directory(): string
{
    return dirname(__DIR__) . '/uploads/avatars';
}
function photo_filename(string $name): bool
{
    return (bool) preg_match('/^[a-f0-9]{40}\.jpg$/D', $name);
}
function avatar_url(array $u): string
{
    $name = (string) ($u['avatar_path'] ?? '');
    return photo_filename($name) ? 'avatar.php?user=' . (int) $u['id'] . '&v=' . $name : '';
}
function delete_photo(string $name): void
{
    if (photo_filename($name) && is_file(photo_directory() . '/' . $name)) {
        @unlink(photo_directory() . '/' . $name);
    }
}
