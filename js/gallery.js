/* ============================================================
   Gallery Module – Alpine Ascents
   Full-featured image/video gallery with category filtering
   and Bootstrap-modal lightbox.
   ============================================================ */

const Gallery = {
    items: [],
    lastTrigger: null,
    /* images matching the active filter, in display order */
    visibleImages: [],
    currentImageIndex: 0,
    activeFilter: 'All',

    /* --------------------------------------------------------
       init()  – populate items, render filters + grid, bind events
       -------------------------------------------------------- */
    init() {
        this.items = [
            // ── Mountains ──────────────────────────────────────
            {
                id: 1,
                title: 'Starry Mountain Night',
                description: 'A breathtaking view of a mountain range under a blanket of stars.',
                category: 'Mountains',
                type: 'image',
                src: 'assets/images/gallery/starry-mountain-night.webp',
                thumbnail: 'assets/images/gallery/starry-mountain-night.webp'
            },
            {
                id: 2,
                title: 'Mountain Landscape',
                description: 'Towering peaks stretch across the horizon in golden hour light.',
                category: 'Mountains',
                type: 'image',
                src: 'assets/images/gallery/mountain-landscape.webp',
                thumbnail: 'assets/images/gallery/mountain-landscape.webp'
            },
            {
                id: 3,
                title: 'Summit Peak',
                description: 'A solitary peak piercing through the clouds at sunrise.',
                category: 'Mountains',
                type: 'image',
                src: 'assets/images/gallery/summit-peak.webp',
                thumbnail: 'assets/images/gallery/summit-peak.webp'
            },
            {
                id: 4,
                title: 'Clouds Below the Summit',
                description: 'Majestic mountain surrounded by a sea of clouds.',
                category: 'Mountains',
                type: 'image',
                src: 'assets/images/gallery/clouds-below-the-summit.webp',
                thumbnail: 'assets/images/gallery/clouds-below-the-summit.webp'
            },
            {
                id: 5,
                title: 'Snow-Capped Ridgeline',
                description: 'Fresh snowfall blankets a high-altitude ridge.',
                category: 'Mountains',
                type: 'image',
                src: 'assets/images/gallery/snow-capped-ridgeline.webp',
                thumbnail: 'assets/images/gallery/snow-capped-ridgeline.webp'
            },

            // ── Expeditions ────────────────────────────────────
            {
                id: 6,
                title: 'Mountain Panorama',
                description: 'A sweeping panoramic view from the expedition base camp.',
                category: 'Expeditions',
                type: 'image',
                src: 'assets/images/gallery/mountain-panorama.webp',
                thumbnail: 'assets/images/gallery/mountain-panorama.webp'
            },
            {
                id: 7,
                title: 'The Climb',
                description: 'Climbers ascending a steep rock face with determination.',
                category: 'Expeditions',
                type: 'image',
                src: 'assets/images/gallery/the-climb.webp',
                thumbnail: 'assets/images/gallery/the-climb.webp'
            },
            {
                id: 8,
                title: 'High-Altitude Camp',
                description: 'A remote expedition camp nestled among towering peaks.',
                category: 'Expeditions',
                type: 'image',
                src: 'assets/images/gallery/high-altitude-camp.webp',
                thumbnail: 'assets/images/gallery/high-altitude-camp.webp'
            },
            {
                id: 9,
                title: 'Trail to the Top',
                description: 'A narrow hiking trail winds its way up the mountainside.',
                category: 'Expeditions',
                type: 'image',
                src: 'assets/images/gallery/trail-to-the-top.webp',
                thumbnail: 'assets/images/gallery/trail-to-the-top.webp'
            },

            // ── Equipment ──────────────────────────────────────
            {
                id: 10,
                title: 'Camping Gear Layout',
                description: 'Essential mountaineering equipment spread out and ready for the journey.',
                category: 'Equipment',
                type: 'image',
                src: 'assets/images/gallery/camping-gear-layout.webp',
                thumbnail: 'assets/images/gallery/camping-gear-layout.webp'
            },
            {
                id: 11,
                title: 'Tent Under the Stars',
                description: 'A sturdy expedition tent glowing warmly in the night wilderness.',
                category: 'Equipment',
                type: 'image',
                src: 'assets/images/gallery/tent-under-the-stars.webp',
                thumbnail: 'assets/images/gallery/tent-under-the-stars.webp'
            },
            {
                id: 12,
                title: 'Frozen Alpine Lake',
                description: 'Still, ice-cold water below snow-covered peaks on a winter approach.',
                category: 'Nature',
                type: 'image',
                src: 'assets/images/gallery/frozen-alpine-lake.webp',
                thumbnail: 'assets/images/gallery/frozen-alpine-lake.webp'
            },

            // ── Nature ─────────────────────────────────────────
            {
                id: 13,
                title: 'Green Valley',
                description: 'A lush green valley stretching between distant peaks.',
                category: 'Nature',
                type: 'image',
                src: 'assets/images/gallery/green-valley.webp',
                thumbnail: 'assets/images/gallery/green-valley.webp'
            },
            {
                id: 14,
                title: 'Mountain Lake Reflection',
                description: 'Crystal-clear lake perfectly mirroring the surrounding mountains.',
                category: 'Nature',
                type: 'image',
                src: 'assets/images/gallery/mountain-lake-reflection.webp',
                thumbnail: 'assets/images/gallery/mountain-lake-reflection.webp'
            },
            {
                id: 15,
                title: 'Forest & Mountain',
                description: 'Dense evergreen forest climbing toward rocky peaks.',
                category: 'Nature',
                type: 'image',
                src: 'assets/images/gallery/forest-mountain.webp',
                thumbnail: 'assets/images/gallery/forest-mountain.webp'
            },
            {
                id: 16,
                title: 'Alpine Meadow',
                description: 'Wildflowers carpet an alpine meadow beneath snow-capped peaks.',
                category: 'Nature',
                type: 'image',
                src: 'assets/images/gallery/alpine-meadow.webp',
                thumbnail: 'assets/images/gallery/alpine-meadow.webp'
            },

           
        ];

        // ── Peak spotlights ───────────────────────────────────────
        // Four gallery tiles are generated from mountains.json instead of being
        // hard-coded, so the name, photo and description always match the
        // mountain record they open. They reuse photos that already exist in
        // the project (no new photography).
        if (typeof DetailsModal !== 'undefined' && DetailsModal.mountains.length) {
            const spotlightIds = [1, 2, 14, 11]; // Everest, K2, Matterhorn, Denali
            const spotlights = DetailsModal.mountains
                .filter(m => spotlightIds.includes(Number(m.id)))
                .map((m, index) => ({
                    id: 100 + index,
                    title: m.name,
                    description: m.description
                        ? m.description.split('. ')[0] + '.'
                        : (m.location || 'Mountain photograph'),
                    category: 'Mountains',
                    type: 'image',
                    src: m.image,
                    thumbnail: m.image,
                    mountainId: Number(m.id)
                }));

            this.items = this.items.concat(spotlights);
        }

        // Render filter buttons
        this.renderFilterButtons();

        // Initial full render
        this.render('All');

        // Open the lightbox with mouse, Enter or Space (delegated, so it also
        // works for cards re-created by the category filter).
        $('#gallery-container')
            .on('click', '.gallery-card', (e) => {
                const card = e.currentTarget;

                // A photo that is tied to a mountain record opens the mountain
                // dialog instead of the lightbox — one click, one dialog.
                const mountainId = parseInt($(card).attr('data-gallery-mountain'), 10);
                if (!Number.isNaN(mountainId) && typeof DetailsModal !== 'undefined') {
                    this.lastTrigger = card;
                    DetailsModal.openMountain(mountainId, card);
                    return;
                }

                this.lastTrigger = card;
                this.openLightbox(parseInt($(card).data('id'), 10));
            })
            .on('keydown', '.gallery-card', (e) => {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                    e.preventDefault();
                    this.lastTrigger = e.currentTarget;
                    this.openLightbox(parseInt($(e.currentTarget).data('id'), 10));
                }
            });

        // Lightbox navigation buttons
        $('#lightbox-prev').on('click', () => this.showImage(this.currentImageIndex - 1));
        $('#lightbox-next').on('click', () => this.showImage(this.currentImageIndex + 1));

        // Touch: swipe left/right inside the lightbox to browse (mobile)
        const modalEl = document.getElementById('gallery-lightbox');
        if (modalEl) {
            let startX = 0;
            let startY = 0;

            modalEl.addEventListener('touchstart', (e) => {
                if (e.touches.length !== 1) return;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }, { passive: true });

            modalEl.addEventListener('touchend', (e) => {
                if (!e.changedTouches.length) return;
                const dx = e.changedTouches[0].clientX - startX;
                const dy = e.changedTouches[0].clientY - startY;

                // Horizontal intent only: >= 50 px and clearly not a vertical drag
                if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
                if (dx < 0) this.showImage(this.currentImageIndex + 1);
                else this.showImage(this.currentImageIndex - 1);
            }, { passive: true });
        }

        // Arrow keys browse the gallery while the dialog is open.
        // Escape is handled by Bootstrap itself.
        $(document).on('keydown', (e) => {
            const modalEl = document.getElementById('gallery-lightbox');
            if (!modalEl || !modalEl.classList.contains('show')) return;
            if (this.visibleImages.length < 2) return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.showImage(this.currentImageIndex - 1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.showImage(this.currentImageIndex + 1);
            }
        });

        // Lightbox close handler
        $('#gallery-lightbox').on('hidden.bs.modal', () => {
            // removeAttr (not src="") — an empty src makes the browser re-request the page URL
            $('#lightbox-image').removeAttr('src');
            // Return focus to the card that opened the dialog
            if (this.lastTrigger && document.body.contains(this.lastTrigger)) {
                this.lastTrigger.focus();
            }
        });
    },

    /* --------------------------------------------------------
       renderFilterButtons()
       -------------------------------------------------------- */
    renderFilterButtons() {
        const container = document.getElementById('gallery-filter-buttons');
        if (!container) return;

        const categories = ['All', 'Mountains', 'Expeditions', 'Equipment', 'Nature', 'Videos'];

        const html = categories.map(cat => {
            const isActive = cat === 'All';
            return `<button type="button" class="btn btn-filter ${isActive ? 'active' : ''} m-1 gallery-filter-btn"
                        data-category="${cat}"
                        aria-pressed="${isActive}"
                        aria-label="Show ${cat === 'All' ? 'all gallery items' : cat + ' gallery items'}">${cat}</button>`;
        }).join('');

        container.innerHTML = html;

        // Bind click events
        $(container).on('click', '.gallery-filter-btn', (e) => {
            this.filter($(e.currentTarget).data('category'));
        });
    },

    /**
     * True when the visitor asked the operating system to reduce motion.
     * @returns {boolean}
     */
    prefersReducedMotion() {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    },

    /* --------------------------------------------------------
       render(filterCategory)
       -------------------------------------------------------- */
    render(filterCategory = 'All') {
        const container = document.getElementById('gallery-container');
        if (!container) return;

        const filtered = filterCategory === 'All'
            ? this.items
            : this.items.filter(item => item.category === filterCategory);

        // Keep the browsing order in sync with what the visitor can actually see,
        // so prev/next never jumps to an item hidden by the active filter.
        this.activeFilter = filterCategory;
        this.visibleImages = filtered.filter(item => item.type === 'image');

        let html = '';

        filtered.forEach(item => {
            if (item.type === 'image') {
                html += `
                <div class="col-lg-3 col-md-4 col-sm-6 gallery-item" data-category="${item.category}">
                    <div class="gallery-card" data-id="${item.id}"${item.mountainId ? ` data-gallery-mountain="${item.mountainId}"` : ''} role="button" tabindex="0"
                         aria-label="${item.mountainId ? 'Open mountain details for ' + item.title : 'Open larger view of ' + item.title}">
                        <img src="${item.src}" alt="${item.title} — ${item.description}" class="img-fluid"
                             loading="lazy" decoding="async"
                             onerror="this.onerror=null; this.src='assets/images/ui/placeholder-mountain.svg';">
                        <div class="gallery-overlay" aria-hidden="true">
                            <i class="fas ${item.mountainId ? 'fa-mountain' : 'fa-search-plus'} fa-2x"></i>
                        </div>
                        ${item.mountainId ? '<span class="gallery-peak-badge"><i class="fas fa-circle-info me-1" aria-hidden="true"></i>Peak details</span>' : ''}
                    </div>
                    <p class="text-center mt-2 small text-muted">${item.title}</p>
                </div>`;
            } else if (item.type === 'video') {
                html += `
                <div class="col-lg-6 col-md-6 gallery-item" data-category="${item.category}">
                    <div class="ratio ratio-16x9 rounded overflow-hidden shadow-sm">
                        <iframe src="https://www.youtube.com/embed/${item.src}"
                                title="${item.title}"
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen></iframe>
                    </div>
                    <p class="text-center mt-2 small text-muted">${item.title}</p>
                </div>`;
            }
        });

        // Fade transition (skipped entirely when motion is reduced)
        const $container = $(container);
        if (this.prefersReducedMotion()) {
            $container.html(html).show();
            return;
        }

        $container.fadeOut(200, function () {
            $container.html(html).fadeIn(300);
        });
    },

    /* --------------------------------------------------------
       filter(category)
       -------------------------------------------------------- */
    filter(category) {
        // Update active button and its exposed pressed state
        $('.gallery-filter-btn').removeClass('active').attr('aria-pressed', 'false');
        $(`.gallery-filter-btn[data-category="${category}"]`)
            .addClass('active')
            .attr('aria-pressed', 'true');

        // Re-render
        this.render(category);
    },

    /* --------------------------------------------------------
       openLightbox(itemId)
       -------------------------------------------------------- */
    openLightbox(itemId) {
        // Fall back to the full set if the grid has not been rendered yet
        const list = this.visibleImages.length ? this.visibleImages : this.items.filter(i => i.type === 'image');
        const index = list.findIndex(i => i.id === itemId);
        if (index === -1) return;

        this.visibleImages = list;
        this.showImage(index);

        const modalEl = document.getElementById('gallery-lightbox');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    },

    /**
     * Display the image at `index`, wrapping around at both ends, and refresh the
     * title, caption, alt text and position counter.
     * @param {number} index
     */
    showImage(index) {
        const total = this.visibleImages.length;
        if (!total) return;

        // Wrap instead of clamping: from the last image, "next" returns to the first
        this.currentImageIndex = ((index % total) + total) % total;
        const item = this.visibleImages[this.currentImageIndex];

        const $img = $('#lightbox-image');

        if (this.prefersReducedMotion()) {
            $img.attr('src', item.src).attr('alt', `${item.title} — ${item.description}`);
        } else {
            // Fade the outgoing frame so the swap does not flash
            $img.fadeTo(120, 0.35, function () {
                $(this).attr('src', item.src).attr('alt', `${item.title} — ${item.description}`).fadeTo(120, 1);
            });
        }

        $('#lightbox-title').text(item.title);
        $('#lightbox-description').text(item.description);
        $('#lightbox-counter').text(`${this.currentImageIndex + 1} / ${total}`);

        // With a single image there is nowhere to browse
        const multiple = total > 1;
        $('#lightbox-prev, #lightbox-next').toggle(multiple);
    },

    /* --------------------------------------------------------
       closeLightbox()
       -------------------------------------------------------- */
    closeLightbox() {
        const modalEl = document.getElementById('gallery-lightbox');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }
};
