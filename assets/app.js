'use strict';
// CiviConnect — interface connectée à api.php et MySQL.
// Icônes SVG utilisées par les composants.
const ICONS = {
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    layers: 'm12 3 10 6-10 6L2 9l10-6Zm-9 12 9 6 9-6M3 12l9 6 9-6',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    briefcase: 'M9 7V4h6v3M3 7h18v14H3zM3 12a23 23 0 0 0 18 0M10 12v3h4v-3',
    link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2',
    message:
        'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6A8.4 8.4 0 0 1 12.5 3h.5a8.5 8.5 0 0 1 8 8v.5Z',
    book: 'M3 3h6a4 4 0 0 1 3 2 4 4 0 0 1 3-2h6v17h-6a4 4 0 0 0-3 2 4 4 0 0 0-3-2H3zM12 5v17',
    settings:
        'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M9 3l-.6 2.2-2 .9-2-.6L2 9l1.7 1.6v2.8L2 15l2.4 3.5 2-.6 2 .9L9 21h6l.6-2.2 2-.9 2 .6L22 15l-1.7-1.6v-2.8L22 9l-2.4-3.5-2 .6-2-.9L15 3z',
    search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
    plus: 'M12 5v14M5 12h14',
    arrow: 'M5 12h14m-5-5 5 5-5 5',
    chevron: 'm9 5 7 7-7 7',
    down: 'm6 9 6 6 6-6',
    calendar: 'M8 2v4M16 2v4M3 9h18M3 4h18v18H3zM7 13h3M14 13h3M7 17h3',
    code: 'm8 5-7 7 7 7m8-14 7 7-7 7M14 3l-4 18',
    check: 'm5 12 4 4L19 6',
    checkCircle: 'm8 12 3 3 5-6M22 12a10 10 0 1 1-4-8',
    clock: 'M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    bookmark: 'M5 3h14v19l-7-4-7 4z',
    close: 'm6 6 12 12M6 18 18 6',
    menu: 'M3 6h18M3 12h18M3 18h18',
    shield: 'm12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6l9-4Zm-4 10 3 3 5-6',
    globe: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M2 12h20M12 2c6 6 6 14 0 20-6-6-6-14 0-20',
    leaf: 'M20 3C9 2 2 9 5 17c8 3 15-4 15-14ZM3 21l11-11',
    file: 'M14 2H5v20h14V7l-5-5ZM14 2v5h5M8 12h8M8 16h6',
    send: 'm22 2-7 20-4-9-9-4 20-7ZM11 13 22 2',
    mail: 'M3 5h18v14H3zM3 5l9 7 9-7',
    logOut: 'M9 3H3v18h6M9 12h13m-4-4 4 4-4 4',
    info: 'M12 11v6M12 7v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    alert: 'M12 3 1 21h22L12 3ZM12 9v5M12 17v.1',
    heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
    building: 'M4 22V5l8-3 8 3v17M1 22h22M8 7h1M15 7h1M8 11h1M15 11h1M8 15h1M15 15h1M10 22v-4h4v4',
    edit: 'm16 3 5 5-13 13-6 1 1-6L16 3ZM13 6l5 5',
    chart: 'M3 3v18h18M7 14l4-5 4 3 6-8',
    palette:
        'M12 2a10 10 0 1 0 0 20c2 0 2-2 1-3s-1-3 2-3h3c6 0 4-14-6-14ZM7 7h.1M12 5h.1M17 8h.1M5 12h.1',
    download: 'M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5',
    refresh: 'M20 6v6h-6M4 18v-6h6M5 8a8 8 0 0 1 13-3l2 3M4 16l2 3a8 8 0 0 0 13-3',
    coins: 'M21 6c0 2-4 3-9 3S3 8 3 6s4-3 9-3 9 1 9 3ZM3 6v12c0 2 4 3 9 3s9-1 9-3V6M3 12c0 2 4 3 9 3s9-1 9-3',
    lock: 'M5 10h14v12H5zM8 10V6a4 4 0 0 1 8 0v4M12 15v3',
    spark: 'm12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2',
    user: 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    back: 'M19 12H5m5-5-5 5 5 5',
    more: 'M5 12h.1M12 12h.1M19 12h.1',
    star: 'm12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6',
};
const icon = (name, size = 18) =>
    `
        <svg
            width="${size}"
            height="${size}"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <path d="${ICONS[name] || ICONS.code}" />
        </svg>
    `;
