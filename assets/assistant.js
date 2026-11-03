/* CiviConnect : assistant guidé local. Aucun appel réseau, aucune modification de compte. */
(() => {
    'use strict';
    if (document.getElementById('cc-help')) return;

    const topics = {
        profileStart: {
            "label": "Un profil clair en 4 étapes",
            "text": "1. Présentez votre métier ou votre parcours actuel, même si vous débutez.\n2. Indiquez quelques compétences que vous pouvez expliquer ou montrer.\n3. Décrivez une réalisation et votre contribution personnelle.\n4. Précisez le type de collaboration recherché.\n\nPréférez des phrases courtes et concrètes. Une expérience d’apprentissage peut être valorisée si vous la présentez comme telle.",
            "choices": [
                "bio",
                "skills",
                "profileCheck"
            ],
            "link": [
                "Compléter mon profil",
                "profil"
            ]
        },
        bio: {
            "label": "Rédiger ma présentation",
            "text": "Modèle à personnaliser :\n« Je suis [métier ou formation], basé(e) à [ville ou pays]. Je travaille avec [compétences]. J’ai réalisé [exemple concret], où j’ai contribué à [votre rôle]. Je souhaite participer à [type de projet]. »\n\nExemple fictif : « Je suis étudiante en développement web à Dakar. Je pratique PHP et MySQL. Pour un projet de formation, j’ai réalisé un formulaire de suivi des demandes. Je souhaite contribuer à des outils utiles aux associations. »\n\nRemplacez les éléments entre crochets par vos informations réelles. Ce guide ne rédige pas automatiquement votre profil à partir de vos messages.",
            "choices": [
                "developer",
                "designer",
                "engineer",
                "profileCheck"
            ]
        },
        skills: {
            "label": "Choisir mes compétences",
            "text": "Retenez les compétences utiles à vos contributions : PHP, MySQL, JavaScript, conception d’interfaces, tests ou gestion de projet, par exemple.\n\nDistinguez ce que vous pratiquez de ce que vous découvrez. Dans votre présentation, vous pouvez écrire : « Je pratique HTML/CSS et j’apprends JavaScript à travers un projet personnel. »\n\nÉvitez une longue liste d’outils que vous ne connaissez pas. Associez une compétence à une réalisation lorsque c’est possible.",
            "choices": [
                "portfolio",
                "bio",
                "profileCheck"
            ]
        },
        profileCheck: {
            "label": "Vérifier mon profil",
            "text": "Avant d’enregistrer, relisez ces points :\n• Mon nom et mon métier ou parcours sont compréhensibles.\n• Ma présentation explique ce que je peux apporter.\n• Mes compétences correspondent à mon niveau réel.\n• Les liens que je partage fonctionnent et sont consultables.\n• Ma photo, si j’en ajoute une, est nette et appropriée.\n• J’ai corrigé les fautes et retiré les informations confidentielles.\n\nAprès l’enregistrement, consultez votre profil pour vérifier le résultat. Je ne peux pas examiner automatiquement vos champs ni confirmer leur sauvegarde.",
            "choices": [
                "profileStart",
                "portfolio",
                "projects"
            ],
            "link": [
                "Ouvrir mon profil",
                "profil"
            ]
        },
        projectPlan: {
            "label": "Structurer mon projet",
            "text": "Une bonne présentation répond à six questions :\n1. Quel problème voulez-vous résoudre ?\n2. Qui rencontre ce problème ?\n3. Quelle solution proposez-vous ?\n4. Quelles fonctions existent déjà ?\n5. Quel est votre rôle et quelles technologies utilisez-vous ?\n6. Que reste-t-il à faire et quelle aide recherchez-vous ?\n\nAnnoncez clairement l’état réel : idée, prototype, en développement ou utilisable. Distinguez les fonctions disponibles des améliorations prévues.",
            "choices": [
                "projectExample",
                "projectTitle",
                "projectCheck"
            ]
        },
        projectTitle: {
            "label": "Trouver un titre précis",
            "text": "Associez un nom court à un usage compréhensible.\n\nExemples fictifs :\n• SunuCourrier — Suivi des courriers d’une association.\n• SamaStock — Gestion des fournitures d’un petit service.\n• DevMentor — Entraide entre développeurs débutants.\n\nDans la description, commencez par le problème et le public concerné. Évitez les promesses vagues comme « une application qui révolutionne tout ».",
            "choices": [
                "projectExample",
                "projectPlan"
            ]
        },
        projectExample: {
            "label": "Voir une description de projet",
            "text": "Exemple fictif à adapter :\n\n« Notre association suit ses fournitures sur papier, ce qui rend les quantités disponibles difficiles à connaître. SamaStock vise à centraliser ce suivi pour les agents responsables.\n\nLe prototype permet d’enregistrer les articles et les mouvements de stock. Il utilise PHP, MySQL et JavaScript. J’ai développé les formulaires et la base de données.\n\nLes exports sont prévus dans une prochaine étape. Nous recherchons une personne pour tester les parcours sur téléphone. »\n\nN’annoncez comme réalisées que les fonctions que vous avez effectivement testées.",
            "choices": [
                "projectCheck",
                "collaboration",
                "projectTitle"
            ]
        },
        projectCheck: {
            "label": "Avant de publier",
            "text": "Vérifiez votre présentation :\n• Le titre indique l’utilité du projet.\n• Le problème, le public et la solution sont expliqués.\n• L’état du projet et votre contribution sont précisés.\n• La catégorie correspond au domaine principal.\n• Les liens de démonstration et de dépôt, si fournis, fonctionnent.\n• Les captures sont lisibles et ne révèlent aucune donnée privée.\n• Les tâches proposées aux collaborateurs sont concrètes.\n\nRelisez puis utilisez le formulaire de votre espace. Si la publication est en attente, consultez son statut et les éventuelles remarques. Ce guide ne publie ni ne valide à votre place.",
            "choices": [
                "projectPlan",
                "collaboration",
                "support"
            ],
            "link": [
                "Voir les projets",
                "projets"
            ]
        },
        profile: {
            label: 'Compléter mon profil',
            text: 'Présentez votre métier, vos compétences et les problèmes que vous aimez résoudre. Ajoutez une photo adaptée et quelques réalisations. Choisissez un exemple ci-dessous : il est à personnaliser avec votre expérience réelle.',
            choices: ['profileStart', 'bio', 'skills', 'organisation'],
            link: ['Ouvrir mon profil', 'profil'],
        },
        developer: {
            label: 'Je suis développeur',
            text: 'Exemple à adapter : « Je développe des applications web avec [technologies maîtrisées]. Mon projet [nom] aide [public] à [objectif]. Je souhaite contribuer à des projets dans [domaines]. »\n\nDans Compétences, séparez vos technologies par des virgules. Ajoutez un projet avec une description et, si disponibles, les liens vers son dépôt et sa démonstration.',
            choices: ['portfolio', 'projects', 'collaboration'],
            link: ['Compléter mon profil', 'profil'],
        },
        designer: {
            label: 'Je suis designer',
            text: 'Exemple à adapter : « Je conçois des interfaces pour [public]. Je travaille sur [UX, UI, identité visuelle…] avec [outils maîtrisés]. Ma réalisation [nom] facilite [usage]. »\n\nPour votre portfolio, montrez le problème de départ, quelques écrans et les raisons de vos choix. Précisez votre contribution personnelle.',
            choices: ['portfolio', 'collaboration'],
            link: ['Compléter mon profil', 'profil'],
        },
        engineer: {
            label: 'Je suis ingénieur informatique',
            text: 'Exemple à adapter : « Mon domaine est [systèmes, réseaux, développement…]. J’ai travaillé sur [réalisation] pour améliorer [résultat]. Je peux contribuer sur [compétences concrètes]. »\n\nIndiquez vos domaines de maîtrise et votre rôle dans les projets. Ne publiez pas de mots de passe, de configurations confidentielles ou de données de clients.',
            choices: ['portfolio', 'collaboration'],
            link: ['Compléter mon profil', 'profil'],
        },
        organisation: {
            label: 'Je représente une organisation',
            text: 'Renseignez le nom, le type, le pays et une courte présentation de vos activités. L’adresse e-mail est celle du compte. Le site web, le téléphone, l’adresse précise et le responsable sont facultatifs.\n\nExemple : « [Nom] accompagne [public] dans [domaine]. Nous cherchons à améliorer [activité] grâce au numérique. »\n\nEnregistrez votre profil : les informations complètes seront disponibles pour validation par un administrateur.',
            choices: ['needs', 'validation'],
            link: ['Compléter mon profil', 'profil'],
        },
        portfolio: {
            label: 'Construire mon portfolio',
            text: 'Commencez par une ou deux réalisations bien expliquées. Pour chacune : problème rencontré, public visé, solution, votre rôle, technologies et résultat. Ajoutez une démonstration ou un dépôt si vous pouvez les partager.\n\nUn projet personnel ou d’apprentissage convient : précisez son état réel. Ne présentez pas un travail collectif comme entièrement personnel.',
            choices: ['projects', 'profile'],
            link: ['Voir les projets', 'projets'],
        },
        projects: {
            label: 'Présenter un projet',
            text: 'Choisissez un titre précis et expliquez : pour qui, quel problème, quelle solution et quelles fonctionnalités. Indiquez les technologies, l’état du projet et les liens disponibles.\n\nSi vous recherchez des collaborateurs, détaillez les compétences attendues et les tâches proposées. Depuis votre espace, utilisez le formulaire de publication ; une validation peut être nécessaire avant l’affichage public.',
            choices: ['projectPlan', 'projectExample', 'projectCheck', 'collaboration'],
            link: ['Explorer les projets', 'projets'],
        },
        needs: {
            label: 'Exprimer un besoin',
            text: 'Pour une organisation, décrivez le problème avant de demander un outil. Précisez les utilisateurs concernés, le résultat attendu, le délai et le budget s’ils sont connus.\n\nExemple : « Nous suivons les inscriptions sur papier. Nous souhaitons enregistrer les participants et exporter une liste. L’outil sera utilisé par deux agents. »\n\nDepuis votre espace organisation, publiez votre besoin avec les informations disponibles.',
            choices: ['organisation', 'collaboration', 'validation'],
            link: ['Voir les besoins', 'besoins'],
        },
        collaboration: {
            label: 'Collaborer et échanger',
            text: 'Ouvrez un projet ou un besoin et utilisez l’action de proposition lorsqu’elle est disponible pour votre profil. Présentez votre compétence, votre disponibilité et une contribution concrète.\n\nExemple : « Bonjour, je peux contribuer à [tâche]. J’ai réalisé [exemple] et je suis disponible [créneaux]. Pourrions-nous préciser les attentes ? »\n\nSuivez ensuite les échanges dans votre espace. L’assistant n’envoie aucun message à votre place.',
            choices: ['projects', 'needs', 'support'],
            link: ['Explorer les projets', 'projets'],
        },
        validation: {
            label: 'Comprendre la validation',
            text: 'Une organisation complète son profil puis un administrateur examine les informations. Une approbation administrative et la confirmation d’une adresse e-mail sont deux choses distinctes.\n\nChanger le téléphone, le site ou la présentation conserve l’approbation. Changer le nom, le type ou le pays déclenche une nouvelle validation. Si votre profil est à ajuster, lisez le retour puis enregistrez vos corrections. Pour une suspension, contactez le support.',
            choices: ['organisation', 'support'],
            link: ['Ouvrir mon profil', 'profil'],
        },
        password: {
            label: 'Mot de passe oublié',
            text: 'Sur la page de connexion, choisissez « Mot de passe oublié ». Si l’envoi des e-mails est disponible, suivez les instructions reçues. Sinon, utilisez le support.\n\nNe communiquez jamais votre mot de passe dans cet assistant ou dans un ticket. Je ne peux pas réinitialiser votre compte.',
            choices: ['support'],
            link: ['Aller à la connexion', 'connexion'],
        },
        support: {
            label: 'Contacter le support',
            text: 'Décrivez la page concernée, ce que vous vouliez faire et le message d’erreur exact. Précisez si vous utilisez un téléphone ou un ordinateur.\n\nN’envoyez ni mot de passe ni données confidentielles. Je suis un guide automatique : pour qu’un administrateur reçoive votre demande, ouvrez le support et envoyez-la depuis son formulaire.',
            choices: ['profile', 'validation', 'password'],
            link: ['Ouvrir le support', 'support'],
        },
    };

    const root = document.createElement('div');
    root.id = 'cc-help';
    // Masqué dès sa création : aucun flash pour les visiteurs.
    root.hidden = true;
    root.style.display = 'none';
    root.innerHTML = `
        <button type="button" class="cc-help-launch" aria-controls="cc-help-panel" aria-expanded="false" aria-label="Ouvrir l’assistant CiviConnect">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M11 4H8a5 5 0 0 0-5 5v5a5 5 0 0 0 5 5h1l4 3v-3h3a5 5 0 0 0 5-5v-2" />
                <path d="m18 2 1.2 3.8L23 7l-3.8 1.2L18 12l-1.2-3.8L13 7l3.8-1.2L18 2Z" />
                <path d="M7 12h5M7 15h8" />
            </svg>
            <span>Assistant</span>
        </button>
        <section id="cc-help-panel" role="dialog" aria-labelledby="cc-help-title" hidden>
            <header class="cc-help-head"><div><h2 id="cc-help-title">Votre guide CiviConnect</h2><p>Des conseils, étape par étape</p></div><button type="button" class="cc-help-close" aria-label="Fermer l’assistant">×</button></header>
            <p class="cc-help-note">Assistant guidé · réponses préparées, sans IA externe.</p>
            <div class="cc-help-log" role="log" aria-live="polite" aria-relevant="additions" tabindex="0" aria-label="Conseils de l’assistant"></div>
            <div class="cc-help-choices" aria-label="Sujets proposés"></div>
            <form class="cc-help-form"><label for="cc-help-question">Chercher un conseil</label><div><input id="cc-help-question" type="text" maxlength="200" autocomplete="off" placeholder="Ex. : profil, portfolio, besoin…"><button type="submit" aria-label="Chercher">→</button></div></form>
            <footer class="cc-help-foot"><button type="button" class="cc-help-reset">Recommencer</button><span>Échanges effacés au rechargement.</span></footer>
        </section>`;
    document.body.append(root);
    const launch = root.querySelector('.cc-help-launch');
    const panel = root.querySelector('#cc-help-panel');
    const log = root.querySelector('.cc-help-log');
    const choices = root.querySelector('.cc-help-choices');
    const input = root.querySelector('input');
    let opened = false;
    let replyTimer = null;
    let pending = false;

    function cancelReply() {
        clearTimeout(replyTimer);
        replyTimer = null;
        pending = false;
        root.querySelector('.cc-help-typing')?.remove();
        root.querySelectorAll('.cc-help-form button, .cc-help-choices button').forEach(button => {
            button.disabled = false;
        });
    }

    function prepareReply(writeReply) {
        if (pending || !opened || !shouldShow()) return;
        pending = true;
        const indicator = document.createElement('div');
        indicator.className = 'cc-help-typing';
        indicator.setAttribute('role', 'status');
        indicator.innerHTML = '<span>Préparation du conseil</span><span class="cc-help-dots" aria-hidden="true"><i></i><i></i><i></i></span>';
        log.append(indicator);
        log.scrollTop = log.scrollHeight;
        root.querySelectorAll('.cc-help-form button, .cc-help-choices button').forEach(button => {
            button.disabled = true;
        });
        // Transition visuelle uniquement : les réponses restent préparées localement.
        replyTimer = setTimeout(() => {
            cancelReply();
            if (opened && shouldShow()) writeReply();
        }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650);
    }

    // Lecture du rôle uniquement : aucune donnée du profil n’est copiée ou envoyée.
    function currentRole() {
        return typeof state !== 'undefined' && state.authenticated ? state.role : 'guest';
    }

    function append(text, user = false, link = null) {
        const message = document.createElement('div');
        message.className = user ? 'cc-help-message cc-help-user' : 'cc-help-message';
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        message.append(paragraph);
        if (link) {
            const anchor = document.createElement('a');
            const requiresLogin = link[1] === 'profil';
            anchor.href = '#' + (requiresLogin && currentRole() === 'guest' ? 'connexion' : link[1]);
            anchor.textContent = requiresLogin && currentRole() === 'guest' ? 'Se connecter pour compléter son profil' : link[0];
            anchor.addEventListener('click', () => toggle(false));
            message.append(anchor);
        }
        log.append(message);
        while (log.children.length > 12) log.firstElementChild.remove();
        log.scrollTop = log.scrollHeight;
    }

    function showChoices(keys) {
        choices.replaceChildren();
        keys.forEach(key => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = topics[key].label;
            button.addEventListener('click', () => {
                answer(key);
                choices.querySelector('button')?.focus({ preventScroll: true });
            });
            choices.append(button);
        });
    }

    function answer(key, question) {
        if (pending) return;
        const topic = topics[key];
        if (question !== false) append(question || topic.label, true);
        prepareReply(() => {
            append(topic.text, false, topic.link);
            showChoices(topic.choices);
        });
    }

    function reset() {
        cancelReply();
        log.replaceChildren();
        input.value = '';
        const role = currentRole();
        append(role === 'organisation'
            ? 'Bonjour ! Je peux vous aider à présenter votre organisation et à exprimer un besoin. Par où commencer ?'
            : 'Bonjour ! Je vous aide à présenter vos compétences, vos projets et à trouver comment participer. Choisissez un sujet ou saisissez quelques mots-clés.');
        showChoices(role === 'organisation'
            ? ['organisation', 'needs', 'validation', 'support']
            : ['profile', 'portfolio', 'projects', 'needs', 'collaboration', 'support']);
    }

    function toggle(value) {
        if (value && !shouldShow()) return;
        if (!value) cancelReply();
        opened = value;
        panel.hidden = !value;
        launch.setAttribute('aria-expanded', String(value));
        if (value) {
            reset();
            root.querySelector('.cc-help-close').focus();
        } else {
            launch.focus({ preventScroll: true });
        }
    }

    launch.addEventListener('click', () => toggle(!opened));
    root.querySelector('.cc-help-close').addEventListener('click', () => toggle(false));
    root.querySelector('.cc-help-reset').addEventListener('click', () => {
        reset();
        choices.querySelector('button')?.focus();
    });
    root.addEventListener('keydown', event => {
        if (event.key === 'Escape' && opened) {
            event.preventDefault();
            event.stopPropagation();
            toggle(false);
        }
    });
    root.querySelector('form').addEventListener('submit', event => {
        event.preventDefault();
        event.stopPropagation();
        if (pending) return;
        const question = input.value.trim();
        if (!question) return;
        input.value = '';
        const normalized = question.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const rules = [
            ['projectCheck', /avant.*publi|verifi.*projet|relire.*projet/],
            ['projectExample', /exemple.*projet|description.*projet|decrire.*projet/],
            ['projectTitle', /titre|nom.*projet/],
            ['profileCheck', /verifi.*profil|relire.*profil/],
            ['bio', /biographie|\bbio\b|rediger.*presentation|me presenter/],
            ['skills', /competence|debutant|debutante/],
            ['password', /mot de passe|connexion|connecter/],
            ['support', /support|erreur|bug|probleme technique/],
            ['validation', /valid|approuv|refus|suspend|confirmation|email|e-mail/],
            ['designer', /design|graphis|\bux\b|\bui\b/],
            ['engineer', /ingenieur|reseau|systeme/],
            ['needs', /besoin|budget|demande/],
            ['organisation', /organisation|association|entreprise|ong|administration/],
            ['portfolio', /portfolio|realisation/],
            ['collaboration', /collabor|message|contribu|echange/],
            ['projects', /projet|publier|publication/],
            ['developer', /developpeur|developpeuse/],
            ['profile', /profil|competence|photo|presentation/],
        ];
        const match = rules.find(([, pattern]) => pattern.test(normalized));
        if (match) answer(match[0], question);
        else {
            append(question, true);
            prepareReply(() => {
            append('Je n’ai pas de réponse préparée pour cette question. Essayez « profil », « projet » ou « besoin », ou contactez le support pour une demande particulière.');
            showChoices(['profile', 'projects', 'needs', 'support']);
            });
        }
    });

    function routeChanged() {
        root.classList.toggle('cc-help-messages', location.hash === '#messages');
        if (opened) toggle(false);
    }
    function isConnected() {
        return typeof state !== 'undefined' && state.authenticated === true;
    }

    function shouldShow() {
        // L’accueil reste sans assistant, même avec une session ouverte.
        const route = location.hash.slice(1).split('?')[0].replace(/^\/+|\/+$/g, '').toLowerCase();
        const publicEntry = ['', 'accueil', 'home', 'connexion', 'inscription'];
        return isConnected() && !publicEntry.includes(route);
    }

    let previousVisibility = null;
    function syncVisibility() {
        // Le bouton prend une vraie place dans l’en-tête : aucun recouvrement
        // du champ de rédaction, même après défilement ou au clavier mobile.
        const messaging = location.hash.slice(1).split('/')[0].split('?')[0] === 'messages';
        const dock = messaging
            ? document.querySelector('.chat-head, .conversation-list-head')
            : null;
        // Privilégier l’en-tête de la discussion lorsqu’elle existe.
        const destination = messaging
            ? document.querySelector('.chat-head') || dock || document.body
            : document.body;
        if (root.parentElement !== destination) destination.append(root);
        root.classList.toggle('cc-help-docked', messaging && destination !== document.body);
        root.classList.toggle('cc-help-messages', messaging);
        const visible = shouldShow();
        if (visible === previousVisibility) return;
        previousVisibility = visible;
        root.hidden = !visible;
        root.style.display = visible ? '' : 'none';
        if (!visible) {
            cancelReply();
            // Fermer et effacer les échanges sans déplacer le focus vers un bouton masqué.
            opened = false;
            panel.hidden = true;
            launch.setAttribute('aria-expanded', 'false');
            log.replaceChildren();
            choices.replaceChildren();
            input.value = '';
        }
    }

    // L’application réaffiche #app après le chargement de session,
    // la connexion et la déconnexion. L’assistant suit cet état réel.
    const app = document.getElementById('app');
    if (app) {
        new MutationObserver(syncVisibility).observe(app, {
            childList: true,
            subtree: true,
        });
    }
    window.addEventListener('hashchange', () => {
        syncVisibility();
        if (isConnected()) routeChanged();
    });
    syncVisibility();
    routeChanged();
})();
