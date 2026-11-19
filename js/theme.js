/* ============================================================
   Theme Module – Alpine Ascents
   Light / dark theme with persistence.

   Storage contract
   ----------------
   This module owns exactly one key: `alpineAscents_theme`
   (values: "light" | "dark"). It never reads or writes the cart
   (`alpineAscents_cart`) or checklist (`alpineAscents_expeditionChecklist`)
   keys, so changing the theme can never disturb those features.

   The initial attribute is set by a tiny inline script in <head> so the
   first paint already has the right colours; this module takes over for
   interaction, persistence and system-preference changes.
   ============================================================ */

const Theme = {
    KEY: 'alpineAscents_theme',
    MEDIA: '(prefers-color-scheme: dark)',
    current: 'light',
    button: null,
    mediaQuery: null,

    init() {
        this.button = document.getElementById('theme-toggle');
        this.mediaQuery = window.matchMedia ? window.matchMedia(this.MEDIA) : null;

        // Prefer the attribute written by the head script; fall back to storage
        const attr = document.documentElement.getAttribute('data-bs-theme');
        this.current = (attr === 'dark' || attr === 'light') ? attr : this.readSaved() || this.systemTheme();

        this.apply(this.current);
        this.syncButton();

        if (this.button) {
            this.button.addEventListener('click', () => this.toggle());
        }

        // Follow the OS only while the visitor has not chosen explicitly
        if (this.mediaQuery && typeof this.mediaQuery.addEventListener === 'function') {
            this.mediaQuery.addEventListener('change', (event) => {
                if (this.readSaved()) return;
                this.apply(event.matches ? 'dark' : 'light');
                this.syncButton();
            });
        }
    },

    systemTheme() {
        return (this.mediaQuery && this.mediaQuery.matches) ? 'dark' : 'light';
    },

    readSaved() {
        try {
            const saved = window.localStorage.getItem(this.KEY);
            return (saved === 'dark' || saved === 'light') ? saved : null;
        } catch (e) {
            return null; // storage blocked — behave as "no preference"
        }
    },

    toggle() {
        const next = this.current === 'dark' ? 'light' : 'dark';
        this.apply(next, true);
        this.syncButton();
        this.announce(next === 'dark' ? 'Dark mode on.' : 'Light mode on.');
    },

    /**
     * Apply a theme to the document.
     * @param {'light'|'dark'} theme
     * @param {boolean} [persist] write the choice to localStorage
     */
    apply(theme, persist = false) {
        const value = theme === 'dark' ? 'dark' : 'light';
        this.current = value;

        document.documentElement.setAttribute('data-bs-theme', value);
        document.documentElement.setAttribute('data-theme', value);
        document.documentElement.style.colorScheme = value;

        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', value === 'dark' ? '#0d1117' : '#ffffff');

        if (persist) {
            try {
                window.localStorage.setItem(this.KEY, value);
            } catch (e) {
                // Private mode or blocked storage: the theme still applies for this visit
                console.warn('Theme preference could not be saved.', e);
            }
        }
    },

    syncButton() {
        if (!this.button) return;

        const goingDark = this.current === 'light';
        this.button.setAttribute('aria-pressed', String(this.current === 'dark'));
        this.button.setAttribute('aria-label', goingDark ? 'Switch to dark mode' : 'Switch to light mode');
        this.button.setAttribute('title', goingDark ? 'Switch to dark mode' : 'Switch to light mode');
    },

    /** Short polite announcement, without moving focus. */
    announce(message) {
        const live = document.getElementById('theme-live-status');
        if (!live) return;
        live.textContent = '';
        window.setTimeout(() => { live.textContent = message; }, 30);
    }
};
