'use strict';

// Composants de l’espace administrateur. Les permissions restent contrôlées en PHP.
function administration() {
    const organisations = [...state.organisations].sort(
        (a, b) => Number(b.status === 'En attente') - Number(a.status === 'En attente'),
    );
    const publications = [...state.projects].sort(
        (a, b) => Number(b.status === 'En validation') - Number(a.status === 'En validation'),
    );

    const tabs = [
        ['organisations', 'Organisations', organisations],
        ['publications', 'Publications', publications],
        ['comptes', 'Développeurs', state.accounts],
        ...(state.isSuperAdmin
            ? [['administrateurs', 'Administrateurs', state.administrators || []]]
            : []),
    ];
    const selected = tabs.find(([id]) => id === ui.adminTab) || tabs[0];
    const rowRenderers = {
        organisations: adminOrganisationRow,
        publications: adminProjectRow,
        comptes: adminDeveloperRow,
        administrateurs: adminAdministratorRow,
    };
    const createButton =
        selected[0] === 'administrateurs' && state.isSuperAdmin
            ? button('Créer un administrateur', 'new-admin', 'primary', 'plus')
            : button('Créer un compte', 'new-account', 'primary', 'plus');

    return (
        (state.features && !state.features.evolutionReady
            ? '<div class="notice orange">Terminez la mise à jour SQL indiquée dans la notice.</div>'
            : '') +
        (!state.hasSuperAdmin
            ? '<div class="notice orange">Aucun super administrateur n’est encore désigné. Le propriétaire doit terminer l’étape de désignation indiquée dans la notice.</div>'
            : '') +
        (state.features && !state.features.databaseReady
            ? `
                <div class="notice orange" style="margin-bottom: 22px">
                    La base choisie est incomplète. Vérifiez les paramètres de votre installation.
                    
                </div>
            `
            : '') +
        heading(
            'La confiance, au cœur de la plateforme.',
            'Partagez les vérifications entre administrateurs. Les éléments en attente apparaissent en premier.',
            createButton,
        ) +
        `
            <div class="page-tabs admin-tabs">${tabs
                .map(
                    ([id, label, list]) => `
                        <button data-action="admin-tab" data-id="${id}" class="${selected[0] === id ? 'active' : ''}">
                            ${label} ${badge(String(list.length), 'gray')}
                        </button>
                    `,
                )
                .join('')}</div>
            <section class="panel admin-table-wrap">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th scope="col">${selected[0] === 'publications' ? 'Projet' : 'Compte'}</th>
                            <th scope="col">Informations</th>
                            <th scope="col">Statut</th>
                            <th scope="col">${selected[0] === 'administrateurs' ? 'Accès' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody>${selected[2].map(rowRenderers[selected[0]]).join('')}</tbody>
                </table>
                ${
                    selected[2].length
                        ? ''
                        : `
                <p class="panel-pad prose">Aucun élément dans cette rubrique pour le moment.</p>
            `
                }
            </section>
            ${accountRequestsPanel()}
            ${validationRules()}
        `
    );
}

function adminOrganisationRow(organisation) {
    return `
        <tr>
            <td>
                <strong>${esc(organisation.name)}</strong>
                <small>${esc(organisation.email)}</small>
            </td>
            <td>${esc(organisation.type || 'Organisation')}</td>
            <td>${badge(organisation.status)}${organisation.org_is_demo ? badge('Démonstration', 'orange') : ''}</td>
            <td>${button('Examiner', 'review-org', 'sm', 'eye', `data-id="${organisation.id}"`)}</td>
        </tr>
    `;
}

function adminProjectRow(project) {
    return `
        <tr>
            <td>
                <strong>${esc(project.title)}</strong>
                <small>${esc(project.owner)}</small>
            </td>
            <td>${esc(domainLabel(project))}</td>
            <td>${badge(project.status)}</td>
            <td>${button('Examiner', 'review-project', 'sm', 'eye', `data-id="${project.id}"`)}</td>
        </tr>
    `;
}

function adminDeveloperRow(account) {
    const suspended = account.status === 'suspended';
    return `
        <tr>
            <td>
                <strong>${esc(account.name)}</strong>
                <small>${esc(account.email)}</small>
            </td>
            <td>Développeur</td>
            <td>${badge(suspended ? 'Suspendu' : 'Actif', suspended ? 'red' : 'green')}</td>
            <td>${button(
                state.isSuperAdmin
                    ? suspended
                        ? 'Réactiver'
                        : 'Suspendre'
                    : suspended
                      ? 'Demander une réactivation'
                      : 'Demander une suspension',
                'account-status',
                suspended ? 'sm' : 'danger sm',
                'shield',
                `data-id="${account.id}" data-status="${suspended ? 'verified' : 'suspended'}"`,
            )}</td>
        </tr>
    `;
}

function adminAdministratorRow(account) {
    return `
        <tr>
            <td>
                <strong>${esc(account.name)}</strong>
                <small>${esc(account.email)}</small>
            </td>
            <td>${account.isSuperAdmin ? 'Super administrateur' : 'Modération et support'}</td>
            <td>${badge(
                account.status === 'verified' ? 'Actif' : 'Suspendu',
                account.status === 'verified' ? 'green' : 'red',
            )}</td>
            <td>${
                account.self
                    ? badge('Votre compte', 'gray')
                    : account.isSuperAdmin
                      ? badge('Compte protégé', 'gray')
                      : button(
                            account.status === 'verified' ? 'Désactiver' : 'Réactiver',
                            'account-status',
                            'sm',
                            'shield',
                            `data-id="${account.id}" data-status="${account.status === 'verified' ? 'suspended' : 'verified'}"`,
                        )
            }</td>
        </tr>
    `;
}

