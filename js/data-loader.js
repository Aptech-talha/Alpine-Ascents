/* ============================================================
   Data Loader Module - Alpine Ascents SPA
   Utility for loading JSON data files with caching and fallback
   ============================================================ */

const DataLoader = {
    cache: {},
    /* { filename, message } for every dataset that could not be loaded */
    failures: [],

    /**
     * Load a single JSON data file from the data/ directory.
     * Results are cached to avoid duplicate fetches.
     * @param {string} filename - Name of the JSON file (e.g. "mountains.json")
     * @returns {Promise<Array|Object>} Parsed data, or an empty array on error
     *   (the failure is recorded in DataLoader.failures so the UI can say so)
     */
    async load(filename) {
        // Return from cache if already loaded
        if (this.cache[filename]) {
            return this.cache[filename];
        }

        try {
            const response = await fetch(`data/${filename}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to load ${filename}`);
            }

            const data = await response.json();
            this.cache[filename] = data;
            return data;

        } catch (error) {
            this.failures.push({ filename, message: error.message });

            // Detect file:// protocol issues
            if (window.location.protocol === 'file:') {
                console.warn(
                    `⚠️ Cannot fetch "${filename}" over file:// protocol. ` +
                    `Please serve the site with a local server (e.g. "npx serve" or Live Server). ` +
                    `Returning empty dataset.`
                );
            } else {
                console.error(`❌ Error loading ${filename}:`, error.message);
            }

            // Try embedded fallback data if available
            if (typeof FallbackData !== 'undefined' && FallbackData[filename]) {
                console.info(`ℹ️ Using embedded fallback data for "${filename}".`);
                this.cache[filename] = FallbackData[filename];
                return FallbackData[filename];
            }

            return [];
        }
    },

    /**
     * Load all data files in parallel.
     * @returns {Promise<Object>} Object with all datasets keyed by name
     */
    async loadAll() {
        const filenames = [
            'mountains.json',
            'equipment.json',
            'records.json',
            'organizations.json',
            'history.json',
            'education.json',
            'news.json'
        ];

        const results = await Promise.all(
            filenames.map(f => this.load(f))
        );

        return {
            mountains: results[0],
            equipment: results[1],
            records: results[2],
            organizations: results[3],
            history: results[4],
            education: results[5],
            news: results[6]
        };
    },

    /**
     * Clear the cache (useful for reloading data)
     */
    clearCache() {
        this.cache = {};
    }
};
