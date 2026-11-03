'use strict';

// Navigation publique commune à l’accueil et aux catalogues.
function publicHeader() {
    return `
        <header class="public-header">
            ${brand()}
            <a class="public-login" href="#${state.authenticated ? 'dashboard' : 'connexion'}">
                ${state.authenticated ? 'Mon espace' : 'Connexion'}
            </a>
            <button class="icon-btn public-menu-toggle" data-action="public-menu"
                aria-controls="public-navigation" aria-expanded="${Boolean(ui.publicMenu)}"
                aria-label="${ui.publicMenu ? 'Fermer le menu' : 'Ouvrir le menu'}">
                ${icon(ui.publicMenu ? 'close' : 'menu', 22)}
            </button>
            <nav id="public-navigation" class="public-nav ${ui.publicMenu ? 'is-open' : ''}" aria-label="Navigation principale">
                <a href="#projets">Les projets</a>
                <a href="#developpeurs">Les talents</a>
                <a href="#besoins">Les besoins</a>
                <a href="#support">Aide et support</a>
                <a class="btn" href="#${state.authenticated ? 'dashboard' : 'connexion'}">${state.authenticated ? 'Mon espace' : 'Se connecter'}</a>
                ${state.authenticated ? logoutForm() : '<a class="btn primary" href="#inscription">Créer un compte</a>'}
            </nav>
        </header>
    `;
}

function support() {
    const ticket = ui.supportTicket;
    const tickets = state.supportTickets || [];
    return (
        heading(
            'Aide et support.',
            'Une difficulté d’accès, un projet en attente ou une question ? Échangez avec notre équipe.',
        ) +
        `
        <div class="support-grid">
            <section class="panel panel-pad">
                <h2>Contacter l’équipe</h2>
                <p class="prose">N’indiquez jamais votre mot de passe. Pour une publication, précisez son titre et le problème rencontré.</p>
                <form data-form="support-create" class="stack" style="margin-top: 20px">
                    ${state.authenticated ? `<p class="prose">Demande envoyée avec le compte ${esc(state.profile.name)}.</p>` : field('Votre nom', 'name', '', 'text', true, '', 'maxlength="180"') + field('Votre adresse e-mail', 'email', '', 'email', true, '', 'autocomplete="email" maxlength="180"')}
                    ${field('Objet de la demande', 'subject', '', 'text', true, '', 'minlength="5" maxlength="180"')}
                    <div class="field"><label for="support-body">Votre message</label>
                        <textarea id="support-body" name="body" class="input" required minlength="10" maxlength="5000" rows="5"></textarea>
                    </div>
                    <button class="btn primary" type="submit">Envoyer la demande ${icon('send', 15)}</button>
                    <p class="prose">Après l’envoi, conservez le lien personnel de suivi. Vous pourrez y lire les réponses même sans connexion.</p>
                </form>
            </section>
            <section class="panel panel-pad support-thread" aria-live="polite">
                ${ui.supportError ? `<p class="notice orange">${esc(ui.supportError)}</p>` : ''}
                ${ui.supportLoading ? '<p class="prose">Chargement de votre demande…</p>' : ''}
                ${
                    ticket
                        ? supportThread(ticket)
                        : `
                    <h2>${state.role === 'admin' ? 'Demandes reçues' : 'Suivre une demande'}</h2>
                    <p class="prose">${state.authenticated ? 'Sélectionnez une demande ci-dessous pour lire les réponses.' : 'Ouvrez le lien personnel obtenu après l’envoi de votre demande. Conservez-le dans vos favoris.'}</p>
                `
                }
                ${
                    tickets.length
                        ? `<div class="support-list">${tickets
                              .map(
                                  (item) => `
                    <a href="#support/${esc(item.id)}" class="support-list-item">
                        <strong>#${esc(item.id)} · ${esc(item.subject)}</strong>
                        <span>${supportStatus(item.status)}${state.role === 'admin' ? ' · ' + esc(item.name) : ''}</span>
                    </a>
                `,
                              )
                              .join('')}</div>`
                        : ''
                }
            </section>
        </div>
    `
    );
}

function supportStatus(status) {
    return (
        { open: 'En attente de réponse', answered: 'Réponse disponible', closed: 'Clôturée' }[
            status
        ] || status
    );
}