// Ce tableau explique les validations aux membres comme aux administrateurs.
function validationRules(expanded = false) {
    return `
        <details class="panel validation-rules" ${expanded ? 'open' : ''}>
            <summary>Qui valide quoi ?</summary>
            <div class="admin-table-wrap">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th scope="col">Élément</th>
                            <th scope="col">Validation</th>
                            <th scope="col">Résultat</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Inscription développeur</td>
                            <td>Accès immédiat</td>
                            <td>Le membre peut compléter son profil et préparer ses projets.</td>
                        </tr>
                        <tr>
                            <td>Inscription organisation</td>
                            <td>Un administrateur</td>
                            <td>L’organisation vérifiée peut publier des besoins et collaborer.</td>
                        </tr>
                        <tr>
                            <td>Publication d’un projet</td>
                            <td>Un administrateur</td>
                            <td>Le projet devient visible dans le catalogue.</td>
                        </tr>
                        <tr>
                            <td>Désactivation d’un compte</td>
                            <td>Le super administrateur</td>
                            <td>Un administrateur peut transmettre une demande motivée, sans modifier lui-même l’accès du membre.</td>
                        </tr>
                        <tr>
                            <td>Demande de collaboration</td>
                            <td>Son destinataire</td>
                            <td>
                                Le membre accepte ou décline directement, sans validation administrative.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </details>
    `;
}

function accountModal(initialRole = 'developer') {
    const role = ['developer', 'organisation', 'admin'].includes(initialRole)
        ? initialRole
        : 'developer';
    const isAdmin = role === 'admin';
    ui.modal = { kind: 'admin-account' };

    openModal(
        'Créer un compte',
        'Vous conservez votre session administrateur.',
        `
            <form id="admin-account-form" data-form="admin-account" novalidate>
                <div class="form-grid">
                    <div class="field full">
                        <label for="f-account-role">Type de compte</label>
                        <select
                            class="input"
                            id="f-account-role"
                            name="role"
                            aria-describedby="account-role-help"
                        >
                            ${[
                                ['developer', 'Développeur'],
                                ['organisation', 'Organisation'],
                                ...(state.isSuperAdmin ? [['admin', 'Administrateur']] : []),
                            ]
                                .map(
                                    ([value, label]) => `
                                        <option value="${value}" ${value === role ? 'selected' : ''}>${label}</option>
                                    `,
                                )
                                .join('')}
                        </select>
                    </div>
                    ${field('Nom affiché', 'name', '', 'text', true, '', 'maxlength="180" autofocus')} ${field(
                        'Adresse e-mail',
                        'email',
                        '',
                        'email',
                        true,
                        '',
                        'autocomplete="off" maxlength="180"',
                    )} ${field('Pays', 'country', 'Sénégal', 'text', true, '', 'maxlength="100"')}
                    ${field(
                        'Mot de passe initial du nouveau compte',
                        'password',
                        '',
                        'password',
                        true,
                        `Entre ${isAdmin ? '12' : '10'} et 72 octets. Le titulaire pourra le changer dans son profil.`,
                        `autocomplete="new-password" minlength="${isAdmin ? '12' : '10'}"`,
                    )}
                    <div id="admin-confirmation" class="field full" ${isAdmin ? '' : 'hidden'}>
                        <label for="f-admin-current-password">Votre mot de passe actuel</label>
                        <input
                            class="input"
                            id="f-admin-current-password"
                            name="current_password"
                            type="password"
                            autocomplete="current-password"
                            aria-describedby="admin-confirm-help"
                            ${isAdmin ? '' : 'disabled'}
                        />
                        <small id="admin-confirm-help">
                            Confirmez la création de cet accès administrateur avec votre propre mot de passe.
                        </small>
                        <span class="field-error" id="err-current_password"></span>
                    </div>
                </div>
                <p id="account-role-help" class="prose" style="margin-top: 18px">${accountRoleHelp(role)}</p>
                <p class="prose" style="margin-top: 8px; font-size: 11px">
                    Aucun e-mail automatique n’est envoyé.
                </p>
            </form>
        `,
        button('Annuler', 'close-modal', '') +
            `
                <button class="btn primary" type="submit" form="admin-account-form">
                    Créer le compte ${icon('plus', 14)}
                </button>
            `,
    );
}

function accountRoleHelp(role) {
    if (role === 'admin') {
        return 'Cet administrateur pourra vérifier les organisations, examiner les projets et traiter le support. Il devra demander votre accord pour modifier les accès des membres et ne pourra pas créer ou désactiver d’autres administrateurs.';
    }
    if (role === 'organisation') {
        return 'Cette organisation restera en attente de vérification dans l’administration.';
    }
    return 'Ce développeur pourra se connecter immédiatement et préparer ses projets.';
}

// Change les champs utiles sans effacer les informations déjà saisies.
function updateAccountRole(form) {
    const role = form.elements.namedItem('role').value;
    const isAdmin = role === 'admin';
    const confirmation = form.querySelector('#admin-confirmation');
    const currentPassword = form.elements.namedItem('current_password');
    const newPassword = form.elements.namedItem('password');

    confirmation.hidden = !isAdmin;
    currentPassword.disabled = !isAdmin;
    if (!isAdmin) {
        currentPassword.value = '';
    }

    newPassword.minLength = isAdmin ? 12 : 10;
    newPassword.closest('.field').querySelector('small').textContent =
        `Entre ${isAdmin ? '12' : '10'} et 72 octets. Le titulaire pourra le changer dans son profil.`;
    form.querySelector('#account-role-help').textContent = accountRoleHelp(role);
}
