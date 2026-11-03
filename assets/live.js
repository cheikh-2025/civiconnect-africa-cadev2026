// Application réelle. Les données sont lues et modifiées uniquement par l’API PHP.
// 1. Communication avec l’API et gestion des erreurs.
async function api(action, data, applyData = true) {
    const opts = { credentials: 'same-origin', headers: { Accept: 'application/json' } };
    if (data !== undefined) {
        opts.method = 'POST';
        opts.headers['Content-Type'] = 'application/json';
        opts.headers['X-CSRF-Token'] = state.csrf || '';
        opts.body = JSON.stringify(data);
    }
    let r, j;
    try {
        r = await fetch('api.php?action=' + encodeURIComponent(action), opts);
        j = await r.json();
    } catch {
        throw new Error(
            'La connexion au serveur est interrompue. Réessayez dans quelques instants.',
        );
    }
    if (!r.ok || !j.success) {
        const e = new Error(j.message || 'Cette action n’a pas pu être effectuée.');
        e.fields = j.fields || {};
        e.status = r.status;
        throw e;
    }
    if (j.data && applyData) {
        state = j.data;
        roles.admin = state.isSuperAdmin ? 'Super administrateur' : 'Administrateur';
    }
    return j;
}
async function refresh() {
    let old = document.querySelector('.chat-composer input'),
        draft = old?.value,
        focused = old && document.activeElement === old,
        pos = old?.selectionStart;
    const previousPage = current().page;
    const previousChat = document.getElementById('chat-messages');
    const previousScroll = previousChat?.scrollTop || 0;
    const readingHistory = previousChat && previousChat.scrollHeight - previousChat.clientHeight - previousChat.scrollTop > 48;
    const previousConversation = ui.conversation;
    const listScroll = document.querySelector('.conversation-list')?.scrollTop || 0;
    const refreshed = await api('bootstrap', undefined, false);
    if (ui.busy) return;
    state = refreshed.data;
    roles.admin = state.isSuperAdmin ? 'Super administrateur' : 'Administrateur';
    old = document.querySelector('.chat-composer input');
    draft = old?.value;
    focused = old && document.activeElement === old;
    pos = old?.selectionStart;
    if (previousPage !== current().page || (previousPage === 'messages' && previousConversation !== ui.conversation)) return;
    render();
    const updatedChat = document.getElementById('chat-messages');
    if (updatedChat && readingHistory && previousConversation === ui.conversation) {
        updatedChat.scrollTop = previousScroll;
    }
    const updatedList = document.querySelector('.conversation-list');
    if (updatedList) updatedList.scrollTop = listScroll;
    const f = document.querySelector('.chat-composer input');
    if (f && draft) {
        f.value = draft;
    }
    if (f && focused) {
        f.focus({ preventScroll: true });
        if (typeof pos === 'number') {
            f.setSelectionRange(pos, pos);
        }
    }
}
async function actionTask(fn) {
    if (ui.busy) {
        return;
    }
    ui.busy = true;
    try {
        await fn();
    } catch (e) {
        toast(e.message, true);
        if (e.status === 401) {
            await refresh();
            go('connexion');
        }
    } finally {
        ui.busy = false;
    }
}
function logoutForm(label = 'Se déconnecter', full = false) {
    return `
        <form action="logout.php" method="post" class="logout-form ${full ? 'full-btn' : ''}">
            <input type="hidden" name="csrf" value="${esc(state.csrf)}" />
            <button type="submit" class="btn ${full ? 'full-btn' : 'sm'}">
                ${icon('logOut', 14)}${label}
            </button>
        </form>
    `;
}
// 2. Navigation et écrans de l’application.
function shell(content, page) {
    const publicNav = publicHeader();
    if (!state.authenticated) {
        return (
            publicNav +
            `
                <main id="main" class="public-section" tabindex="-1">${content}</main>
            `
        );
    }
    const nav = [
        ['dashboard', 'grid', 'Tableau de bord'],
        ['projets', 'layers', 'Projets'],
        ['developpeurs', 'users', 'Annuaire des talents'],
        ['besoins', 'briefcase', 'Besoins & opportunités'],
        ['collaborations', 'link', 'Collaborations'],
        ['messages', 'message', 'Messagerie'],
    ];
    if (state.role === 'organisation') {
        nav.splice(1, 0, ['mes-besoins', 'briefcase', 'Mes besoins']);
    } else if (state.role === 'developer') {
        nav.splice(1, 0, ['mes-projets', 'layers', 'Mes projets']);
    }
    if (state.role === 'admin') {
        nav.push(['administration', 'shield', 'Administration']);
    }
    const unread = state.conversations.reduce((n, c) => n + c.unread, 0),
        notifications = state.notificationUnreadCount ?? state.notifications.filter((n) => !Number(n.is_read)).length;
    return `
        <div class="mobile-overlay ${ui.mobile ? 'open' : ''}" data-action="close-menu"></div>
        <aside class="sidebar ${ui.mobile ? 'open' : ''}" aria-label="Navigation principale">
            ${brand()}
            <div class="workspace-card">
                <span class="workspace-icon">${icon(
                    state.role === 'organisation'
                        ? 'building'
                        : state.role === 'admin'
                          ? 'shield'
                          : 'code',
                    17,
                )}</span>
                <div>
                    <strong>Espace ${roles[state.role].toLowerCase()}</strong>
                    <small>Connecter. Créer. Transformer.</small>
                </div>
            </div>
            <p class="nav-label">Mon espace</p>
            <nav class="nav">${nav
                .map(
                    ([id, ic, label]) => `
        <a href="#${id}" class="${page === id || (page === 'projet' && id === 'projets') ? 'active' : ''}" ${page === id ? 'aria-current="page"' : ''}>
            ${icon(ic, 17)}${label}${
                id === 'messages' && unread
                    ? `
        <span class="count">${unread}</span>
    `
                    : ''
            }
        </a>
    `,
                )
                .join('')}</nav>
            <div class="nav-secondary">
                <p class="nav-label">Votre compte</p>
                <nav class="nav">
                    <a href="#profil" class="${page === 'profil' ? 'active' : ''}">
                        ${icon('settings', 17)}Profil & paramètres
                    </a>
                    <a href="#support" class="${page === 'support' ? 'active' : ''}">${icon('message', 17)}Aide et support</a>
                    <a href="#aide" class="${page === 'aide' ? 'active' : ''}">
                        ${icon('book', 17)}Guide d’utilisation
                    </a>
                </nav>
            </div>
            <div class="sidebar-bottom">
                <div class="private-card">
                    <div class="row">${icon('leaf', 14)}Un numérique utile.</div>
                    <p>Des idées et des talents au service des territoires.</p>
                    <a href="#accueil">Découvrir CiviConnect ${icon('arrow', 12)}</a>
                </div>
                <div class="user-card">
                    ${avatar(state.profile.initials, '', '', state.profile.avatarUrl)}
                    <div>
                        <strong>${esc(state.profile.name)}</strong>
                        <small>${roles[state.role]}</small>
                    </div>
                </div>
                <div style="margin-top: 12px">${logoutForm('Se déconnecter', true)}</div>
            </div>
        </aside>
        <div class="shell">
            <header class="topbar">
                <button
                    class="icon-btn mobile-menu"
                    data-action="menu"
                    aria-label="Ouvrir la navigation"
                    aria-expanded="${ui.mobile}"
                >
                    ${icon('menu', 18)}
                </button>
                <div class="breadcrumb">
                    <span>Mon espace</span>
                    ${icon('chevron', 12)}
                    <span>${pageTitles[page] || 'CiviConnect'}</span>
                </div>
                <form class="top-search" data-form="global-search">
                    ${icon('search', 14)}
                    <input aria-label="Rechercher un projet" name="q" placeholder="Rechercher un projet…" />
                </form>
                <div class="top-actions">
                    <span class="muted" style="font-size: 10px">${roles[state.role]}</span>
                    <button class="icon-btn" data-action="refresh" aria-label="Actualiser les données">
                        ${icon('refresh', 17)}
                    </button>
                    <button
                        class="icon-btn notification-button"
                        data-action="notifications"
                        aria-label="${notifications} notifications non lues"
                    >
                        ${icon('bell', 26)}${
                            notifications
                                ? `
        <span class="notification-count" aria-hidden="true">${notifications > 99 ? '99+' : notifications}</span>
    `
                                : ''
                        }
                    </button>
                    <a href="#profil" aria-label="Mon profil">${avatar(state.profile.initials, '', '', state.profile.avatarUrl)}</a>
                </div>
            </header>
            <main id="main" class="main" tabindex="-1">
                ${content}
                <footer class="page-footer">
                    <span>
                        © ${new Date().getFullYear()} CiviConnect Africa · Un numérique utile, ensemble.
                    </span>
                    <span>${icon('shield', 11)}Espace personnel</span>
                </footer>
            </main>
        </div>
    `;
}
function metrics(items) {
    return `
        <div class="metrics">${items
            .map(
                ([label, value, ic, note, route]) => `
        <${route ? 'a' : 'div'} class="panel metric" ${route ? `href="#${route}" style="color: inherit; text-decoration: none"` : ''}>
            <div class="metric-head">
                <span>${label}</span>
                <span class="metric-icon">${icon(ic, 17)}</span>
            </div>
            <div class="metric-value">${value}</div>
            <p class="metric-foot">${note}${route ? ' · Voir →' : ''}</p>
        </${route ? 'a' : 'div'}>
    `,
            )
            .join('')}</div>
    `;
}
function dashboard() {
    const org = state.role === 'organisation',
        admin = state.role === 'admin',
        mine = state.projects.filter((p) => p.mine),
        needs = state.needs.filter((n) => n.mine);
    const stats = admin
        ? [
              ['Développeurs', state.accounts.length, 'users', 'Comptes enregistrés'],
              ['Organisations', state.organisations.length, 'building', 'Structures inscrites'],
              [
                  'Projets publiés',
                  state.projects.filter((p) => p.status === 'Publié').length,
                  'layers',
                  'Solutions au catalogue',
              ],
              [
                  'À examiner',
                  state.organisations.filter((o) => o.status === 'En attente').length +
                      state.projects.filter((p) => p.status === 'En validation').length,
                  'clock',
                  'Organisations et publications',
              ],
          ]
        : org
          ? [
                ['Mes besoins', needs.length, 'briefcase', 'Publications de votre organisation', 'mes-besoins'],
                [
                    'Collaborations',
                    state.collaborations.length,
                    'link',
                    'Demandes reçues et envoyées',
                ],
                [
                    'Projets sauvegardés',
                    state.favorites.length,
                    'bookmark',
                    'Votre sélection personnelle',
                ],
                [
                    'Messages non lus',
                    state.conversations.reduce((n, c) => n + c.unread, 0),
                    'message',
                    'Dans vos conversations',
                ],
            ]
          : [
                [
                    'Mes projets',
                    mine.length,
                    'layers',
                    `${mine.filter((p) => p.status === 'Publié').length} publié(s)`,
                    'mes-projets',
                ],
                [
                    'Collaborations',
                    state.collaborations.length,
                    'link',
                    'Vos échanges et propositions',
                ],
                [
                    'Vues sur mes projets',
                    mine.reduce((n, p) => n + p.views, 0),
                    'eye',
                    'Consultations uniques par session',
                ],
                [
                    'Messages non lus',
                    state.conversations.reduce((n, c) => n + c.unread, 0),
                    'message',
                    'Dans vos conversations',
                ],
            ];
    const pending = org && state.profile.status !== 'verified';
    const selection = admin
        ? state.projects.filter((p) => p.status === 'En validation')
        : org
          ? state.projects.filter((p) => state.favorites.includes(p.id))
          : mine;
    return `
        <p class="date-note">${icon('calendar', 12)}${new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })}</p>
        ${heading(
            'Bonjour, ' + esc(state.profile.name.split(' ')[0]) + '.',
            'Votre espace pour construire de nouvelles collaborations.',
            admin
                ? `
        <a class="btn primary" href="#administration">Ouvrir l’administration</a>
    `
                : button(
                      org ? 'Exprimer un besoin' : 'Nouveau projet',
                      org ? 'new-need' : 'new-project',
                      'primary',
                      'plus',
                  ),
        )}${
            pending
                ? `
        <div class="notice orange" style="margin-bottom: 22px">
            ${icon('clock', 17)}${
                state.profile.status === 'pending'
                    ? 'Votre organisation est en attente de vérification. Vous pouvez consulter les projets ; l’administrateur activera la publication et les demandes de collaboration.'
                    : 'Votre organisation n’a pas été validée. Contactez l’administration pour connaître la suite à donner.'
            }
        </div>
    `
                : ''
        }
        <section class="welcome-banner">
            <div>
                <p class="eyebrow">Des talents. Des solutions. De l’impact.</p>
                <h2>
                    Votre prochaine idée peut
                    <br />
                    <em>faire la différence.</em>
                </h2>
                <p>
                    Transformez les compétences et les besoins du terrain en solutions concrètes pour les
                    communautés.
                </p>
            </div>
            <div class="banner-actions">
                <a class="btn light" href="#${org ? 'developpeurs' : 'besoins'}">
                    ${org ? 'Rencontrer les talents' : 'Explorer les opportunités'}${icon('arrow', 14)}
                </a>
                <small>${icon('spark', 11)}Construisons un numérique utile.</small>
            </div>
        </section>
        ${metrics(stats)}
        <div class="dashboard-grid">
            <div class="dashboard-left">
                ${org ? `<section class="panel">
                    <div class="panel-head">
                        <div><h2>Mes besoins</h2><p>Retrouvez vos publications et leur statut.</p></div>
                        ${link('Voir tous mes besoins', 'mes-besoins')}
                    </div>
                    <div class="panel-pad">${needs.length
                        ? needs.slice(0, 3).map(n => `<div class="panel-pad">
                            <h3>${esc(n.title)}</h3>${badge(n.status)}
                            ${button('Consulter', 'need-detail', '', 'arrow', `data-id="${n.id}"`)}
                        </div>`).join('')
                        : '<p class="prose">Aucun besoin publié pour le moment. Utilisez « Exprimer un besoin » pour commencer.</p>'}
                    </div>
                </section>` : ''}
                <section class="panel">
                    <div class="panel-head">
                        <div>
                            <h2>${
                                admin
                                    ? 'Publications à examiner'
                                    : org
                                      ? 'Votre sélection de projets'
                                      : 'Mes projets'
                            }</h2>
                            <p>Des idées à faire avancer, ensemble.</p>
                        </div>
                        ${link('Tout voir', admin ? 'administration' : org ? 'projets' : 'mes-projets')}
                    </div>
                    ${
                        selection.slice(0, 4).map(projectMini).join('') ||
                        `
        <div class="panel-pad"><p class="prose">${
            admin
                ? 'Aucune publication en attente.'
                : org
                  ? 'Sauvegardez des projets depuis le catalogue pour les retrouver ici.'
                  : 'Votre premier projet commence ici. Présentez votre idée pour la faire découvrir.'
        }</p></div>
    `
                    }
                </section>
                <section class="panel">
                    <div class="panel-head">
                        <h2>Dernières collaborations</h2>
                        ${link('Tout voir', 'collaborations')}
                    </div>
                    ${
                        state.collaborations
                            .slice(0, 3)
                            .map(
                                (c) =>
                                    `
                        <a class="project-mini" href="#collaborations">
                            ${avatar(c.initials, '', '', c.avatarUrl)}
                            <div>
                                <h3>${esc(c.name)}</h3>
                                <p>${esc(c.project)}</p>
                            </div>
                            ${badge(c.status)}
                        </a>
                    `,
                            )
                            .join('') ||
                        `
            <div class="panel-pad prose">Vos premières collaborations apparaîtront ici.</div>
        `
                    }
                </section>
            </div>
            <div class="dashboard-right">
                <section class="panel">
                    <div class="panel-head">
                        <h2>Activité récente</h2>
                        ${icon('clock', 16)}
                    </div>
                    <ul class="activity">
                        ${
                            state.notifications
                                .slice(0, 4)
                                .map(
                                    (n) =>
                                        `
                        <li>
                            <span class="activity-icon">${icon('bell', 13)}</span>
                            <div>
                                <strong>${esc(n.title)}</strong>
                                <p>${esc(n.body)}</p>
                                <small>${esc(n.created_at)}</small>
                            </div>
                        </li>
                    `,
                                )
                                .join('') ||
                            `
            <li><span class="activity-icon"></span></li>
        ` +
                                icon('leaf', 13) +
                                `
                </span>
                <div>
                <strong>Bienvenue dans CiviConnect.</strong>
                <p>Votre activité commencera avec votre première publication ou votre premier échange.</p>
                </div>
                </li>
            `
                        }
                    </ul>
                </section>
                <section class="profile-progress">
                    <span class="eyebrow">Votre profil</span>
                    <h3>Faites-vous connaître.</h3>
                    <p>Un profil clair aide vos futurs partenaires à comprendre ce que vous construisez.</p>
                    <div class="spacer"></div>
                    <a class="btn" href="#profil">Compléter mon profil ${icon('arrow', 13)}</a>
                </section>
            </div>
        </div>
    `;
}
// Actions communes à l’en-tête et à l’appel à collaboration de la fiche.
function projectDetailAction(project) {
    const own = project.mine && state.role === 'developer';
    if (own) {
        return button(
            'Modifier mon projet',
            'edit-project',
            'primary',
            'edit',
            `data-id="${project.id}"`,
        );
    }
    if (state.role === 'admin') {
        return project.status === 'En validation'
            ? button(
                  'Examiner le projet',
                  'review-project',
                  'primary',
                  'shield',
                  `data-id="${project.id}"`,
              )
            : '';
    }
    const collaboration = state.collaborations.find(
        (item) => item.projectId === project.id && !item.incoming && item.status !== 'Refusée',
    );
    if (collaboration) {
        return button(
            collaboration.status === 'Acceptée' ? 'Poursuivre l’échange' : 'Voir ma demande',
            'collab-message',
            'primary',
            'message',
            `data-id="${collaboration.id}"`,
        );
    }
    if (project.status !== 'Publié') {
        return '';
    }
    if (!state.authenticated) {
        return '<a class="btn primary" href="#connexion">Se connecter pour échanger</a>';
    }
    if (state.role === 'organisation' && state.profile.status !== 'verified') {
        return '<a class="btn" href="#profil">Vérification de votre organisation en attente</a>';
    }
    if (
        state.role === 'organisation' ||
        (state.role === 'developer' && project.seekingCollaborators)
    ) {
        return button(
            state.role === 'developer' ? 'Proposer ma contribution' : 'Demander une collaboration',
            'request-collab',
            'primary',
            'link',
            `data-id="${project.id}"`,
        );
    }
    return '';
}

