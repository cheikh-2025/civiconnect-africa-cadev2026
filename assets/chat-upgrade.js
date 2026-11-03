/* Messagerie : activité réelle, accusés de lecture visibles et reprise d’envoi. */
(() => {
    'use strict';
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
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Connexion interrompue.');
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
            drafts.clear(); deliveries.clear(); acknowledged.clear(); remoteTyping.clear();
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
            acknowledged.set(id, through);
            updateReadCounters();
        } catch { /* Retenter lors de la prochaine observation. */ }
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
            remoteTyping.set(id, result.typing ? Date.now() + 6000 : 0);
            if (ui.conversation === id) syncView();
        } catch { /* Une coupure réseau n’empêche pas de conserver le brouillon. */ }
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
