# CiviConnect Africa

Une plateforme d’échange africaine pour les développeurs et les organisations : présenter des projets, exprimer des besoins et construire des collaborations.

Projet présenté au concours CADEV 2026 par **Les Gaindés du Code** : **Cheikh Diop et Abdoul Karim Diallo**.

- [Plateforme en ligne]
- [Vidéo de présentation]
- Guide-Utilisateur-Jury
- Les accès de démonstration du jury sont transmis séparément et ne figurent pas dans ce dossier.

## Fonctionnalités

| Espace | Principales fonctions |
| --- | --- |
| Visiteur | Accueil, projets publiés, besoins récents, découverte des talents |
| Développeur | Profil et photo recadrable, projets personnels, recherche de collaborateurs, messagerie |
| Organisation | Dossier de vérification, publication et suivi des besoins, recherche de talents et collaborations |
| Administrateur | Vérification des organisations, modération des projets, création de comptes et support |
| Super administrateur | Création d’administrateurs, décisions de suspension et réactivation des comptes |

Notifications, favoris, recherche et filtres complètent les parcours. L’assistant intégré est un **assistant guidé local**, sans service d’IA générative.

## Technologies

PHP natif, MySQL, JavaScript natif, HTML et CSS. Aucun framework applicatif. PHPMailer est inclus pour les fonctions SMTP optionnelles ; sa licence est conservée dans `lib/phpmailer/LICENSE`.

## Installation locale sous XAMPP

1. Utiliser PHP **8.1 minimum** (la version déployée utilise PHP 8.3) avec `pdo_mysql` et `mbstring`. Les photos nécessitent aussi `gd` et `fileinfo` ; les e-mails nécessitent `openssl`.
2. Copier le dossier dans `C:\xampp\htdocs\civiconnect-africa` puis démarrer Apache et MySQL.
3. Créer une base vide nommée `civiconnect` dans phpMyAdmin, en `utf8mb4`. Ne pas utiliser la base du site en production.
4. Ouvrir `http://localhost/civiconnect-africa/install.php` sur ce même ordinateur. Ne pas créer `config/local.php` avant cette étape.
5. Saisir les paramètres MySQL locaux et choisir le nom, l’adresse e-mail et le mot de passe du premier super administrateur. Utiliser un mot de passe de 12 à 72 octets pour ce compte.
6. L’installateur importe `sql/schema.sql`, crée le super administrateur et écrit `config/local.php`. Aucun compte prédéfini n’est fourni.
7. Se connecter et créer les comptes de test nécessaires. Une organisation doit être complétée puis vérifiée avant de publier ses besoins.

Le dossier `config/` doit être accessible en écriture pendant l’installation. `uploads/avatars/` doit être accessible en écriture pour les photos. Éviter les permissions générales 777.

L’installateur accepte seulement une connexion locale et refuse de réinstaller une base contenant des comptes. Le schéma fourni est **destiné à une base neuve** : `CREATE TABLE IF NOT EXISTS` ne transforme pas une ancienne structure.

## Organisation des fichiers

- `index.php` : point d’entrée et accueil initial.
- `api.php` : actions de l’application et contrôles d’accès.
- `assets/` : JavaScript, styles et visuels publics.
- `lib/` : connexion, permissions, données, support, photos et e-mails.
- `config/local.example.php` : modèle de configuration sans identifiants réels.
- `sql/schema.sql` : structure consolidée pour une installation neuve.
- `install.php` : installation initiale locale.
- `uploads/avatars/` : photos des utilisateurs, exclues du dépôt.
- `tools/reset-password.php` : outil de récupération réservé à la console du serveur.
- `robots.txt` et `sitemap.xml` : configuration de découverte du site public.

## Déploiement sur un autre hébergement

Préparer et tester d’abord une installation locale. Exporter sa base, puis l’importer dans une base dédiée sur l’hébergement. Transférer le code et créer un `config/local.php` privé avec les paramètres de cet hébergement ; renseigner `app_url` avec l’URL HTTPS finale. Les identifiants de la base et du super administrateur sont propres à chaque installation.

Apache doit appliquer les fichiers `.htaccess`, qui protègent notamment `config/`, `lib/`, `sql/` et `uploads/`. Pour un autre serveur web, prévoir des règles équivalentes. Ne pas exposer le serveur de développement PHP sur Internet.

Pour un autre domaine, adapter aussi les URL canoniques et métadonnées dans `index.php`, ainsi que `sitemap.xml` et `robots.txt`.

## Fonctions reportées et limites

- SMTP est désactivé par défaut. Les liens de récupération de mot de passe et la confirmation d’adresse nécessitent une configuration SMTP valide et un test d’envoi.
- Le changement d’adresse e-mail nécessite également `email_change_enabled => true`. Le laisser désactivé tant que les tests d’envoi ne sont pas terminés.
- La suppression définitive des utilisateurs n’est pas proposée ; les parcours prévus utilisent suspension et réactivation.
- Le sitemap référence l’accueil uniquement. Les vues utilisant des fragments `#` ne constituent pas des pages SEO distinctes.
- Ce dossier ne contient ni les comptes du jury, ni les messages, ni les photos personnelles du site en ligne.

## Vérification avant remise

Consulter [VALIDATION.md](VALIDATION.md) : les contrôles statiques de ce dossier ne remplacent pas un essai d’installation PHP/MySQL et les tests des trois profils.

## Mise en dépôt

Déposer le contenu de ce dossier décompressé, en conservant `.gitignore` et les fichiers `.htaccess`. Ne jamais ajouter `config/local.php`, un export de production ou les mots de passe du jury. Le site hébergé est indépendant de cette copie : cette préparation ne le met pas à jour.
