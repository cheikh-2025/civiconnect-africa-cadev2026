# Validation du dossier — 2 novembre 2026

## Contrôles réalisés

- Comparaison avec l’archive de production fournie : aucun fichier PHP, JavaScript ou CSS modifié. Seul le `.gitignore` existant a été renforcé ; le schéma, le modèle de configuration et la documentation ont été ajoutés.
- Vérification de syntaxe de tous les fichiers JavaScript avec `node --check` : réussie.
- Schéma consolidé : 18 tables ; toutes les références `cc_*` relevées dans le code PHP ont une table correspondante.
- Vérification statique des colonnes dans les instructions INSERT et UPDATE explicites : aucune colonne manquante détectée.
- Aucun compte prédéfini ni instruction INSERT de données dans le schéma.
- Absence de `config/local.php` et de photos d’utilisateurs dans le dossier distribué.

Le schéma a été reconstruit à partir du schéma initial fourni et des requêtes du code actuel, avec les ajouts de messagerie et d’e-mail disponibles. Il ne s’agit pas d’un export de la structure de production.

## Limites des vérifications

PHP et MySQL ne sont pas disponibles dans l’environnement de préparation. Aucun test d’exécution PHP, import MySQL ou test navigateur de cette installation neuve n’a donc été réalisé. Le contrôle statique ne garantit pas le comportement des jointures, transactions, permissions de fichiers ou extensions PHP.

Les tests réalisés par l’auteur sur le site en ligne concernent sa base existante. Ils ne remplacent pas les essais ci-dessous sur le schéma consolidé.

## Parcours à tester sur une base locale vide

1. Ouvrir `install.php` depuis localhost, installer et vérifier la création du premier super administrateur. Une seconde installation doit être refusée.
2. Se connecter au compte initial ; créer un développeur, une organisation et un administrateur sans perdre la session courante.
3. Compléter le profil de l’organisation. Vérifier qu’une organisation en attente ne publie pas de besoins ; faire examiner et valider son dossier par l’administrateur.
4. Créer un projet développeur, le soumettre, puis le publier depuis l’administration. Vérifier l’accueil, les filtres et « Mes projets ».
5. Publier un besoin depuis l’organisation ; vérifier « Mes besoins », les besoins récents, la fermeture et la réouverture du besoin.
6. Créer une demande de collaboration entre deux comptes ; tester acceptation, refus, conversation, accusé de lecture et indicateur de saisie dans deux navigateurs.
7. Ajouter une photo avec GD/fileinfo activés ; tester recadrage, zoom et sauvegarde. Vérifier que chaque utilisateur ne modifie que son profil.
8. Tester favoris, notifications et compteurs après rechargement de la page.
9. Créer un ticket de support comme visiteur et comme membre ; répondre comme administrateur. Tester le lien de suivi personnel du visiteur.
10. Demander une suspension comme administrateur ; décider comme super administrateur. Vérifier que le compte suspendu perd son accès, puis tester sa réactivation.
11. Vérifier que les fonctions e-mail restent indisponibles quand SMTP est désactivé. Leur activation et les essais d’envoi sont reportés.
12. Tester les principaux parcours sur téléphone et vérifier qu’un visiteur ne peut pas consulter les conversations ou les espaces d’administration.

Ne pas importer ce schéma dans la base du site en ligne. Il sert exclusivement aux installations neuves.
