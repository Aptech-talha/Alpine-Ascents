/* ============================================================
   Bottom Ticker Module - Alpine Ascents SPA
   Live alpine advisory, date/time, and visitor ticker
   ============================================================ */

const BottomTicker = {
    isPaused: false,
    isMinimized: false,

    /**
     * Initialize ticker controls, event listeners, and initial values
     */
    init() {
        const $ticker = $('#bottom-ticker');
        if (!$ticker.length) return;

        // Toggle pause/play
        $('#ticker-pause-btn').on('click', () => {
            this.isPaused = !this.isPaused;
            const $marquee = $('#ticker-marquee');
            const $icon = $('#ticker-pause-btn i');
            if (this.isPaused) {
                $marquee.css('animation-play-state', 'paused');
                $icon.removeClass('fa-pause').addClass('fa-play');
                $('#ticker-pause-btn').attr('title', 'Resume Ticker').attr('aria-label', 'Resume ticker');
            } else {
                $marquee.css('animation-play-state', 'running');
                $icon.removeClass('fa-play').addClass('fa-pause');
                $('#ticker-pause-btn').attr('title', 'Pause Ticker').attr('aria-label', 'Pause ticker');
            }
        });

        // Toggle minimize/expand
        $('#ticker-toggle-btn').on('click', () => {
            this.isMinimized = !this.isMinimized;
            $ticker.toggleClass('minimized', this.isMinimized);
            $('body').toggleClass('ticker-minimized', this.isMinimized);
            const $icon = $('#ticker-toggle-btn i');
            if (this.isMinimized) {
                $icon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
                $('#ticker-toggle-btn').attr('title', 'Expand Ticker').attr('aria-label', 'Expand ticker');
            } else {
                $icon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
                $('#ticker-toggle-btn').attr('title', 'Minimize Ticker').attr('aria-label', 'Minimize ticker');
            }
        });

        // Sync initial visitor count
        this.updateVisitorCount();

        // Duplicate the marquee content once so the -50% loop is seamless.
        // The clone must NOT keep the source ids: duplicate ids are invalid HTML,
        // and the copies would stay frozen at their initial text forever.
        const $marquee = $('#ticker-marquee');
        const reducedMotion = window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if ($marquee.length && !reducedMotion) {
            const $clone = $marquee.children().clone();
            $clone.find('[id]').removeAttr('id');

            // The duplicate exists only to make the loop seamless, so it is
            // hidden from assistive technology to avoid reading everything twice.
            const $cloneWrap = $('<span class="ticker-clone" aria-hidden="true"></span>').append($clone);

            $marquee.append('<span class="ticker-separator mx-3" aria-hidden="true">•</span>');
            $marquee.append($cloneWrap);
        }
    },

    /**
     * Sync visitor count from VisitorCounter
     */
    updateVisitorCount() {
        if (typeof VisitorCounter !== 'undefined') {
            const count = VisitorCounter.getCount();
            $('.ticker-visitor-count').text(count.toLocaleString());
            $('.visitor-count-compact').text(count.toLocaleString());
        }
    },

    /**
     * Sync date and time from DateTimeDisplay
     */
    updateDateTime(dateStr, timeStr) {
        $('.ticker-datetime').text(`${dateStr} | ${timeStr}`);
    },

    /**
     * Sync user location / status from GeoLocation
     */
    updateGeo(locationStr) {
        $('.ticker-geo').text(locationStr);
    }
};