function supportThread(ticket) {
    const token = /^[a-f0-9]{64}$/.test(current().id || '') ? current().id : '';
    return `
        <h2>Demande #${esc(ticket.id)}</h2>
        <p class="prose">${esc(ticket.subject)} · ${esc(supportStatus(ticket.status))}</p>
        ${token ? `<div class="notice">Conservez cette adresse pour retrouver votre demande. Ce lien est personnel : ne le publiez pas.</div><input class="input tracking-url" readonly aria-label="Lien personnel de suivi" value="${esc(location.href)}">` : ''}
        <div class="support-post"><strong>${esc(ticket.name)}</strong><p>${esc(ticket.body)}</p></div>
        ${ticket.replies
            .map(
                (
                    reply,
                ) => `<div class="support-post ${reply.role === 'admin' ? 'staff-reply' : ''}">
            <strong>${reply.role === 'admin' ? 'Équipe CiviConnect' : esc(reply.name || ticket.name)}</strong>
            <small>${esc(reply.created_at)}</small><p>${esc(reply.body)}</p>
        </div>`,
            )
            .join('')}
        ${ticket.status === 'closed' ? '<p class="notice">Cette demande est clôturée. Une nouvelle réponse la rouvrira.</p>' : ''}
        <form data-form="support-reply" class="stack">
            <div class="field"><label for="support-reply-body">Votre réponse</label>
                <textarea id="support-reply-body" name="body" class="input" required minlength="2" maxlength="5000" rows="4"></textarea>
            </div>
            <button class="btn primary" type="submit">Envoyer la réponse</button>
        </form>
        ${ticket.status !== 'closed' ? button('Clôturer la demande', 'support-close', 'sm', 'check') : ''}
    `;
}

function supportAccess() {
    const key = current().id || '';
    return /^[a-f0-9]{64}$/.test(key) ? { token: key } : { id: key };
}

async function loadSupportRoute() {
    if (current().page !== 'support' || !current().id) {
        ui.supportTicket = null;
        ui.supportError = '';
        return;
    }
    const route = location.hash;
    ui.supportLoading = true;
    ui.supportError = '';
    ui.supportTicket = null;
    render();
    try {
        const result = await api('support.read', supportAccess());
        if (location.hash === route) {
            ui.supportTicket = result.ticket;
        }
    } catch (error) {
        if (location.hash === route) {
            ui.supportError = error.message;
        }
    } finally {
        ui.supportLoading = false;
        if (location.hash === route) {
            render();
        }
    }
}

function accountStatusModal(id, status) {
    const account = [...state.accounts, ...state.organisations, ...state.administrators].find(
        (item) => item.id === id,
    );
    if (!account) {
        return;
    }
    ui.modal = { kind: 'account-decision', id, status };
    openModal(
        state.isSuperAdmin ? 'Décider de l’accès au compte' : 'Demander une décision',
        esc(account.name),
        `
        <form id="account-decision-form" data-form="account-decision">
            <p class="prose">${state.isSuperAdmin ? 'Votre décision sera appliquée et enregistrée.' : 'Le compte conserve son accès jusqu’à la décision du super administrateur.'}</p>
            <div class="field"><label for="account-reason">Motif de ${status === 'suspended' ? 'suspension' : 'réactivation'}</label>
                <textarea class="input" id="account-reason" name="reason" minlength="10" maxlength="1500" required rows="4"></textarea>
            </div>
        </form>`,
        button('Annuler', 'close-modal', '') +
            '<button class="btn primary" type="submit" form="account-decision-form">Confirmer</button>',
    );
}

