'use strict';
let photoPreviewUrl = '';
let photoCrop = null;
let photoLoadId = 0;
function clearPhotoPreview() {
    photoCrop = null;
    photoLoadId++;
    if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
        photoPreviewUrl = '';
    }
}
function resetPhotoPreview() {
    clearPhotoPreview();
    const form = document.getElementById('photo-form');
    form?.reset();
    document.getElementById('photo-crop-controls')?.replaceChildren();
    const preview = document.getElementById('photo-preview');
    if (preview) {
        preview.innerHTML = avatar(
            state.profile.initials,
            '',
            'photo-large',
            state.profile.avatarUrl,
        );
    }
    const status = document.getElementById('photo-status');
    if (status) {
        status.textContent = '';
    }
}
function photoForm() {
    const p = state.profile,
        enabled = state.features?.imageUpload,
        label = state.role === 'organisation' ? 'Logo de l’organisation' : 'Photo de profil';
    return `
        <form id="photo-form" data-form="photo" class="photo-form" enctype="multipart/form-data">
            <div class="photo-editor">
                <div id="photo-preview">${avatar(p.initials, '', 'photo-large', p.avatarUrl)}</div>
                <div class="grow">
                    <h2>${label}</h2>
                    <p class="prose">
                        Visible sur votre profil et dans vos échanges. Choisissez une image, puis ajustez son cadrage avant de l’enregistrer.
                    </p>
                    <label class="photo-label" for="profile-photo">Choisir une image</label>
                    <input
                        class="input"
                        type="file"
                        id="profile-photo"
                        name="photo"
                        accept="image/jpeg,image/png,image/webp"
                        aria-describedby="photo-help photo-status"
                        ${enabled ? '' : 'disabled'}
                    />
                    <small id="photo-help">JPEG, PNG ou WebP · 3 Mo maximum · 16 à 4096 pixels.</small>
                </div>
            </div>
            ${
                !state.features?.photos
                    ? `
        <p class="notice orange">La base choisie est incomplète. Vérifiez les paramètres de votre installation.</p>
    `
                    : !enabled
                      ? `
        <p class="notice orange">
            L’envoi des photos nécessite GD et fileinfo dans PHP. Activez ces extensions dans XAMPP, puis
            redémarrez Apache.
        </p>
    `
                      : ''
            }
            <div id="photo-crop-controls"></div>
            <p id="photo-status" class="prose" role="status" aria-live="polite"></p>
            <div class="photo-actions">
                <button class="btn primary" type="submit" ${enabled ? '' : 'disabled'}>
                    Enregistrer l’image
                </button>
                ${button('Annuler la sélection', 'photo-reset', '')}${p.avatarUrl ? button('Supprimer l’image', 'photo-remove', 'danger') : ''}
            </div>
        </form>
    `;
}
function previewPhoto(input) {
    clearPhotoPreview();
    const file = input.files?.[0],
        status = document.getElementById('photo-status');
    if (!file) {
        resetPhotoPreview();
        return;
    }
    const error =
        file.size > 3 * 1024 * 1024
            ? 'Cette image dépasse 3 Mo.'
            : !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
              ? 'Choisissez un JPEG, un PNG ou un WebP.'
              : '';
    if (error) {
        resetPhotoPreview();
        if (status) {
            status.textContent = error;
        }
        return;
    }
    photoPreviewUrl = URL.createObjectURL(file);
    const loadId = photoLoadId;
    photoCrop = { loading: true };
    document.getElementById('photo-preview').textContent = 'Chargement…';
    document.getElementById('photo-crop-controls').replaceChildren();
    if (status) status.textContent = 'Chargement de l’aperçu…';
    const img = new Image();
    img.onload = () => {
        if (loadId !== photoLoadId || !document.getElementById('photo-preview')) return;
        const w = img.naturalWidth, h = img.naturalHeight;
        if (Math.min(w, h) < 16 || Math.max(w, h) > 4096 || w * h > 16000000) {
            resetPhotoPreview();
            if (status) status.textContent = 'Dimensions autorisées : 16 à 4096 pixels, jusqu’à 16 mégapixels.';
            return;
        }
        photoCrop = { img, zoom: 1, x: 50, y: 50, loading: false };
        document.getElementById('photo-preview').innerHTML = '<canvas id="photo-crop-canvas" width="640" height="640" tabindex="0" aria-label="Aperçu du recadrage. Déplacez l’image ou utilisez les réglages ci-dessous."></canvas>';
        document.getElementById('photo-crop-controls').innerHTML = `
            <p class="prose">Déplacez l’image avec le doigt ou la souris. Les curseurs permettent aussi un réglage au clavier.</p>
            <div class="crop-sliders">
                <label>Zoom <input id="crop-zoom" type="range" min="1" max="3" step="0.01" value="1" /></label>
                <label>Position horizontale <input id="crop-x" type="range" min="0" max="100" step="1" value="50" /></label>
                <label>Position verticale <input id="crop-y" type="range" min="0" max="100" step="1" value="50" /></label>
            </div><button type="button" class="btn" id="crop-center">Recentrer</button>`;
        ['zoom', 'x', 'y'].forEach(key => document.getElementById('crop-' + key).addEventListener('input', event => {
            photoCrop[key] = Number(event.target.value);
            drawPhotoCrop();
        }));
        document.getElementById('crop-center').addEventListener('click', () => {
            Object.assign(photoCrop, { zoom: 1, x: 50, y: 50 });
            syncCropControls(); drawPhotoCrop();
        });
        const canvas = document.getElementById('photo-crop-canvas');
        let drag = null;
        canvas.addEventListener('pointerdown', e => {
            if (e.button !== 0) return;
            drag = { x: e.clientX, y: e.clientY };
            canvas.setPointerCapture(e.pointerId);
        });
        canvas.addEventListener('pointermove', e => {
            if (!drag || !photoCrop) return;
            const g = cropGeometry(photoCrop);
            const factor = g.side / canvas.getBoundingClientRect().width;
            if (g.maxX > 0) photoCrop.x = Math.max(0, Math.min(100, photoCrop.x - (e.clientX - drag.x) * factor / g.maxX * 100));
            if (g.maxY > 0) photoCrop.y = Math.max(0, Math.min(100, photoCrop.y - (e.clientY - drag.y) * factor / g.maxY * 100));
            drag = { x: e.clientX, y: e.clientY };
            syncCropControls(); drawPhotoCrop();
        });
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(event => canvas.addEventListener(event, () => { drag = null; }));
        drawPhotoCrop();
        if (status) status.textContent = 'Aperçu prêt. Enregistrez pour appliquer ce cadrage.';
    };
    img.onerror = () => {
        if (loadId !== photoLoadId) return;
        resetPhotoPreview();
        if (status) status.textContent = 'Cette image ne peut pas être lue. Essayez une autre image.';
    };
    img.src = photoPreviewUrl;
}
function cropGeometry(crop) {
    const side = Math.min(crop.img.naturalWidth, crop.img.naturalHeight) / crop.zoom;
    const maxX = crop.img.naturalWidth - side, maxY = crop.img.naturalHeight - side;
    return { side, maxX, maxY, sx: maxX * crop.x / 100, sy: maxY * crop.y / 100 };
}
function syncCropControls() {
    ['zoom', 'x', 'y'].forEach(key => { document.getElementById('crop-' + key).value = photoCrop[key]; });
}
function drawPhotoCrop() {
    if (!photoCrop || photoCrop.loading) return;
    const canvas = document.getElementById('photo-crop-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d'), g = cropGeometry(photoCrop);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 640, 640);
    ctx.drawImage(photoCrop.img, g.sx, g.sy, g.side, g.side, 0, 0, 640, 640);
}
async function prepareCroppedPhoto(body) {
    if (!photoCrop || photoCrop.loading) throw new Error('Attendez l’aperçu ou sélectionnez à nouveau votre image.');
    const canvas = document.getElementById('photo-crop-canvas');
    if (!canvas) throw new Error('Sélectionnez à nouveau votre image.');
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) throw new Error('Le recadrage a échoué. Essayez une autre image.');
    body.set('photo', blob, 'profil.jpg');
}

