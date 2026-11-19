/* ============================================================
   Geolocation Module - Alpine Ascents SPA
   Browser Geolocation API with user opt-in and Nominatim reverse lookup
   ============================================================ */

const GeoLocation = {
    hasRequested: false,
    cachedLocation: null,

    /**
     * Initialize geolocation module – render opt-in prompt
     */
    init() {
        const $el = $('#geo-greeting');
        if (!$el.length) return;

        if (!navigator.geolocation) {
            this.onUnsupported();
            return;
        }

        // Show a polite, user-initiated opt-in state explaining why location is requested.
        // Nothing is requested until the visitor presses the button.
        $el.html(`
            <span class="geo-opt-in d-inline-flex flex-wrap align-items-center justify-content-center gap-2">
                <span><i class="fas fa-compass me-1 text-accent" aria-hidden="true"></i>Explore peaks near you?</span>
                <button type="button" id="geo-request-btn" class="btn btn-sm btn-outline-light py-1 px-2"
                        aria-describedby="geo-privacy-note">
                    <i class="fas fa-location-arrow me-1" aria-hidden="true"></i>Enable Location
                </button>
            </span>
            <span id="geo-privacy-note" class="geo-privacy-note d-block mt-2">
                Optional. Your location is used to look up a nearby place name. Your coordinates are
                sent to OpenStreetMap Nominatim for this request and are not stored by this website.
                Nothing is requested until you press the button.
            </span>
        `);

        // Keep the ticker honest until the visitor decides
        $('.ticker-geo').text('Location: not shared');

        // Bind user interaction
        $(document).on('click', '#geo-request-btn', (e) => {
            e.preventDefault();
            this.requestPosition();
        });
    },

    /**
     * Request device position with explicit user permission
     */
    requestPosition() {
        if (!navigator.geolocation) {
            this.onUnsupported();
            return;
        }

        if (this.cachedLocation) {
            this.setGreeting(`Welcome from ${this.cachedLocation}! 🏔️`);
            return;
        }

        const $el = $('#geo-greeting');
        if ($el.length) {
            $el.html('<i class="fas fa-spinner fa-spin me-1 text-accent"></i> Requesting permission & locating...');
        }

        navigator.geolocation.getCurrentPosition(
            (position) => this.onSuccess(position),
            (error) => this.onError(error),
            {
                enableHighAccuracy: false,
                timeout: 8000,
                maximumAge: 600000 // Cache position for 10 minutes to avoid repeated lookups
            }
        );
    },

    /**
     * Handle successful position acquisition
     * Reverse geocode using Nominatim for general city/country name without custom User-Agent
     * @param {GeolocationPosition} position
     */
    onSuccess(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Perform reverse geocoding without restricted headers
        fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=10&addressdetails=1`
        )
        .then((response) => {
            if (!response.ok) throw new Error('Geocoding request failed');
            return response.json();
        })
        .then((data) => {
            const address = data.address || {};
            const city = address.city || address.town || address.village || address.municipality || address.state || '';
            const country = address.country || '';

            let locationStr = '';
            if (city && country) {
                locationStr = `${city}, ${country}`;
            } else if (country) {
                locationStr = country;
            } else {
                locationStr = 'your region';
            }

            this.cachedLocation = locationStr;
            this.setGreeting(`Welcome from ${locationStr}! 🏔️`, locationStr);
        })
        .catch(() => {
            // Respectful fallback without broadcasting raw exact coordinates
            this.setGreeting('Welcome, adventurer! Location detected. 🏔️');
        });
    },

    /**
     * Handle geolocation errors with polite fallbacks
     * @param {GeolocationPositionError} error
     */
    onError(error) {
        let message = 'Welcome, adventurer! Location optional. 🏔️';

        if (error) {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    message = 'Welcome, adventurer! Exploring worldwide peaks. 🏔️';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = 'Welcome, explorer! Ready for high altitude. 🏔️';
                    break;
                case error.TIMEOUT:
                    message = 'Welcome, mountaineer! Weather window open. 🏔️';
                    break;
            }
        }

        this.setGreeting(message);
    },

    /**
     * Handle browsers that don't support Geolocation API
     */
    onUnsupported() {
        this.setGreeting('Welcome, mountaineer! Conquer the world\'s greatest peaks. 🏔️');
    },

    /**
     * Update the #geo-greeting element and the ticker field.
     * @param {string} text - The greeting message shown in the hero
     * @param {string} [locationLabel] - Resolved place name, if one is known.
     *   The ticker only ever shows a place name (or "not shared") — never the
     *   full greeting sentence.
     */
    setGreeting(text, locationLabel) {
        const $el = $('#geo-greeting');
        if ($el.length) {
            $el.text(text);
        }

        const tickerText = locationLabel
            ? `Location: ${locationLabel}`
            : 'Location: not shared';

        $('.ticker-geo').text(tickerText);
        if (typeof BottomTicker !== 'undefined') {
            BottomTicker.updateGeo(tickerText);
        }
    }
};
