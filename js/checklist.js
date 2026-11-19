/* ============================================================
   Expedition Checklist Module – Alpine Ascents
   An interactive packing/preparation checklist with 8 categories,
   per-category progress, an overall progress bar and optional
   custom items.

   Storage contract
   ----------------
   Owns exactly one key: `alpineAscents_expeditionChecklist`
       { v: 1, checked: ["clothing-1", ...], custom: [{id,name,category}], mountainId: 1|null }

   It never touches `alpineAscents_theme` or `alpineAscents_cart`, so a
   reset here cannot clear the cart or the theme, and vice-versa.

   All user-entered text is rendered with textContent — never innerHTML.
   ============================================================ */

const Checklist = {
    KEY: 'alpineAscents_expeditionChecklist',
    DATA_URL: 'data/checklist.json',
    MAX_CUSTOM: 50,
    MAX_NAME: 80,

    categories: [],
    mountains: [],
    state: { checked: [], custom: [], mountainId: null },
    openCategories: new Set(),
    els: {},
    loaded: false,

    /* --------------------------------------------------------
       Boot
       -------------------------------------------------------- */
    async init() {
        const root = document.getElementById('checklist-categories');
        if (!root) return;

        this.els = {
            root,
            status: document.getElementById('checklist-status'),
            done: document.getElementById('checklist-done'),
            total: document.getElementById('checklist-total'),
            percent: document.getElementById('checklist-percent'),
            progress: document.querySelector('#checklist'),
            bar: document.getElementById('checklist-progress-bar'),
            mountainSelect: document.getElementById('checklist-mountain'),
            mountainInfo: document.getElementById('checklist-mountain-info'),
            form: document.getElementById('checklist-add-form'),
            nameInput: document.getElementById('checklist-new-name'),
            categorySelect: document.getElementById('checklist-new-category'),
            error: document.getElementById('checklist-add-error'),
            reset: document.getElementById('checklist-reset-confirm')
        };

        // The ARIA progressbar wrapper lives around the .progress element
        this.els.progressbar = document.querySelector('.checklist-progress');

        try {
            const response = await fetch(this.DATA_URL, { cache: 'no-cache' });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error('Unexpected checklist shape');

            this.categories = data.filter(category =>
                category && typeof category.id === 'string' && Array.isArray(category.items));
        } catch (error) {
            root.textContent = '';
            const message = document.createElement('p');
            message.className = 'alert alert-warning mb-0';
            message.textContent = 'The checklist could not be loaded. Open the site through a local web server so data/checklist.json is available.';
            root.appendChild(message);
            console.warn('Checklist data failed to load.', error);
            return;
        }

        this.loadState();
        this.buildCategoryOptions();
        this.render();
        this.bindEvents();
        this.loaded = true;

        // mountains.json is fetched by the app after this module starts, so the
        // select may have been filled (or not) before our state was loaded.
        this.syncMountainSelect();
    },

    /** Mountain options come from the existing mountains.json via App. */
    setMountains(list) {
        this.mountains = Array.isArray(list) ? list : [];
        if (!this.els.mountainSelect) return;

        const select = this.els.mountainSelect;
        const current = this.state.mountainId;
        select.textContent = '';

        const general = document.createElement('option');
        general.value = '';
        general.textContent = 'General expedition — no peak selected';
        select.appendChild(general);

        this.mountains.forEach(mountain => {
            const option = document.createElement('option');
            option.value = String(mountain.id);
            option.textContent = mountain.name + (mountain.location ? ` — ${mountain.location}` : '');
            select.appendChild(option);
        });

        this.syncMountainSelect();
    },

    /**
     * Reflect state.mountainId in the <select>. Called after the option list is
     * built and again after storage is loaded, whichever happens last.
     */
    syncMountainSelect() {
        const select = this.els.mountainSelect;
        if (!select) return;

        const current = this.state.mountainId;
        if (current && this.mountains.some(m => m.id === current)) {
            select.value = String(current);
        } else {
            select.value = '';
            if (current) {
                this.state.mountainId = null;
                this.saveState();
            }
        }

        this.renderMountainInfo();
    },

    /* --------------------------------------------------------
       Storage (own key only)
       -------------------------------------------------------- */
    loadState() {
        let raw = null;
        try {
            raw = window.localStorage.getItem(this.KEY);
        } catch (e) {
            this.state = { checked: [], custom: [], mountainId: null };
            return;
        }

        if (!raw) return;

        try {
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') throw new Error('not an object');

            const checked = Array.isArray(parsed.checked)
                ? parsed.checked.filter(id => typeof id === 'string' && id.length <= 80).slice(0, 500)
                : [];

            const custom = Array.isArray(parsed.custom)
                ? parsed.custom
                    .filter(entry => entry && typeof entry.name === 'string'
                        && entry.name.trim().length > 0
                        && typeof entry.category === 'string'
                        && this.categoryExists(entry.category))
                    .slice(0, this.MAX_CUSTOM)
                    .map((entry, index) => ({
                        id: typeof entry.id === 'string' && entry.id ? entry.id : `custom-restored-${index}`,
                        name: entry.name.trim().slice(0, this.MAX_NAME),
                        category: entry.category
                    }))
                : [];

            const mountainId = Number.isInteger(parsed.mountainId) ? parsed.mountainId : null;

            this.state = { checked, custom, mountainId };
        } catch (error) {
            this.state = { checked: [], custom: [], mountainId: null };
            try { window.localStorage.removeItem(this.KEY); } catch (ignored) { /* no-op */ }
            console.warn('Checklist data was unreadable and has been reset.', error);
        }
    },

    saveState() {
        try {
            window.localStorage.setItem(this.KEY, JSON.stringify({
                v: 1,
                checked: this.state.checked,
                custom: this.state.custom,
                mountainId: this.state.mountainId
            }));
        } catch (e) {
            console.warn('Checklist progress could not be saved.', e);
        }
    },

    categoryExists(id) {
        return this.categories.some(category => category.id === id);
    },

    /* --------------------------------------------------------
       Derived data
       -------------------------------------------------------- */
    itemsFor(category) {
        const custom = this.state.custom
            .filter(item => item.category === category.id)
            .map(item => ({ ...item, custom: true }));

        return (category.items || []).concat(custom);
    },

    allItems() {
        return this.categories.reduce((list, category) => list.concat(this.itemsFor(category)), []);
    },

    /* --------------------------------------------------------
       Rendering
       -------------------------------------------------------- */
    buildCategoryOptions() {
        if (!this.els.categorySelect) return;
        this.els.categorySelect.textContent = '';
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            this.els.categorySelect.appendChild(option);
        });
    },

    render() {
        const root = this.els.root;
        root.textContent = '';

        this.categories.forEach(category => {
            root.appendChild(this.buildCategory(category));
        });

        this.updateProgress();
        this.renderMountainInfo();
    },

    buildCategory(category) {
        const items = this.itemsFor(category);
        const done = items.filter(item => this.state.checked.includes(item.id)).length;

        const wrapper = document.createElement('details');
        wrapper.className = 'checklist-category';
        wrapper.dataset.category = category.id;

        // Keep the open/closed state across re-renders
        if (this.openCategories.has(category.id) || (this.openCategories.size === 0 && this.state.checked.length === 0 && category === this.categories[0])) {
            wrapper.open = true;
        }

        const summary = document.createElement('summary');
        summary.className = 'checklist-category-summary';

        const icon = document.createElement('i');
        icon.className = `fas ${category.icon || 'fa-list-check'} checklist-category-icon`;
        icon.setAttribute('aria-hidden', 'true');

        const name = document.createElement('span');
        name.className = 'checklist-category-name';
        name.textContent = category.name;

        const counter = document.createElement('span');
        counter.className = 'checklist-category-count';
        counter.dataset.categoryCount = category.id;
        counter.textContent = `${done}/${items.length}`;

        summary.append(icon, name, counter);
        wrapper.appendChild(summary);

        const body = document.createElement('div');
        body.className = 'checklist-category-body';

        items.forEach(item => body.appendChild(this.buildItem(item)));
        wrapper.appendChild(body);

        return wrapper;
    },

    buildItem(item) {
        const row = document.createElement('div');
        row.className = 'checklist-item';
        if (item.custom) row.classList.add('is-custom');

        const label = document.createElement('label');
        label.className = 'checklist-item-label';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'form-check-input checklist-checkbox';
        input.value = item.id;
        input.checked = this.state.checked.includes(item.id);
        input.setAttribute('data-check-id', item.id);

        const text = document.createElement('span');
        text.className = 'checklist-item-text';

        const name = document.createElement('span');
        name.className = 'checklist-item-name';
        name.textContent = item.name;

        const note = document.createElement('span');
        note.className = 'checklist-item-note';
        note.textContent = item.note || '';

        text.append(name);
        if (item.note) text.append(note);

        label.append(input, text);
        row.appendChild(label);

        if (item.custom) {
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'checklist-remove';
            remove.setAttribute('data-remove-custom', item.id);
            remove.setAttribute('aria-label', `Remove custom item ${item.name}`);
            remove.innerHTML = '<i class="fas fa-xmark" aria-hidden="true"></i>';
            row.appendChild(remove);
        }

        return row;
    },

    updateProgress() {
        const items = this.allItems();
        const total = items.length;
        const done = items.filter(item => this.state.checked.includes(item.id)).length;
        const percent = total === 0 ? 0 : Math.round((done / total) * 100);

        if (this.els.done) this.els.done.textContent = String(done);
        if (this.els.total) this.els.total.textContent = String(total);
        if (this.els.percent) this.els.percent.textContent = `${percent}%`;

        if (this.els.bar) {
            this.els.bar.style.width = `${percent}%`;
            this.els.bar.classList.toggle('is-complete', percent === 100);
        }
        if (this.els.progressbar) {
            this.els.progressbar.setAttribute('aria-valuenow', String(percent));
            this.els.progressbar.setAttribute('aria-valuetext', `${done} of ${total} items packed`);
        }

        const label = percent === 0 ? 'Not started'
            : percent === 100 ? 'Checklist completed'
                : percent >= 75 ? 'Almost ready'
                    : percent >= 50 ? 'Halfway there'
                        : 'Preparation started';

        if (this.els.status) this.els.status.textContent = label;

        // Per-category counters
        this.categories.forEach(category => {
            const categoryItems = this.itemsFor(category);
            const categoryDone = categoryItems.filter(item => this.state.checked.includes(item.id)).length;
            const counter = document.querySelector(`[data-category-count="${category.id}"]`);
            if (counter) counter.textContent = `${categoryDone}/${categoryItems.length}`;
        });
    },

    renderMountainInfo() {
        const info = this.els.mountainInfo;
        if (!info) return;

        const selected = this.state.mountainId
            ? this.mountains.find(mountain => mountain.id === this.state.mountainId)
            : null;

        if (!selected) {
            info.classList.add('d-none');
            info.textContent = '';
            return;
        }

        info.classList.remove('d-none');
        info.textContent = '';

        const strong = document.createElement('strong');
        strong.textContent = selected.name;

        const details = [];
        if (selected.location) details.push(selected.location);
        if (selected.height) details.push(`${selected.height.toLocaleString()} m`);
        if (selected.difficulty) details.push(selected.difficulty);

        const span = document.createElement('span');
        span.textContent = ` — ${details.join(' · ')}`;

        const note = document.createElement('span');
        note.className = 'd-block text-muted mt-1';
        note.textContent = 'Reference data only: this checklist is not a route-specific equipment list.';

        info.append(strong, span, note);
    },

    /* --------------------------------------------------------
       Interaction
       -------------------------------------------------------- */
    bindEvents() {
        // Checkbox changes (delegated so re-rendered items keep working)
        this.els.root.addEventListener('change', (event) => {
            const input = event.target.closest('[data-check-id]');
            if (!input) return;

            const id = input.getAttribute('data-check-id');
            if (input.checked) {
                if (!this.state.checked.includes(id)) this.state.checked.push(id);
            } else {
                this.state.checked = this.state.checked.filter(entry => entry !== id);
            }

            this.saveState();
            this.updateProgress();

            const nameEl = input.parentElement && input.parentElement.querySelector('.checklist-item-name');
            const name = nameEl ? nameEl.textContent : 'Item';
            this.announce(input.checked ? `${name} packed.` : `${name} unchecked.`);
        });

        // Remember which categories are open
        this.els.root.addEventListener('toggle', (event) => {
            const details = event.target;
            if (!details.classList || !details.classList.contains('checklist-category')) return;
            if (details.open) this.openCategories.add(details.dataset.category);
            else this.openCategories.delete(details.dataset.category);
        }, true);

        // Remove custom item
        this.els.root.addEventListener('click', (event) => {
            const button = event.target.closest('[data-remove-custom]');
            if (!button) return;

            const id = button.getAttribute('data-remove-custom');
            const item = this.state.custom.find(entry => entry.id === id);

            this.state.custom = this.state.custom.filter(entry => entry.id !== id);
            this.state.checked = this.state.checked.filter(entry => entry !== id);
            this.saveState();

            const details = button.closest('.checklist-category');
            if (details) this.openCategories.add(details.dataset.category);

            this.render();
            this.announce(item ? `${item.name} removed from your checklist.` : 'Custom item removed.');
        });

        // Add custom item
        if (this.els.form) {
            this.els.form.addEventListener('submit', (event) => {
                event.preventDefault();
                this.addCustomItem();
            });
        }

        // Mountain selection
        if (this.els.mountainSelect) {
            this.els.mountainSelect.addEventListener('change', () => {
                const value = parseInt(this.els.mountainSelect.value, 10);
                this.state.mountainId = Number.isNaN(value) ? null : value;
                this.saveState();
                this.renderMountainInfo();
            });
        }

        // Reset (confirmed in a modal)
        if (this.els.reset) {
            this.els.reset.addEventListener('click', () => this.reset());
        }
    },

    addCustomItem() {
        const nameInput = this.els.nameInput;
        const categoryId = this.els.categorySelect && this.els.categorySelect.value;
        const name = (nameInput.value || '').trim().replace(/\s+/g, ' ');

        const fail = (message, field) => {
            this.els.error.textContent = message;
            this.els.error.hidden = false;
            if (field) {
                field.setAttribute('aria-invalid', 'true');
                field.focus();
            }
        };

        if (!categoryId || !this.categoryExists(categoryId)) {
            fail('Choose a category for the new item.', this.els.categorySelect);
            return;
        }

        if (name.length === 0) {
            fail('Enter a name for the item.', nameInput);
            return;
        }

        if (name.length > this.MAX_NAME) {
            fail(`Keep the name under ${this.MAX_NAME} characters.`, nameInput);
            return;
        }

        if (this.state.custom.length >= this.MAX_CUSTOM) {
            fail(`You can add up to ${this.MAX_CUSTOM} custom items.`, nameInput);
            return;
        }

        const category = this.categories.find(entry => entry.id === categoryId);
        const duplicates = this.itemsFor(category)
            .some(item => item.name.toLowerCase() === name.toLowerCase());

        if (duplicates) {
            fail('That item is already in this category.', nameInput);
            return;
        }

        this.state.custom.push({
            id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name,
            category: categoryId
        });
        this.saveState();

        this.els.error.hidden = true;
        this.els.error.textContent = '';
        nameInput.value = '';
        nameInput.removeAttribute('aria-invalid');

        this.openCategories.add(categoryId);
        this.render();
        this.announce(`${name} added to ${category.name}.`);
        nameInput.focus();
    },

    reset() {
        // Only checklist state — cart and theme keys are never touched
        this.state = { checked: [], custom: [], mountainId: null };
        this.saveState();

        if (this.els.mountainSelect) this.els.mountainSelect.value = '';

        // Close the confirmation dialog explicitly; re-rendering the list does
        // not dismiss it, which left the page in a "modal-open" state.
        const modalEl = document.getElementById('checklist-reset-modal');
        if (modalEl && typeof bootstrap !== 'undefined') {
            const instance = bootstrap.Modal.getInstance(modalEl);
            if (instance) instance.hide();
        }

        this.openCategories.clear();
        this.render();
        this.announce('Checklist reset. Cart and theme are unchanged.');
    },

    announce(message) {
        const live = document.getElementById('checklist-live-status');
        if (!live) return;
        live.textContent = '';
        window.setTimeout(() => { live.textContent = message; }, 30);
    }
};