function projectResources(project, own) {
    const links = [
        [
            'demo_url',
            'globe',
            'Essayer la démonstration',
            'Ouvrir la solution dans un nouvel onglet.',
        ],
        [
            'github_url',
            'code',
            'Explorer le code source',
            'Consulter le dépôt partagé par son auteur.',
        ],
    ].filter(([key]) => /^https?:\/\//i.test(project[key] || ''));
    return `
        <section class="panel project-resources" aria-labelledby="project-resources-title">
            <div class="project-resource-banner">
                <span class="project-symbol">${icon('layers', 25)}</span>
                <div>
                    <p class="eyebrow">Découvrir la solution</p>
                    <h2 id="project-resources-title">${esc(project.title)}</h2>
                    <p>La démonstration et le code partagés par le développeur.</p>
                </div>
            </div>
            <div class="panel-pad">
                ${
                    links.length
                        ? `
                    <div class="project-resource-links">
                        ${links
                            .map(
                                ([key, symbol, label, help]) => `
                            <a class="project-resource-link" href="${esc(project[key])}"
                                target="_blank" rel="noopener noreferrer">
                                <span class="resource-icon">${icon(symbol, 20)}</span>
                                <span><strong>${label}</strong><small>${help}</small></span>
                                ${icon('arrow', 16)}
                            </a>
                        `,
                            )
                            .join('')}
                    </div>
                `
                        : `
                    <div class="project-links-empty">
                        ${icon('globe', 24)}
                        <div>
                            <h3>Les liens arrivent bientôt.</h3>
                            <p class="prose">${
                                own
                                    ? 'Ajoutez le lien de votre démonstration ou de votre dépôt dans « Modifier mon projet ».'
                                    : 'Le développeur n’a pas encore partagé de lien vers une démonstration ou un dépôt.'
                            }</p>
                        </div>
                    </div>
                `
                }
            </div>
        </section>
    `;
}

function detail(id) {
    const project = state.projects.find((item) => item.id === id);
    if (!project) {
        return empty(
            'Ce projet est introuvable',
            'Il n’est peut-être pas encore publié.',
            'all-projects',
            'Voir les projets',
        );
    }
    const own = project.mine && state.role === 'developer';
    const developer = state.developers.find((item) => item.id === project.ownerId);
    const locationLabel = [project.city, project.country].filter(Boolean).join(', ');
    const saved = state.favorites.includes(project.id);
    const createdAt = /^\d{4}-\d{2}-\d{2}$/.test(project.createdAt || '')
        ? new Date(project.createdAt + 'T12:00:00').toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          })
        : '';
    const otherProjects = state.projects
        .filter(
            (item) =>
                item.ownerId === project.ownerId &&
                item.id !== project.id &&
                item.status === 'Publié',
        )
        .slice(0, 2);
    const action = projectDetailAction(project);

    return `
        <a class="text-link project-back" href="#projets">
            ${icon('back', 14)}Retour aux projets
        </a>
        <section class="panel detail-header project-detail-header">
            <div class="row project-identity">
                <span class="project-symbol ${project.color}">
                    ${icon(project.category === 'Administration' ? 'file' : 'layers', 29)}
                </span>
                <div>
                    <div class="tags project-heading-tags">
                        ${badge(domainLabel(project), 'gray')}${badge(project.status)}
                    </div>
                    <h1>${esc(project.title)}</h1>
                    <p>Une solution de ${esc(project.owner)}${locationLabel ? ' · ' + esc(locationLabel) : ''}</p>
                </div>
            </div>
            <div class="project-detail-actions">
                <button class="icon-btn ${saved ? 'saved' : ''}"
                    data-action="favorite" data-id="${project.id}"
                    aria-label="${saved ? 'Retirer ce projet des favoris' : 'Sauvegarder ce projet'}"
                    aria-pressed="${saved}">
                    ${icon('bookmark', 18)}
                </button>
                ${action}
            </div>
        </section>
        ${project.mine && project.reviewNote ? `<div class="notice orange">Correction demandée : ${esc(project.reviewNote)} <a class="text-link" href="#support">Contacter le support</a></div>` : ''}
        ${
            project.status !== 'Publié'
                ? `
            <p class="notice orange project-publication-note">
                ${icon('eye', 17)}
                ${
                    project.status === 'En validation'
                        ? 'Ce projet attend la validation d’un administrateur. Il est visible uniquement par son auteur et l’administration.'
                        : 'Ce brouillon est visible uniquement par son auteur et l’administration. Envoyez-le en validation pour le publier.'
                }
            </p>
        `
                : ''
        }
        <div class="detail-layout project-detail-layout">
            <div class="stack project-detail-main">
                <section class="panel panel-pad" aria-labelledby="project-presentation-title">
                    <p class="eyebrow project-section-eyebrow">Le projet</p>
                    <h2 id="project-presentation-title">Une idée, un impact concret.</h2>
                    <div class="prose project-description">${projectDescription(project.description)}</div>
                </section>
                ${projectResources(project, own)}
                <section class="panel panel-pad" aria-labelledby="project-technologies-title">
                    <div class="project-section-heading">
                        <span class="resource-icon">${icon('code', 20)}</span>
                        <div>
                            <h2 id="project-technologies-title">Technologies & compétences</h2>
                            <p class="prose">Les outils utilisés pour construire cette solution.</p>
                        </div>
                    </div>
                    ${project.skills.length ? tags(project.skills) : '<p class="prose">Les technologies ne sont pas encore renseignées.</p>'}
                </section>
                ${
                    project.seekingCollaborators
                        ? `
                    <section class="panel panel-pad project-recruitment" aria-labelledby="project-recruitment-title">
                        <p class="eyebrow">Construire entre développeurs</p>
                        <h2 id="project-recruitment-title">Ce projet recherche des collaborateurs.</h2>
                        <p class="prose">${
                            own
                                ? 'Présentez les compétences dont vous avez besoin. Les développeurs pourront vous proposer leur contribution après publication.'
                                : 'Envie de faire avancer cette idée ? Présentez vos compétences et la contribution que vous souhaitez apporter.'
                        }</p>
                        ${project.wantedSkills?.length ? tags(project.wantedSkills) : '<p class="prose">Échangez avec son auteur pour préciser les contributions possibles.</p>'}
                        ${action ? `<div class="project-recruitment-action">${action}</div>` : ''}
                    </section>
                `
                        : ''
                }
            </div>
            <aside class="stack project-detail-aside" aria-label="Auteur et informations du projet">
                <section class="panel panel-pad project-author">
                    <p class="eyebrow project-section-eyebrow">Derrière la solution</p>
                    <h2>Le développeur</h2>
                    <div class="row project-author-identity">
                        ${avatar(project.initials, '', 'lg', project.avatarUrl)}
                        <div>
                            <h3>${esc(project.owner)}</h3>
                            ${developer?.specialty ? `<p class="prose">${esc(developer.specialty)}</p>` : ''}
                            ${developer ? badge(developer.available ? 'Disponible pour collaborer' : 'Indisponible actuellement', developer.available ? 'green' : 'gray') : ''}
                        </div>
                    </div>
                    ${developer?.bio ? `<p class="prose project-author-bio">${esc(developer.bio)}</p>` : ''}
                    ${locationLabel ? `<p class="project-author-location">${icon('pin', 14)}${esc(locationLabel)}</p>` : ''}
                    ${
                        own
                            ? '<a class="btn" href="#profil">Consulter mon profil</a>'
                            : developer
                              ? button(
                                    'Voir le profil du développeur',
                                    'developer-detail',
                                    '',
                                    'user',
                                    `data-id="${project.ownerId}"`,
                                )
                              : '<p class="prose">Le profil public de cet auteur est indisponible.</p>'
                    }
                </section>
                <section class="panel panel-pad">
                    <h2>En quelques mots</h2>
                    <dl class="project-facts">
                        <div class="detail-stat"><dt>Secteur</dt><dd>${esc(domainLabel(project))}</dd></div>
                        <div class="detail-stat"><dt>Consultations</dt><dd>${project.views}</dd></div>
                        <div class="detail-stat"><dt>Statut</dt><dd>${badge(project.status)}</dd></div>
                        ${locationLabel ? `<div class="detail-stat"><dt>Localisation</dt><dd>${esc(locationLabel)}</dd></div>` : ''}
                        ${createdAt ? `<div class="detail-stat"><dt>Ajouté le</dt><dd><time datetime="${esc(project.createdAt)}">${esc(createdAt)}</time></dd></div>` : ''}
                        <div class="detail-stat"><dt>Contributions de développeurs</dt><dd>${project.seekingCollaborators ? 'Ouvertes' : 'Non recherchées'}</dd></div>
                    </dl>
                </section>
                ${
                    otherProjects.length
                        ? `
                    <section class="panel panel-pad project-other-projects">
                        <h2>Du même développeur</h2>
                        ${otherProjects
                            .map(
                                (item) => `
                            <a class="project-related-link" href="#projet/${item.id}">
                                <span class="project-symbol ${item.color}">${icon('layers', 18)}</span>
                                <span><strong>${esc(item.title)}</strong><small>${esc(domainLabel(item))}</small></span>
                                ${icon('arrow', 14)}
                            </a>
                        `,
                            )
                            .join('')}
                    </section>
                `
                        : ''
                }
            </aside>
        </div>
    `;
}
function settings() {
    const p = state.profile;
    return (
        heading(
            'Un profil qui vous ressemble.',
            'Présentez votre activité et choisissez vos préférences.',
        ) +
        `
            <div class="settings-layout">
                <nav class="panel settings-menu">${[
                    ['profile', 'Mon profil'],
                    ['notifications', 'Notifications'],
                    ['account', 'Connexion et sécurité'],
                ]
                    .map(
                        ([id, label]) =>
                            `
                        <button
                            data-action="settings-tab"
                            data-id="${id}"
                            class="${ui.settingsTab === id ? 'active' : ''}"
                        >
                            ${label}
                        </button>
                    `,
                    )
                    .join('')}</nav>
                <section class="panel panel-pad">${
                    ui.settingsTab === 'profile'
                        ? `
                    ${photoForm()}
                    ${state.role === 'organisation' ? organisationDossierStatus(p) : ''}
                    <div class="divider"></div>
                    <form data-form="profile" novalidate>
                        <div class="row" style="margin-bottom: 24px">
                            ${avatar(p.initials, '', 'lg', p.avatarUrl)}
                            <div>
                                <h2>${esc(p.name)}</h2>
                                <p class="prose">${esc(p.email)}</p>
                            </div>
                        </div>
                        <div class="form-grid">
                            ${field('Nom affiché', 'name', p.name, 'text', true)}${field('Ville', 'city', p.city)}${field('Pays', 'country', p.country)}${
                                state.role === 'organisation'
                                    ? organisationProfileFields(p)
                                    : field(
                                          'Votre spécialité',
                                          'specialty',
                                          p.specialty,
                                          'text',
                                          true,
                                      )
                            }${
                                state.role === 'developer'
                                    ? field(
                                          'Compétences',
                                          'skills',
                                          p.skills,
                                          'text',
                                          true,
                                          'Séparez les compétences par une virgule.',
                                      )
                                    : `
                    <input type="hidden" name="skills" value="" />
                `
                            }
                            <div class="field full">
                                <label for="f-bio">Présentation</label>
                                <textarea class="input" id="f-bio" name="bio" maxlength="1500">${esc(p.bio)}</textarea>
                            </div>
                        </div>
                        ${
                            state.role === 'developer'
                                ? `
                    <div class="switch-row">
                        <div>
                            <strong>Disponible pour collaborer</strong>
                            <p>Affichez votre disponibilité dans l’annuaire.</p>
                        </div>
                        <input
                            class="switch"
                            type="checkbox"
                            name="available"
                            aria-label="Disponible pour collaborer"
                            ${p.available ? 'checked' : ''}
                        />
                    </div>
                `
                                : ''
                        }
                        <div class="form-actions">
                            <button class="btn primary" type="submit">Enregistrer les modifications</button>
                        </div>
                    </form>
                `
                        : ui.settingsTab === 'notifications'
                          ? `
                      <form data-form="preferences">
                          <h2>Vos préférences</h2>
                          <p class="prose" style="margin: 10px 0">
                              Choisissez les catégories affichées dans votre centre de notifications.
                          </p>
                          ${[
                              ['collabs', 'Collaborations'],
                              ['messages', 'Messages'],
                          ]
                              .map(
                                  ([id, label]) =>
                                      `
                                    <div class="switch-row">
                                        <label for="pref-${id}">${label}</label>
                                        <input
                                            class="switch"
                                            type="checkbox"
                                            id="pref-${id}"
                                            name="${id}"
                                            ${state.preferences[id] !== false ? 'checked' : ''}
                                        />
                                    </div>
                                `,
                              )
                              .join('')}
                          <div class="form-actions"><button class="btn primary" type="submit">Enregistrer</button></div>
                      </form>
                  `
                          : `
                      <form data-form="password" novalidate>
                          <h2>Changer mon mot de passe</h2>
                          <p class="prose" style="margin: 10px 0 25px">
                              Les autres sessions de votre compte seront déconnectées.
                          </p>
                          <div class="stack">${field('Mot de passe actuel', 'current_password', '', 'password')}${field(
                              'Nouveau mot de passe',
                              'password',
                              '',
                              'password',
                              false,
                              '10 caractères minimum ; 72 octets maximum.',
                          )}${field('Confirmer le nouveau mot de passe', 'confirm_password', '', 'password')}</div>
                          <div class="form-actions">
                              <button class="btn primary" type="submit">Changer le mot de passe</button>
                          </div>
                      </form>
                      <div class="email-change-form">
                          <h2>Adresse e-mail de connexion</h2>
                          <p class="prose">Adresse actuelle : ${esc(p.email)}</p>
                          ${state.emailChangeEnabled ? `
                          <p class="prose">Confirmez votre nouvelle adresse par e-mail. L’adresse actuelle reste active jusqu’à confirmation.</p>
                          <form data-form="email-change">
                              <div class="stack">
                                  ${field('Nouvelle adresse e-mail', 'email', '', 'email', true, '', 'autocomplete="email" maxlength="180"')}
                                  ${field('Votre mot de passe actuel', 'current_password', '', 'password', true, '', 'autocomplete="current-password"')}
                              </div>
                              <div class="form-actions"><button type="submit" class="btn primary">Confirmer la nouvelle adresse</button></div>
                          </form>` : `<p class="prose">Le changement d’adresse par e-mail n’est pas encore disponible. Si vous avez perdu l’accès à votre boîte e-mail, contactez le support pour faire vérifier votre demande.</p><a href="#support" class="btn">Contacter le support</a>`}
                      </div>
                  `
                }</section>
            </div>
        `
    );
}
function connectedAccount() {
    return `
        <main id="main" class="public-section" style="max-width: 680px">
            <div style="margin-bottom: 30px">${brand()}</div>
            <section class="panel panel-pad">
                <div class="row" style="margin-bottom: 20px">
                    ${avatar(state.profile.initials, '', 'lg', state.profile.avatarUrl)}
                    <div>
                        <h1>Vous êtes connecté.</h1>
                        <p class="prose">${esc(state.profile.name)} · ${roles[state.role]}</p>
                    </div>
                </div>
                <p class="prose" style="margin-bottom: 22px">${
                    state.role === 'admin'
                        ? 'Créez les comptes autorisés depuis votre espace de gestion. La création des administrateurs est réservée au super administrateur.'
                        : 'Pour créer un autre compte personnel ou changer de compte, terminez d’abord cette session.'
                }</p>
                <div class="row" style="flex-wrap: wrap">
                    <a class="btn" href="#dashboard">Revenir à mon espace</a>
                    ${
                        state.role === 'admin'
                            ? button('Créer un compte', 'new-account', 'primary', 'plus')
                            : ''
                    }${logoutForm()}
                </div>
            </section>
        </main>
    `;
}
function auth() {
    if (state.authenticated && current().page !== 'reinitialiser') {
        return connectedAccount();
    }
    const signup = current().page === 'inscription',
        reset = current().page === 'reinitialiser';
    return `
        <main id="main" class="auth-page">
            <section class="auth-story">
                ${brand()}
                <div class="auth-story-content">
                    <p class="eyebrow">Le numérique qui rapproche.</p>
                    <h1>
                        La prochaine belle idée
                        <br />
                        commence par
                        <br />
                        <em>une rencontre.</em>
                    </h1>
                    <p>
                        Valorisez vos talents, trouvez des partenaires et construisez des solutions utiles.
                    </p>
                </div>
                <small>CiviConnect Africa · Connecter. Créer. Transformer.</small>
            </section>
            <section class="auth-form-wrap">
                <div class="auth-form">
                    <a class="text-link" href="#accueil" style="margin-bottom: 30px">
                        ${icon('back', 14)}Retour à l’accueil
                    </a>
                    <h1>${
                        reset
                            ? 'Un nouveau départ.'
                            : signup
                              ? 'Faisons connaissance.'
                              : 'Heureux de vous retrouver.'
                    }</h1>
                    <p>${
                        reset
                            ? 'Choisissez votre nouveau mot de passe.'
                            : signup
                              ? 'Créez votre compte pour rejoindre la communauté.'
                              : 'Connectez-vous à votre espace personnel.'
                    }</p>
                    ${
                        signup
                            ? `
                <div class="page-tabs">${[
                    ['developer', 'Développeur'],
                    ['organisation', 'Organisation'],
                ]
                    .map(
                        ([id, label]) =>
                            `
                              <button data-action="auth-role" data-id="${id}" class="${ui.authRole === id ? 'active' : ''}">
                                  ${label}
                              </button>
                          `,
                    )
                    .join('')}</div>
            `
                            : ''
                    }
                    <form data-form="${reset ? 'reset-password' : 'auth'}" novalidate>
                        ${
                            signup
                                ? field(
                                      ui.authRole === 'organisation'
                                          ? 'Nom de l’organisation'
                                          : 'Nom complet',
                                      'name',
                                      '',
                                      'text',
                                  ) + field('Pays', 'country', 'Sénégal')
                                : ''
                        }${
                            reset
                                ? ''
                                : field(
                                      'Adresse e-mail',
                                      'email',
                                      '',
                                      'email',
                                      false,
                                      '',
                                      'autocomplete="email"',
                                  )
                        }${field(
                            reset ? 'Nouveau mot de passe' : 'Mot de passe',
                            'password',
                            '',
                            'password',
                            false,
                            signup || reset ? '10 caractères minimum ; 72 octets maximum.' : '',
                            `autocomplete="${signup || reset ? 'new-password' : 'current-password'}"`,
                        )}${
                            reset
                                ? field(
                                      'Confirmer le mot de passe',
                                      'confirm_password',
                                      '',
                                      'password',
                                  )
                                : ''
                        }
                        <button class="btn primary" type="submit">
                            ${
                                reset
                                    ? 'Enregistrer le mot de passe'
                                    : signup
                                      ? 'Créer mon compte'
                                      : 'Se connecter'
                            } ${icon('arrow', 14)}
                        </button>
                    </form>
                    ${
                        !signup && !reset
                            ? `
        <div style="text-align: right; margin-top: 15px">${button('Mot de passe oublié ?', 'forgot', 'ghost sm')} <a class="text-link" href="#support">Aide et support</a></div>
    `
                            : ''
                    }${
                        reset
                            ? ''
                            : `
        <div class="form-bottom">
            <span>${signup ? 'Déjà un compte ?' : 'Vous êtes nouveau ?'}</span>
            <a class="text-link" href="#${signup ? 'connexion' : 'inscription'}">${signup ? 'Se connecter' : 'Créer un compte'}</a>
        </div>
    `
                    }${
                        signup && ui.authRole === 'organisation'
                            ? `
        <div class="notice" style="margin-top: 25px">
            ${icon('shield', 17)}Votre organisation sera vérifiée par l’administrateur avant de pouvoir
            publier des besoins et demander des collaborations.
        </div>
    `
                            : ''
                    }
                </div>
            </section>
        </main>
    `;
}
function landing() {
    return `
        <div class="landing">
            ${publicHeader()}
            <main id="main">
                <section class="landing-hero">
                    <div>
                        <span class="badge green">
                            ${icon('globe', 12)}Le numérique au service de l’Afrique
                        </span>
                        <h1>
                            Des talents connectés.
                            <br />
                            Des solutions
                            <br />
                            <em>qui changent la vie.</em>
                        </h1>
                        <p>
                            La plateforme d’échange africaine, pour les devs, par les devs. Partagez vos
                            projets, rencontrez d’autres développeurs et construisez ensemble des solutions
                            utiles aux communautés.
                        </p>
                        <div class="row small-gap">
                            <a class="btn primary" href="#projets">
                                Découvrir les projets ${icon('arrow', 14)}
                            </a>
                            <a class="btn" href="#${state.authenticated ? 'dashboard' : 'inscription'}">${state.authenticated ? 'Mon espace' : 'Rejoindre la communauté'}</a>
                        </div>
                    </div>
                    <div class="hero-photo">
                        <img src="assets/community.jpg" alt="Une équipe réunie autour de ses ordinateurs" />
                        <div class="photo-note">
                            <span class="project-symbol">${icon('leaf', 21)}</span>
                            <div>
                                <strong>Un numérique utile, ensemble.</strong>
                                <small>Du talent à l’impact sur le terrain.</small>
                            </div>
                        </div>
                    </div>
                </section>
                <div class="public-stats">${[
                    [state.developers.length, 'Talents inscrits'],
                    [state.projects.filter((p) => p.status === 'Publié').length, 'Projets publiés'],
                    [state.needs.filter((n) => n.status === 'Ouvert').length, 'Besoins ouverts'],
                    [new Set(state.developers.map((d) => d.country)).size, 'Pays représentés'],
                ]
                    .map(
                        ([n, label]) => `
            <div>
                <strong>${n}</strong>
                <small>${label}</small>
            </div>
        `,
                    )
                    .join('')}</div>
                <section class="public-section">
                    <div class="page-heading">
                        <div>
                            <p class="eyebrow" style="color: var(--terra); margin-bottom: 10px">
                                Des idées, déjà en mouvement
                            </p>
                            <h2>Les projets récemment publiés.</h2>
                        </div>
                        ${link('Tous les projets', 'projets')}
                    </div>
                    ${
                        state.projects.some((p) => p.status === 'Publié')
                            ? `
                <div class="grid-3">${sortedPublications(state.projects.filter((p) => p.status === 'Publié'))
                    .slice(0, 3)
                    .map(projectCard)
                    .join('')}</div>
            `
                            : empty(
                                  'Les premières solutions arrivent.',
                                  'Créez votre compte et partagez un projet utile aux organisations.',
                                  'join',
                                  'Rejoindre CiviConnect',
                              )
                    }
                </section>
                ${state.needs.some(n => n.status === 'Ouvert' && n.publicVisible !== false) ? `
                <section class="public-section" style="padding-top: 0">
                    <div class="page-heading"><h2>Les besoins récents.</h2>${link('Tous les besoins', 'besoins')}</div>
                    <div class="catalogue-needs">${sortedPublications(state.needs.filter(n => n.status === 'Ouvert' && n.publicVisible !== false)).slice(0, 3).map(needCard).join('')}</div>
                </section>` : ''}
                <section class="public-section" style="padding-top: 0">
                    <div class="public-cta">
                        <div>
                            <h2>Vous avez un besoin. Ils ont le talent.</h2>
                            <p>Faites le premier pas vers votre prochaine solution numérique.</p>
                        </div>
                        <a class="btn light" href="#${state.authenticated ? 'besoins' : 'inscription'}">
                            ${state.authenticated ? 'Explorer les besoins' : 'Créer un compte organisation'}${icon('arrow', 14)}
                        </a>
                    </div>
                </section>
            </main>
            <footer class="public-footer">
                © ${new Date().getFullYear()} CiviConnect Africa · Connecter. Créer. Transformer.
            </footer>
        </div>
    `;
}
function help() {
    return (
        heading(
            'Chaque idée commence par une rencontre.',
            'Les étapes pour utiliser votre espace CiviConnect.',
        ) +
        `
            <div class="help-grid">${[
                [
                    'code',
                    'Développeurs',
                    'Ajoutez votre photo, présentez un projet et activez la recherche de collaborateurs. Proposez aussi votre contribution aux projets ouverts des autres développeurs.',
                ],
                [
                    'building',
                    'Organisations',
                    'Votre compte est vérifié par un administrateur. Vous pouvez ensuite publier vos besoins et demander une collaboration autour d’un projet.',
                ],
                [
                    'message',
                    'Collaborer',
                    'Une demande apparaît dans l’espace du destinataire. Il peut l’accepter ou la décliner ; la messagerie vous permet d’échanger.',
                ],
            ]
                .map(
                    ([ic, title, desc]) =>
                        `
                        <section class="panel help-card">
                            <span class="project-symbol">${icon(ic, 23)}</span>
                            <h3>${title}</h3>
                            <p>${desc}</p>
                        </section>
                    `,
                )
                .join('')}</div>
            ${validationRules(true)}
            <section class="panel panel-pad" style="margin-top: 22px"><h2>Connexion et récupération d’accès</h2><p class="prose">Sur téléphone, ouvrez le menu en haut de l’écran pour créer un compte ou vous connecter. Si vous avez oublié votre mot de passe, demandez un lien avec l’adresse enregistrée sur votre compte. Ce lien est valable 20 minutes et utilisable une seule fois.</p><a class="btn" href="#support">Contacter le support</a></section>
            <section class="panel panel-pad" style="margin-top: 22px">
                <h2>Vos données vous suivent.</h2>
                <p class="prose" style="margin-top: 12px">
                    Vos publications, sélections et messages sont enregistrés dans votre compte. Utilisez le
                    bouton d’actualisation en haut de l’écran pour retrouver les dernières modifications. La
                    messagerie se met à jour automatiquement quand elle est ouverte.
                </p>
            </section>
        `
    );
}
function needModal(id) {
    const n = id ? state.needs.find((n) => n.id === id) : null;
    ui.modal = { kind: 'need', id };
    openModal(
        n ? 'Faites évoluer votre besoin.' : 'Quel défi souhaitez-vous relever ?',
        'Exprimez votre besoin pour rencontrer les bons talents.',
        `
            <form id="need-form" data-form="need" novalidate>
                <div class="form-grid">
                    ${field(
                        'Titre du besoin *',
                        'title',
                        n?.title || '',
                        'text',
                        true,
                        '',
                        'maxlength="150" autofocus',
                    )}
                    <div class="field full">
                        <label for="f-description">Décrivez votre besoin *</label>
                        <textarea class="input" id="f-description" name="description" maxlength="10000">${esc(n?.description || '')}</textarea>
                        <span class="field-error" id="err-description"></span>
                    </div>
                    ${domainFields(n)}
                    ${field(
                        'Budget indicatif',
                        'budget',
                        n?.budget || '',
                        'text',
                        false,
                        '',
                        'maxlength="120"',
                    )}${field('Date souhaitée', 'deadline', n?.dateValue || '', 'date')}${field(
                        'Compétences recherchées',
                        'skills',
                        n?.skills.join(', ') || '',
                        'text',
                        true,
                        'Séparez les compétences par une virgule.',
                        'maxlength="500"',
                    )}
                </div>
            </form>
        `,
        `
            ${button('Annuler', 'close-modal', '')}
            <button class="btn primary" type="submit" form="need-form">
                Enregistrer le besoin ${icon('arrow', 14)}
            </button>
        `,
    );
}
function notifications() {
    const selected = state.notifications.filter((n) =>
        n.route === 'messages'
            ? state.preferences.messages !== false
            : n.route === 'collaborations'
              ? state.preferences.collabs !== false
              : true,
    );
    openModal(
        'Votre réseau est en mouvement.',
        'Les 50 dernières notifications. Le compteur indique toutes les notifications non lues.',
        selected
            .map(
                (n) =>
                    `
                        <div class="notification-row ${Number(n.is_read) ? 'is-read' : 'is-unread'}">
                            <span class="activity-icon">${icon('bell', 14)}</span>
                            <div>
                                <h3>${esc(n.title)}</h3>
                                <p>${esc(n.body)}</p>
                                <small>${esc(n.created_at)}</small>
                                <div style="margin-top: 7px">${button('Consulter', 'read-notification', '', '', `data-id="${esc(n.id)}"`)}<small>${Number(n.is_read) ? 'Lue' : 'Non lue'}</small></div>
                            </div>
                        </div>
                    `,
            )
            .join('') ||
            `
                <p class="prose">Aucune notification dans les catégories choisies.</p>
            `,
        `${button('Fermer', 'close-modal', '')}${button('Tout marquer comme lu', 'read-notifications', 'primary', 'check')}`,
    );
}
// Listes personnelles : le serveur fournit le marqueur de propriété « mine ».
function personalPublications(kind, requestedPage) {
    const isNeed = kind === 'needs';
    const allowedRole = isNeed ? 'organisation' : 'developer';
    if (!state.authenticated || state.role !== allowedRole) {
        return '<p class="prose">Cet espace n’est pas accessible à votre profil.</p>';
    }
    const title = isNeed ? 'Mes besoins' : 'Mes projets';
    const route = isNeed ? 'mes-besoins' : 'mes-projets';
    const items = (isNeed ? state.needs : state.projects).filter(item => item.mine);
    const pageCount = Math.max(1, Math.ceil(items.length / 6));
    const page = Math.max(1, Math.min(pageCount, parseInt(requestedPage, 10) || 1));
    const visible = items.slice((page - 1) * 6, page * 6);
    const create = button(isNeed ? 'Exprimer un besoin' : 'Nouveau projet',
        isNeed ? 'new-need' : 'new-project', 'primary', 'plus');
    return heading(title, 'Vos publications, avec leur statut et leurs actions de gestion.', create) + `
        <div class="panel toolbar">
            <span>${items.length} publication(s) · Page ${page} sur ${pageCount}</span>
            <a class="btn" href="#${isNeed ? 'besoins' : 'projets'}">Explorer le catalogue</a>
        </div>
        ${visible.length
            ? `<div class="grid-3 catalogue-grid">${visible.map(isNeed ? needCard : projectCard).join('')}</div>`
            : `<section class="panel panel-pad"><h2>Aucune publication pour le moment</h2>
                <p class="prose">${isNeed ? 'Présentez un besoin de votre organisation.' : 'Présentez votre premier projet à la communauté.'}</p>
                ${create}</section>`}
        ${pageCount > 1 ? `<nav class="panel toolbar" aria-label="Pagination de mes publications">
            ${page > 1 ? `<a class="btn" href="#${route}/${page - 1}">Précédent</a>` : ''}
            <span aria-current="page">Page ${page} sur ${pageCount}</span>
            ${page < pageCount ? `<a class="btn" href="#${route}/${page + 1}">Suivant</a>` : ''}
        </nav>` : ''}
    `;
}
pageTitles['mes-besoins'] = 'Mes besoins';
pageTitles['mes-projets'] = 'Mes projets';