function accountRequestsPanel() {
    return `<section class="panel panel-pad" style="margin-top: 24px">
        <h2>${state.isSuperAdmin ? 'Décisions sur les accès' : 'Mes demandes de décision'}</h2>
        ${state.isSuperAdmin ? `<p class="prose">Récupération automatique : ${state.mailEnabled ? 'configuration SMTP présente' : 'configuration SMTP à compléter'}.</p>${button('Tester l’envoi vers mon adresse', 'mail-test', 'sm', 'mail')}` : ''}
        <p class="prose">Les suspensions et réactivations demandées par les administrateurs attendent l’accord du super administrateur.</p>
        ${
            (state.accountRequests || [])
                .map(
                    (request) => `<article class="account-request">
            <strong>${esc(request.target_name)} · ${request.desired_status === 'suspended' ? 'Suspension' : 'Réactivation'}</strong>
            <p class="prose">Demande de ${esc(request.requester_name)} · ${esc(request.reason)}</p>
            ${
                request.status === 'pending' && state.isSuperAdmin
                    ? `
                ${button('Accepter', 'account-request-decide', 'primary sm', 'check', `data-id="${request.id}" data-decision="approved"`)}
                ${button('Refuser', 'account-request-decide', 'sm', 'close', `data-id="${request.id}" data-decision="rejected"`)}
            `
                    : badge(
                          { pending: 'En attente', approved: 'Acceptée', rejected: 'Refusée' }[
                              request.status
                          ],
                      )
            }
            ${request.decision_note ? `<p class="prose">Décision : ${esc(request.decision_note)}</p>` : ''}
        </article>`,
                )
                .join('') || '<p class="prose">Aucune demande enregistrée.</p>'
        }
    </section>`;
}

// Ces actions sont traitées ici avant les actions générales de live.js.
document.addEventListener('click', (event) => {
    const element = event.target.closest('[data-action]');
    if (!element) {
        return;
    }
    const action = element.dataset.action;
    if (
        ![
            'public-menu',
            'account-status',
            'account-request-decide',
            'support-close',
            'mail-test',
        ].includes(action)
    ) {
        return;
    }
    event.stopImmediatePropagation();
    if (action === 'public-menu') {
        ui.publicMenu = !ui.publicMenu;
        render();
        document.querySelector('.public-menu-toggle')?.focus();
    } else if (action === 'mail-test') {
        actionTask(async () => {
            const result = await api('mail.test', {});
            toast(result.message);
        });
    } else if (action === 'account-status') {
        accountStatusModal(element.dataset.id, element.dataset.status);
    } else if (action === 'account-request-decide') {
        ui.modal = {
            kind: 'request-decision',
            id: element.dataset.id,
            decision: element.dataset.decision,
        };
        openModal(
            'Confirmer la décision',
            'Le demandeur sera informé du résultat.',
            `
            <form id="request-decision-form" data-form="request-decision">
                <div class="field"><label for="decision-note">Motif de votre décision</label>
                    <textarea id="decision-note" name="note" class="input" required minlength="5" maxlength="1500" rows="4"></textarea>
                </div>
            </form>`,
            button('Annuler', 'close-modal', '') +
                '<button class="btn primary" type="submit" form="request-decision-form">Confirmer</button>',
        );
    } else {
        actionTask(async () => {
            await api('support.close', supportAccess());
            await loadSupportRoute();
            toast('La demande a été clôturée.');
        });
    }
});

document.addEventListener('submit', (event) => {
    const form = event.target;
    const type = form.dataset.form;
    if (
        !['support-create', 'support-reply', 'account-decision', 'request-decision'].includes(type)
    ) {
        return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!form.reportValidity()) {
        return;
    }
    const data = Object.fromEntries(new FormData(form));
    const modal = ui.modal;
    const submit =
        form.querySelector('[type="submit"]') ||
        document.querySelector(`[form="${form.id}"][type="submit"]`);
    actionTask(async () => {
        if (submit) {
            submit.disabled = true;
        }
        try {
            if (type === 'support-create') {
                const result = await api('support.create', data);
                go('support/' + result.trackingToken);
                toast('Demande enregistrée. Conservez votre lien personnel de suivi.');
            } else if (type === 'support-reply') {
                await api('support.reply', { ...supportAccess(), ...data });
                await loadSupportRoute();
                toast('Votre réponse a été enregistrée.');
            } else if (type === 'account-decision') {
                await api(state.isSuperAdmin ? 'account.status' : 'account.request', {
                    ...data,
                    id: modal.id,
                    status: modal.status,
                });
                closeModal();
                render();
                toast(
                    state.isSuperAdmin
                        ? 'Décision appliquée.'
                        : 'Demande transmise au super administrateur.',
                );
            } else {
                await api('account.decide', { ...data, id: modal.id, decision: modal.decision });
                closeModal();
                render();
                toast('La décision a été enregistrée.');
            }
        } finally {
            if (submit) {
                submit.disabled = false;
            }
        }
    });
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && ui.publicMenu) {
        ui.publicMenu = false;
        render();
        document.querySelector('.public-menu-toggle')?.focus();
    }
});
