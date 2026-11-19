/* ============================================================
   App Controller - Alpine Ascents SPA
   Main application orchestrator — initializes modules and
   renders all data-driven sections with Bootstrap 5 markup
   ============================================================ */

const App = {
    /**
     * Master initialization — called on DOM ready
     */
    async init() {
        // Initialize core modules (no data dependency)
        Navigation.init();
        VisitorCounter.init();
        DateTimeDisplay.init();
        GeoLocation.init();
        if (typeof BottomTicker !== 'undefined') BottomTicker.init();
        if (typeof ContactForm !== 'undefined') ContactForm.init();
        if (typeof Theme !== 'undefined') Theme.init();
        if (typeof DetailsModal !== 'undefined') DetailsModal.init();
        if (typeof Cart !== 'undefined') Cart.init();
        if (typeof Checklist !== 'undefined') Checklist.init();

        // Load all data
        const data = await DataLoader.loadAll();
        this.renderDataStatus();

        // Render data-driven sections
        this.renderMountains(data.mountains);
        this.renderHistory(data.history);
        this.renderEquipment(data.equipment);
        this.renderRecords(data.records);
        this.renderOrganizations(data.organizations);
        this.renderNews(data.news);
        this.renderEducation(data.education);

        // Initialize feature modules that depend on rendered content
        if (typeof Gallery !== 'undefined') Gallery.init();
        if (typeof MountainMap !== 'undefined') MountainMap.init(data.mountains, data.organizations);

        // Animate stats counters in About section
        this.initStatsCounters();

        // Re-observe new dynamically rendered elements for scroll animations
        Navigation.observeNewElements();

    },

    /* -------------------------------------------------------
       SHARED HELPERS
    ------------------------------------------------------- */

    /**
     * True when the visitor asked the operating system to reduce motion.
     * @returns {boolean}
     */
    prefersReducedMotion() {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    },

    /**
     * Push a short status message to a polite live region so screen-reader
     * users learn that a filter changed the visible result count.
     * @param {string} message
     */
    announce(message) {
        let region = document.getElementById('aa-live-region');

        if (!region) {
            region = document.createElement('div');
            region.id = 'aa-live-region';
            region.className = 'visually-hidden';
            region.setAttribute('role', 'status');
            region.setAttribute('aria-live', 'polite');
            region.setAttribute('aria-atomic', 'true');
            document.body.appendChild(region);
        }

        // Clear first so identical consecutive messages are still announced
        region.textContent = '';
        window.setTimeout(() => { region.textContent = message; }, 60);
    },

    /**
     * Replace a container's contents with a readable "could not load" panel.
     * Used when a dataset is missing so a section never looks broken/blank.
     * @param {string} selector
     * @param {string} message
     */
    showEmpty(selector, message) {
        const el = document.querySelector(selector);
        if (!el) return;
        while (el.firstChild) el.removeChild(el.firstChild);
        const col = document.createElement('div');
        col.className = 'col-12';
        const box = document.createElement('div');
        box.className = 'data-empty';
        box.textContent = message;
        col.appendChild(box);
        el.appendChild(col);
    },

    /* -------------------------------------------------------
       DATA STATUS
    ------------------------------------------------------- */

    /**
     * Show a visible notice when one or more JSON datasets failed to load.
     * The SPA keeps working with whatever did load, but a silent empty
     * section is worse than an honest message, so failures are surfaced.
     */
    renderDataStatus() {
        const el = document.getElementById('data-status');
        if (!el) return;

        const failures = (typeof DataLoader !== 'undefined' && Array.isArray(DataLoader.failures))
            ? DataLoader.failures
            : [];

        el.textContent = '';
        if (!failures.length) {
            el.hidden = true;
            return;
        }

        const wrap = document.createElement('div');
        wrap.className = 'alert alert-warning d-flex gap-2 align-items-start mb-0';

        const icon = document.createElement('i');
        icon.className = 'fas fa-triangle-exclamation mt-1';
        icon.setAttribute('aria-hidden', 'true');

        const body = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = failures.length === 1
            ? 'One data file could not be loaded.'
            : failures.length + ' data files could not be loaded.';
        const list = document.createElement('ul');
        list.className = 'mb-1 small';
        failures.forEach(f => {
            const li = document.createElement('li');
            li.textContent = f.filename + ' — ' + f.message;
            list.appendChild(li);
        });
        const hint = document.createElement('p');
        hint.className = 'small mb-0';
        hint.textContent = window.location.protocol === 'file:'
            ? 'Open the site through a local web server: browsers block JSON reads over file://.'
            : 'Check that the data/ folder is present and the files contain valid JSON.';

        body.append(title, list, hint);
        wrap.append(icon, body);
        el.appendChild(wrap);
        el.hidden = false;
    },

    /* -------------------------------------------------------
       MOUNTAINS
    ------------------------------------------------------- */
    renderMountains(mountains) {
        const $container = $('#mountains-container');
        if (typeof DetailsModal !== 'undefined') DetailsModal.setMountains(mountains);
        if (typeof Checklist !== 'undefined') Checklist.setMountains(mountains);
        if (!$container.length) return;
        if (!mountains || !mountains.length) {
            this.showEmpty('#mountains-container', 'Mountain data could not be loaded. Check that data/mountains.json exists and is valid JSON.');
            return;
        }

        const difficultyBadge = (difficulty) => {
            const map = {
                'Easy': 'success',
                'Moderate': 'info',
                'Difficult': 'warning',
                'Very Difficult': 'danger',
                'Extreme': 'danger'
            };
            const color = map[difficulty] || 'secondary';
            return `<span class="badge bg-${color}">${difficulty || 'Unknown'}</span>`;
        };

        const html = mountains.map((m) => `
            <div class="col-lg-4 col-md-6 mb-4 animate-on-scroll">
                <div class="card h-100 shadow-sm border-0 mountain-card">
                    <div class="position-relative overflow-hidden">
                        <button type="button" class="mountain-media-btn" data-mountain-id="${m.id}"
                                aria-label="View details for ${m.name || 'this peak'}">
                        ${m.image
                            ? `<img src="${m.image}" class="card-img-top mountain-img" alt="${m.name} peak" loading="lazy" style="height: 220px; object-fit: cover;" onerror="this.onerror=null; this.src='assets/images/ui/placeholder-mountain.svg';">`
                            : `<img src="assets/images/ui/placeholder-mountain.svg" class="card-img-top mountain-img" alt="${m.name} peak" style="height: 220px; object-fit: cover;">`
                        }
                        </button>
                        <div class="position-absolute top-0 end-0 m-2">
                            ${difficultyBadge(m.difficulty)}
                        </div>
                        ${m.continent ? `<div class="position-absolute bottom-0 start-0 m-2"><span class="badge bg-dark text-white border border-secondary-subtle">${m.continent}</span></div>` : ''}
                    </div>
                    <div class="card-body d-flex flex-column p-4">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <h5 class="card-title fw-bold text-summit mb-0">
                                <i class="fas fa-mountain me-2 text-primary"></i>${m.name || 'Unnamed Peak'}
                            </h5>
                        </div>
                        <p class="text-muted small mb-2">
                            <i class="fas fa-map-marker-alt me-1 text-danger"></i>${m.location || m.country || 'Unknown'}${m.range ? ` • <span class="fw-semibold">${m.range}</span>` : ''}
                        </p>
                        <div class="d-flex align-items-center gap-3 py-2 my-2 border-top border-bottom border-light-subtle">
                            <div>
                                <small class="text-muted d-block">Elevation</small>
                                <strong class="text-summit">${m.height ? m.height.toLocaleString() + ' m' : 'N/A'}</strong>
                                ${m.heightFt ? `<small class="text-muted">(${m.heightFt.toLocaleString()} ft)</small>` : ''}
                            </div>
                            ${m.firstAscent ? `
                            <div class="border-start ps-3">
                                <small class="text-muted d-block">First Ascent</small>
                                <strong>${m.firstAscent}</strong>
                            </div>` : ''}
                        </div>
                        <p class="card-text text-secondary small flex-grow-1">${m.description || ''}</p>
                        <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mt-3 pt-2">
                            ${m.season ? `<span class="badge bg-light text-dark border"><i class="fas fa-calendar-alt text-primary me-1"></i>${m.season}</span>` : '<span></span>'}
                            <div class="d-flex gap-2 ms-auto">
                                <button type="button" class="btn btn-sm btn-details" data-mountain-id="${m.id}">
                                    <i class="fas fa-circle-info me-1"></i>Details
                                </button>
                                ${m.lat && m.lng ? `
                                <button class="btn btn-sm btn-outline-danger view-mountain-map-btn" data-lat="${m.lat}" data-lng="${m.lng}" title="Locate on map">
                                    <i class="fas fa-crosshairs me-1"></i>Map
                                </button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        $container.html(html);

        // Bind View on Map buttons
        $container.find('.view-mountain-map-btn').on('click', function(e) {
            e.preventDefault();
            const lat = parseFloat($(this).data('lat'));
            const lng = parseFloat($(this).data('lng'));
            if (typeof MountainMap !== 'undefined' && lat && lng) {
                const jumpToMap = () => MountainMap.flyTo(lat, lng, 7);

                if (App.prefersReducedMotion()) {
                    window.scrollTo(0, $('#organizations').offset().top - 80);
                    jumpToMap();
                } else {
                    $('html, body').animate({ scrollTop: $('#organizations').offset().top - 80 }, 600, 'swing', jumpToMap);
                }
            }
        });
    },

    /* -------------------------------------------------------
       HISTORY TIMELINE
    ------------------------------------------------------- */
    renderHistory(history) {
        const $timeline = $('#history-timeline');
        if (!$timeline.length) return;
        if (!history || !history.length) {
            this.showEmpty('#history-timeline .timeline-container, #history-timeline', 'Timeline data could not be loaded. Check data/history.json.');
            return;
        }

        const sorted = [...history].sort((a, b) => (a.year || 0) - (b.year || 0));

        const html = sorted.map((item, i) => {
            const side = i % 2 === 0 ? 'left' : 'right';
            const significanceColor = {
                'High': 'danger',
                'Medium': 'warning',
                'Low': 'info',
                'Major': 'danger',
                'Notable': 'warning',
                'Landmark': 'success'
            }[item.significance] || 'primary';

            return `
                <div class="timeline-item timeline-item-${side} animate-on-scroll">
                    <div class="timeline-content">
                        <span class="timeline-date"><i class="fas fa-calendar-check me-1"></i>${item.year || '—'}</span>
                        <h4 class="fw-bold text-summit mb-2">${item.title || 'Untitled Event'}</h4>
                        <p class="text-secondary mb-3">${item.description || ''}</p>
                        <div class="d-flex justify-content-between align-items-center flex-wrap gap-1 mb-2">
                            ${item.category ? `<span class="badge bg-light text-dark border"><i class="fas fa-tag text-muted me-1"></i>${item.category}</span>` : '<span></span>'}
                            ${item.status ? `<span class="badge bg-success-subtle text-success-emphasis border border-success-subtle small"><i class="fas fa-check-circle me-1"></i>${item.status}</span>` : (item.significance ? `<span class="badge bg-${significanceColor}"><i class="fas fa-star me-1"></i>${item.significance}</span>` : '')}
                        </div>
                        ${item.source ? `<div class="mt-2 pt-2 border-top border-light-subtle"><small class="text-muted"><i class="fas fa-book-open text-primary me-1"></i>Source: ${item.source}</small></div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        $timeline.html(html);
    },

    /* -------------------------------------------------------
       EQUIPMENT (with filter)
    ------------------------------------------------------- */
    /**
     * General, category-level guidance shown on every equipment card.
     * This is educational context (what the category is for, the suggested
     * minimum experience and the routine care/safety checks) — it is NOT
     * product specification, certification or a manufacturer's instruction.
     * Keep it generic so it stays true for any item in the category.
     */
    EQUIPMENT_GUIDANCE: {
        'Footwear': {
            use: 'Insulated boots for snow, ice and glacier travel',
            level: 'Intermediate',
            care: 'Check sole flex, welt and waterproofing before each season; dry slowly, never over direct heat.'
        },
        'Climbing Gear': {
            use: 'Rope, protection and attachment hardware for roped movement',
            level: 'Intermediate',
            care: 'Inspect for cuts, corrosion and worn sheaths before every trip; retire damaged textile gear.'
        },
        'Safety': {
            use: 'Personal protection, rescue and emergency signalling',
            level: 'Beginner',
            care: 'Check batteries and expiry dates each season; replace single-use items after any use.'
        },
        'Camping': {
            use: 'Shelter, sleep system and cooking for multi-day trips',
            level: 'Beginner',
            care: 'Seal seams and inflate-test pads before departure; never cook inside a closed tent.'
        },
        'Clothing': {
            use: 'Layering for cold, wind and changing exertion levels',
            level: 'Beginner',
            care: 'Wash down with a technical detergent and re-proof shells; avoid fabric softener.'
        },
        'Accessories': {
            use: 'Eye protection, load carriage and water treatment',
            level: 'Beginner',
            care: 'Check filter life and lens scratches; store poles compressed and fully dry.'
        },
        'Navigation': {
            use: 'Route finding, position reporting and emergency contact',
            level: 'Advanced',
            care: 'Carry spare power, pre-download maps and test the SOS registration before you travel.'
        }
    },

    renderEquipment(equipment) {
        if (typeof DetailsModal !== 'undefined') DetailsModal.setEquipment(equipment);
        if (typeof Cart !== 'undefined') Cart.setProducts(equipment);
        const $filterBtns = $('#equipment-filter-buttons');
        const $container = $('#equipment-container');
        if (!$container.length) return;
        if (!equipment || !equipment.length) {
            this.showEmpty('#equipment-container', 'Equipment data could not be loaded. Check data/equipment.json.');
            return;
        }

        // Collect unique categories
        const categories = ['All', ...new Set(equipment.map(e => e.category).filter(Boolean))];

        // Render filter buttons using .btn-filter
        if ($filterBtns.length) {
            $filterBtns.attr({ role: 'group', 'aria-label': 'Filter equipment by category' });

            const btnHtml = categories.map(cat => {
                const isActive = cat === 'All';
                return `
                <button type="button" class="btn btn-filter ${isActive ? 'active' : ''} m-1"
                        data-filter="${cat.toLowerCase()}" aria-pressed="${isActive}">
                    <i class="fas ${isActive ? 'fa-th' : 'fa-tag'} me-1" aria-hidden="true"></i>${cat}
                </button>`;
            }).join('');
            $filterBtns.html(btnHtml);

            // Filter click handler
            $filterBtns.on('click', 'button[data-filter]', function () {
                const filter = $(this).data('filter');
                const reduced = App.prefersReducedMotion();

                $filterBtns.find('button').removeClass('active').attr('aria-pressed', 'false');
                $(this).addClass('active').attr('aria-pressed', 'true');

                // Show/hide cards
                const show = (el) => reduced ? el.show() : el.fadeIn(250);
                const hide = (el) => reduced ? el.hide() : el.fadeOut(250);

                if (filter === 'all') {
                    $container.find('.equipment-card-wrapper').each(function () { show($(this)); });
                } else {
                    $container.find('.equipment-card-wrapper').each(function () {
                        const cardCat = ($(this).data('category') || '').toLowerCase();
                        cardCat === filter ? show($(this)) : hide($(this));
                    });
                }

                App.announce(`${$(this).text().trim()}: ${$container.find('.equipment-card-wrapper:visible').length} items shown`);
            });
        }

        // Render rating stars
        const renderStars = (rating) => {
            const r = parseFloat(rating) || 0;
            const full = Math.floor(r);
            const half = r % 1 >= 0.5 ? 1 : 0;
            const empty = 5 - full - half;
            return '<span class="text-warning small">' +
                '<i class="fas fa-star"></i>'.repeat(full) +
                (half ? '<i class="fas fa-star-half-alt"></i>' : '') +
                '<i class="far fa-star"></i>'.repeat(empty) +
                '</span>';
        };

        const levelColor = (level) => ({ 'Beginner': 'success', 'Intermediate': 'warning', 'Advanced': 'danger' }[level] || 'secondary');

        // Render equipment cards
        const html = equipment.map((item) => {
            const guidance = this.EQUIPMENT_GUIDANCE[item.category] || {};
            return `
            <div class="col-lg-4 col-md-6 mb-4 equipment-card-wrapper animate-on-scroll" data-category="${item.category || ''}">
                <div class="card h-100 shadow-sm border-0 equipment-card">
                    <div class="position-relative overflow-hidden">
                        ${item.image
                            ? `<img src="${item.image}" class="card-img-top" alt="${item.name} equipment" loading="lazy" style="height: 200px; object-fit: cover;" onerror="this.onerror=null; this.src='assets/images/ui/placeholder-equipment.svg';">`
                            : `<img src="assets/images/ui/placeholder-equipment.svg" class="card-img-top" alt="${item.name} equipment" style="height: 200px; object-fit: cover;">`
                        }
                        ${item.essential ? '<span class="badge bg-danger position-absolute top-0 end-0 m-2 shadow-sm"><i class="fas fa-check-circle me-1"></i>Essential</span>' : ''}
                    </div>
                    <div class="card-body d-flex flex-column p-4">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title fw-bold text-summit mb-0">${item.name || 'Unnamed'}</h5>
                        </div>
                        <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                            <span class="badge bg-info-subtle text-info-emphasis border border-info-subtle">${item.category || 'General'}</span>
                            ${guidance.level ? `<span class="badge bg-${levelColor(guidance.level)}" title="Suggested minimum experience">${guidance.level}</span>` : ''}
                        </div>
                        <p class="card-text text-secondary small">${item.description || ''}</p>
                        ${guidance.use ? `<p class="equipment-guidance flex-grow-1"><i class="fas fa-bullseye me-1 text-primary" aria-hidden="true"></i><span class="visually-hidden">Typical use: </span>${guidance.use}</p>` : '<div class="flex-grow-1"></div>'}
                        ${guidance.care ? `<p class="equipment-care"><i class="fas fa-shield-halved me-1" aria-hidden="true"></i><span class="visually-hidden">Care and safety: </span>${guidance.care}</p>` : ''}
                        <div class="d-flex justify-content-between align-items-center pt-2 mt-auto border-top border-light-subtle">
                            <div>
                                ${item.weight ? `<small class="text-muted"><i class="fas fa-weight-hanging me-1 text-primary"></i>${item.weight}</small>` : ''}
                            </div>
                            <div>
                                ${item.price ? `<strong class="text-success">${item.price.startsWith('$') ? item.price : '$' + item.price}</strong>` : ''}
                            </div>
                        </div>
                        ${item.rating ? `<div class="mt-2 d-flex justify-content-between align-items-center">${renderStars(item.rating)} <small class="text-muted">${item.rating}/5</small></div>` : ''}
                        <button type="button" class="btn btn-buy w-100 mt-3" data-buy-id="${item.id}"
                                aria-label="Buy Now — open product details for ${item.name}">
                            <i class="fas fa-cart-shopping me-2" aria-hidden="true"></i>Buy Now
                        </button>
                    </div>
                </div>
            </div>
        `;
        }).join('');

        $container.html(html);
    },

    /* -------------------------------------------------------
       RECORDS (with filter)
    ------------------------------------------------------- */
    renderRecords(records) {
        const $filterContainer = $('#records-filter-buttons');
        const $container = $('#records-container');
        if (!$container.length) return;
        if (!records || !records.length) {
            this.showEmpty('#records-container', 'Record data could not be loaded. Check data/records.json.');
            return;
        }

        // Collect unique categories
        const categories = ['All', ...new Set(records.map(r => r.category).filter(Boolean))];

        // Render filter buttons using .btn-filter class
        if ($filterContainer.length) {
            $filterContainer.attr({ role: 'group', 'aria-label': 'Filter mountaineering records by category' });

            const filterHtml = categories.map(cat => {
                const isActive = cat === 'All';
                return `
                <button type="button" class="btn btn-filter ${isActive ? 'active' : ''} m-1"
                        data-filter="${cat.toLowerCase()}" aria-pressed="${isActive}">
                    <i class="fas ${isActive ? 'fa-trophy' : 'fa-tag'} me-1" aria-hidden="true"></i>${cat}
                </button>`;
            }).join('');
            $filterContainer.html(filterHtml);

            // Filter button click handler
            $filterContainer.on('click', 'button[data-filter]', function () {
                const filter = $(this).data('filter');
                const reduced = App.prefersReducedMotion();

                $filterContainer.find('button').removeClass('active').attr('aria-pressed', 'false');
                $(this).addClass('active').attr('aria-pressed', 'true');

                const show = (el) => reduced ? el.show() : el.fadeIn(250);
                const hide = (el) => reduced ? el.hide() : el.fadeOut(250);

                if (filter === 'all') {
                    $container.find('.record-card-wrapper').each(function () { show($(this)); });
                } else {
                    $container.find('.record-card-wrapper').each(function () {
                        const itemCat = ($(this).data('category') || '').toLowerCase();
                        itemCat === filter ? show($(this)) : hide($(this));
                    });
                }

                App.announce(`${$(this).text().trim()}: ${$container.find('.record-card-wrapper:visible').length} records shown`);
            });
        }

        const categoryBadgeColor = (cat) => {
            const colors = {
                'Speed': 'danger',
                'Endurance': 'warning',
                'Age': 'info',
                'First Ascent': 'success',
                'First': 'success',
                'Solo': 'dark',
                'Altitude': 'primary'
            };
            return colors[cat] || 'secondary';
        };

        const cardsHtml = records.map((r) => {
            const isVerified = (r.status || '').toLowerCase() === 'verified';
            const statusLabel = r.label || (isVerified ? 'Verified Record' : 'Historical Account');
            const badgeClass = isVerified
                ? 'bg-success-subtle text-success-emphasis border border-success-subtle'
                : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
            const sourceUrl = r.sourceUrl || '';
            const sourceLine = r.source
                ? `<div class="mt-3 pt-2 border-top border-light-subtle d-flex justify-content-between align-items-center flex-wrap gap-1">
                       <span class="badge ${badgeClass} small">
                           <i class="fas ${isVerified ? 'fa-circle-check' : 'fa-bookmark'} me-1" aria-hidden="true"></i>${statusLabel}
                       </span>
                       <small class="text-muted">
                           <i class="fas fa-link me-1" aria-hidden="true"></i>Source:
                           ${sourceUrl
                               ? `<a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" class="text-decoration-none text-info fw-semibold">${r.source} <i class="fas fa-external-link-alt fa-xs" aria-hidden="true"></i><span class="visually-hidden"> (opens in a new tab)</span></a>`
                               : `<span class="fw-medium">${r.source}</span>`}
                       </small>
                   </div>`
                : '';

            return `
            <div class="col-lg-4 col-md-6 mb-4 record-card-wrapper animate-on-scroll" data-category="${r.category || ''}">
                <div class="card h-100 shadow-sm border-0 record-card">
                    <div class="card-body d-flex flex-column p-4">
                        <div class="d-flex align-items-center mb-3">
                            <div class="me-3 p-2 bg-warning-subtle text-warning rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                <i class="fas fa-trophy fa-lg" aria-hidden="true"></i>
                            </div>
                            <div>
                                <h5 class="card-title fw-bold mb-0 text-summit">${r.title || 'Record'}</h5>
                                ${r.category ? `<span class="badge bg-${categoryBadgeColor(r.category)} mt-1">${r.category}</span>` : ''}
                            </div>
                        </div>
                        <div class="record-details mb-3">
                            ${r.holder ? `<p class="mb-1 small"><i class="fas fa-user text-primary me-2" aria-hidden="true"></i><strong>${r.holder}</strong>${r.nationality ? ` (${r.nationality})` : ''}</p>` : ''}
                            ${r.year ? `<p class="mb-1 small text-muted"><i class="fas fa-calendar-alt text-primary me-2" aria-hidden="true"></i>Year: ${r.year}</p>` : ''}
                            ${r.mountain ? `<p class="mb-1 small text-muted"><i class="fas fa-mountain text-primary me-2" aria-hidden="true"></i>Peak: ${r.mountain}</p>` : ''}
                        </div>
                        <p class="card-text text-secondary small flex-grow-1">${r.description || ''}</p>
                        ${sourceLine}
                    </div>
                </div>
            </div>`;
        }).join('');

        $container.html(cardsHtml);
    },

    /* -------------------------------------------------------
       ORGANIZATIONS (Interactive Sidebar with Map integration)
    ------------------------------------------------------- */
    renderOrganizations(organizations) {
        const $container = $('#organizations-container');
        if (!$container.length) return;
        if (!organizations || !organizations.length) {
            this.showEmpty('#organizations-container', 'Organisation data could not be loaded. Check data/organizations.json.');
            return;
        }

        const html = organizations.map((org) => `
            <div class="col-12 mb-3">
                <div class="card shadow-sm border-0 org-card">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title fw-bold mb-0 text-summit">
                                <i class="fas fa-landmark me-2 text-primary"></i>${org.name || 'Organization'}
                            </h6>
                            ${org.abbreviation ? `<span class="badge bg-secondary">${org.abbreviation}</span>` : ''}
                        </div>
                        ${org.type ? `<p class="mb-1 small text-muted"><i class="fas fa-tag me-2 text-primary"></i>${org.type}</p>` : ''}
                        ${org.headquarters ? `<p class="mb-1 small text-muted"><i class="fas fa-map-marker-alt me-2 text-danger"></i>${org.headquarters}</p>` : ''}
                        ${org.founded ? `<p class="mb-2 small text-muted"><i class="fas fa-calendar-alt me-2 text-muted"></i>Founded: ${org.founded}</p>` : ''}
                        <div class="d-flex gap-2 mt-2">
                            ${org.lat && org.lng ? `
                                <button class="btn btn-sm btn-outline-danger locate-org-btn" data-lat="${org.lat}" data-lng="${org.lng}" title="Locate on map">
                                    <i class="fas fa-crosshairs me-1"></i>Locate
                                </button>` : ''}
                            ${org.website ? `
                                <a href="${org.website}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary">
                                    <i class="fas fa-globe me-1"></i>Website
                                </a>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        $container.html(`
            <div class="org-sidebar-header d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0 text-summit"><i class="fas fa-building me-2 text-primary"></i>Directory (${organizations.length})</h5>
                <small class="text-muted">Click Locate to fly map</small>
            </div>
            <div class="org-scroll-list" style="max-height: 440px; overflow-y: auto; padding-right: 5px;">
                <div class="row g-2">${html}</div>
            </div>
        `);

        // Bind Locate buttons
        $container.find('.locate-org-btn').on('click', function(e) {
            e.preventDefault();
            const lat = parseFloat($(this).data('lat'));
            const lng = parseFloat($(this).data('lng'));
            if (typeof MountainMap !== 'undefined' && lat && lng) {
                MountainMap.flyTo(lat, lng, 7);
                // Scroll into view on mobile
                if (window.innerWidth < 992) {
                    $('html, body').animate({ scrollTop: $('#map').offset().top - 80 }, 500);
                }
            }
        });
    },

    /* -------------------------------------------------------
       NEWS (sorted by date descending)
    ------------------------------------------------------- */
    renderNews(news) {
        const $container = $('#news-container');
        if (!$container.length) return;
        if (!news || !news.length) {
            this.showEmpty('#news-container', 'News and reference entries could not be loaded. Check data/news.json.');
            return;
        }

        // Sort by date descending
        const sorted = [...news].sort((a, b) => {
            return new Date(b.date || 0) - new Date(a.date || 0);
        });

        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            if (isNaN(d)) return dateStr;
            return d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        const categoryBadge = (cat) => {
            const map = {
                'Expedition': 'primary',
                'Safety': 'danger',
                'Environment': 'success',
                'Record': 'warning',
                'Policy': 'info'
            };
            const color = map[cat] || 'secondary';
            return cat ? `<span class="badge bg-${color}">${cat}</span>` : '';
        };

        const html = sorted.map((item) => {
            const isReference = (item.type || '').toLowerCase() === 'reference';
            const url = item.url || item.sourceUrl;
            const dateLabel = isReference ? 'Reviewed' : 'Published';

            // Only render a link when the data file actually carries a URL
            const sourceLine = item.source
                ? `<p class="text-muted small mb-0 news-source">
                       <i class="fas fa-link me-1" aria-hidden="true"></i>Source:
                       ${url
                           ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${item.source}<span class="visually-hidden"> (opens in a new tab)</span></a>`
                           : item.source}
                   </p>`
                : '';

            return `
            <div class="col-lg-4 col-md-6 mb-4 animate-on-scroll">
                <article class="card h-100 shadow-sm border-0">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-1">
                            <span>
                                ${categoryBadge(item.category)}
                                <span class="badge ${isReference ? 'bg-secondary' : 'bg-dark'} ms-1">${isReference ? 'Reference' : 'Article'}</span>
                            </span>
                            <small class="text-muted">${dateLabel}: ${formatDate(item.date)}</small>
                        </div>
                        <h5 class="card-title fw-bold">
                            <i class="fas fa-newspaper me-2 text-info" aria-hidden="true"></i>${item.title || 'News'}
                        </h5>
                        <p class="card-text flex-grow-1">${item.summary || item.description || ''}</p>
                        ${sourceLine}
                    </div>
                </article>
            </div>`;
        }).join('');

        $container.html(html);
    },

    /* -------------------------------------------------------
       EDUCATION (accordion layout)
    ------------------------------------------------------- */
    renderEducation(education) {
        const $container = $('#education-container');
        if (!$container.length) return;
        if (!education || !education.length) {
            this.showEmpty('#education-accordion', 'Education content could not be loaded. Check data/education.json.');
            return;
        }

        const difficultyColor = (d) => {
            const map = { 'Beginner': 'success', 'Intermediate': 'warning', 'Advanced': 'danger' };
            return map[d] || 'secondary';
        };

        const iconMap = {
            'Safety': 'fa-shield-alt',
            'Technique': 'fa-hiking',
            'Weather': 'fa-cloud-sun',
            'Gear': 'fa-toolbox',
            'Navigation': 'fa-compass',
            'First Aid': 'fa-first-aid',
            'Training': 'fa-dumbbell'
        };

        const html = `
            <div class="accordion education-accordion" id="educationAccordion">
                ${education.map((item, idx) => {
                    const collapseId = `edu-collapse-${idx}`;
                    const headerId = `edu-header-${idx}`;
                    const icon = iconMap[item.category] || 'fa-book';

                    return `
                        <div class="accordion-item border-0 mb-3 shadow-sm animate-on-scroll">
                            <h2 class="accordion-header" id="${headerId}">
                                <button class="accordion-button ${idx === 0 ? '' : 'collapsed'}" type="button"
                                    data-bs-toggle="collapse" data-bs-target="#${collapseId}"
                                    aria-expanded="${idx === 0}" aria-controls="${collapseId}">
                                    <i class="fas ${icon} me-3 text-primary"></i>
                                    <span class="fw-bold">${item.title || 'Topic'}</span>
                                    <span class="ms-auto me-3">
                                        ${item.category ? `<span class="badge bg-info text-dark me-1">${item.category}</span>` : ''}
                                        ${item.difficulty ? `<span class="badge bg-${difficultyColor(item.difficulty)}">${item.difficulty}</span>` : ''}
                                    </span>
                                </button>
                            </h2>
                            <div id="${collapseId}" class="accordion-collapse collapse ${idx === 0 ? 'show' : ''}"
                                aria-labelledby="${headerId}" data-bs-parent="#educationAccordion">
                                <div class="accordion-body">
                                    <p>${item.content || item.description || ''}</p>
                                    ${item.keyPoints || item.key_points
                                        ? `<h6 class="fw-bold mt-3"><i class="fas fa-check-circle text-success me-2"></i>Key Points</h6>
                                           <ul class="list-group list-group-flush">
                                               ${(item.keyPoints || item.key_points).map(point =>
                                                   `<li class="list-group-item border-0 ps-0"><i class="fas fa-chevron-right text-primary me-2"></i>${point}</li>`
                                               ).join('')}
                                           </ul>`
                                        : ''
                                    }
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        $container.html(html);
    },

    /* -------------------------------------------------------
       STATS COUNTERS (About section)
    ------------------------------------------------------- */
    initStatsCounters() {
        const $stats = $('.stat-number');
        if (!$stats.length) return;

        if (!('IntersectionObserver' in window)) {
            // Fallback: animate immediately
            $stats.each(function () { App.animateCounter($(this)); });
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        App.animateCounter($(entry.target));
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );

        $stats.each(function () {
            observer.observe(this);
        });
    },

    /**
     * Animate a stat number from 0 to its target value
     * @param {jQuery} $el - jQuery element containing the target number as text or data-target
     */
    animateCounter($el) {
        const target = parseInt($el.data('target') || $el.text()) || 0;
        if (target === 0) return;

        // Respect reduced-motion: show the final value without a count-up
        if (this.prefersReducedMotion()) {
            $el.text(target.toLocaleString() + ($el.data('suffix') || ''));
            return;
        }

        const duration = 2000;
        const startTime = performance.now();

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(target * easeOut);

            $el.text(current.toLocaleString() + ($el.data('suffix') || ''));

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                $el.text(target.toLocaleString() + ($el.data('suffix') || ''));
            }
        };

        requestAnimationFrame(step);
    }
};

/* -------------------------------------------------------
   Bootstrap on DOM ready
------------------------------------------------------- */
$(document).ready(() => {
    App.init();
});