// Échappe le texte avant son insertion dans un gabarit HTML.
const esc = (v) =>
    String(v ?? '').replace(
        /[&<>"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );

// Données métier reçues de PHP ; les filtres et fenêtres restent dans ui.
let state = {
    authenticated: false,
    role: 'guest',
    profile: { name: 'Visiteur', skills: '' },
    projects: [],
    developers: [],
    needs: [],
    collaborations: [],
    conversations: [],
    notifications: [],
    favorites: [],
    talents: [],
    organisations: [],
    accounts: [],
    administrators: [],
    preferences: {},
};
const ui = {
    projectTab: 'catalogue',
    projectStatus: 'Tous',
    projectFilter: 'Tous',
    projectSearch: '',
    projectPage: 1,
    favoritesOnly: false,
    recruitingOnly: false,
    devSearch: '',
    country: 'Tous les pays',
    devPage: 1,
    availableOnly: false,
    needSearch: '',
    needCategory: 'Tous',
    needPage: 1,
    collabTab: 'Toutes',
    messageSearch: '',
    conversation: '',
    chatOpen: false,
    settingsTab: 'profile',
    adminTab: 'organisations',
    modal: null,
    returnFocus: null,
    scenario: 'ready',
    kitState: 'ready',
    mobile: false,
    authRole: 'developer',
    authMode: 'login',
    busy: false,
};
const roles = {
    guest: 'Visiteur',
    developer: 'Développeur',
    organisation: 'Organisation',
    admin: 'Administrateur',
};
const pageTitles = {
    dashboard: 'Tableau de bord',
    projets: 'Projets',
    developpeurs: 'Annuaire des talents',
    besoins: 'Besoins & opportunités',
    collaborations: 'Collaborations',
    messages: 'Messagerie',
    profil: 'Mon profil',
    administration: 'Administration',
    composants: 'Bibliothèque UI',
    aide: 'Guide d’utilisation',
    support: 'Aide et support',
    accueil: 'Accueil',
    connexion: 'Connexion',
    inscription: 'Inscription',
    projet: 'Détail du projet',
};
const current = () => {
    const parts = location.hash.slice(1).split('/');
    return { page: parts[0] || 'dashboard', id: parts[1] };
};
const go = (page) => {
    ui.mobile = false;
    ui.scenario = 'ready';
    if (location.hash === '#' + page) {
        render();
    } else {
        location.hash = page;
    }
};
const initials = (name) =>
    name
        .split(/\s+/)
        .map((s) => s[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
const badge = (text, color) =>
    `
        <span class="badge ${
            color ||
            {
                Publié: 'green',
                'En validation': 'orange',
                Brouillon: 'gray',
                'À répondre': 'orange',
                'En cours': 'blue',
                Acceptée: 'green',
                Refusée: 'red',
                'En attente': 'orange',
                Vérifiée: 'green',
                Refusée: 'red',
                Ouvert: 'green',
            }[text] ||
            'gray'
        }">
            <span class="dot"></span>
            ${esc(text)}
        </span>
    `;
const avatar = (name, color = '', size = '', url = '') =>
    `
        <span
            class="avatar ${esc(color)} ${esc(size)}"
            data-initials="${esc(name)}"
        >
            ${url ? `<img src="${esc(url)}" alt="" loading="lazy">` : esc(name)}
        </span>
    `;
const tags = (skills) =>
    `
        <div class="tags">${skills
            .map(
                (t) => `
        <span class="tag">${esc(t)}</span>
    `,
            )
            .join('')}</div>
    `;
const button = (label, action, style = 'primary', ico = '', attrs = '') =>
    `
        <button
            type="button"
            class="btn ${style}"
            data-action="${action}"
            ${attrs}
        >
            ${ico ? icon(ico, 15) : ''}${label}
        </button>
    `;
const link = (label, route, ico = 'arrow') =>
    `
        <a class="text-link" href="#${route}">
            ${label}${icon(ico, 14)}
        </a>
    `;
const brand = () =>
    `
        <a class="brand" href="#accueil" aria-label="CiviConnect Africa, accueil">
            <span class="brand-mark">${icon('code', 22)}</span>
            <span>
                CiviConnect
                <em>AFRICA</em>
            </span>
        </a>
    `;
const empty = (
    title = 'Aucun résultat pour le moment',
    desc = 'Essayez d’autres mots-clés ou élargissez vos filtres.',
    action = 'reset-filters',
    label = 'Réinitialiser les filtres',
) =>
    `
        <div class="panel empty-state">
            <div class="empty-icon">${icon('search', 27)}</div>
            <h3>${title}</h3>
            <p>${desc}</p>
            ${button(label, action, '', 'refresh')}
        </div>
    `;
const loading = () =>
    `
        <div class="grid-3" aria-busy="true" aria-label="Chargement des contenus">
            ${[1, 2, 3]
                .map(
                    () => `
        <div class="panel skeleton-card">
            <div class="skeleton large"></div>
            <div class="skeleton medium"></div>
            <div class="skeleton short"></div>
        </div>
    `,
                )
                .join('')}
        </div>
    `;
const errorState = () =>
    `
        <div class="panel empty-state error-state" role="alert">
            <div class="empty-icon">${icon('alert', 27)}</div>
            <h3>Les contenus n’ont pas pu être chargés</h3>
            <p>La connexion semble interrompue. Vos données sont conservées ; vous pouvez réessayer.</p>
            ${button('Réessayer', 'retry', '', 'refresh')}
        </div>
    `;
const field = (label, name, value = '', type = 'text', full = false, help = '', extra = '') =>
    `
        <div class="field ${full ? 'full' : ''}">
            <label for="f-${name}">${label}</label>
            <input
                class="input"
                id="f-${name}"
                name="${name}"
                type="${type}"
                value="${esc(value)}"
                ${extra}
            />
            ${
                help
                    ? `
        <small>${help}</small>
    `
                    : ''
            }
            <span class="field-error" id="err-${name}"></span>
        </div>
    `;

function scenarioControls() {
    return '';
}
let toastTimer;
function toast(msg, error = false) {
    clearTimeout(toastTimer);
    document.getElementById('toast-root').innerHTML = `
            <div class="toast ${error ? 'error' : ''}" role="status">
                ${icon(error ? 'alert' : 'checkCircle', 19)}${esc(msg)}
            </div>
        `;
    toastTimer = setTimeout(() => (document.getElementById('toast-root').innerHTML = ''), 4200);
}
function heading(title, desc, cta = '') {
    return `
        <div class="page-heading">
            <div>
                <h1>${title}</h1>
                <p>${desc}</p>
            </div>
            ${cta}
        </div>
    `;
}

function projectMini(p) {
    return `
        <div class="project-mini">
            <div class="project-symbol ${p.color}">${icon(
                p.category === 'Administration'
                    ? 'file'
                    : p.category === 'Éducation'
                      ? 'book'
                      : 'layers',
                21,
            )}</div>
            <div>
                <h3><a href="#projet/${p.id}">${esc(p.title)}</a></h3>
                <p>${esc(domainLabel(p))} · ${p.skills.slice(0, 2).map(esc).join(', ')}</p>
            </div>
            ${badge(p.status)}
            <a
                class="text-link"
                href="#projet/${p.id}"
                aria-label="Voir ${esc(p.title)}"
            >
                ${icon('chevron', 15)}
            </a>
        </div>
    `;
}

// Cartes et catalogues de projets.
// La présentation reste du texte dans MySQL. Seuls les titres et les listes
// sont mis en forme ; tout le contenu saisi est échappé avant affichage.
function projectDescription(description) {
    const blocks = [];
    let paragraph = [];
    let items = [];

    function flush() {
        if (paragraph.length) {
            blocks.push(`<p>${paragraph.map(esc).join('<br>')}</p>`);
            paragraph = [];
        }
        if (items.length) {
            blocks.push(`<ul>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`);
            items = [];
        }
    }

    for (const line of String(description || '')
        .replace(/\r\n?/g, '\n')
        .split('\n')) {
        const title = line.match(/^#{2,3}\s+(.+)$/);
        const item = line.match(/^\s*[-*]\s+(.+)$/);
        if (!line.trim()) {
            flush();
        } else if (title) {
            flush();
            blocks.push(`<h3>${esc(title[1])}</h3>`);
        } else if (item) {
            if (paragraph.length) {
                flush();
            }
            items.push(item[1]);
        } else {
            if (items.length) {
                flush();
            }
            paragraph.push(line);
        }
    }
    flush();
    return blocks.join('\n');
}

function projectExcerpt(description, limit = 220) {
    const text = String(description || '')
        .split(/\r?\n/)
        .filter((line) => !/^#{2,3}\s/.test(line))
        .map((line) => line.replace(/^\s*[-*]\s+/, '').trim())
        .filter(Boolean)
        .join(' ');
    return text.length > limit ? text.slice(0, limit - 3) + '…' : text;
}

function updateProjectDescriptionPreview() {
    const input = document.getElementById('f-description');
    const preview = document.getElementById('project-description-preview');
    const count = document.getElementById('project-description-count');
    if (!input || !preview) {
        return;
    }
    preview.innerHTML = input.value.trim()
        ? projectDescription(input.value)
        : '<p>Votre présentation apparaîtra ici au fil de la saisie.</p>';
    if (count) {
        count.textContent = input.value.length.toLocaleString('fr-FR') + ' / 10 000 caractères';
    }
}

function publicationTime(item) {
    const value = item.publishedAt || item.createdTimestamp || item.createdAt || '';
    if (!value) return 0;
    const ms = Date.parse(value.includes('T') ? value : value.replace(' ', 'T') + (value.length > 10 ? 'Z' : 'T00:00:00Z'));
    return Number.isFinite(ms) ? ms : 0;
}
function recentBadge(item) {
    const time = publicationTime(item), age = Date.now() - time;
    return time > 0 && age >= 0 && age < 7 * 86400000 ? badge('Nouveau', 'green') : '';
}
function sortedPublications(items, order = 'recent') {
    return [...items].sort((a, b) => {
        const diff = publicationTime(b) - publicationTime(a) || Number(b.id) - Number(a.id);
        return order === 'oldest' ? -diff : diff;
    });
}
function publicationSort(kind) {
    const order = ui[kind + 'Sort'] || 'recent';
    return `<label class="publication-sort">Trier par <select class="input" id="${kind}-sort">
        <option value="recent" ${order === 'recent' ? 'selected' : ''}>Plus récents</option>
        <option value="oldest" ${order === 'oldest' ? 'selected' : ''}>Plus anciens</option>
    </select></label>`;
}
function projectCard(p) {
    return `
        <article class="panel project-card">
            <div class="project-cover ${p.color}">
                <span class="cover-meta">${badge(domainLabel(p), 'gray')}</span>
                <button
                    class="icon-btn ${state.favorites.includes(p.id) ? 'saved' : ''}"
                    data-action="favorite"
                    data-id="${p.id}"
                    aria-label="${state.favorites.includes(p.id) ? 'Retirer' : 'Sauvegarder'} ${esc(p.title)}"
                    aria-pressed="${state.favorites.includes(p.id)}"
                >
                    ${icon('bookmark', 15)}
                </button>
                <div class="cover-content">
                    ${esc(p.brand)}
                    <em>${esc(p.em)}</em>
                </div>
            </div>
            <div class="project-body">
                <div class="tags">${badge(p.status)}${p.status === 'Publié' ? recentBadge(p) : ''}${p.seekingCollaborators ? badge('Recherche des collaborateurs', 'green') : ''}</div>
                <h3><a href="#projet/${p.id}">${esc(p.title)}</a></h3>
                <p>${esc(projectExcerpt(p.description))}</p>
                ${tags(p.skills)}
            </div>
            <div class="project-card-footer">
                <span class="row small-gap">${avatar(p.initials, '', '', p.avatarUrl)}${esc(p.owner)}</span>
                ${link('Découvrir', 'projet/' + p.id)}
            </div>
        </article>
    `;
}

// Pagination commune aux trois catalogues, avec un nombre limité de boutons.
function pagination(pages, page, action) {
    const visible = new Set([1, pages, page - 1, page, page + 1]);
    const numbers = [...visible].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
    const pageButton = (number, label, disabled = false) => `
        <button type="button"
            class="${number === page && !disabled ? 'active' : ''}"
            data-action="${action}" data-id="${number}"
            aria-label="${label}"
            ${label.startsWith('Page ') && number === page ? 'aria-current="page"' : ''}
            ${disabled ? 'disabled' : ''}>${label.startsWith('Page ') ? number : label}</button>`;
    return `
        <nav class="pagination catalogue-pagination" aria-label="Pagination du catalogue">
            <span class="pagination-summary">Page ${page} sur ${pages}</span>
            <div class="pagination-controls">
                ${pageButton(page - 1, 'Précédent', page === 1)}
                ${numbers.map((number, index) =>
                    (index && number - numbers[index - 1] > 1 ? '<span aria-hidden="true">…</span>' : '') +
                    pageButton(number, 'Page ' + number)).join('')}
                ${pageButton(page + 1, 'Suivant', page === pages)}
            </div>
        </nav>`;
}

function focusCatalogue() {
    const target = document.querySelector('.filters-count');
    if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
}

function projects() {
    const q = ui.projectSearch.toLocaleLowerCase('fr');
    let list = state.projects.filter(
        (p) =>
            (ui.projectTab === 'mine'
                ? p.mine
                : ui.projectTab === 'saved'
                  ? p.status === 'Publié' && state.favorites.includes(p.id)
                  : ui.projectTab === 'all'
                    ? true
                    : p.status === 'Publié') &&
            (ui.projectStatus === 'Tous' || p.status === ui.projectStatus) &&
            (ui.projectFilter === 'Tous' || itemDomains(p).includes(ui.projectFilter)) &&
            (!ui.favoritesOnly || state.favorites.includes(p.id)) &&
            (!ui.recruitingOnly || p.seekingCollaborators) &&
            (p.title + ' ' + p.description + ' ' + p.skills.join(' '))
                .toLocaleLowerCase('fr')
                .includes(q),
    );
    list = sortedPublications(list, ui.projectSort);
    const pages = Math.max(1, Math.ceil(list.length / 6));
    ui.projectPage = Math.min(ui.projectPage, pages);
    return (
        heading(
            'Des solutions qui font avancer l’Afrique.',
            'Explorez les projets, repérez une idée et donnez-lui de nouvelles perspectives.',
            state.role === 'developer'
                ? button('Nouveau projet', 'new-project', 'primary', 'plus')
                : '',
        ) +
        `
            <div class="page-tabs">
                <button data-action="project-tab" data-id="catalogue" class="${ui.projectTab === 'catalogue' ? 'active' : ''}">
                    Catalogue de projets
                </button>
                ${state.authenticated ? `
                <button
                    data-action="project-tab"
                    data-id="${
                        state.role === 'organisation'
                            ? 'saved'
                            : state.role === 'admin'
                              ? 'all'
                              : 'mine'
                    }"
                    class="${ui.projectTab !== 'catalogue' ? 'active' : ''}"
                >
                    ${
                        state.role === 'organisation'
                            ? 'Ma sélection'
                            : state.role === 'admin'
                              ? 'Toutes les publications'
                              : 'Mes projets'
                    } ${badge(
                        String(
                            state.role === 'organisation'
                                ? state.favorites.length
                                : state.role === 'admin'
                                  ? state.projects.length
                                  : state.projects.filter((p) => p.mine).length,
                        ),
                        'gray',
                    )}
                </button>
                ` : ''}
            </div>
            <div class="panel toolbar">
                <div class="input-wrap">
                    ${icon('search', 16)}
                    <input
                        class="input"
                        id="project-search"
                        data-search="projectSearch"
                        value="${esc(ui.projectSearch)}"
                        placeholder="Rechercher un projet, une technologie…"
                        aria-label="Rechercher dans les projets"
                    />
                </div>
                ${publicationSort('project')}
                <select class="input" id="project-category" aria-label="Secteur du projet">
                    ${[
                        'Tous',
                        'Administration',
                        'Éducation',
                        'Santé',
                        'Agriculture',
                        'Citoyenneté',
                        'Environnement',
                    ]
                        .map(
                            (s) => `
            <option ${ui.projectFilter === s ? 'selected' : ''}>${s}</option>
        `,
                        )
                        .join('')}
                </select>
                <label>
                    <input type="checkbox" id="project-recruiting" ${ui.recruitingOnly ? 'checked' : ''} />
                    Recherche de collaborateurs
                </label>
                <label>
                    <input type="checkbox" id="project-favorites" ${ui.favoritesOnly ? 'checked' : ''} />
                    Sauvegardés
                </label>
                ${scenarioControls()}
            </div>
            <div class="filters-count">
                <b>${list.length}</b>
                projet${list.length > 1 ? 's' : ''} ${ui.projectTab === 'mine' ? 'dans votre espace' : 'à découvrir'}
                <span class="muted">· Des solutions utiles aux territoires</span>
            </div>
            ${
                ui.scenario === 'loading'
                    ? loading()
                    : ui.scenario === 'error'
                      ? errorState()
                      : ui.scenario === 'empty'
                        ? empty(
                              'Aucun projet pour le moment',
                              'Votre prochain projet a sa place ici. Commencez par partager votre idée.',
                              'new-project',
                              'Créer un projet',
                          )
                        : list.length
                          ? `
                          <div class="grid-3 catalogue-grid">${list
                              .slice((ui.projectPage - 1) * 6, ui.projectPage * 6)
                              .map(projectCard)
                              .join('')}</div>
                          ${pages > 1 ? pagination(pages, ui.projectPage, 'project-page') : ''}
                      `
                          : empty()
            }
        `
    );
}

// Annuaire des développeurs.
function developerCard(d) {
    return `
        <article class="panel developer-card">
            <button
                class="icon-btn ${state.talents.includes(d.id) ? 'saved' : ''}"
                data-action="save-talent"
                data-id="${d.id}"
                aria-label="Sauvegarder ${esc(d.name)}"
                aria-pressed="${state.talents.includes(d.id)}"
            >
                ${icon('bookmark', 14)}
            </button>
            ${avatar(d.initials, d.color, 'lg', d.avatarUrl)}
            <h3>${esc(d.name)}</h3>
            <p class="specialty">${esc(d.specialty || "Spécialité non renseignée")}</p>
            <p class="location">${icon('pin', 12)}${[d.city, d.country].filter(Boolean).map(esc).join(', ')}</p>
            ${tags(d.skills)}
            <div class="bottom">
                <div>
                    ${badge(d.available ? 'Disponible' : 'En mission', d.available ? 'green' : 'gray')}
                    <small style="display: block; margin-top: 6px">
                        ${d.projects} projet${Number(d.projects) === 1 ? '' : 's'} partagé${Number(d.projects) === 1 ? '' : 's'}
                    </small>
                </div>
                ${button('Voir le profil', 'developer-detail', '', 'arrow', `data-id="${d.id}"`)}
            </div>
        </article>
    `;
}

function developers() {
    const q = ui.devSearch.toLocaleLowerCase('fr');
    const list = state.developers.filter(
        (d) =>
            (d.name + ' ' + d.skills.join(' ')).toLocaleLowerCase('fr').includes(q) &&
            (ui.country === 'Tous les pays' || d.country === ui.country) &&
            (!ui.availableOnly || d.available),
    );
    const pages = Math.max(1, Math.ceil(list.length / 6));
    ui.devPage = Math.min(ui.devPage, pages);
    return (
        heading(
            'Les talents derrière les solutions.',
            'Rencontrez des développeurs engagés et trouvez votre prochaine collaboration.',
        ) +
        `
            <div class="panel toolbar">
                <div class="input-wrap">
                    ${icon('search', 16)}
                    <input
                        class="input"
                        id="developer-search"
                        data-search="devSearch"
                        value="${esc(ui.devSearch)}"
                        aria-label="Rechercher un talent"
                        placeholder="Un nom, une compétence…"
                    />
                </div>
                <select class="input" id="developer-country" aria-label="Pays du développeur">
                    ${['Tous les pays', ...new Set(state.developers.map((d) => d.country))]
                        .map(
                            (c) => `
            <option ${ui.country === c ? 'selected' : ''}>${esc(c)}</option>
        `,
                        )
                        .join('')}
                </select>
                <label>
                    <input type="checkbox" id="developer-available" ${ui.availableOnly ? 'checked' : ''} />
                    Disponibles uniquement
                </label>
                ${scenarioControls()}
            </div>
            <div class="filters-count">
                <b>${list.length}</b>
                ${list.length === 1 ? 'talent' : 'talents'} ${
                    ui.country !== 'Tous les pays'
                        ? '· ' + esc(ui.country)
                        : '· Des compétences à travers l’Afrique'
                }
            </div>
            ${
                ui.scenario === 'loading'
                    ? loading()
                    : ui.scenario === 'error'
                      ? errorState()
                      : ui.scenario === 'empty'
                        ? empty(
                              'L’annuaire attend ses premiers talents',
                              'Les profils des comptes inscrits apparaîtront ici.',
                              'retry',
                              'Revenir à la démo',
                          )
                        : list.length
                          ? `
                          <div class="grid-3 catalogue-grid">${list
                              .slice((ui.devPage - 1) * 6, ui.devPage * 6)
                              .map(developerCard)
                              .join('')}</div>
                          ${pages > 1 ? pagination(pages, ui.devPage, 'dev-page') : ''}
                      `
                          : empty()
            }
        `
    );
}

function needCard(n) {
    return `
        <article class="panel need-card">
            <div class="need-top">${
                n.avatarUrl
                    ? avatar(initials(n.org), '', 'square', n.avatarUrl)
                    : `
        <span class="project-symbol ${n.color}">${icon(
            n.category === 'Administration'
                ? 'building'
                : n.category === 'Éducation'
                  ? 'book'
                  : 'leaf',
            23,
        )}</span>
    `
            }${badge(n.status)}${n.status === 'Ouvert' && n.publicVisible !== false ? recentBadge(n) : ''}</div>
            <div class="org-label">${esc(n.org)} · ${esc(domainLabel(n))}</div>
            <h3>${esc(n.title)}</h3>
            <p>${esc(projectExcerpt(n.description, 160))}</p>
            ${tags(n.skills)}
            <div class="need-meta">
                <span>${icon('coins', 13)}${esc(n.budget)}</span>
                <span>${icon('calendar', 13)}${esc(n.deadline)}</span>
            </div>
            <div class="bottom spread">
                <span class="muted" style="font-size: 10px">Besoin publié</span>
                <div class="need-actions">
                    ${button('Voir le besoin', 'need-detail', '', 'arrow', `data-id="${n.id}"`)}
                    ${state.role === 'developer' && !n.mine && n.status === 'Ouvert'
                        ? button('Proposer une solution', 'propose', 'primary', 'link', `data-id="${n.id}"`)
                        : ''}
                </div>
            </div>
        </article>
    `;
}

function needs() {
    let list = state.needs.filter(
        (n) =>
            (n.title + ' ' + n.org + ' ' + n.skills.join(' '))
                .toLocaleLowerCase('fr')
                .includes(ui.needSearch.toLocaleLowerCase('fr')) &&
            (ui.needCategory === 'Tous' || itemDomains(n).includes(ui.needCategory)),
    );
    const pages = Math.max(1, Math.ceil(list.length / 6));
    list = sortedPublications(list, ui.needSort);
    ui.needPage = Math.max(1, Math.min(ui.needPage, pages));
    return (
        heading(
            'Des besoins concrets. Votre talent en réponse.',
            'Découvrez les défis des organisations et proposez des solutions utiles.',
            state.role === 'organisation'
                ? button('Exprimer un besoin', 'new-need', 'primary', 'plus')
                : '',
        ) +
        `
            <div class="panel toolbar">
                <div class="input-wrap">
                    ${icon('search', 16)}
                    <input
                        class="input"
                        data-search="needSearch"
                        id="need-search"
                        value="${esc(ui.needSearch)}"
                        placeholder="Rechercher un besoin…"
                        aria-label="Rechercher un besoin"
                    />
                </div>
                ${publicationSort('need')}
                <select class="input" id="need-category" aria-label="Secteur du besoin">
                    ${['Tous', 'Administration', 'Éducation', 'Santé', 'Agriculture', 'Citoyenneté', 'Environnement']
                        .map(
                            (c) => `
            <option ${ui.needCategory === c ? 'selected' : ''}>${c}</option>
        `,
                        )
                        .join('')}
                </select>
                ${scenarioControls()}
            </div>
            <div class="filters-count">
                <b>${list.length}</b>
                besoin${list.length > 1 ? 's' : ''} affiché${list.length > 1 ? 's' : ''} · ${list.filter((n) => n.status === 'Ouvert').length} ouvert${list.filter((n) => n.status === 'Ouvert').length > 1 ? 's' : ''}
            </div>
            ${
                ui.scenario === 'loading'
                    ? loading()
                    : ui.scenario === 'error'
                      ? errorState()
                      : ui.scenario === 'empty'
                        ? empty(
                              'Aucune opportunité ouverte',
                              'Les nouveaux besoins des organisations seront affichés ici.',
                              'retry',
                              'Revenir à la démo',
                          )
                        : list.length
                          ? `
            <div class="catalogue-needs">${list
                .slice((ui.needPage - 1) * 6, ui.needPage * 6)
                .map(needCard).join('')}</div>
            ${pages > 1 ? pagination(pages, ui.needPage, 'need-page') : ''}
        `
                          : empty()
            }
        `
    );
}

function collaborations() {
    const list = state.collaborations.filter(
        (c) =>
            ui.collabTab === 'Toutes' ||
            (ui.collabTab === 'Reçues' && c.incoming) ||
            (ui.collabTab === 'Envoyées' && !c.incoming) ||
            (ui.collabTab === 'Acceptées' && c.status === 'Acceptée'),
    );
    return (
        heading(
            'Les idées avancent mieux ensemble.',
            'Retrouvez vos demandes, vos propositions et vos collaborations.',
        ) +
        `
            <div class="page-tabs">${['Toutes', 'Reçues', 'Envoyées', 'Acceptées']
                .map(
                    (t) => `
            <button data-action="collab-tab" data-id="${t}" class="${ui.collabTab === t ? 'active' : ''}">
                ${t}${t === 'Toutes' ? badge(String(state.collaborations.length), 'gray') : ''}
            </button>
        `,
                )
                .join('')}</div>
            ${
                list.length
                    ? `
            <section class="panel">${list
                .map(
                    (c) => `
            <article class="collab-row">
                ${avatar(c.initials, c.color, 'square', c.avatarUrl)}
                <div class="grow">
                    <h3>${esc(c.name)}</h3>
                    <p>${esc(c.subject)}</p>
                    <small class="muted">
                        ${esc(c.project)} · ${c.date} · ${c.incoming ? 'Reçue' : 'Envoyée'}
                    </small>
                </div>
                <div class="row-actions">${badge(c.status)}${
                    c.status === 'À répondre' && c.incoming
                        ? `${button('Décliner', 'decline-collab', 'sm', '', `data-id="${c.id}"`)}${button('Accepter', 'accept-collab', 'primary sm', 'check', `data-id="${c.id}"`)}`
                        : button('Échanger', 'collab-message', 'sm', 'message', `data-id="${c.id}"`)
                }</div>
            </article>
        `,
                )
                .join('')}</section>
        `
                    : empty(
                          'Aucune collaboration dans cette rubrique',
                          'Explorez les projets ou les besoins pour commencer une nouvelle rencontre.',
                          'all-projects',
                          'Explorer les projets',
                      )
            }
        `
    );
}

// Liste des conversations et historique de la discussion sélectionnée.
function messages() {
    const conv =
        state.conversations.find((c) => c.id === ui.conversation) || state.conversations[0];
    if (!conv) {
        return empty(
            'Aucune conversation',
            'Une première collaboration peut ouvrir la discussion.',
            'all-projects',
            'Explorer les projets',
        );
    }
    ui.conversation = conv.id;
    return (
        heading(
            'Une conversation peut tout commencer.',
            'Échangez avec les organisations et les talents de votre réseau.',
        ) +
        `
            <div class="panel conversation-shell ${ui.chatOpen ? 'chat-open' : ''}">
                <aside class="conversation-list" aria-label="Conversations">
                    <div class="conversation-list-head">
                        <h2>
                            Vos échanges
                            <span class="badge gray">${state.conversations.length}</span>
                        </h2>
                        <div class="input-wrap">
                            ${icon('search', 14)}
                            <input
                                class="input"
                                id="message-search"
                                data-search="messageSearch"
                                value="${esc(ui.messageSearch)}"
                                aria-label="Rechercher une conversation"
                                placeholder="Rechercher une conversation…"
                            />
                        </div>
                    </div>
                    ${
                        state.conversations
                            .filter((c) =>
                                c.name.toLowerCase().includes(ui.messageSearch.toLowerCase()),
                            )
                            .map(
                                (c) =>
                                    `
                            <button
                                class="conversation-item ${c.id === conv.id ? 'active' : ''}"
                                data-action="conversation"
                                data-id="${c.id}"
                                aria-pressed="${c.id === conv.id}"
                            >
                                ${avatar(c.initials, c.color, '', c.avatarUrl)}
                                <div class="grow">
                                    <strong>${esc(c.name)}</strong>
                                    <p>${esc(c.messages[c.messages.length - 1]?.text || 'Démarrer la conversation')}</p>
                                </div>
                                ${c.unread ? `<span class="badge" aria-label="${c.unread} messages non lus">${c.unread}</span>` : ''}
                                ${icon('chevron', 12)}
                            </button>
                        `,
                            )
                            .join('') ||
                        `
                <p class="muted panel-pad" style="font-size: 11px">Aucune conversation trouvée.</p>
            `
                    }
                </aside>
                <section class="chat" aria-label="Discussion avec ${esc(conv.name)}">
                    <div class="chat-head">
                        <button
                            class="icon-btn back-mobile"
                            data-action="back-chats"
                            aria-label="Retour aux conversations"
                        >
                            ${icon('back', 15)}
                        </button>
                        ${avatar(conv.initials, conv.color, '', conv.avatarUrl)}
                        <div>
                            <h3>${esc(conv.name)}</h3>
                            <p>${esc(conv.context)}</p>
                        </div>
                        ${badge('Messagerie', 'green')}
                    </div>
                    <div
                        class="chat-messages"
                        id="chat-messages"
                        role="log"
                        aria-label="Historique des messages"
                        aria-live="polite"
                    >
                        <div class="chat-date">Historique de la conversation</div>
                        ${conv.messages
                            .map(
                                (m, index) => `
            ${index === 0 || conv.messages[index - 1].date !== m.date ? `<div class="chat-date">${esc(m.date)}</div>` : ''}
            <div class="bubble ${m.mine ? 'mine' : ''}" data-message-id="${esc(m.id)}" data-incoming="${m.mine ? '0' : '1'}">
                <div class="message-text">${esc(m.text)}</div>
                <small>${esc(m.time)}${m.mine ? (m.read ? ' · ✓✓ Lu' : ' · ✓ Envoyé') : ''}</small>
            </div>
        `,
                            )
                            .join('')}
                    </div>
                    <div id="chat-activity" role="status" aria-live="polite"></div>
                    <form class="chat-composer" data-form="message">
                        <input
                            class="input"
                            id="message-input"
                            name="message"
                            aria-label="Votre message"
                            placeholder="Écrivez votre message…"
                            autocomplete="off"
                            maxlength="2000"
                            required
                        />
                        <button class="btn primary" type="submit" aria-label="Envoyer le message">
                            ${icon('send', 17)}
                        </button>
                    </form>
                </section>
            </div>
        `
    );
}

// Fenêtres de saisie et gestion du focus.
function openModal(title, subtitle, body, foot = '', wide = false) {
    ui.returnFocus = document.activeElement;
    document.getElementById('modal-root').innerHTML = `
            <div class="modal-overlay" data-action="dismiss-overlay">
                <section
                    class="modal ${wide ? 'wide' : ''}"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    tabindex="-1"
                >
                    <header class="modal-head">
                        <div>
                            <h2 id="modal-title">${title}</h2>
                            <p>${subtitle}</p>
                        </div>
                        <button class="icon-btn" data-action="close-modal" aria-label="Fermer la fenêtre">
                            ${icon('close', 17)}
                        </button>
                    </header>
                    <div class="modal-body">${body}</div>
                    ${
                        foot
                            ? `
            <footer class="modal-foot">${foot}</footer>
        `
                            : ''
                    }
                </section>
            </div>
        `;
    document.body.style.overflow = 'hidden';
    const target =
        document.querySelector('.modal [autofocus]') ||
        document.querySelector('.modal input') ||
        document.querySelector('.modal');
    target?.focus();
}

function closeModal() {
    document.getElementById('modal-root').innerHTML = '';
    document.body.style.overflow = '';
    ui.modal = null;
    ui.returnFocus?.focus?.();
}

function projectModal(id) {
    const p = id ? state.projects.find((p) => p.id === id) : null;
    ui.modal = { kind: 'project', id };
    openModal(
        p ? 'Faites évoluer votre projet.' : 'Une idée à partager ?',
        'Présentez le besoin, votre solution et ce que l’on peut déjà essayer.',
        `
            <form id="project-form" data-form="project" novalidate>
                <div class="form-grid">
                    ${field(
                        'Nom du projet *',
                        'title',
                        p?.title || '',
                        'text',
                        true,
                        'Un nom clair et facile à retenir.',
                        'maxlength="150" autofocus',
                    )}
                    <div class="field full">
                        <label for="f-description">Présentation détaillée du projet *</label>
                        <textarea
                            class="input"
                            id="f-description"
                            name="description"
                            placeholder="Quel besoin résolvez-vous ? Pour qui ? Décrivez les fonctionnalités et ce qui est déjà utilisable."
                            maxlength="10000"
                            rows="12"
                            aria-describedby="project-description-help project-description-count"
                        >${esc(p?.description || '')}</textarea>
                        <small id="project-description-help">
                            Vous pouvez ajouter des paragraphes, des titres commençant par ## et des
                            listes dont chaque ligne commence par - .
                        </small>
                        <small id="project-description-count">${(p?.description?.length || 0).toLocaleString('fr-FR')} / 10 000 caractères</small>
                        <span class="field-error" id="err-description"></span>
                        <details class="project-writing-preview">
                            <summary>Voir l’aperçu de la présentation</summary>
                            <div id="project-description-preview" class="prose project-description">
                                ${p?.description ? projectDescription(p.description) : '<p>Votre présentation apparaîtra ici au fil de la saisie.</p>'}
                            </div>
                        </details>
                    </div>
                    ${domainFields(p)}
                    ${field(
                        'Technologies *',
                        'skills',
                        p?.skills.join(', ') || '',
                        'text',
                        false,
                        'Séparez les technologies par une virgule.',
                        'maxlength="500"',
                    )}${field('Lien du dépôt GitHub', 'github_url', p?.github_url || '', 'url')}${field('Lien de démonstration', 'demo_url', p?.demo_url || '', 'url')}
                </div>
                ${
                    state.features?.peerCollaboration
                        ? `
            <div class="recruitment-box">
                <div class="switch-row">
                    <div>
                        <label for="f-seeking"><strong>Je recherche des collaborateurs</strong></label>
                        <p>
                            Les autres développeurs pourront vous proposer de rejoindre ce projet après sa
                            publication.
                        </p>
                    </div>
                    <input
                        id="f-seeking"
                        class="switch"
                        type="checkbox"
                        name="seeking_collaborators"
                        ${p?.seekingCollaborators ? 'checked' : ''}
                    />
                </div>
                ${field(
                    'Compétences recherchées',
                    'wanted_skills',
                    p?.wantedSkills?.join(', ') || '',
                    'text',
                    true,
                    'Ex. : PHP, design UI, tests — séparées par des virgules.',
                    'maxlength="500"',
                )}
            </div>
        `
                        : `
            <p class="notice">
                La base choisie est incomplète. Vérifiez les paramètres de votre installation.
            </p>
        `
                }
                <div class="notice orange" style="margin-top: 20px; margin-bottom: 0">
                    ${icon('info', 16)}Le projet sera visible dans le catalogue après validation par un
                    administrateur.
                </div>
            </form>
        `,
        `
            ${button('Annuler', 'close-modal', '')}
            <button class="btn" type="submit" form="project-form" name="intent" value="draft">
                Enregistrer le brouillon
            </button>
            <button class="btn primary" type="submit" form="project-form" name="intent" value="review">
                Envoyer en validation ${icon('arrow', 14)}
            </button>
        `,
    );
}

function collaborationModal(kind, id) {
    const item =
        kind === 'project'
            ? state.projects.find((p) => p.id === id)
            : state.needs.find((n) => n.id === id);
    if (!item) {
        return;
    }
    ui.modal = { kind: 'collaboration', source: kind, id };
    openModal(
        kind === 'project'
            ? 'Faisons avancer ce projet.'
            : 'Votre talent peut faire la différence.',
        esc(item.title),
        `
            <form id="collab-form" data-form="collaboration" novalidate>
                <div class="notice">${icon('link', 16)}${
                    kind === 'project'
                        ? `
            Vous souhaitez collaborer autour de
            <strong>${esc(item.title)}</strong>
            .
        `
                        : `
            Vous proposez votre aide à
            <strong>${esc(item.org)}</strong>
            .
        `
                }</div>
                ${field(
                    'Objet de votre demande *',
                    'subject',
                    kind === 'project'
                        ? 'Échanger autour de ' + item.title
                        : 'Proposition pour ' + item.title,
                    'text',
                    false,
                    '',
                    'maxlength="120" autofocus',
                )}
                <div class="field" style="margin-top: 16px">
                    <label for="f-message">Votre message *</label>
                    <textarea
                        class="input"
                        name="message"
                        id="f-message"
                        placeholder="Présentez votre contexte et ce que vous aimeriez construire ensemble."
                        maxlength="1500"
                    ></textarea>
                    <span class="field-error" id="err-message"></span>
                </div>
                <p class="prose" style="font-size: 10px; margin-top: 15px">
                    Votre demande sera transmise au destinataire.
                </p>
            </form>
        `,
        `
            ${button('Annuler', 'close-modal', '')}
            <button class="btn primary" type="submit" form="collab-form">
                Envoyer la demande ${icon('send', 14)}
            </button>
        `,
    );
}

function openDeveloper(id) {
    const d = state.developers.find((d) => d.id === id);
    if (!d) {
        return;
    }
    ui.modal = { kind: 'developer', id };
    openModal(
        esc(d.name),
        esc(d.specialty || 'Spécialité non renseignée'),
        `
            <div class="row" style="margin-bottom: 20px">
                ${avatar(d.initials, d.color, 'lg', d.avatarUrl)}
                <div>
                    <p class="row muted" style="font-size: 11px; gap: 6px">
                        ${icon('pin', 13)}${esc([d.city, d.country].filter(Boolean).join(', ') || 'Localisation non renseignée')}
                    </p>
                    <div style="margin-top: 8px">${badge(
                        d.available ? 'Disponible pour collaborer' : 'Actuellement en mission',
                        d.available ? 'green' : 'gray',
                    )}</div>
                </div>
            </div>
            <h3>Construire des solutions utiles.</h3>
            <p class="prose" style="margin: 9px 0 22px">${esc(d.bio || 'Ce profil ne dispose pas encore de présentation.')}</p>
            <h3 style="margin-bottom: 12px">Compétences</h3>
            ${d.skills?.length ? tags(d.skills) : '<p class="prose">Compétences non renseignées.</p>'}
            <div class="divider"></div>
            <div class="spread">
                <span class="prose">${d.projects} projet${Number(d.projects) === 1 ? '' : 's'} partagé${Number(d.projects) === 1 ? '' : 's'} · Profil public</span>
                ${badge('Compte inscrit', 'green')}
            </div>
        `,
        `${button('Fermer', 'close-modal', '')}${
            d.id === state.profile.id
                ? `
            <a class="btn primary" href="#profil">Mon profil</a>
        `
                : button(
                      'Contacter',
                      'contact-developer',
                      'primary',
                      'message',
                      `data-id="${d.id}"`,
                  )
        }`,
    );
}

function openNeed(id) {
    const n = state.needs.find((n) => n.id === id);
    if (!n) {
        return;
    }
    ui.modal = { kind: 'need-detail', id };
    openModal(
        esc(n.title),
        `${esc(n.org)} · ${esc(domainLabel(n))}`,
        `
            <div class="spread">${badge(n.status)}${badge('Publication', 'gray')}</div>
            <p class="prose" style="margin: 22px 0">${esc(n.description)}</p>
            <h3 style="margin-bottom: 12px">Compétences recherchées</h3>
            ${tags(n.skills)}
            <div class="divider"></div>
            <div class="detail-stat">
                <span class="muted">Budget indicatif</span>
                <b>${esc(n.budget)}</b>
            </div>
            <div class="detail-stat">
                <span class="muted">Date souhaitée</span>
                <b>${esc(n.deadline)}</b>
            </div>
        `,
        `
            ${button('Fermer', 'close-modal', '')}
            ${
                !state.authenticated && n.status === 'Ouvert'
                    ? '<a class="btn primary need-login-link" href="#connexion">Se connecter pour proposer son aide</a>'
                    : n.mine
                      ? button('Modifier le besoin', 'edit-need', 'primary', 'edit', `data-id="${n.id}"`) +
                        (n.status === 'Ouvert'
                            ? button('Clôturer', 'close-need', '', 'check', `data-id="${n.id}"`)
                            : n.status === 'Clôturé' ? button('Réouvrir le besoin', 'reopen-need', '', 'check', `data-id="${n.id}"`) : '')
                      : state.role === 'developer' && n.status === 'Ouvert'
                        ? button('Proposer une solution', 'propose', 'primary', 'link', `data-id="${n.id}"`)
                        : ''
            }
        `,
    );
}

function reviewOrg(id) {
    const o = state.organisations.find((o) => o.id === id);
    if (!o) {
        return;
    }
    openModal(
        'Une organisation à découvrir.',
        esc(o.name),
        `
            <div class="row">
                ${avatar(initials(o.name), 'orange', 'lg', o.avatarUrl)}
                <div>
                    <h3>${esc(o.name)}</h3>
                    <p class="prose">${o.type}</p>
                    ${badge(o.status)}
                </div>
            </div>
            <div class="divider"></div>
            <div class="detail-stat">
                <span class="muted">Contact</span>
                <b>${esc(o.email)}</b>
            </div>
            <div class="detail-stat">
                <span class="muted">Pays</span>
                <b>Sénégal</b>
            </div>
            <div class="notice" style="margin-top: 20px; margin-bottom: 0">
                ${icon('shield', 16)}La validation permet à cette organisation de publier des besoins.
            </div>
        `,
        `${button('Fermer', 'close-modal', '')}${o.status === 'En attente' ? button('Refuser', 'reject-org', 'danger', '', `data-id="${o.id}"`) + button('Valider l’organisation', 'approve-org', 'primary', 'check', `data-id="${o.id}"`) : ''}`,
    );
}

function reviewProject(id) {
    const p = state.projects.find((p) => p.id === id);
    if (!p) {
        return;
    }
    openModal(
        'Une solution prête à être découverte.',
        esc(p.title),
        `
            <div class="row" style="margin-bottom: 18px">
                <span class="project-symbol ${p.color}">${icon('layers', 23)}</span>
                <div>
                    <h3>${esc(p.title)}</h3>
                    <p class="prose">${esc(p.owner)} · ${esc(domainLabel(p))}</p>
                </div>
                ${badge(p.status)}
            </div>
            <p class="prose" style="margin: 16px 0">${esc(p.description)}</p>
            ${tags(p.skills)}
            <div class="notice" style="margin-top: 20px; margin-bottom: 0">
                ${icon('info', 16)}La validation rend le projet visible dans le catalogue.
            </div>
            <div class="field" style="margin-top: 18px"><label for="review-reason">Motif si une correction est demandée</label>
                <textarea class="input" id="review-reason" maxlength="1500" rows="3" placeholder="Précisez ce que l’auteur doit améliorer.">${esc(p.reviewNote || '')}</textarea>
            </div>
        `,
        `${button('Fermer', 'close-modal', '')}${button('Renvoyer en brouillon', 'return-project', '', '', `data-id="${p.id}"`)}${button('Valider la publication', 'approve-project', 'primary', 'check', `data-id="${p.id}"`)}`,
    );
}

function validate(form, rules) {
    let valid = true;
    form.querySelectorAll('.field.error').forEach((f) => f.classList.remove('error'));
    form.querySelectorAll('[aria-invalid]').forEach((f) => f.removeAttribute('aria-invalid'));
    form.querySelectorAll('.field-error').forEach((e) => (e.textContent = ''));
    for (const [name, test, message] of rules) {
        const f = form.elements.namedItem(name);
        if (f && !test(f.value.trim())) {
            valid = false;
            f.closest('.field')?.classList.add('error');
            f.setAttribute('aria-invalid', 'true');
            f.setAttribute('aria-describedby', 'err-' + name);
            const er = form.querySelector('#err-' + name);
            if (er) {
                er.textContent = message;
            }
        }
    }
    if (!valid) {
        form.querySelector('[aria-invalid]')?.focus();
    }
    return valid;
}

// Un même projet ou besoin peut être retrouvé dans plusieurs domaines.
function itemDomains(item) {
    return Array.isArray(item?.categories) && item.categories.length
        ? item.categories
        : item?.category ? [item.category] : [];
}
function domainLabel(item) {
    return itemDomains(item).join(' · ');
}
function domainFields(item) {
    const choices = ['Administration', 'Éducation', 'Santé', 'Agriculture', 'Citoyenneté', 'Environnement'];
    const selected = itemDomains(item);
    return `<fieldset class="field full domain-fieldset">
        <legend>Domaines du projet ou du besoin *</legend>
        <p class="prose">Choisissez un ou plusieurs domaines.</p>
        <div class="domain-options">${choices.map(value => `<label>
            <input type="checkbox" name="categories" value="${esc(value)}" ${selected.includes(value) ? 'checked' : ''} />
            <span>${esc(value)}</span>
        </label>`).join('')}</div>
        <span class="field-error" id="err-categories"></span>
    </fieldset>`;
}
