/* ============================================================
   Details Modal Module – Alpine Ascents
   Two read-only dialogs driven by the existing JSON datasets:

   • Mountain details — opened by a mountain card image, its
     "Details" button, or a gallery item that carries a mountainId.
   • Gear details — opened by the "Buy Now" button on every
     equipment card.

   Design decisions
   ----------------
   • One dialog per click. A gallery item that links to a mountain
     opens the mountain dialog INSTEAD of the lightbox, so two modals
     never stack.
   • All values are written with textContent / created nodes — no
     dataset string is ever injected as HTML.
   • Nothing is invented: a missing field is simply left out or shown
     as "Not recorded".
   • Front-end only. The gear dialog states plainly that no checkout,
   payment or order exists.
   ============================================================ */

const DetailsModal = {
    mountains: [],
    equipment: [],
    mountainModal: null,
    productModal: null,
    currentMountain: null,
    lastTrigger: null,

    DIFFICULTY_COLOURS: {
        'Easy': 'success',
        'Moderate': 'info',
        'Difficult': 'warning',
        'Very Difficult': 'danger',
        'Extreme': 'danger'
    },

    /* --------------------------------------------------------
       init()
       -------------------------------------------------------- */
    init() {
        const mountainEl = document.getElementById('mountain-modal');
        const productEl = document.getElementById('product-modal');
        if (!mountainEl || !productEl || typeof bootstrap === 'undefined') return;

        this.mountainModal = bootstrap.Modal.getOrCreateInstance(mountainEl);
        this.productModal = bootstrap.Modal.getOrCreateInstance(productEl);

        // Delegated: works for cards re-rendered by the filters
        $(document).on('click', '[data-mountain-id]', (e) => {
            const id = parseInt($(e.currentTarget).attr('data-mountain-id'), 10);
            if (!Number.isNaN(id)) this.openMountain(id, e.currentTarget);
        });

        $(document).on('click', '[data-buy-id]', (e) => {
            const id = parseInt($(e.currentTarget).attr('data-buy-id'), 10);
            if (!Number.isNaN(id)) this.openProduct(id, e.currentTarget);
        });

        // Bootstrap does not reliably restore focus when a dialog is opened
        // programmatically, so both dialogs return focus to their opener.
        $(mountainEl).on('hidden.bs.modal', () => this.restoreFocus());
        $(productEl).on('hidden.bs.modal', () => this.restoreFocus());

        // "View on map" jumps from the dialog to the Leaflet map
        $(document).on('click', '#mountain-modal-map', () => {
            const m = this.currentMountain;
            this.mountainModal.hide();
            if (!m || typeof MountainMap === 'undefined') return;

            window.setTimeout(() => {
                const target = $('#organizations').offset();
                if (target) window.scrollTo(0, target.top - 70);
                MountainMap.flyTo(m.lat, m.lng, 8);
            }, 260);
        });
    },

    /* --------------------------------------------------------
       Data registration (called by App after each fetch)
       -------------------------------------------------------- */
    setMountains(list) {
        this.mountains = Array.isArray(list) ? list : [];
    },

    setEquipment(list) {
        this.equipment = Array.isArray(list) ? list : [];
    },

    /* --------------------------------------------------------
       MOUNTAIN DIALOG
       -------------------------------------------------------- */
    openMountain(id, trigger) {
        const m = this.mountains.find(item => Number(item.id) === id);
        if (!m || !this.mountainModal) return;

        this.lastTrigger = trigger || document.activeElement;
        this.currentMountain = m;

        const image = document.getElementById('mountain-modal-image');
        image.src = m.image || 'assets/images/ui/placeholder-mountain.svg';
        image.alt = `${m.name || 'Mountain'} — summit view`;

        document.getElementById('mountain-modal-title').textContent = m.name || 'Unnamed peak';
        document.getElementById('mountain-modal-location').textContent =
            [m.range, m.location].filter(Boolean).join(' • ') || 'Location not recorded';

        const badge = document.getElementById('mountain-modal-difficulty');
        if (m.difficulty) {
            const colour = this.DIFFICULTY_COLOURS[m.difficulty] || 'secondary';
            badge.className = `badge bg-${colour} mb-2`;
            badge.textContent = `${m.difficulty} difficulty`;
        } else {
            badge.className = 'd-none';
            badge.textContent = '';
        }

        this.renderFacts(m);

        document.getElementById('mountain-modal-description').textContent =
            m.description || 'No description is recorded for this peak.';

        const ascent = document.getElementById('mountain-modal-ascent');
        if (m.firstAscent) {
            ascent.textContent = m.firstAscentBy
                ? `First ascent: ${m.firstAscent} — ${m.firstAscentBy}.`
                : `First ascent: ${m.firstAscent}.`;
        } else {
            ascent.textContent = 'First ascent: not recorded in the dataset.';
        }

        const mapBtn = document.getElementById('mountain-modal-map');
        mapBtn.classList.toggle('d-none', !(m.lat && m.lng));

        this.mountainModal.show();
    },

    /**
     * Return keyboard focus to the control that opened the dialog.
     */
    restoreFocus() {
        const el = this.lastTrigger;
        this.lastTrigger = null;
        if (el && document.body.contains(el) && typeof el.focus === 'function') {
            el.focus({ preventScroll: true });
        }
    },

    /**
     * Build the fact tiles from whatever the dataset actually contains.
     * @param {object} m mountain record
     */
    renderFacts(m) {
        const container = document.getElementById('mountain-modal-facts');
        container.textContent = '';

        const facts = [];
        if (m.height) {
            facts.push({
                icon: 'fa-mountain',
                label: 'Elevation',
                value: `${m.height.toLocaleString()} m${m.heightFt ? ` (${m.heightFt.toLocaleString()} ft)` : ''}`
            });
        }
        if (m.range) facts.push({ icon: 'fa-layer-group', label: 'Range', value: m.range });
        if (m.continent) facts.push({ icon: 'fa-globe', label: 'Continent', value: m.continent });
        if (m.season) facts.push({ icon: 'fa-calendar-alt', label: 'Best season', value: m.season });
        if (m.deathRate) facts.push({ icon: 'fa-triangle-exclamation', label: 'Reported fatality rate', value: m.deathRate });

        facts.forEach((fact) => {
            const tile = document.createElement('div');
            tile.className = 'mountain-fact';
            tile.setAttribute('role', 'listitem');

            const icon = document.createElement('i');
            icon.className = `fas ${fact.icon} mountain-fact-icon`;
            icon.setAttribute('aria-hidden', 'true');

            const label = document.createElement('span');
            label.className = 'mountain-fact-label';
            label.textContent = fact.label;

            const value = document.createElement('strong');
            value.className = 'mountain-fact-value';
            value.textContent = fact.value;

            tile.append(icon, label, value);
            container.appendChild(tile);
        });
    },

    /* --------------------------------------------------------
       GEAR DIALOG
       -------------------------------------------------------- */
    openProduct(id, trigger) {
        const item = this.equipment.find(entry => Number(entry.id) === id);
        if (!item || !this.productModal) return;

        this.lastTrigger = trigger || document.activeElement;

        const guidance = (typeof App !== 'undefined' && App.EQUIPMENT_GUIDANCE)
            ? (App.EQUIPMENT_GUIDANCE[item.category] || {})
            : {};

        const image = document.getElementById('product-modal-image');
        image.src = item.image || 'assets/images/ui/placeholder-equipment.svg';
        image.alt = `${item.name || 'Equipment'} product photograph`;

        document.getElementById('product-modal-title').textContent = item.name || 'Unnamed item';
        document.getElementById('product-modal-category').textContent = item.category || 'General';
        document.getElementById('product-modal-price').textContent = item.price || 'Price not listed';

        // Only show metadata that exists — never invent weight or rating
        const metaParts = [];
        if (item.weight) metaParts.push(`Weight: ${item.weight}`);
        if (item.rating) metaParts.push(`Rated ${item.rating}/5`);
        document.getElementById('product-modal-meta').textContent =
            metaParts.join('  ·  ') || 'No additional specifications recorded.';

        document.getElementById('product-modal-description').textContent =
            item.description || 'No description is recorded for this item.';

        const use = document.getElementById('product-modal-use');
        use.textContent = guidance.use || 'Not classified in this project.';

        const care = document.getElementById('product-modal-care');
        care.textContent = guidance.care || 'Follow the manufacturer instructions for this category.';

        document.getElementById('product-modal-essential').classList.toggle('d-none', !item.essential);

        // Point the "Add to Cart" button at the product on screen. The id lives
        // on the button (not in a closure) so Cart can stay the single owner of
        // cart state using one delegated listener.
        const addBtn = document.getElementById('product-add-to-cart');
        if (addBtn) {
            addBtn.setAttribute('data-add-to-cart-id', String(item.id));
            addBtn.setAttribute('aria-label', `Add ${item.name || 'this item'} to the cart`);

            const price = (typeof Cart !== 'undefined') ? Cart.parsePrice(item.price) : null;
            addBtn.disabled = false;
            addBtn.title = price === null ? 'The dataset has no price for this item; it will be added without a price.' : '';
        }

        this.productModal.show();
    }
};
