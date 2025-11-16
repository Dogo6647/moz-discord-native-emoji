// Replaces <img class="emoji"> with a span containing the native emoji.
// extracted from the img.alt if it contains an emoji character/sequence.

const EMOJI_SEQ_RE = /((?:\p{Extended_Pictographic}|\u200D|\uFE0F)+)/gu;
const REPLACED_MARKER = 'native-emoji-replaced';

function replaceImgWithNative(img) {
    if (!img || !(img instanceof HTMLImageElement)) return;
    if (img.classList.contains(REPLACED_MARKER)) return;

    const alt = (img.getAttribute('alt') || '').trim();
    if (!alt) return;

    const match = EMOJI_SEQ_RE.exec(alt);
    EMOJI_SEQ_RE.lastIndex = 0;

    if (!match) return;

    const emojiSequence = match[1];
    if (!emojiSequence) return;

    const span = document.createElement('span');
    span.className = 'native-emoji-replacement ' + REPLACED_MARKER;
    span.setAttribute('aria-hidden', 'false');
    if (img.getAttribute('aria-label')) {
        span.setAttribute('aria-label', img.getAttribute('aria-label'));
    } else if (alt) {
        span.setAttribute('aria-label', alt);
    }

    span.textContent = emojiSequence;

    try {
        const cs = window.getComputedStyle(img);
        const height = img.height + 'px';
        let fontSize = '1em';
        const parsed = parseFloat(height);
        if (!Number.isNaN(parsed) && parsed > 0) {
            fontSize = (Math.round(parsed * 0.75)) + 'px';
        }
        span.style.fontSize = fontSize;
        span.style.lineHeight = height;
        span.style.display = cs.display === 'block' ? 'block' : 'inline-block';
        span.style.verticalAlign = cs.verticalAlign || 'baseline';
        span.style.margin = cs.margin;
        span.style.padding = cs.padding;
    } catch (e) {
        console.warn('[DiscordNativeEmoji] Something went wrong:', e);
    }

    img.replaceWith(span);
}

function scanAndReplace(root = document) {
    const imgs = root.querySelectorAll('img.emoji:not(.' + REPLACED_MARKER + ')');
    imgs.forEach(replaceImgWithNative);
}

function setupObserver() {
    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.addedNodes && m.addedNodes.length > 0) {
                m.addedNodes.forEach(node => {
                    if (!(node instanceof Element)) return;
                    if (node.matches && node.matches('img.emoji')) {
                        replaceImgWithNative(node);
                    }
                    scanAndReplace(node);
                });
            }
            if (m.type === 'attributes' && m.target instanceof HTMLImageElement) {
                const t = m.target;
                if (t.matches('img.emoji')) replaceImgWithNative(t);
            }
        }
    });

    observer.observe(document, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['alt', 'class']
    });

    return observer;
}

(function init() {
    try {
        scanAndReplace(document);
        setupObserver();
    } catch (e) {
        console.error('[DiscordNativeEmoji] initialization error', e);
    }
})();