async function photoRequest(body) {
    const form = document.getElementById('photo-form'),
        controls = [...(form?.querySelectorAll('button,input') || [])],
        disabled = controls.map((c) => c.disabled);
    const status = document.getElementById('photo-status');
    if (status) {
        status.textContent = 'Enregistrement en cours…';
    }
    controls.forEach((c) => (c.disabled = true));
    try {
        let r, j;
        try {
            r = await fetch('profile-photo.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { Accept: 'application/json', 'X-CSRF-Token': state.csrf },
                body,
            });
            j = await r.json();
        } catch {
            throw new Error('L’envoi a été interrompu. Vérifiez votre connexion et réessayez.');
        }
        if (!r.ok || !j.success) {
            const e = new Error(j.message || 'Cette image n’a pas pu être enregistrée.');
            e.status = r.status;
            throw e;
        }
        state = j.data;
    } catch (e) {
        if (status) {
            status.textContent = e.message;
        }
        throw e;
    } finally {
        controls.forEach((c, i) => (c.disabled = disabled[i]));
    }
}

document.addEventListener(
    'error',
    (e) => {
        if (e.target.tagName === 'IMG' && e.target.parentElement?.classList.contains('avatar')) {
            const parent = e.target.parentElement;
            parent.textContent = parent.dataset.initials || '?';
        }
    },
    true,
);
