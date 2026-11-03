<?php
// Exemple uniquement. install.php crée config/local.php lors de l’installation locale.
// Pour un déploiement, copier ce modèle vers local.php et adapter les valeurs.
return [
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'civiconnect',
    'username' => 'VOTRE_UTILISATEUR_MYSQL',
    'password' => 'VOTRE_MOT_DE_PASSE_MYSQL',
    'app_url' => 'http://localhost/civiconnect-africa',
    'mail_enabled' => false,
    'email_change_enabled' => false,
    'mail_from' => '',
    'smtp_host' => '',
    'smtp_port' => 587,
    'smtp_username' => '',
    'smtp_password' => '',
    'smtp_encryption' => 'tls',
];
