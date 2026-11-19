/* ============================================================
   Navigation Module - Alpine Ascents SPA
   SPA navigation, smooth scrolling, scroll spy, animations
   ============================================================ */

const Navigation = {
    navbarOffset: 70,
    observer: null,
    reducedMotionQuery: null,

    /**
     * True when the visitor asked the operating system to reduce motion.
     * Read live (not cached) so a mid-session preference change is respected.
     * @returns {boolean}
     */
    /**
     * Height of the fixed navbar plus a small gap, in pixels.
     * @returns {number}
     */
    measureNavbarOffset() {
        const header = document.getElementById('site-header') || document.getElementById('navbar');
        const h = header ? Math.round(header.getBoundingClientRect().height) : 70;
        return Math.max(56, h + 8);
    },

    prefersReducedMotion() {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    },

    /**
     * Initialize all navigation functionality
     */
    init() {
        this.setupSmoothScrolling();
        this.setupScrollHandler();
        this.setupIntersectionObserver();
        this.setupMobileNavCollapse();
        this.handleInitialHash();
        this.setupHashChangeListener();
        this.setupKeyboardDismiss();
        this.navbarOffset = this.measureNavbarOffset();
        this.setupSkipLink();
    },

    /**
     * Set up smooth scrolling for all anchor links pointing to sections
     */
    setupSmoothScrolling() {
        $(document).on('click', 'a[href^="#"]', (e) => {
            const href = $(e.currentTarget).attr('href');
            if (href === '#' || href.length <= 1) return;

            // The skip link uses native fragment navigation so the browser moves
            // the sequential focus start point; setupSkipLink() then focuses <main>.
            if ($(e.currentTarget).hasClass('skip-link')) return;

            const $target = $(href);
            if ($target.length) {
                e.preventDefault();
                this.scrollToSection(href.substring(1));

                // Update URL hash without jumping
                if (history.pushState) {
                    history.pushState(null, null, href);
                }
            }
        });
    },

    /**
     * Smooth scroll to a section with offset for fixed navbar
     * @param {string} sectionId - The section ID (without #)
     */
    scrollToSection(sectionId) {
        const $section = $(`#${sectionId}`);
        if (!$section.length) return;

        const targetTop = Math.max(0, $section.offset().top - this.navbarOffset);

        if (this.prefersReducedMotion()) {
            // No easing when the visitor prefers reduced motion
            window.scrollTo(0, targetTop);
            return;
        }

        $('html, body').animate({ scrollTop: targetTop }, 800, 'swing');
    },

    /**
     * Set up scroll event handler for navbar and back-to-top button
     */
    setupScrollHandler() {
        let ticking = false;

        $(window).on('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Navbar height changes between breakpoints; keep the offset in sync
        $(window).on('resize orientationchange', () => {
            this.navbarOffset = this.measureNavbarOffset();
        });

        // Trigger once on load
        this.handleScroll();
    },

    /**
     * Handle scroll events - navbar background and back-to-top visibility
     */
    handleScroll() {
        const scrollY = window.scrollY || window.pageYOffset;

        // Header background change on scroll
        const $header = $('#site-header, #navbar');
        if (scrollY > 50) {
            $header.addClass('scrolled');
        } else {
            $header.removeClass('scrolled');
        }

        // Back to top button visibility
        const $backToTop = $('#back-to-top');
        if (scrollY > 300) {
            $backToTop.addClass('visible');
        } else {
            $backToTop.removeClass('visible');
        }

        // Update active nav link based on scroll position
        this.updateActiveLink();
    },

    /**
     * Determine which section is in view and highlight the corresponding nav link
     */
    updateActiveLink() {
        const scrollPos = $(window).scrollTop() + this.navbarOffset + 60;
        const sections = [
            'home', 'about', 'types-styles', 'mountains', 'history',
            'techniques', 'sheltering', 'equipment', 'hazards-safety',
            'guidelines', 'records', 'expeditions', 'organizations',
            'gallery', 'news', 'education', 'contact'
        ];

        let currentSection = 'home';

        for (const sectionId of sections) {
            const $section = $(`#${sectionId}`);
            if ($section.length) {
                const sectionTop = $section.offset().top;
                const sectionBottom = sectionTop + $section.outerHeight();
                if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                    currentSection = sectionId;
                }
            }
        }

        // Clear active class from all links and dropdowns
        $('.navbar-nav .nav-link, .navbar-nav .dropdown-item').removeClass('active');

        // Highlight matching link or dropdown item
        const $targetLink = $(`.navbar-nav a[href="#${currentSection}"]`);
        $targetLink.addClass('active');

        // If the active item is inside a dropdown, highlight the parent dropdown-toggle
        if ($targetLink.hasClass('dropdown-item')) {
            $targetLink.closest('.dropdown').find('.dropdown-toggle').addClass('active');
        }
    },

    /**
     * Set up Intersection Observer for scroll-triggered animations
     */
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            // Fallback: show all elements immediately
            $('.animate-on-scroll').addClass('animate');
            return;
        }

        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate');
                        // Unobserve after animation triggers (one-time)
                        this.observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );

        // Observe all elements with .animate-on-scroll class
        document.querySelectorAll('.animate-on-scroll').forEach((el) => {
            this.observer.observe(el);
        });
    },

    /**
     * Re-observe newly added .animate-on-scroll elements
     * (called after dynamic content is rendered)
     */
    observeNewElements() {
        if (!this.observer) return;
        document.querySelectorAll('.animate-on-scroll:not(.animate)').forEach((el) => {
            this.observer.observe(el);
        });
    },

    /**
     * Collapse mobile navbar after clicking a link (excluding dropdown toggles)
     */
    setupMobileNavCollapse() {
        $(document).on('click', '.navbar-nav .nav-link:not(.dropdown-toggle), .navbar-nav .dropdown-item', () => {
            const $navbarCollapse = $('.navbar-collapse');
            if ($navbarCollapse.hasClass('show')) {
                $navbarCollapse.collapse('hide');
            }
        });
    },

    /**
     * Handle hash in URL on page load
     */
    handleInitialHash() {
        if (window.location.hash) {
            const sectionId = window.location.hash.substring(1);
            // Delay to ensure DOM is ready and layout is complete
            setTimeout(() => {
                this.scrollToSection(sectionId);
            }, 500);
        }
    },

    /**
     * Listen for hash changes (browser back/forward)
     */
    setupHashChangeListener() {
        $(window).on('hashchange', () => {
            if (window.location.hash) {
                const sectionId = window.location.hash.substring(1);
                this.scrollToSection(sectionId);
            }
        });

        // Back to top button click
        $(document).on('click', '#back-to-top', (e) => {
            e.preventDefault();
            if (this.prefersReducedMotion()) {
                window.scrollTo(0, 0);
            } else {
                $('html, body').animate({ scrollTop: 0 }, 600, 'swing');
            }
        });
    },

    /**
     * Skip link: after jumping to <main>, move focus there so the next Tab
     * continues inside the content instead of returning to the navbar.
     */
    setupSkipLink() {
        const link = document.querySelector('.skip-link');
        const main = document.getElementById('main-content');
        if (!link || !main) return;

        // Native listener (not delegated): this must survive any interference
        // from the global smooth-scroll handler.
        link.addEventListener('click', () => {
            window.setTimeout(() => main.focus({ preventScroll: true }), 30);
        });
    },

    /**
     * Escape closes the open mobile drawer and any open dropdown,
     * mirroring standard menu behaviour for keyboard users.
     */
    setupKeyboardDismiss() {
        $(document).on('keydown', (e) => {
            if (e.key !== 'Escape') return;

            const $navbarCollapse = $('.navbar-collapse');
            if ($navbarCollapse.hasClass('show')) {
                $navbarCollapse.collapse('hide');
            }
        });
    }
};
