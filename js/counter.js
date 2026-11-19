/* ============================================================
   Visitor Counter Module - Alpine Ascents SPA
   localStorage-based visit counter with session-aware incrementing
   and defensive try/catch error handling
   ============================================================ */

const VisitorCounter = {
    STORAGE_KEY: 'alpine_ascents_visit_count',
    LAST_VISIT_KEY: 'alpine_ascents_last_visit',
    SESSION_FLAG: 'alpine_ascents_session_counted',
    inMemoryFallbackCount: 0,
    /* 'persistent' when localStorage works, 'memory' when it is blocked */
    storageMode: 'persistent',
    /* Guards against double counting inside the same document */
    countedThisPageLoad: false,

    /**
     * Check if localStorage is available and accessible
     * @returns {boolean}
     */
    isStorageAvailable() {
        try {
            const testKey = '__alpine_storage_test__';
            window.localStorage.setItem(testKey, testKey);
            window.localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * Check if sessionStorage is available and accessible
     * @returns {boolean}
     */
    isSessionAvailable() {
        try {
            const testKey = '__alpine_session_test__';
            window.sessionStorage.setItem(testKey, testKey);
            window.sessionStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * Initialize the visitor counter
     */
    init() {
        this.increment();
        this.display();
        this.updateLabel();

        // Transparent disclaimer in developer console
        console.info(
            '%c📊 Visitor Counter Notice: ' +
            'This counter tracks page visits in this browser only (localStorage, or memory when storage is blocked). ' +
            'It does not represent a centralized global visitor count.',
            'color: #0288D1; font-size: 11px;'
        );
    },

    /**
     * Describe what the counter is actually measuring, so the number is never
     * mistaken for site-wide traffic. Mirrors the storage mode in use.
     * @returns {string}
     */
    getModeLabel() {
        return this.storageMode === 'persistent' ? '(this browser)' : '(this session)';
    },

    /**
     * Keep the ticker's suffix in sync with the active storage mode.
     */
    updateLabel() {
        $('.ticker-visitor-label').text(this.getModeLabel());

        const $pill = $('#visitor-count');
        if ($pill.length) {
            $pill.attr('title', this.storageMode === 'persistent'
                ? 'Visits recorded in this browser (stored locally)'
                : 'Visits recorded during this session (browser storage unavailable)');
        }
    },

    /**
     * Get the current visit count safely from localStorage or memory fallback
     * @returns {number} Current visit count
     */
    getCount() {
        if (!this.isStorageAvailable()) {
            return this.inMemoryFallbackCount;
        }

        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? parseInt(stored, 10) || 1 : 1;
        } catch (e) {
            return this.inMemoryFallbackCount;
        }
    },

    /**
     * Increment the counter once per session safely
     */
    increment() {
        if (this.countedThisPageLoad) return;
        this.countedThisPageLoad = true;

        // If storage is completely disabled, keep a real in-memory tally so the
        // displayed number still increases instead of being frozen at 1.
        if (!this.isStorageAvailable()) {
            this.storageMode = 'memory';
            this.inMemoryFallbackCount += 1;
            return;
        }

        let currentCount = 0;

        try {
            // Check if already counted during this browser session
            if (this.isSessionAvailable() && sessionStorage.getItem(this.SESSION_FLAG)) {
                return;
            }

            currentCount = this.getCount();
            const newCount = currentCount + 1;

            localStorage.setItem(this.STORAGE_KEY, newCount.toString());
            localStorage.setItem(this.LAST_VISIT_KEY, new Date().toISOString());

            if (this.isSessionAvailable()) {
                sessionStorage.setItem(this.SESSION_FLAG, 'true');
            }
        } catch (e) {
            // Quota exceeded or storage revoked mid-flight — degrade to memory,
            // but still count this page load.
            this.storageMode = 'memory';
            this.inMemoryFallbackCount = Math.max(this.inMemoryFallbackCount, currentCount) + 1;
            console.warn('Storage unavailable or quota exceeded; counter running in memory mode.', e);
        }
    },

    /**
     * Update the #visitor-count element with an animated counting effect
     */
    display() {
        const $counter = $('#visitor-count');
        const targetCount = this.getCount();

        if (!$counter.length) {
            $('.ticker-visitor-count, .visitor-count-compact').text(targetCount.toLocaleString());
            return;
        }

        // Animated counter effect
        const duration = 1200; // ms
        const startTime = performance.now();
        const startCount = 0;

        const animateCount = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out curve
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(startCount + (targetCount - startCount) * easeOut);

            $counter.text(currentValue.toLocaleString());
            $('.ticker-visitor-count, .visitor-count-compact').text(currentValue.toLocaleString());

            if (progress < 1) {
                requestAnimationFrame(animateCount);
            } else {
                $counter.text(targetCount.toLocaleString());
                $('.ticker-visitor-count, .visitor-count-compact').text(targetCount.toLocaleString());
            }
        };

        requestAnimationFrame(animateCount);
    }
};
