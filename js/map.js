/* ============================================================
   Mountain Map Module – Alpine Ascents
   Interactive Leaflet map with OpenStreetMap tiles, showing
   mountain peaks and mountaineering organisations.

   Accessibility notes:
   • Markers are L.marker + divIcon (not circleMarker) because markers
     are keyboard-focusable in Leaflet, so the map can be browsed with
     Tab/Enter. SVG paths are not focusable.
   • Scroll-wheel zoom is off until the visitor clicks the map, so the
     page does not get trapped while scrolling past the section.
   ============================================================ */

const MountainMap = {
    map: null,
    markers: [],
    peakMarkers: [],
    orgMarkers: [],
    mountainLayer: null,
    orgLayer: null,
    /* the single layer that actually holds markers and cluster bubbles */
    renderLayer: null,
    showPeaks: true,
    showOrgs: true,
    statusEl: null,
    wheelEnabled: false,
    hasOpenPopup: false,
    /* Peaks closer than this many pixels are replaced by one cluster bubble */
    CLUSTER_RADIUS: 44,
    /* At or beyond this zoom nothing is clustered */
    CLUSTER_MAX_ZOOM: 9,

    COLORS: {
        mountain: '#e67e22',
        mountainDark: '#b3541e',
        organization: '#3b82c4',
        organizationDark: '#255d8f'
    },

    /* --------------------------------------------------------
       init(mountains, organizations)
       -------------------------------------------------------- */
    init(mountains, organizations) {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        // Leaflet is loaded from a CDN — degrade gracefully if it is blocked
        if (typeof L === 'undefined' || !L || typeof L.map !== 'function') {
            mapContainer.innerHTML =
                '<div class="alert alert-warning m-3 mb-0">' +
                '<i class="fas fa-triangle-exclamation me-1" aria-hidden="true"></i>' +
                '<strong>The interactive map could not load.</strong> The mapping library is served from a CDN and ' +
                'was blocked or is unavailable. Every organisation is still listed beside the map, and the peak ' +
                'catalogue above lists every mountain with its coordinates.' +
                '</div>';
            mapContainer.classList.add('d-flex', 'align-items-center');
            console.warn('Leaflet unavailable — map rendering skipped.');
            return;
        }

        const peaks = Array.isArray(mountains) ? mountains.filter(m => m.lat != null && m.lng != null) : [];
        const orgs = Array.isArray(organizations) ? organizations.filter(o => o.lat != null && o.lng != null) : [];

        this.map = L.map('map', {
            center: [30, 80],
            zoom: 3,
            scrollWheelZoom: false,
            worldCopyJump: true
        });

        // Enable wheel zoom only after the visitor deliberately interacts
        this.map.on('click', () => this.enableWheelZoom());

        // Closing a popup (✕ or Escape) also clears the selection halo
        this.map.on('popupopen', () => { this.hasOpenPopup = true; });
        this.map.on('popupclose', () => {
            this.hasOpenPopup = false;
            this.selectMarker(null);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.map && this.hasOpenPopup) {
                this.map.closePopup();
            }
        });

        const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18,
            // Fewer cancelled tile downloads while the visitor is zooming or
            // panning: tiles are fetched once movement settles instead of for
            // every intermediate zoom step (each cancelled request shows up in
            // DevTools as net::ERR_ABORTED).
            updateWhenIdle: true,
            updateWhenZooming: false,
            keepBuffer: 3
        }).addTo(this.map);

        tiles.on('tileerror', () => this.showStatus('Map tiles could not load — check your internet connection.'));

        // Two empty proxy layers drive the Leaflet layer control. They hold no
        // markers: peaks and organisations are clustered TOGETHER in one render
        // layer, otherwise a peak cluster and an organisation cluster can land
        // on exactly the same pixel (e.g. Kathmandu).
        this.mountainLayer = L.layerGroup();
        this.orgLayer = L.layerGroup();
        this.renderLayer = L.layerGroup().addTo(this.map);

        peaks.forEach(m => this.addMarker(m, 'mountain'));
        orgs.forEach(o => this.addMarker(o, 'organization'));

        this.mountainLayer.addTo(this.map);
        this.orgLayer.addTo(this.map);

        this.renderMarkers();
        this.map.on('zoomend', () => this.renderMarkers());
        this.map.on('overlayadd overlayremove', () => {
            this.showPeaks = this.map.hasLayer(this.mountainLayer);
            this.showOrgs = this.map.hasLayer(this.orgLayer);
            this.renderMarkers();
        });

        const overlays = {
            [`<i class="fas fa-mountain me-1"></i> Peaks (${peaks.length})`]: this.mountainLayer,
            [`<i class="fas fa-building me-1"></i> Organisations (${orgs.length})`]: this.orgLayer
        };
        const collapseControl = window.matchMedia('(max-width: 991.98px)').matches;
        L.control.layers(null, overlays, { collapsed: collapseControl, position: 'topright' }).addTo(this.map);

        this.addLegend(peaks.length, orgs.length);

        if (!peaks.length && !orgs.length) {
            this.showStatus('Map data could not be loaded. The organisation directory lists every location in text.');
        }

        setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 300);
        window.addEventListener('resize', () => {
            if (this.map) this.map.invalidateSize();
        });
    },

    /* --------------------------------------------------------
       Marker creation
       -------------------------------------------------------- */
    addMarker(record, kind) {
        const isMountain = kind === 'mountain';
        const name = record.name || 'Unknown';

        const marker = L.marker([record.lat, record.lng], {
            icon: this.createIcon(kind),
            title: name,
            alt: isMountain ? `Mountain peak: ${name}` : `Organisation: ${name}`,
            keyboard: true,
            riseOnHover: true
        });

        marker.bindPopup(
            isMountain ? this.createMountainPopup(record) : this.createOrgPopup(record),
            { maxWidth: 300, className: 'aa-popup-container', autoPanPadding: [24, 24] }
        );

        // Selecting a marker always opens its popup. Hover auto-open was removed:
        // it fought with Leaflet's click-to-toggle (the first click closed the
        // popup the hover had just opened) and fired constantly while panning.
        marker.on('click', () => {
            this.selectMarker(marker);
            marker.openPopup();
        });

        this.markers.push(marker);

        // Remember the true record so clustering can group members later
        marker.aaRecord = record;
        marker.aaKind = kind;
        (isMountain ? this.peakMarkers : this.orgMarkers).push(marker);
    },

    /* --------------------------------------------------------
       Overlap handling
       --------------------------------------------------------
       Peaks in one massif (Everest, Lhotse, Makalu) are 1–2 px
       apart at low zoom, so no single dot can be targeted. Instead
       of moving any coordinate, overlapping records are replaced by
       ONE cluster bubble at the centroid of its members. Activating
       the bubble zooms to those members' real bounds, where they
       separate into individually focusable markers.

       Peaks and organisations are clustered together: a peak cluster
       and an organisation cluster at the same city would otherwise
       overlap each other.
       -------------------------------------------------------- */
    renderMarkers() {
        if (!this.map || !this.renderLayer) return;

        this.renderLayer.clearLayers();

        const active = [];
        if (this.showPeaks) active.push(...this.peakMarkers);
        if (this.showOrgs) active.push(...this.orgMarkers);
        if (!active.length) return;

        // Past this zoom every record is far enough apart — show them all
        if (this.map.getZoom() >= this.CLUSTER_MAX_ZOOM) {
            active.forEach(m => this.renderLayer.addLayer(m));
            return;
        }

        const points = active.map(m => ({
            marker: m,
            point: this.map.latLngToContainerPoint(m.getLatLng())
        }));

        const used = new Set();
        const groups = [];

        points.forEach((a, i) => {
            if (used.has(i)) return;
            used.add(i);
            const group = [a.marker];

            for (let j = i + 1; j < points.length; j++) {
                if (used.has(j)) continue;
                if (a.point.distanceTo(points[j].point) < this.CLUSTER_RADIUS) {
                    used.add(j);
                    group.push(points[j].marker);
                }
            }
            groups.push(group);
        });

        groups.forEach((group) => {
            if (group.length === 1) {
                this.renderLayer.addLayer(group[0]);
            } else {
                this.renderLayer.addLayer(this.createClusterMarker(group));
            }
        });
    },

    /**
     * Build one bubble standing in for an overlapping group.
     * @param {L.Marker[]} members
     */
    createClusterMarker(members) {
        const lat = members.reduce((sum, m) => sum + m.getLatLng().lat, 0) / members.length;
        const lng = members.reduce((sum, m) => sum + m.getLatLng().lng, 0) / members.length;

        const names = members.map(m => m.aaRecord.name).filter(Boolean);
        const label = names.length > 3
            ? `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`
            : names.join(', ');

        const marker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'aa-cluster-wrap',
                html: `<span class="aa-cluster">${members.length}</span>`,
                iconSize: [34, 34],
                iconAnchor: [17, 17]
            }),
            keyboard: true,
            title: `${members.length} locations here`,
            alt: `${members.length} overlapping locations: ${label}. Activate to zoom in.`,
            riseOnHover: true,
            zIndexOffset: 500
        });

        marker.on('click', () => this.expandCluster(members));
        return marker;
    },

    /**
     * Zoom to the real extent of a cluster's members.
     * @param {L.Marker[]} members
     */
    expandCluster(members) {
        if (!this.map || !members.length) return;

        if (members.length === 1) {
            this.map.setView(members[0].getLatLng(), Math.min(this.CLUSTER_MAX_ZOOM, this.map.getZoom() + 3));
            return;
        }

        const bounds = L.latLngBounds(members.map(m => m.getLatLng()));
        this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: this.CLUSTER_MAX_ZOOM });
    },

    createIcon(kind) {
        const isMountain = kind === 'mountain';
        const colour = isMountain ? this.COLORS.mountain : this.COLORS.organization;
        const dark = isMountain ? this.COLORS.mountainDark : this.COLORS.organizationDark;

        // The wrapper is 28×28 so the clickable/tappable target clears the
        // WCAG 2.2 minimum of 24×24; the visible dot stays 16 px.
        return L.divIcon({
            className: 'aa-marker-wrap',
            html: `<span class="aa-marker ${isMountain ? 'aa-marker--peak' : 'aa-marker--org'}" style="background:${colour};border-color:${dark}"></span>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -14]
        });
    },

    /**
     * Visually mark one marker as selected (used by the "View on Map" buttons).
     * @param {L.Marker|null} marker
     */
    selectMarker(marker) {
        this.markers.forEach(m => {
            const el = m.getElement();
            if (el) el.classList.remove('aa-marker-selected');
        });

        if (!marker) return;
        const el = marker.getElement();
        if (el) el.classList.add('aa-marker-selected');
    },

    /* --------------------------------------------------------
       Popups
       -------------------------------------------------------- */
    createMountainPopup(mountain) {
        const heightM = mountain.height ? mountain.height.toLocaleString() : '—';
        const heightFt = mountain.height ? Math.round(mountain.height * 3.28084).toLocaleString() : '—';

        const difficultyColors = {
            'Easy': 'success',
            'Moderate': 'info',
            'Difficult': 'warning',
            'Very Difficult': 'danger',
            'Extreme': 'danger'
        };
        const badgeColor = difficultyColors[mountain.difficulty] || 'secondary';

        return `
            <div class="aa-popup">
                <h4><i class="fas fa-mountain text-warning me-1" aria-hidden="true"></i>${mountain.name || 'Unknown peak'}</h4>
                <dl>
                    <dt>Location</dt><dd>${mountain.location || '—'}</dd>
                    <dt>Range</dt><dd>${mountain.range || '—'}</dd>
                    <dt>Elevation</dt><dd>${heightM} m <span class="text-muted">/ ${heightFt} ft</span></dd>
                    <dt>Difficulty</dt><dd><span class="badge bg-${badgeColor}">${mountain.difficulty || '—'}</span></dd>
                    <dt>Best season</dt><dd>${mountain.season || '—'}</dd>
                    <dt>First ascent</dt><dd>${mountain.firstAscent || '—'}</dd>
                </dl>
            </div>`;
    },

    createOrgPopup(org) {
        const websiteLink = org.website
            ? `<a href="${org.website}" target="_blank" rel="noopener noreferrer">${org.website.replace(/^https?:\/\//, '')}<span class="visually-hidden"> (opens in a new tab)</span></a>`
            : '—';

        return `
            <div class="aa-popup">
                <h4><i class="fas fa-building text-primary me-1" aria-hidden="true"></i>${org.name || 'Unknown organisation'}${org.abbreviation ? ' (' + org.abbreviation + ')' : ''}</h4>
                <dl>
                    <dt>Type</dt><dd>${org.type || '—'}</dd>
                    <dt>Founded</dt><dd>${org.founded || '—'}</dd>
                    <dt>Headquarters</dt><dd>${org.headquarters || '—'}</dd>
                    <dt>Website</dt><dd>${websiteLink}</dd>
                </dl>
            </div>`;
    },

    /* --------------------------------------------------------
       Legend & status
       -------------------------------------------------------- */
    addLegend(peakCount, orgCount) {
        const legend = L.control({ position: 'bottomleft' });

        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'map-legend');
            div.innerHTML = `
                <h3>Map legend</h3>
                <div class="map-legend-item"><span class="map-legend-dot is-mountain"></span> Peak (${peakCount})</div>
                <div class="map-legend-item"><span class="map-legend-dot is-organization"></span> Organisation (${orgCount})</div>
                <div class="map-legend-item"><span class="map-legend-cluster">3</span> Overlapping peaks <br> activate to zoom in</div>
                <div class="mt-1 text-white-50">Select a dot for details</div>`;
            // Stop map drag/zoom when interacting with the legend
            L.DomEvent.disableClickPropagation(div);
            return div;
        };

        legend.addTo(this.map);
    },

    /**
     * Show a short status message on top of the map (tile or data failure).
     * @param {string} message
     */
    showStatus(message) {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        if (!this.statusEl) {
            this.statusEl = document.createElement('div');
            this.statusEl.className = 'map-status';
            this.statusEl.setAttribute('role', 'status');
            this.statusEl.style.cssText = 'position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:500;max-width:90%;text-align:center;';
            mapContainer.appendChild(this.statusEl);
        }

        this.statusEl.textContent = message;
    },

    enableWheelZoom() {
        if (this.wheelEnabled || !this.map) return;
        this.wheelEnabled = true;
        this.map.scrollWheelZoom.enable();
    },

    /* --------------------------------------------------------
       flyTo(lat, lng, zoom)
       -------------------------------------------------------- */
    flyTo(lat, lng, zoom = 10) {
        if (!this.map) return;

        // Never stop inside a cluster: below CLUSTER_MAX_ZOOM the requested
        // peak may still be represented by a bubble, so its own marker would
        // not be on the map and openPopup() would silently do nothing.
        const targetZoom = Math.max(zoom, this.CLUSTER_MAX_ZOOM);

        this.map.flyTo([lat, lng], targetZoom, {
            duration: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1.2,
            easeLinearity: 0.25
        });

        // After the flight, highlight and open the marker closest to the target
        this.map.once('moveend', () => {
            let closest = null;
            let best = Infinity;

            this.markers.forEach(marker => {
                const ll = marker.getLatLng();
                const d = Math.abs(ll.lat - lat) + Math.abs(ll.lng - lng);
                if (d < best) { best = d; closest = marker; }
            });

            if (closest && best < 0.5 && this.renderLayer && this.renderLayer.hasLayer(closest)) {
                this.selectMarker(closest);
                closest.openPopup();
            }
        });
    }
};
