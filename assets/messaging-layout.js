/* Adapter la discussion à la zone visible, y compris au clavier mobile. */
(() => {
    'use strict';
    let frame = 0;
    function measure() {
        frame = 0;
        const shell = document.querySelector('.conversation-shell');
        document.body.classList.toggle('messaging-page', Boolean(shell));
        if (!shell || !window.matchMedia('(max-width: 760px)').matches) return;
        const viewport = window.visualViewport;
        const height = viewport?.height || window.innerHeight;
        const offset = viewport?.offsetTop || 0;
        const top = Math.max(0, shell.getBoundingClientRect().top - offset);
        const available = Math.max(220, Math.min(680, Math.floor(height - top - 16)));
        const value = available + 'px';
        if (shell.style.getPropertyValue('--chat-viewport-height') !== value) {
            shell.style.setProperty('--chat-viewport-height', value);
        }
    }
    function schedule() {
        if (!frame) frame = requestAnimationFrame(measure);
    }
    function keepComposerVisible() {
        schedule();
        const input = document.getElementById('message-input');
        if (input && document.activeElement === input) {
            requestAnimationFrame(() => input.scrollIntoView({block: 'nearest', inline: 'nearest'}));
        }
    }
    window.addEventListener('resize', keepComposerVisible);
    window.visualViewport?.addEventListener('resize', keepComposerVisible);
    window.visualViewport?.addEventListener('scroll', schedule);
    document.addEventListener('focusin', event => {
        if (event.target.id === 'message-input') keepComposerVisible();
    });
    new MutationObserver(schedule).observe(document.getElementById('app'), {childList: true, subtree: true});
    schedule();
})();
