<?php
declare(strict_types=1);
if (!is_file(__DIR__ . '/config/local.php')) {
    header('Location: install.php');
    exit();
}
header(
    "Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
);
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store');
$assetVersion = (string) max(
    filemtime(__DIR__ . '/assets/app.js'),
    filemtime(__DIR__ . '/assets/live.js'),
    filemtime(__DIR__ . '/assets/styles.css'),
    filemtime(__DIR__ . '/assets/photos.js'),
    filemtime(__DIR__ . '/assets/admin.js'),
    filemtime(__DIR__ . '/assets/evolution.js'),
    filemtime(__DIR__ . '/assets/evolution.css'),
    filemtime(__DIR__ . '/assets/readability.css'),
    filemtime(__DIR__ . '/assets/messaging-layout.js'),
);
?>
<!doctype html>
<html lang="fr">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#153e32" />
        <title>CiviConnect Africa — Projets, développeurs et organisations</title>
        <meta name="description" content="Découvrez des projets numériques africains, trouvez des développeurs et exprimez les besoins de votre organisation. Construisez des solutions utiles ensemble." />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href="https://civiconnect.africa/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="CiviConnect Africa" />
        <meta property="og:title" content="CiviConnect Africa — Projets, développeurs et organisations" />
        <meta property="og:description" content="Découvrez des projets numériques africains, trouvez des développeurs et exprimez les besoins de votre organisation. Construisez des solutions utiles ensemble." />
        <meta property="og:url" content="https://civiconnect.africa/" />
        <meta property="og:image" content="https://civiconnect.africa/assets/community.jpg" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1080" />
        <meta property="og:image:height" content="602" />
        <meta property="og:image:alt" content="Une équipe réunie autour de ses ordinateurs pour construire des solutions numériques." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CiviConnect Africa — Projets, développeurs et organisations" />
        <meta name="twitter:description" content="Découvrez des projets numériques africains, trouvez des développeurs et exprimez les besoins de votre organisation. Construisez des solutions utiles ensemble." />
        <meta name="twitter:image" content="https://civiconnect.africa/assets/community.jpg" />
        <meta name="twitter:image:alt" content="Une équipe réunie autour de ses ordinateurs." />
        <script type="application/ld+json">{"@context": "https://schema.org", "@type": "WebSite", "@id": "https://civiconnect.africa/#website", "url": "https://civiconnect.africa/", "name": "CiviConnect Africa", "alternateName": "CiviConnect", "description": "Découvrez des projets numériques africains, trouvez des développeurs et exprimez les besoins de votre organisation. Construisez des solutions utiles ensemble.", "inLanguage": "fr"}</script>
        <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
        <link rel="stylesheet" href="assets/styles.css?v=<?= $assetVersion ?>" />
        <link rel="stylesheet" href="assets/evolution.css?v=<?= $assetVersion ?>" />
        <link rel="stylesheet" href="assets/readability.css?v=<?= $assetVersion ?>" />
        <link rel="stylesheet" href="assets/assistant.css?v=20261029-position1" />
        <link rel="stylesheet" href="assets/seo-home.css?v=20261031-1" />
        <link rel="stylesheet" href="assets/profile-updates.css?v=20261031-1" />
        <link rel="stylesheet" href="assets/chat-upgrade.css?v=20261030-bubbles1" />
    </head>
    <body>
        <a class="skip-link" href="#main">Aller au contenu</a>
        <div id="app">
            <!-- Présentation publique lisible sans JavaScript, remplacée par l’application au chargement. -->
            <div class="landing" id="initial-home">
                <header class="public-header">
                    <a class="brand" href="https://civiconnect.africa/" aria-label="CiviConnect Africa, accueil">
                        <img src="assets/favicon.svg" width="36" height="36" alt="" />
                        <span>CiviConnect <em>Africa</em></span>
                    </a>
                    <nav class="initial-navigation" aria-label="Navigation principale">
                        <a href="#projets">Les projets</a>
                        <a href="#developpeurs">Les talents</a>
                        <a href="#besoins">Les besoins</a>
                        <a href="#support">Aide et support</a>
                        <a class="btn" href="#connexion">Se connecter</a>
                        <a class="btn primary" href="#inscription">Créer un compte</a>
                    </nav>
                </header>
                <main id="main">
                    <section class="landing-hero" aria-labelledby="initial-title">
                        <div>
                            <span class="badge green">Le numérique au service de l’Afrique</span>
                            <h1 id="initial-title">Des talents connectés.<br />Des solutions<br /><em>qui changent la vie.</em></h1>
                            <p>La plateforme d’échange africaine, pour les devs, par les devs. Partagez vos projets, rencontrez d’autres développeurs et construisez ensemble des solutions utiles aux communautés.</p>
                            <div class="initial-actions">
                                <a class="btn primary" href="#projets">Découvrir les projets</a>
                                <a class="btn" href="#inscription">Rejoindre la communauté</a>
                            </div>
                        </div>
                        <div class="hero-photo">
                            <img src="assets/community.jpg" width="1080" height="602" fetchpriority="high" alt="Une équipe réunie autour de ses ordinateurs" />
                            <div class="photo-note"><div><strong>Un numérique utile, ensemble.</strong><small>Du talent à l’impact sur le terrain.</small></div></div>
                        </div>
                    </section>
                    <section class="public-section" aria-labelledby="initial-about">
                        <h2 id="initial-about">CiviConnect Africa rapproche les talents et les besoins.</h2>
                        <div class="grid-3 initial-features">
                            <article class="panel panel-pad"><h3>Partagez vos projets</h3><p class="prose">Présentez vos réalisations, vos technologies et les compétences recherchées pour faire avancer vos solutions numériques.</p><a class="text-link" href="#projets">Explorer les projets</a></article>
                            <article class="panel panel-pad"><h3>Rencontrez des développeurs</h3><p class="prose">Découvrez les profils de la communauté, trouvez des compétences complémentaires et proposez une collaboration.</p><a class="text-link" href="#developpeurs">Découvrir les talents</a></article>
                            <article class="panel panel-pad"><h3>Exprimez un besoin</h3><p class="prose">Associations, organisations et administrations peuvent présenter leurs besoins à la communauté pour identifier des solutions utiles.</p><a class="text-link" href="#besoins">Explorer les besoins</a></article>
                        </div>
                    </section>
                    <noscript><p class="notice initial-noscript">Cette présentation est accessible sans JavaScript. Activez JavaScript pour consulter les publications, créer un compte et utiliser la plateforme.</p></noscript>
                </main>
                <footer class="public-footer">CiviConnect Africa · Connecter. Créer. Transformer.</footer>
            </div>
        </div>
        <div id="modal-root"></div>
        <div id="toast-root" aria-live="polite" aria-atomic="true"></div>
        <script src="assets/app.js?v=<?= $assetVersion ?>-oct31" defer></script>
        <script src="assets/photos.js?v=<?= $assetVersion ?>-oct31" defer></script>
        <script src="assets/admin.js?v=<?= $assetVersion ?>" defer></script>
        <script src="assets/evolution.js?v=<?= $assetVersion ?>" defer></script>
        <script src="assets/live.js?v=<?= $assetVersion ?>-seo1" defer></script>
        <script src="assets/messaging-layout.js?v=<?= $assetVersion ?>" defer></script>
        <script src="assets/assistant.js?v=20261029-position1" defer></script>
    </body>
</html>