// 3. Choix de l’écran à partir de l’adresse #page.
function render() {
    clearPhotoPreview();
    const { page, id } = current(),
        focus = document.activeElement?.id,
        pos = document.activeElement?.selectionStart;
    const protectedPages = [
        'mes-besoins',
        'mes-projets',
        'dashboard',
        'collaborations',
        'messages',
        'profil',
        'administration',
        'aide',
    ];
    if (!state.authenticated && protectedPages.includes(page)) {
        location.hash = 'connexion';
        return;
    }
    if (page === 'administration' && state.role !== 'admin') {
        location.hash = 'dashboard';
        return;
    }
    let html;
    if (page === 'changer-email') {
        html = `${publicHeader()}<main id="main" class="container"><section class="panel panel-pad email-confirm-panel">
            <h1>Confirmer votre nouvelle adresse e-mail</h1>
            ${!state.emailChangeEnabled ? '<p class="prose">Le changement d’adresse par e-mail n’est pas disponible actuellement.</p><a href="#support" class="btn">Contacter le support</a>' : !state.authenticated ? '<p class="prose">Connectez-vous avec votre adresse actuelle, puis rouvrez le lien reçu par e-mail.</p><a href="#connexion" class="btn primary">Se connecter</a>' : `<p class="prose">Vous êtes connecté en tant que ${esc(state.profile.email)}. Confirmer remplacera votre adresse et fermera vos sessions. Vous devrez vous reconnecter avec la nouvelle adresse.</p>${button('Confirmer le changement', 'confirm-email-change', 'primary')}`}
        </section></main>`;
    } else if (page === 'confirmer-email') {
        html = `${publicHeader()}<main id="main" class="container"><section class="panel panel-pad email-confirm-panel">
            <h1>Confirmer votre adresse e-mail</h1>
            <p class="prose">Ce lien confirme l’accès à votre boîte e-mail. L’approbation de l’organisation reste une étape distincte.</p>
            ${button('Confirmer mon adresse', 'confirm-email', 'primary')}
            <a href="#profil" class="btn">Retour au profil</a>
        </section></main>`;
    } else if (page === 'connexion' || page === 'inscription' || page === 'reinitialiser') {
        html = auth();
    } else if (page === 'accueil' || !page) {
        html = landing();
    } else {
        const view = {
            dashboard,
            'mes-besoins': () => personalPublications('needs', id),
            'mes-projets': () => personalPublications('projects', id),
            projets: projects,
            developpeurs: developers,
            besoins: needs,
            collaborations,
            messages,
            profil: settings,
            administration,
            aide: help,
            support,
            projet: () => detail(id),
        };
        html = shell(view[page] ? view[page]() : help(), page);
    }
    document.getElementById('app').innerHTML = html;
    document.title = (!page || page === 'accueil')
        ? 'CiviConnect Africa — Projets, développeurs et organisations'
        : (pageTitles[page] || 'CiviConnect') + ' · CiviConnect Africa';
    if (focus) {
        const f = document.getElementById(focus);
        if (f) {
            f.focus({ preventScroll: true });
            if (typeof pos === 'number') {
                try {
                    f.setSelectionRange(pos, pos);
                } catch {}
            }
        }
    }
    const chat = document.getElementById('chat-messages');
    if (chat) {
        chat.scrollTop = chat.scrollHeight;
    }
}
const emailValid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
// 4. Actions déclenchées par les boutons.
document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-action]');
    if (!a) {
        return;
    }
    const act = a.dataset.action,
        id = a.dataset.id;
    if (act === 'dismiss-overlay') {
        if (e.target === a) {
            closeModal();
        }
        return;
    }
    const local = {
        menu: () => {
            ui.mobile = !ui.mobile;
            render();
        },
        'close-menu': () => {
            ui.mobile = false;
            render();
        },
        'close-modal': closeModal,
        'project-tab': () => {
            ui.projectTab = id;
            ui.projectStatus = 'Tous';
            ui.projectPage = 1;
            render();
        },
        'project-page': () => {
            ui.projectPage = +id;
            render();
            focusCatalogue();
        },
        'dev-page': () => {
            ui.devPage = +id;
            render();
            focusCatalogue();
        },
        'need-page': () => {
            ui.needPage = +id;
            render();
            focusCatalogue();
        },
        'collab-tab': () => {
            ui.collabTab = id;
            render();
        },
        'settings-tab': () => {
            ui.settingsTab = id;
            render();
        },
        'admin-tab': () => {
            ui.adminTab = id;
            render();
        },
        'auth-role': () => {
            ui.authRole = id;
            render();
        },
        'all-projects': () => {
            ui.projectTab = 'catalogue';
            go('projets');
        },
        join: () => go('inscription'),
        'back-chats': () => {
            ui.chatOpen = false;
            render();
        },
        'reset-filters': () => {
            ui.projectSearch = '';
            ui.projectFilter = 'Tous';
            ui.projectStatus = 'Tous';
            ui.favoritesOnly = false;
            ui.recruitingOnly = false;
            ui.devSearch = '';
            ui.country = 'Tous les pays';
            ui.availableOnly = false;
            ui.needSearch = '';
            ui.needCategory = 'Tous';
            render();
        },
        'developer-detail': () => openDeveloper(id),
        'need-detail': () => openNeed(id),
        notifications: notifications,
        'edit-project': () => projectModal(id),
        'review-project': () => reviewProject(id),
        propose: () => collaborationModal('need', id),
        'edit-need': () => needModal(id),
    };
    if (local[act]) {
        local[act]();
        return;
    }
    if (act === 'photo-reset') {
        resetPhotoPreview();
        return;
    }
    if (act === 'new-account' || act === 'new-admin') {
        if (state.role !== 'admin' || (act === 'new-admin' && !state.isSuperAdmin)) {
            toast('Cette action est réservée à l’administration.', true);
            return;
        }
        accountModal(act === 'new-admin' ? 'admin' : 'developer');
        return;
    }
    if (act === 'new-project') {
        if (state.role !== 'developer') {
            go('connexion');
            return;
        }
        projectModal();
        return;
    }
    if (act === 'new-need') {
        if (state.role !== 'organisation' || state.profile.status !== 'verified') {
            toast('Votre organisation doit être validée avant de publier un besoin.', true);
            return;
        }
        needModal();
        return;
    }
    if (act === 'request-collab') {
        if (!state.authenticated) {
            go('connexion');
            return;
        }
        if (!['organisation', 'developer'].includes(state.role)) {
            toast('Cette action est réservée aux développeurs et organisations.', true);
            return;
        }
        collaborationModal('project', id);
        return;
    }
    if (act === 'review-org') {
        const o = state.organisations.find((o) => o.id === id);
        openModal(
            esc(o.name),
            esc(o.type),
            `
                ${organisationReviewDetails(o)}
                <div class="field">
                    <label for="org-review-reason">Motif de la décision ou informations demandées (10 caractères minimum)</label>
                    <textarea id="org-review-reason" class="input" maxlength="1500" rows="4"></textarea>
                </div>
                ${state.isSuperAdmin && ['En attente', 'Refusée'].includes(o.status) ? `<label class="demo-choice"><input type="checkbox" id="org-demo" ${o.org_is_demo ? 'checked' : ''} /> Compte fictif de démonstration : autoriser sans confirmation e-mail</label>` : ''}
            `,
            `${button('Fermer', 'close-modal', '')}${
                ['En attente', 'Refusée'].includes(o.status)
                    ? button('Demander des compléments', 'request-org-info', '', '', `data-id="${id}"`) + button('Refuser', 'reject-org', 'danger', '', `data-id="${id}"`) +
                      button('Valider', 'approve-org', 'primary', 'check', `data-id="${id}"`)
                    : button(
                          state.isSuperAdmin
                              ? o.status === 'Suspendue'
                                  ? 'Réactiver'
                                  : 'Suspendre'
                              : o.status === 'Suspendue'
                                ? 'Demander une réactivation'
                                : 'Demander une suspension',
                          'account-status',
                          '',
                          'shield',
                          `data-id="${id}" data-status="${o.status === 'Suspendue' ? 'verified' : 'suspended'}"`,
                      )
            }`,
        );
        return;
    }
    if (act === 'forgot') {
        if (!state.mailEnabled) {
            openModal(
                'Retrouver votre accès.',
                'La récupération par e-mail n’est pas activée.',
                `
                    <p class="prose">
                        L’envoi automatique est momentanément indisponible. Ouvrez une demande de support ; vous pourrez suivre la réponse sans être connecté.
                    </p>
                `,
                button('Fermer', 'close-modal', '') +
                    '<a class="btn primary" href="#support">Contacter le support</a>',
            );
            return;
        }
        openModal(
            'Retrouver votre accès.',
            'Un lien vous permettra de choisir un nouveau mot de passe.',
            `
                <form id="forgot-form" data-form="forgot" novalidate>${field('Adresse e-mail', 'recoveryEmail', '', 'email', false, '', 'autofocus')}</form>
            `,
            `
                ${button('Annuler', 'close-modal', '')}
                <a class="btn" href="#support">Aide et support</a>
                <button class="btn primary" type="submit" form="forgot-form">Demander un lien</button>
            `,
        );
        return;
    }
    actionTask(async () => {
        if (!state.authenticated && !['refresh', 'confirm-email'].includes(act)) {
            go('connexion');
            return;
        }
        switch (act) {
            case 'read-notification': {
                const notice = state.notifications.find(item => String(item.id) === String(id));
                if (!notice) return;
                await api('notifications.read', { id });
                closeModal();
                go(notice.route || 'dashboard');
                render();
                break;
            }
            case 'confirm-email-change': {
                const result = await api('email.change.confirm', { token: current().id });
                go('connexion');
                toast(result.message);
                break;
            }
            case 'request-email-confirmation':
                await api('email.confirm.request', {});
                toast('Message accepté par le service d’envoi. Vérifiez votre boîte e-mail et les indésirables.');
                break;
            case 'submit-org-dossier':
                await api('organisation.submit', {});
                render();
                toast('Votre dossier a été transmis pour examen.');
                break;
            case 'confirm-email':
                await api('email.confirm', { token: current().id });
                go(state.authenticated ? 'profil' : 'connexion');
                render();
                toast('Votre adresse e-mail est confirmée.');
                break;
            case 'photo-remove': {
                const data = new FormData();
                data.append('action', 'remove');
                await photoRequest(data);
                resetPhotoPreview();
                render();
                toast('La photo a été supprimée.');
                break;
            }
            case 'refresh':
                await refresh();
                toast('Les données ont été actualisées.');
                break;
            case 'logout':
                await api('logout', {});
                closeModal();
                go('accueil');
                render();
                break;
            case 'favorite':
            case 'save-talent':
                await api('save.toggle', {
                    id,
                    kind: act === 'favorite' ? 'project' : 'developer',
                });
                render();
                toast('Votre sélection a été mise à jour.');
                break;
            case 'read-notifications':
                await api('notifications.read', {});
                closeModal();
                render();
                toast('Toutes les notifications sont marquées comme lues.');
                break;
            case 'conversation':
                ui.conversation = id;
                ui.chatOpen = true;

                render();
                break;
            case 'contact-developer': {
                const r = await api('conversation.open', { id });
                ui.conversation = r.conversationId;
                ui.chatOpen = true;
                closeModal();
                go('messages');
                render();
                break;
            }
            case 'collab-message': {
                const c = state.collaborations.find((c) => c.id === id);
                ui.conversation = c.conversationId;
                ui.chatOpen = true;

                go('messages');
                render();
                break;
            }
            case 'accept-collab':
            case 'decline-collab':
                await api('collaboration.respond', {
                    id,
                    status: act === 'accept-collab' ? 'accepted' : 'declined',
                });
                render();
                toast('Votre réponse a été enregistrée.');
                break;
            case 'approve-project':
            case 'return-project':
                await api('project.review', {
                    id,
                    status: act === 'approve-project' ? 'published' : 'draft',
                    reason: document.getElementById('review-reason')?.value || '',
                });
                closeModal();
                render();
                toast('Le statut de la publication a été mis à jour.');
                break;
            case 'request-org-info':
            case 'approve-org':
            case 'reject-org':
            case 'suspend-org':
                await api('organisation.review', {
                    id,
                    reason: document.getElementById('org-review-reason')?.value || '',
                    is_demo: document.getElementById('org-demo')?.checked || false,
                    status:
                        act === 'request-org-info' ? 'pending' : act === 'approve-org'
                            ? 'verified'
                            : act === 'reject-org'
                              ? 'rejected'
                              : 'suspended',
                });
                closeModal();
                render();
                toast('Le statut de l’organisation a été mis à jour.');
                break;
            case 'account-status':
                await api('account.status', { id, status: a.dataset.status });
                render();
                toast('Le statut du compte a été mis à jour.');
                break;
            case 'reopen-need':
                await api('need.reopen', { id });
                closeModal();
                render();
                toast('Le besoin est réouvert aux propositions.');
                break;
            case 'close-need':
                await api('need.close', { id });
                closeModal();
                render();
                toast('Votre besoin a été clôturé.');
                break;
        }
    });
});
let searchTimer;
document.addEventListener('input', (e) => {
    if (e.target.id === 'f-description') {
        updateProjectDescriptionPreview();
    }
    if (e.target.dataset.search) {
        ui[e.target.dataset.search] = e.target.value;
        ui.projectPage = 1;
        ui.devPage = 1;
        ui.needPage = 1;
        clearTimeout(searchTimer);
        searchTimer = setTimeout(render, 130);
    }
});
document.addEventListener('change', (e) => {
    if (e.target.id === 'f-account-role') {
        updateAccountRole(e.target.form);
        return;
    }
    if (e.target.id === 'profile-photo') {
        previewPhoto(e.target);
        return;
    }
    switch (e.target.id) {
        case 'project-sort':
            ui.projectSort = e.target.value; ui.projectPage = 1; break;
        case 'need-sort':
            ui.needSort = e.target.value; ui.needPage = 1; break;
        case 'project-recruiting':
            ui.recruitingOnly = e.target.checked;
            ui.projectPage = 1;
            break;
        case 'project-category':
            ui.projectFilter = e.target.value;
            ui.projectPage = 1;
            break;
        case 'project-favorites':
            ui.favoritesOnly = e.target.checked;
            ui.projectPage = 1;
            break;
        case 'developer-country':
            ui.country = e.target.value;
            ui.devPage = 1;
            break;
        case 'developer-available':
            ui.availableOnly = e.target.checked;
            ui.devPage = 1;
            break;
        case 'need-category':
            ui.needCategory = e.target.value;
            ui.needPage = 1;
            break;
        default:
            return;
    }
    render();
});
// 5. Envoi des formulaires vers les actions PHP correspondantes.
document.addEventListener('submit', (e) => {
    const form = e.target;
    if (!form.dataset.form) {
        return;
    }
    e.preventDefault();
    const type = form.dataset.form,
        fd = new FormData(form),
        data = Object.fromEntries(fd.entries());
    if (type === 'project' || type === 'need') {
        data.categories = fd.getAll('categories');
        if (!data.categories.length) {
            const error = form.querySelector('#err-categories');
            if (error) error.textContent = 'Choisissez au moins un domaine.';
            toast('Choisissez au moins un domaine.', true);
            return;
        }
    }
    if (type === 'global-search') {
        ui.projectSearch = String(data.q || '');
        ui.projectTab = 'catalogue';
        go('projets');
        render();
        return;
    }
    if (type === 'message' && !String(data.message || '').trim()) {
        return;
    }
    if (type === 'auth' && state.authenticated) {
        render();
        return;
    }
    if (
        type === 'auth' &&
        !validate(form, [
            ['email', emailValid, 'Saisissez une adresse e-mail valide.'],
            ['password', (v) => v.length > 0, 'Indiquez votre mot de passe.'],
        ])
    ) {
        return;
    }
    if (
        (type === 'password' || type === 'reset-password') &&
        data.password !== data.confirm_password
    ) {
        validate(form, [
            ['confirm_password', () => false, 'Les mots de passe ne correspondent pas.'],
        ]);
        return;
    }
    actionTask(async () => {
        const submits = [
            ...form.querySelectorAll('[type=submit]'),
            ...document.querySelectorAll(`[form="${form.id}"]`),
        ];
        submits.forEach((b) => (b.disabled = true));
        try {
            if (type === 'photo') {
                if (!fd.get('photo')?.size) {
                    toast('Choisissez une photo avant de l’enregistrer.', true);
                    return;
                }
                await prepareCroppedPhoto(fd);
                await photoRequest(fd);
                resetPhotoPreview();
                render();
                toast('Votre photo a été enregistrée.');
                return;
            }
            if (type === 'admin-account') {
                await api('account.create', data);
                closeModal();
                ui.adminTab =
                    data.role === 'admin'
                        ? 'administrateurs'
                        : data.role === 'organisation'
                          ? 'organisations'
                          : 'comptes';
                go('administration');
                render();
                toast('Le compte a été créé. Votre session administrateur est conservée.');
                return;
            }
            if (type === 'auth') {
                const signup = current().page === 'inscription';
                await api(signup ? 'register' : 'login', { ...data, role: ui.authRole });
                ui.projectTab = 'catalogue';
                ui.settingsTab = 'profile';
                ui.conversation = state.conversations[0]?.id || '';
                go(state.role === 'admin' ? 'administration' : 'dashboard');
                render();
                return;
            }
            if (type === 'project') {
                await api('project.save', {
                    ...data,
                    id: ui.modal.id || 0,
                    seeking_collaborators: fd.has('seeking_collaborators'),
                    intent: e.submitter?.value || 'draft',
                });
                closeModal();
                ui.projectTab = 'mine';
                ui.projectStatus = 'Tous';
                ui.projectSearch = '';
                go('projets');
                render();
                toast('Votre projet a été enregistré.');
                return;
            }
            if (type === 'need') {
                await api('need.save', { ...data, id: ui.modal.id || 0 });
                closeModal();
                ui.needSearch = '';
                go('besoins');
                render();
                toast('Votre besoin a été enregistré.');
                return;
            }
            if (type === 'collaboration') {
                await api('collaboration.create', {
                    ...data,
                    source: ui.modal.source,
                    item_id: ui.modal.id,
                });
                closeModal();
                go('collaborations');
                render();
                toast('Votre demande a été envoyée au destinataire.');
                return;
            }
            if (type === 'message') {
                await api('message.send', { id: ui.conversation, message: data.message });
                render();
                document.querySelector('.chat-composer input')?.focus();
                return;
            }
            if (type === 'profile') {
                await api('profile.save', { ...data, available: fd.has('available') });
                render();
                toast('Votre profil a été mis à jour.');
                return;
            }
            if (type === 'preferences') {
                await api('preferences.save', {
                    collabs: fd.has('collabs'),
                    messages: fd.has('messages'),
                });
                toast('Vos préférences ont été enregistrées.');
                return;
            }
            if (type === 'email-change') {
                const result = await api('email.change.request', data);
                form.reset();
                toast(result.message);
                return;
            }
            if (type === 'password') {
                await api('password.change', data);
                form.reset();
                toast('Votre mot de passe a été changé.');
                return;
            }
            if (type === 'forgot') {
                const r = await api('password.request', { email: data.recoveryEmail });
                closeModal();
                toast(r.message);
                return;
            }
            if (type === 'reset-password') {
                await api('password.reset', {
                    password: data.password,
                    confirm_password: data.confirm_password,
                    token: current().id,
                });
                go('connexion');
                toast('Votre mot de passe a été changé. Connectez-vous.');
                return;
            }
        } catch (err) {
            for (const [key, msg] of Object.entries(err.fields || {})) {
                const f = form.elements.namedItem(key);
                if (f) {
                    f.closest('.field')?.classList.add('error');
                    f.setAttribute('aria-invalid', 'true');
                    const el = form.querySelector('#err-' + key);
                    if (el) {
                        el.textContent = msg;
                        f.setAttribute('aria-describedby', 'err-' + key);
                    }
                }
            }
            form.querySelector('[aria-invalid]')?.focus();
            throw err;
        } finally {
            submits.forEach((b) => (b.disabled = false));
        }
    });
});
document.addEventListener('keydown', (e) => {
    const modal = document.querySelector('.modal');
    if (e.key === 'Escape') {
        closeModal();
        if (ui.mobile) {
            ui.mobile = false;
            render();
        }
    }
    if (e.key === 'Tab' && modal) {
        const items = [
            ...modal.querySelectorAll('button:not(:disabled),a[href],input,select,textarea'),
        ];
        if (items.length) {
            const first = items[0],
                last = items.at(-1);
            if (
                e.shiftKey &&
                (document.activeElement === first || document.activeElement === modal)
            ) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }
});
window.addEventListener('hashchange', () => {
    clearPhotoPreview();
    closeModal();
    ui.mobile = false;
    ui.publicMenu = false;
    render();
    loadSupportRoute();
    window.scrollTo({ top: 0 });
    document.getElementById('main')?.focus({ preventScroll: true });
    const r = current();
    if (r.page === 'projet') {
        actionTask(async () => {
            await api('project.view', { id: r.id });
        });
    }
});
// 6. Chargement initial et actualisation de la messagerie.
async function start() {
    try {
        await api('bootstrap');
        if (!location.hash) {
            location.hash = state.authenticated ? 'dashboard' : 'accueil';
        }
        render();
        await loadSupportRoute();
        if (state.conversations.length && !ui.conversation) {
            ui.conversation = state.conversations[0].id;
        }
    } catch (e) {
        document.getElementById('app').innerHTML = `
                <main id="main" class="empty-state">
                    <div class="empty-icon">${icon('alert', 28)}</div>
                    <h1>CiviConnect n’est pas disponible.</h1>
                    <p>${esc(e.message)}</p>
                    <a class="btn primary" href="index.php">Réessayer</a>
                    <p style="margin-top: 20px">
                        <a class="text-link" href="install.php">Vérifier l’installation</a>
                    </p>
                </main>
            `;
    }
}
setInterval(() => {
    if (
        state.authenticated &&
        current().page === 'messages' &&
        !ui.busy &&
        !document.hidden &&
        !document.querySelector('.modal')
    ) {
        refresh().catch(() => {});
    }
}, 5000);
start();


// Les coordonnées de vérification restent dans le profil privé et l’administration.
function organisationProfileFields(profile) {
    const types = ['Association', 'Entreprise', 'Administration', 'ONG', 'Établissement public', 'Autre'];
    return `<div class="field"><label for="f-org_type">Type d’organisation *</label>
        <select id="f-org_type" name="org_type" class="input">
            <option value="">Choisir un type</option>
            ${types.map(type => `<option value="${esc(type)}" ${profile.org_type === type ? 'selected' : ''}>${esc(type)}</option>`).join('')}
        </select><span class="field-error" id="err-org_type"></span></div>
        ${field('Adresse de la structure (facultatif)', 'org_address', profile.org_address || '', 'text', true, '', 'maxlength="255"')}
        ${field('Nom du responsable (facultatif)', 'org_contact_name', profile.org_contact_name || '', 'text', false, '', 'maxlength="180"')}
        ${field('Téléphone de contact (facultatif)', 'org_phone', profile.org_phone || '', 'tel', false, '', 'maxlength="60"')}
        ${field('Site officiel ou page publique (facultatif)', 'org_website', profile.org_website || '', 'url', true, 'Lien complet commençant par https://', 'maxlength="255"')}`;
}
function organisationDossierStatus(profile) {
    const complete = ['name', 'org_type', 'country', 'bio', 'email']
        .every(key => String(profile[key] || '').trim());
    const statuses = {
        pending: complete ? 'En attente de validation' : 'Profil à compléter',
        verified: 'Organisation approuvée',
        rejected: 'Profil à ajuster',
        suspended: 'Compte suspendu',
    };
    return `<section class="org-dossier-status">
        <h2>Présentation de votre organisation</h2>
        <p class="prose">Indiquez votre nom, votre type d’organisation, votre pays et une courte présentation. Les coordonnées complémentaires sont facultatives. Enregistrez votre profil : les informations complètes sont automatiquement disponibles pour validation.</p>
        <p><strong>${esc(statuses[profile.status] || profile.status)}</strong></p>
        ${profile.status === 'verified' ? '<p class="prose">Vous pouvez actualiser vos coordonnées et votre présentation. Seul un changement de nom, de type ou de pays nécessite une nouvelle validation.</p>' : ''}
        ${profile.org_is_demo ? '<p class="notice orange">Compte de démonstration — données fictives.</p>' : ''}
        ${profile.org_review_note ? `<p class="prose">${esc(profile.org_review_note)}</p>` : ''}
        ${profile.email_verified_at ? '<p class="prose">Adresse e-mail confirmée.</p>' : (state.mailEnabled ? `<p class="prose">Confirmez votre adresse e-mail pour terminer la validation.</p>${button('Confirmer mon adresse e-mail', 'request-email-confirmation', '')}` : '')}
    </section>`;
}
function organisationReviewDetails(org) {
    const rows = [
        ['Type', org.type], ['Pays', org.country], ['Ville', org.city],
        ['Adresse', org.org_address], ['Responsable', org.org_contact_name],
        ['Téléphone', org.org_phone], ['Adresse e-mail', org.email],
        ['Confirmation e-mail', org.email_verified_at ? 'Confirmée le ' + org.email_verified_at : 'Non confirmée'],
        ['Site ou page publique', org.org_website], ['Activités', org.bio],
        ['Dernière décision', org.org_review_note], ['Date d’examen', org.org_reviewed_at],
    ];
    return `${badge(org.status)}${org.org_is_demo ? badge('Démonstration', 'orange') : ''}
        <p class="prose">Vérifiez le nom, le type, le pays et la présentation. Les coordonnées complémentaires sont facultatives. Si l’envoi des e-mails est désactivé, une approbation manuelle est possible ; elle ne confirme pas l’adresse e-mail.</p>
        <dl class="org-review-details">${rows.map(([label,value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value || 'Non renseigné')}</dd></div>`).join('')}</dl>`;
}

;
/* Messagerie : activité réelle, accusés de lecture visibles et reprise d’envoi. */
(() => {
    'use strict';
    // Le module est intégré à live.js : une seule initialisation par page.
    if (document.documentElement.dataset.ccChatVersion) return;
    document.documentElement.dataset.ccChatVersion = '20261029-3';
    const syncErrors = new Map();
    const drafts = new Map();
    const deliveries = new Map();
    const acknowledged = new Map();
    let lastInput = 0;
    let typingConversation = null;
    let activityBusy = false;
    let readBusy = false;
    let sending = false;
    let observedConversation = null;
    const remoteTyping = new Map();
    let lastActivitySent = 0;

    function updateReadCounters() {
        for (const conversation of state.conversations || []) {
            const through = acknowledged.get(conversation.id) || 0;
            for (const message of conversation.messages) {
                if (!message.mine && Number(message.id) <= through) message.read = true;
            }
            conversation.unread = conversation.messages.filter(message => !message.mine && !message.read).length;
            const row = [...document.querySelectorAll('[data-action="conversation"]')]
                .find(node => node.dataset.id === conversation.id);
            if (row) {
                let badge = row.querySelector('.badge');
                if (!conversation.unread) badge?.remove();
                else {
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'badge';
                        row.append(badge);
                    }
                    badge.textContent = String(conversation.unread);
                    badge.setAttribute('aria-label', conversation.unread + ' messages non lus');
                }
            }
        }
        const total = (state.conversations || []).reduce((sum, conversation) => sum + conversation.unread, 0);
        document.querySelectorAll('.nav a[href="#messages"]').forEach(link => {
            let badge = link.querySelector('.count');
            if (!total) badge?.remove();
            else {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'count';
                    link.append(badge);
                }
                badge.textContent = String(total);
            }
        });
    }

    function visibleChat() {
        const chat = document.getElementById('chat-messages');
        return state.authenticated && current().page === 'messages' && !document.hidden &&
            chat && chat.getClientRects().length && getComputedStyle(chat).visibility !== 'hidden' ? chat : null;
    }
    async function quietRequest(action, data) {
        // Les petits appels d’activité ne remplacent pas l’état global de l’application.
        const response = await fetch('api.php?action=' + encodeURIComponent(action), {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrf || '' },
            body: JSON.stringify(data),
        });
        let result;
        try {
            result = await response.json();
        } catch {
            throw new Error('Réponse serveur illisible (HTTP ' + response.status + ').');
        }
        if (!response.ok || !result.success) throw new Error(result.message || 'Échec de synchronisation (HTTP ' + response.status + ').');
        return result;
    }
    function status(text, failed = false) {
        const node = document.getElementById('chat-activity');
        if (!node) return;
        node.textContent = text;
        node.classList.toggle('chat-send-error', failed);
    }
    function syncView() {
        if (!state.authenticated) {
            drafts.clear(); deliveries.clear(); acknowledged.clear(); remoteTyping.clear(); syncErrors.clear();
            return;
        }
        updateReadCounters();
        const input = document.querySelector('.chat-composer input');
        if (!input) return;
        if (observedConversation !== ui.conversation) {
            lastInput = 0;
            observedConversation = ui.conversation;
        }
        const draft = drafts.get(ui.conversation);
        if (draft !== undefined && input.value !== draft) input.value = draft;
        const delivery = deliveries.get(ui.conversation);
        const button = document.querySelector('.chat-composer button[type="submit"]');
        if (button) {
            button.disabled = sending;
            button.setAttribute('aria-label', delivery?.failed ? 'Réessayer l’envoi' : 'Envoyer le message');
            if (delivery?.failed) button.textContent = 'Réessayer';
        }
        if (delivery?.failed) status('Échec de confirmation : ' + delivery.error + ' Votre texte est conservé. Réessayez.', true);
        else if (sending) status('Envoi en cours…');
        else if (syncErrors.get(ui.conversation)?.size) {
            status([...syncErrors.get(ui.conversation).values()].join(' '), true);
            document.getElementById('chat-activity')?.classList.toggle('chat-is-typing', false);
        }
        else {
            const typing = (remoteTyping.get(ui.conversation) || 0) > Date.now();
            status(typing ? 'Votre correspondant écrit…' : '');
            document.getElementById('chat-activity')?.classList.toggle('chat-is-typing', typing);
        }
    }
    document.addEventListener('input', event => {
        if (!event.target.matches('.chat-composer input')) return;
        drafts.set(ui.conversation, event.target.value);
        typingConversation = ui.conversation;
        lastInput = Date.now();
        if (Date.now() - lastActivitySent > 1200) activity();
    });
    document.addEventListener('submit', async event => {
        const form = event.target;
        if (!form.matches('.chat-composer[data-form="message"]')) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (sending || ui.busy) return;
        const input = form.querySelector('[name="message"]');
        const body = input.value.trim();
        if (!body) return;
        const id = ui.conversation;
        let delivery = deliveries.get(id);
        if (!delivery || delivery.body !== body) {
            delivery = { body, key: crypto.randomUUID(), failed: false };
            deliveries.set(id, delivery);
        }
        delivery.failed = false;
        drafts.set(id, input.value);
        sending = true;
        ui.busy = true;
        lastInput = 0;
        syncView();
        try {
            await api('message.send', { id, message: body, client_key: delivery.key });
            deliveries.delete(id);
            // Préserver un texte saisi pendant l’envoi.
            if ((drafts.get(id) || '').trim() === body) drafts.set(id, '');
            if (current().page === 'messages' && ui.conversation === id) {
                render();
                syncView();
                document.querySelector('.chat-composer input')?.focus({ preventScroll: true });
            }
        } catch (error) {
            delivery.failed = true;
            delivery.error = error.message;
        } finally {
            sending = false;
            ui.busy = false;
            if (ui.conversation === id) {
                syncView();
                if (!delivery.failed) status('');
            }
        }
    }, true);

    function reportSync(id, kind, message = '') {
        if (!syncErrors.has(id)) syncErrors.set(id, new Map());
        const errors = syncErrors.get(id);
        if (message) errors.set(kind, message);
        else errors.delete(kind);
        if (ui.conversation === id) syncView();
    }

    async function acknowledgeVisible() {
        const chat = visibleChat();
        if (!chat || readBusy || sending) return;
        const bounds = chat.getBoundingClientRect();
        const ids = [...chat.querySelectorAll('[data-incoming="1"]')].filter(node => {
            const rect = node.getBoundingClientRect();
            return rect.top < bounds.bottom && rect.bottom > bounds.top;
        }).map(node => Number(node.dataset.messageId));
        // Au bas de la discussion, tous les messages chargés ont été parcourus.
        // Cela fonctionne aussi lorsque le dernier message est un message envoyé.
        const atBottom = chat.scrollHeight - chat.clientHeight - chat.scrollTop <= 48;
        const loaded = state.conversations?.find(conversation => conversation.id === ui.conversation);
        const through = atBottom
            ? Math.max(0, ...(loaded?.messages || []).map(message => Number(message.id)))
            : Math.max(0, ...ids);
        const id = ui.conversation;
        if (!through || through <= (acknowledged.get(id) || 0)) return;
        readBusy = true;
        try {
            await quietRequest('conversation.read', { id, through_id: through });
            reportSync(id, 'read');
            acknowledged.set(id, through);
            updateReadCounters();
        } catch (error) {
            reportSync(id, 'read', 'Lecture non synchronisée : ' + error.message);
        }
        finally { readBusy = false; }
    }
    async function activity() {
        const chat = visibleChat();
        if (!chat || activityBusy || sending) return;
        const id = ui.conversation;
        activityBusy = true;
        lastActivitySent = Date.now();
        try {
            const result = await quietRequest('conversation.activity', {
                id,
                typing: typingConversation === id && Date.now() - lastInput < 2500 && !!drafts.get(id)?.trim(),
            });
            reportSync(id, 'typing', result.ready === false
                ? 'Indicateur de saisie indisponible : tables de messagerie non installées.'
                : '');
            remoteTyping.set(id, result.typing ? Date.now() + 6000 : 0);
            if (ui.conversation === id) syncView();
        } catch (error) {
            reportSync(id, 'typing', 'Activité non synchronisée : ' + error.message);
        }
        finally { activityBusy = false; }
    }
    new MutationObserver(() => {
        syncView();
        // Après render() et la restauration de la position de défilement.
        setTimeout(acknowledgeVisible, 0);
    }).observe(document.getElementById('app'), { childList: true });
    document.addEventListener('scroll', event => {
        if (event.target.id === 'chat-messages') acknowledgeVisible();
    }, true);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) lastInput = 0;
        else { acknowledgeVisible(); activity(); }
    });
    window.addEventListener('hashchange', () => { lastInput = 0; });
    setInterval(() => { syncView(); acknowledgeVisible(); activity(); }, 2000);
    syncView();
})();
