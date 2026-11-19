/* ============================================================
   Date/Time Display Module - Alpine Ascents SPA
   Live date and time display updated every second
   ============================================================ */

const DateTimeDisplay = {
    intervalId: null,

    /**
     * Initialize the live date/time display
     */
    init() {
        // Immediate first update
        this.update();

        // Update every second
        this.intervalId = setInterval(() => {
            this.update();
        }, 1000);
    },

    /**
     * Update the #current-datetime element with formatted date and time
     * Format: "Saturday, October 31, 2026 | 12:15 AM"
     */
    update() {
        const $el = $('#current-datetime');
        if (!$el.length) return;

        const now = new Date();

        const dateStr = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const timeStr = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });

        const formattedStr = `${dateStr} | ${timeStr}`;
        $el.text(formattedStr);

        // Update bottom ticker if available
        if (typeof BottomTicker !== 'undefined') {
            BottomTicker.updateDateTime(dateStr, timeStr);
        } else {
            $('.ticker-datetime').text(formattedStr);
        }
    },

    /**
     * Clean up the interval timer
     */
    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
};
