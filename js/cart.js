/* ============================================================
   Cart Module – Alpine Ascents
   A front-end-only "kit list" cart for the equipment catalogue.

   Scope and honesty
   -----------------
   • No backend, no payment, no stock. The cart stores a product id
     and a quantity; everything else is read live from
     data/equipment.json so prices can never drift out of sync.
   • Prices are parsed into numbers (`$1,200` → 1200). A product with
     no usable price is kept in the cart but shown as "price not
     listed" and excluded from the total, instead of inventing a
     number or silently dropping it.
   • Persistence: localStorage key `alpineAscents_cart`, holding
     only `{ v: 1, items: [{ id, qty }] }`. Corrupt or foreign data is
     discarded rather than trusted.

   Rendering is DOM-based (createElement / textContent) — no dataset
   string is injected as HTML.
   ============================================================ */

const Cart = {
    STORAGE_KEY: 'alpineAscents_cart',
    /* key used by the previous version; read once and then removed */
    LEGACY_KEY: 'alpine_ascents_cart_v1',
    STORAGE_VERSION: 1,
    MAX_QTY: 99,

    items: [],
    products: [],
    byId: new Map(),

    drawer: null,
    els: {},
    toastTimer: null,
    lastAdd: { id: null, at: 0 },
    lastRemoved: null,

    /* --------------------------------------------------------
       init()
       -------------------------------------------------------- */
    init() {
        const drawerEl = document.getElementById('cart-drawer');
        if (!drawerEl || typeof bootstrap === 'undefined') return;

        this.drawer = bootstrap.Offcanvas.getOrCreateInstance(drawerEl);

        this.els = {
            badge: document.getElementById('cart-count'),
            badgeSr: document.getElementById('cart-count-sr'),
            drawerCount: document.getElementById('cart-drawer-count'),
            list: document.getElementById('cart-items'),
            empty: document.getElementById('cart-empty'),
            footer: document.getElementById('cart-footer'),
            totalItems: document.getElementById('cart-total-items'),
            totalAmount: document.getElementById('cart-total-amount'),
            unpricedNote: document.getElementById('cart-unpriced-note'),
            clear: document.getElementById('cart-clear'),
            toast: document.getElementById('cart-toast'),
            toastMsg: document.getElementById('cart-toast-msg'),
            toastOpen: document.getElementById('cart-toast-open'),
            toastUndo: document.getElementById('cart-toast-undo'),
            distinct: document.getElementById('cart-distinct'),
            subtotal: document.getElementById('cart-subtotal'),
            continueBtn: document.getElementById('cart-continue')
        };

        this.load();
        this.render();

        // ── One delegated listener set for the lifetime of the page ──
        document.addEventListener('click', (e) => this.handleClick(e));
    },

    /**
     * Single delegated click handler: add, +/-, remove, clear, toast action.
     * @param {MouseEvent} e
     */
    handleClick(e) {
        const target = e.target instanceof Element ? e.target : null;
        if (!target) return;

        const addBtn = target.closest('[data-add-to-cart]');
        if (addBtn) {
            const id = parseInt(addBtn.getAttribute('data-add-to-cart-id'), 10);
            if (!Number.isNaN(id)) this.add(id, 1, addBtn);
            return;
        }

        const qtyBtn = target.closest('[data-cart-qty]');
        if (qtyBtn) {
            const id = parseInt(qtyBtn.getAttribute('data-cart-id'), 10);
            const current = this.getItem(id);
            if (!current) return;
            const next = current.qty + (qtyBtn.getAttribute('data-cart-qty') === 'up' ? 1 : -1);
            this.setQty(id, next);
            return;
        }

        const removeBtn = target.closest('[data-cart-remove]');
        if (removeBtn) {
            this.remove(parseInt(removeBtn.getAttribute('data-cart-id'), 10));
            return;
        }

        if (target.closest('#cart-clear')) {
            this.clear();
            return;
        }

        if (target.closest('#cart-toast-open')) {
            this.open();
            return;
        }

        if (target.closest('#cart-toast-undo')) {
            this.undoRemove();
            return;
        }

        if (target.closest('#cart-continue') || target.closest('#cart-continue-empty')) {
            this.continueShopping();
        }
    },

    /* --------------------------------------------------------
       Catalogue
       -------------------------------------------------------- */
    setProducts(list) {
        this.products = Array.isArray(list) ? list : [];
        this.byId = new Map(this.products.map(p => [Number(p.id), p]));

        // Drop entries whose product no longer exists, then re-render
        const before = this.items.length;
        this.items = this.items.filter(item => this.byId.has(item.id));
        if (this.items.length !== before) this.save();

        this.render();
    },

    /**
     * Turn a dataset price into a number.
     * Accepts 650, "650", "$650", "$1,200", "1,200.50".
     * @param {string|number} value
     * @returns {number|null} null when there is no trustworthy number
     */
    parsePrice(value) {
        if (typeof value === 'number') {
            return Number.isFinite(value) && value >= 0 ? value : null;
        }
        if (typeof value !== 'string') return null;

        const match = value.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
        if (!match) return null;

        const number = Number(match[1]);
        return Number.isFinite(number) && number >= 0 ? number : null;
    },

    formatMoney(amount) {
        return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    /* --------------------------------------------------------
       Cart mutations
       -------------------------------------------------------- */
    getItem(id) {
        return this.items.find(item => item.id === Number(id)) || null;
    },

    /**
     * Add a product, or increase its quantity when it is already present.
     * A second click on the same button within 250 ms is ignored so a
     * double-firing event cannot add twice.
     */
    add(id, qty = 1, sourceEl = null) {
        const productId = Number(id);
        if (!this.byId.has(productId)) return;

        const now = Date.now();
        if (this.lastAdd.id === productId && now - this.lastAdd.at < 250) return;
        this.lastAdd = { id: productId, at: now };

        const existing = this.getItem(productId);
        if (existing) {
            existing.qty = Math.min(this.MAX_QTY, existing.qty + qty);
        } else {
            this.items.push({ id: productId, qty: Math.min(this.MAX_QTY, Math.max(1, qty)) });
        }

        this.save();
        this.render();
        this.notify(productId);

        // Keep focus on the button that was pressed: blurring it moved focus to
        // <body>, which made Escape stop closing the product dialog for keyboard
        // users and lost their place in the page.
        if (sourceEl && document.activeElement !== sourceEl) {
            sourceEl.focus({ preventScroll: true });
        }
    },

    setQty(id, qty) {
        const item = this.getItem(id);
        if (!item) return;

        const next = Math.max(1, Math.min(this.MAX_QTY, Math.round(qty)));
        if (next === item.qty) return;

        item.qty = next;
        this.save();
        this.render();
    },

    remove(id) {
        const index = this.items.findIndex(item => item.id === Number(id));
        if (index === -1) return;

        const [removed] = this.items.splice(index, 1);
        this.lastRemoved = { item: { ...removed }, index };

        this.save();
        this.render();

        const product = this.byId.get(removed.id);
        const name = product && product.name ? product.name : 'Item';
        this.showToast(`${name} removed from cart.`, { undo: true });
        this.announce(`${name} removed. ${this.totals().count} items remain in the cart.`);
    },

    /** Put back the item removed last (single level of undo). */
    undoRemove() {
        if (!this.lastRemoved) return;

        const { item, index } = this.lastRemoved;
        if (this.byId.has(item.id)) {
            const existing = this.getItem(item.id);
            if (existing) existing.qty = Math.min(this.MAX_QTY, existing.qty + item.qty);
            else this.items.splice(Math.min(index, this.items.length), 0, { id: item.id, qty: item.qty });
            this.save();
            this.render();
            this.announce('Item restored to the cart.');
        }

        this.lastRemoved = null;
        this.hideToast();
    },

    clear() {
        if (!this.items.length) return;
        this.items = [];
        this.save();
        this.render();
        this.announce('Cart cleared.');
    },

    /* --------------------------------------------------------
       Totals
       -------------------------------------------------------- */
    totals() {
        let count = 0;
        let amount = 0;
        let unpriced = 0;

        this.items.forEach((item) => {
            const product = this.byId.get(item.id);
            if (!product) return;

            count += item.qty;
            const price = this.parsePrice(product.price);
            if (price === null) unpriced += 1;
            else amount += price * item.qty;
        });

        return { count, amount, unpriced };
    },

    /* --------------------------------------------------------
       Persistence
       -------------------------------------------------------- */
    load() {
        let raw = null;
        let migrated = false;

        try {
            raw = window.localStorage.getItem(this.STORAGE_KEY);

            // One-time migration from the pre-rename key. Only cart data is
            // involved; theme and checklist keys are never read here.
            if (!raw) {
                const legacy = window.localStorage.getItem(this.LEGACY_KEY);
                if (legacy) {
                    raw = legacy;
                    migrated = true;
                }
            }
        } catch (e) {
            // Storage blocked (private mode / policy): run in memory for this visit
            this.items = [];
            return;
        }

        if (!raw) {
            this.items = [];
            return;
        }

        try {
            const parsed = JSON.parse(raw);
            const list = parsed && Array.isArray(parsed.items) ? parsed.items : null;
            if (!list) throw new Error('Unexpected cart shape');

            this.items = list
                .map(entry => ({
                    id: Number(entry && entry.id),
                    qty: Math.max(1, Math.min(this.MAX_QTY, Math.round(Number(entry && entry.qty)) || 1))
                }))
                .filter(entry => Number.isInteger(entry.id));

            if (migrated) {
                // Persist under the new key, then drop the legacy one so only
                // `alpineAscents_cart` remains.
                this.save();
                try { window.localStorage.removeItem(this.LEGACY_KEY); } catch (ignored) { /* no-op */ }
                console.info('Cart migrated to the new storage key.');
            }
        } catch (e) {
            // Corrupted or foreign payload — start clean and overwrite it
            this.items = [];
            try { window.localStorage.removeItem(this.STORAGE_KEY); } catch (ignored) { /* no-op */ }
            console.warn('Cart data was unreadable and has been reset.', e);
        }
    },

    save() {
        try {
            window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                v: this.STORAGE_VERSION,
                items: this.items.map(item => ({ id: item.id, qty: item.qty }))
            }));
        } catch (e) {
            // Quota or blocked storage: the in-memory cart still works this visit
            console.warn('Cart could not be saved to localStorage.', e);
        }
    },

    /* --------------------------------------------------------
       Rendering
       -------------------------------------------------------- */
    render() {
        if (!this.els.list) return;

        const { count, amount, unpriced } = this.totals();

        // Badges
        if (this.els.badge) {
            this.els.badge.textContent = String(count);
            this.els.badge.dataset.empty = count === 0 ? 'true' : 'false';
        }
        if (this.els.badgeSr) this.els.badgeSr.textContent = count === 1 ? '1 item' : `${count} items`;
        if (this.els.drawerCount) this.els.drawerCount.textContent = String(count);

        // Empty state vs list
        const isEmpty = this.items.length === 0;
        this.els.list.hidden = isEmpty;
        this.els.empty.classList.toggle('d-none', !isEmpty);
        // Belt and braces: hidden content must also leave the accessibility tree
        this.els.empty.hidden = !isEmpty;
        this.els.footer.classList.toggle('d-none', isEmpty);

        this.els.list.textContent = '';
        this.items.forEach(item => this.els.list.appendChild(this.buildRow(item)));

        // Money
        if (this.els.totalItems) this.els.totalItems.textContent = String(count);
        if (this.els.distinct) this.els.distinct.textContent = String(this.items.length);
        if (this.els.subtotal) this.els.subtotal.textContent = this.formatMoney(amount);
        if (this.els.totalAmount) this.els.totalAmount.textContent = this.formatMoney(amount);
        if (this.els.unpricedNote) this.els.unpricedNote.classList.toggle('d-none', unpriced === 0);

        if (this.els.clear) this.els.clear.disabled = isEmpty;
    },

    /**
     * Build one cart row with safe DOM APIs.
     * @param {{id:number, qty:number}} item
     */
    buildRow(item) {
        const product = this.byId.get(item.id) || { name: 'Unknown item' };
        const price = this.parsePrice(product.price);
        const name = product.name || 'Unknown item';

        const li = document.createElement('li');
        li.className = 'cart-item';
        li.setAttribute('data-cart-row', String(item.id));

        const img = document.createElement('img');
        img.className = 'cart-item-img';
        img.src = product.image || 'assets/images/ui/placeholder-equipment.svg';
        img.alt = `${name} product photograph`;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('error', () => {
            img.src = 'assets/images/ui/placeholder-equipment.svg';
        }, { once: true });

        const body = document.createElement('div');
        body.className = 'cart-item-body';

        const title = document.createElement('p');
        title.className = 'cart-item-name';
        title.textContent = name;

        const unit = document.createElement('p');
        unit.className = 'cart-item-unit';
        unit.textContent = price === null ? 'Price not listed' : `${this.formatMoney(price)} each`;

        const controls = document.createElement('div');
        controls.className = 'cart-qty';

        const dec = document.createElement('button');
        dec.type = 'button';
        dec.className = 'cart-qty-btn';
        dec.setAttribute('data-cart-qty', 'down');
        dec.setAttribute('data-cart-id', String(item.id));
        dec.setAttribute('aria-label', `Decrease quantity of ${name}`);
        dec.disabled = item.qty <= 1;
        dec.textContent = '−';

        const qty = document.createElement('span');
        qty.className = 'cart-qty-value';
        qty.setAttribute('aria-live', 'polite');
        qty.textContent = String(item.qty);
        qty.setAttribute('aria-label', `Quantity: ${item.qty}`);

        const inc = document.createElement('button');
        inc.type = 'button';
        inc.className = 'cart-qty-btn';
        inc.setAttribute('data-cart-qty', 'up');
        inc.setAttribute('data-cart-id', String(item.id));
        inc.setAttribute('aria-label', `Increase quantity of ${name}`);
        inc.disabled = item.qty >= this.MAX_QTY;
        inc.textContent = '+';

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'cart-remove';
        remove.setAttribute('data-cart-remove', '');
        remove.setAttribute('data-cart-id', String(item.id));
        remove.setAttribute('aria-label', `Remove ${name} from cart`);
        remove.textContent = 'Remove';

        controls.append(dec, qty, inc, remove);

        const subtotal = document.createElement('p');
        subtotal.className = 'cart-item-subtotal';
        subtotal.textContent = price === null
            ? '—'
            : this.formatMoney(price * item.qty);
        if (price === null) subtotal.title = 'No price in the dataset, so this item is excluded from the total';

        body.append(title, unit, controls, subtotal);

        li.append(img, body);
        return li;
    },

    /* --------------------------------------------------------
       Feedback
       -------------------------------------------------------- */
    notify(productId) {
        const product = this.byId.get(productId);
        const name = product && product.name ? product.name : 'Item';
        this.showToast(`${name} added to cart.`, { undo: false });
        this.announce(`${name} added to cart. ${this.totals().count} items in cart.`);
    },

    /**
     * @param {string} message
     * @param {{undo?: boolean}} [options] show the Undo action
     */
    showToast(message, options = {}) {
        if (!this.els.toast) return;

        this.els.toastMsg.textContent = message;
        if (this.els.toastUndo) this.els.toastUndo.hidden = !options.undo;
        this.els.toast.hidden = false;

        window.clearTimeout(this.toastTimer);
        this.toastTimer = window.setTimeout(() => this.hideToast(), options.undo ? 6000 : 3500);
    },

    hideToast() {
        window.clearTimeout(this.toastTimer);
        if (this.els.toast) this.els.toast.hidden = true;
        if (this.els.toastUndo) this.els.toastUndo.hidden = true;
    },

    /**
     * Read a short status to screen readers without moving focus.
     * @param {string} message
     */
    announce(message) {
        const live = document.getElementById('cart-live-status');
        if (!live) return;
        live.textContent = '';
        window.setTimeout(() => { live.textContent = message; }, 30);
    },

    /**
     * Close the drawer, then scroll to the equipment section — no navigation,
     * no reload, and the cart state is untouched.
     */
    continueShopping() {
        const target = document.getElementById('equipment');
        const go = () => {
            if (!target) return;
            const reduced = window.matchMedia
                && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
            // Move focus to the section heading so keyboard users land there
            const heading = target.querySelector('h2, .section-title');
            if (heading) {
                heading.setAttribute('tabindex', '-1');
                window.setTimeout(() => heading.focus({ preventScroll: true }), reduced ? 0 : 450);
            }
        };

        const drawerEl = document.getElementById('cart-drawer');
        if (this.drawer && drawerEl && drawerEl.classList.contains('show')) {
            drawerEl.addEventListener('hidden.bs.offcanvas', go, { once: true });
            this.drawer.hide();
        } else {
            go();
        }
    },

    /**
     * Open the cart. If the product dialog is open, close it first so the
     * two surfaces never stack on top of each other.
     */
    open() {
        const productModalEl = document.getElementById('product-modal');
        const productModal = productModalEl && bootstrap.Modal.getInstance(productModalEl);

        if (productModal) {
            productModalEl.addEventListener('hidden.bs.modal', () => this.drawer.show(), { once: true });
            productModal.hide();
            return;
        }

        this.drawer.show();
    }
};
