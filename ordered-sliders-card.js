const TRANSLATIONS = {
    en: {
        card_title: "Ordered Sliders",
        min_label: "Min",
        max_label: "Max",
        step_label: "Step",
        bar_height_label: "Bar Height",
        handle_height_label: "Handle Height",
        show_grid_label: "Show Grid",
        free_mode_label: "Free Mode",
        gradient_label: "Color Gradient",
        entities_label: "Entities (input_number)",
        add_entity: "Add Entity",
        add_color: "Add Color",
        color_label: "Color",
        remove: "Remove",
        edit_entity: "Edit Entity",
        entity_id_label: "Entity ID",
        name_label: "Name (optional)",
        color_label_optional: "Color (optional)",
        icon_label: "Icon (optional)",
        show_unit: "Show Unit",
        hide_icon: "Hide Icon",
        save: "Save",
        cancel: "Cancel",
        no_entities: "No entities",
        yes: "Yes",
        no: "No",
        error_entity_not_found: "Entity not found",
        error_invalid_entity_id: "Invalid entity ID"
    },
    fr: {
        card_title: "Curseurs Ordonnés",
        min_label: "Min",
        max_label: "Max",
        step_label: "Pas",
        bar_height_label: "Hauteur barre",
        handle_height_label: "Hauteur curseurs",
        show_grid_label: "Afficher grille",
        free_mode_label: "Mode libre",
        gradient_label: "Dégradé de couleurs",
        entities_label: "Entités (input_number)",
        add_entity: "Ajouter une entité",
        add_color: "Ajouter une couleur",
        color_label: "Couleur",
        remove: "Supprimer",
        edit_entity: "Modifier l'entité",
        entity_id_label: "Entité ID",
        name_label: "Nom (optionnel)",
        color_label_optional: "Couleur (optionnel)",
        icon_label: "Icône (optionnel)",
        show_unit: "Afficher l'unité",
        hide_icon: "Masquer l'icône",
        save: "Enregistrer",
        cancel: "Annuler",
        no_entities: "Aucune entité",
        yes: "Oui",
        no: "Non",
        error_entity_not_found: "Entité non trouvée",
        error_invalid_entity_id: "ID d'entité invalide"
    },
    de: {
        card_title: "Geordnete Schieberegler",
        min_label: "Min",
        max_label: "Max",
        step_label: "Schritt",
        bar_height_label: "Balkenhöhe",
        handle_height_label: "Schiebereglerhöhe",
        show_grid_label: "Raster anzeigen",
        free_mode_label: "Freier Modus",
        gradient_label: "Farbverlauf",
        entities_label: "Entitäten (input_number)",
        add_entity: "Entität hinzufügen",
        add_color: "Farbe hinzufügen",
        color_label: "Farbe",
        remove: "Entfernen",
        edit_entity: "Entität bearbeiten",
        entity_id_label: "Entitäts-ID",
        name_label: "Name (optional)",
        color_label_optional: "Farbe (optional)",
        icon_label: "Symbol (optional)",
        show_unit: "Einheit anzeigen",
        hide_icon: "Symbol ausblenden",
        save: "Speichern",
        cancel: "Abbrechen",
        no_entities: "Keine Entitäten",
        yes: "Ja",
        no: "Nein",
        error_entity_not_found: "Entität nicht gefunden",
        error_invalid_entity_id: "Ungültige Entitäts-ID"
    }
};

const SLIDER_CONSTANTS = {
    DEBOUNCE_DELAY_MS: 500,
    THROTTLE_API_CALL_MS: 100,
    GRID_LINE_WIDTH: 1,
    HANDLE_WIDTH_BASE: 4,
    HANDLE_WIDTH_HOVER: 6,
    ENTITY_ID_REGEX: /^[a-z_]+\.[a-z0-9_]+$/i
};

function escapeHtml(text) {
    if (!text) return "";
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };
    return String(text).replace(/[&<>"']/g, c => map[c]);
}

function escapeHtmlAttribute(text) {
    if (!text) return "";
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "/": "&#x2F;"
    };
    return String(text).replace(/[&<>"'/]/g, c => map[c]);
}

function validateEntityId(entityId) {
    return SLIDER_CONSTANTS.ENTITY_ID_REGEX.test(entityId);
}

class LanguageHelper {
    constructor(hass) {
        this._hass = hass;
    }

    getLanguage() {
        if (this._hass?.locale?.language && TRANSLATIONS[this._hass.locale.language]) {
            return this._hass.locale.language;
        }
        return "en";
    }

    t(key) {
        const lang = this.getLanguage();
        return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
    }

    setHass(hass) {
        this._hass = hass;
    }
}

class SliderAppState {
    constructor(debug = false) {
        this.dragState = {
            isDragging: false,
            currentHandle: null,
            startX: 0
        };
        this.timers = {
            debounce: null,
            update: null,
            throttle: null
        };
        this.caches = {
            entitiesHash: null,
            lastUpdateTime: 0,
            gridCanvas: null
        };
        this.eventListeners = new Map();
        this.debug = debug;
    }

    setDragState(handle, startX) {
        this.dragState = {
            isDragging: true,
            currentHandle: handle,
            startX
        };
        this.log('Drag started', {
            handle: handle.dataset.entity,
            startX
        });
    }

    clearDragState() {
        this.dragState = {
            isDragging: false,
            currentHandle: null,
            startX: 0
        };
        this.log('Drag ended');
    }

    setTimer(key, timerId) {
        if (this.timers[key]) clearTimeout(this.timers[key]);
        this.timers[key] = timerId;
        this.log('Timer set', {
            key,
            timerId
        });
    }

    clearAllTimers() {
        Object.keys(this.timers).forEach(key => {
            if (this.timers[key]) clearTimeout(this.timers[key]);
            this.timers[key] = null;
        });
        this.log('All timers cleared');
    }

    addEventListener(id, target, event, handler, options = {}) {
        if (!this.eventListeners.has(id)) {
            this.eventListeners.set(id, []);
        }
        this.eventListeners.get(id).push({
            target,
            event,
            handler,
            options
        });
        target.addEventListener(event, handler, options);
        this.log('Event listener added', {
            id,
            event,
            options
        });
    }

    removeAllEventListeners(id) {
        if (this.eventListeners.has(id)) {
            this.eventListeners.get(id).forEach(({
                target,
                event,
                handler,
                options
            }) => {
                target.removeEventListener(event, handler, options);
            });
            this.eventListeners.delete(id);
            this.log('Event listeners removed', {
                id
            });
        }
    }

    clearAllEventListeners() {
        const count = Array.from(this.eventListeners.values()).reduce((sum, arr) => sum + arr.length, 0);
        this.eventListeners.forEach((listeners) => {
            listeners.forEach(({
                target,
                event,
                handler,
                options
            }) => {
                target.removeEventListener(event, handler, options);
            });
        });
        this.eventListeners.clear();
        this.log('All event listeners cleared', {
            count
        });
    }

    resetOnDisconnect() {
        this.log('Resetting state on disconnect');
        this.clearAllTimers();
        this.clearDragState();
        this.clearAllEventListeners();
        this.caches.entitiesHash = null;
        this.caches.gridCanvas = null;
    }

    log(message, data = {}) {
        if (this.debug) {
            console.log(`[SliderAppState] ${message}`, data);
        }
    }
}

class OrderedSlidersCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open'
        });

        const debugMode = localStorage.getItem('slider-card-debug') === 'true';
        this._state = new SliderAppState(debugMode);

        this._langHelper = new LanguageHelper(null);
        this.config = {};
        this._hass = null;
        this._lastRenderedHash = null;

        if (debugMode) {
            console.log('%c[Ordered Sliders Card] Debug mode enabled', 'color: #4CAF50; font-weight: bold;');
            console.log('To disable: localStorage.removeItem("slider-card-debug")');
        }
    }

    getLanguage() {
        return this._langHelper.getLanguage();
    }
    t(key) {
        return this._langHelper.t(key);
    }

    setConfig(config) {
        if (!config || typeof config !== 'object') throw new Error('Invalid configuration');

        let entities = config.entities || [];
        if (!Array.isArray(entities)) throw new Error('entities must be an array');

        const validatedEntities = entities.map((e, i) => this._validateEntity(e, i)).filter(e => e);
        const gradient = this._validateGradient(config.gradient || ['#ff0000', '#ffff00', '#00ff00']);

        // Validation des valeurs numériques
        const min = this._validateNumericValue(config.min, 0);
        const max = this._validateNumericValue(config.max, 100);
        const step = this._validateNumericValue(config.step, 1);
        const height = this._validateNumericValue(config.height, 60);
        const handleHeight = this._validateNumericValue(config.handle_height, 40);

        // VALIDATIONS CROISÉES
        if (min >= max) {
            const error = `Configuration error: min (${min}) must be less than max (${max})`;
            console.error(error);
            throw new Error(error);
        }

        if (step <= 0) {
            const error = `Configuration error: step must be positive, got ${step}`;
            console.error(error);
            throw new Error(error);
        }

        if (step > (max - min)) {
            console.warn(`Warning: step (${step}) is larger than range (${max - min}), adjusting to ${(max - min) / 2}`);
            config.step = (max - min) / 2;
        }

        if (height < 20) {
            console.warn(`Warning: height (${height}) is too small, setting to 20`);
            config.height = 20;
        }

        if (handleHeight < 20) {
            console.warn(`Warning: handle_height (${handleHeight}) is too small, setting to 20`);
            config.handle_height = 20;
        }

        this.config = {
            min,
            max,
            step: this._validateNumericValue(config.step, 1),
            height: this._validateNumericValue(config.height, 60),
            handle_height: handleHeight,
            gradient,
            entities: validatedEntities,
            title: String(config.title || '').substring(0, 200),
            show_grid: config.show_grid !== false,
            free_mode: config.free_mode === true
        };

        this.render();
    }

    _validateEntity(entity, index) {
        try {
            if (typeof entity === 'string') {
                const trimmed = entity.trim().toLowerCase(); // NORMALISER EN MINUSCULES
                if (!trimmed) {
                    console.warn(`Empty entity at index ${index}`);
                    return null;
                }
                if (!validateEntityId(trimmed)) {
                    console.warn(`Invalid entity ID at index ${index}: "${trimmed}". Expected format: domain.entity`);
                    return null;
                }
                return {
                    entity: trimmed,
                    name: '',
                    color: '',
                    icon: '',
                    show_unit: true,
                    hide_icon: false,
                    unit: ''
                };
            }

            if (typeof entity !== 'object' || !entity) {
                console.warn(`Invalid entity object at index ${index}`);
                return null;
            }

            let entityId = String(entity.entity || '')
                .trim()
                .toLowerCase(); // NORMALISER EN MINUSCULES

            if (!entityId) {
                console.warn(`Missing entity ID at index ${index}`);
                return null;
            }

            if (!validateEntityId(entityId)) {
                console.warn(`Invalid entity ID at index ${index}: "${entityId}". Expected format: domain.entity`);
                return null;
            }

            return {
                entity: entityId,
                name: String(entity.name || '').trim().substring(0, 100),
                color: String(entity.color || '').trim().substring(0, 20),
                icon: String(entity.icon || '').trim().substring(0, 50),
                show_unit: entity.show_unit !== false,
                hide_icon: entity.hide_icon === true,
                unit: String(entity.unit || '').trim().substring(0, 20)
            };
        } catch (error) {
            console.error(`Validation error at index ${index}:`, error);
            return null;
        }
    }

    _validateGradient(gradient) {
        if (!Array.isArray(gradient)) return ['#ff0000', '#ffff00', '#00ff00'];
        const validated = gradient.map(c => {
            const str = String(c).trim();
            const isHex = /^#[0-9A-F]{6}$/i.test(str);
            const isCssVar = str.includes('var(');
            return (isHex || isCssVar) ? str : null;
        }).filter(c => c).slice(0, 10);
        return validated.length > 0 ? validated : ['#ff0000', '#ffff00', '#00ff00'];
    }

    _validateNumericValue(value, defaultValue) {
        if (value === undefined || value === null) return defaultValue;
        const num = parseFloat(value);
        return isNaN(num) ? defaultValue : num;
    }

    set hass(hass) {
        this._hass = hass;
        this._langHelper.setHass(hass);

        const now = Date.now();
        if (now - this._state.caches.lastUpdateTime < SLIDER_CONSTANTS.DEBOUNCE_DELAY_MS) {
            this._state.setTimer('debounce', setTimeout(() => {
                this.updateCard();
                this._state.caches.lastUpdateTime = Date.now();
            }, SLIDER_CONSTANTS.DEBOUNCE_DELAY_MS));
        } else {
            this.updateCard();
            this._state.caches.lastUpdateTime = now;
        }
    }

    updateCard() {
        if (!this._hass || !this.config) return;

        // Vérifier si les entités ont changé (optimisation)
        const entitiesHash = JSON.stringify(
            this.config.entities.map(e => ({
                entity: e.entity,
                value: this._hass.states[e.entity]?.state
            }))
        );

        if (entitiesHash === this._state.caches.entitiesHash && this._lastRenderedHash === entitiesHash) {
            return; // Rien n'a changé, skip
        }

        this._state.caches.entitiesHash = entitiesHash;

        const titleEl = this.shadowRoot.querySelector('#title');
        if (titleEl) titleEl.textContent = escapeHtml(this.config.title);

        const slider = this.shadowRoot.querySelector('#slider-container');
        const details = this.shadowRoot.querySelector('#details');
        if (!slider || !details) return;

        slider.innerHTML = '';
        details.innerHTML = '';

        this.config.entities.forEach((cfg, idx) => {
            const entity = this._hass.states[cfg.entity];
            if (!entity) {
                console.warn(`${this.t('error_entity_not_found')}: ${cfg.entity}`);
                return;
            }

            const value = parseFloat(entity.state);
            if (isNaN(value)) {
                console.warn(`Invalid state value for ${cfg.entity}: ${entity.state}`);
                return;
            }

            const name = cfg.name || entity.attributes.friendly_name || cfg.entity;
            const color = cfg.color || entity.attributes.icon_color || '#ffffff';
            const icon = entity.attributes.icon || cfg.icon || '';
            const unit = cfg.show_unit ? (entity.attributes.unit_of_measurement || cfg.unit || '') : '';
            const display = unit ? `${value.toFixed(1)} ${escapeHtml(unit)}` : value.toFixed(1);

            const handle = document.createElement('div');
            handle.className = 'slider-handle';
            handle.style.color = color;
            handle.style.height = this.config.handle_height + 'px';
            handle.style.left = this.valueToPercent(value) + '%';
            handle.dataset.entity = cfg.entity;
            handle.dataset.index = idx;
            handle.setAttribute('role', 'slider');
            handle.setAttribute('aria-label', `${escapeHtmlAttribute(name)}: ${value}`);
            handle.setAttribute('tabindex', '0');

            this._addDragBehavior(handle, idx);
            slider.appendChild(handle);

            const row = document.createElement('div');
            row.className = 'detail-row';
            let iconHtml = '';
            if (!cfg.hide_icon && icon) {
                iconHtml = `<div class="detail-icon" role="img" aria-label="${escapeHtmlAttribute(name)}"><ha-icon icon="${escapeHtmlAttribute(icon)}" style="color:${escapeHtmlAttribute(color)}"></ha-icon></div>`;
            } else if (cfg.hide_icon) {
                iconHtml = `<div class="detail-color" style="background-color:${escapeHtmlAttribute(color)}" role="img" aria-label="${escapeHtmlAttribute(name)}"></div>`;
            }
            row.innerHTML = `${iconHtml}<div class="detail-name">${escapeHtml(name)}</div><div class="detail-value">${display}</div>`;
            details.appendChild(row);
        });

        if (this.config.show_grid) {
            requestAnimationFrame(() => this._drawGrid());
        }

        this._lastRenderedHash = entitiesHash;
    }

    _drawGrid() {
        const canvas = this.shadowRoot.querySelector('#grid-canvas');
        const container = this.shadowRoot.querySelector('#slider-container');
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();

        // Skip si les dimensions n'ont pas changé (optimisation)
        if (this._state.caches.gridCanvas &&
            this._state.caches.gridCanvas.width === rect.width &&
            this._state.caches.gridCanvas.height === this.config.height + 20) {
            return;
        }

        canvas.width = rect.width;
        canvas.height = this.config.height + 20;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // DÉTECTER DARK/LIGHT MODE
        const isDarkMode = this._hass?.themes?.darkMode ||
            window.matchMedia('(prefers-color-scheme: dark)').matches;

        ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = SLIDER_CONSTANTS.GRID_LINE_WIDTH;

        const {
            min,
            max,
            step
        } = this.config;
        const range = max - min;
        const numSteps = Math.floor(range / step);

        for (let i = 0; i <= numSteps; i++) {
            const value = min + (i * step);
            const x = (value - min) / range * canvas.width;
            ctx.beginPath();
            ctx.moveTo(x, 10);
            ctx.lineTo(x, canvas.height - 10);
            ctx.stroke();
        }

        this._state.caches.gridCanvas = {
            width: rect.width,
            height: this.config.height + 20
        };
    }

    valueToPercent(value) {
        const {
            min,
            max
        } = this.config;
        return ((value - min) / (max - min)) * 100;
    }

    percentToValue(percent) {
        const {
            min,
            max
        } = this.config;
        return min + (percent / 100) * (max - min);
    }

    snapToStep(value) {
        const {
            step,
            min
        } = this.config;
        return Math.round((value - min) / step) * step + min;
    }

    getConstraints(index) {
        let minValue = this.config.min;
        let maxValue = this.config.max;

        if (this.config.free_mode) return {
            minValue,
            maxValue
        };

        if (index < this.config.entities.length - 1) {
            const nextEntity = this._hass.states[this.config.entities[index + 1].entity];
            if (nextEntity) {
                const nextValue = parseFloat(nextEntity.state);
                if (!isNaN(nextValue)) maxValue = nextValue - this.config.step;
            }
        }

        if (index > 0) {
            const prevEntity = this._hass.states[this.config.entities[index - 1].entity];
            if (prevEntity) {
                const prevValue = parseFloat(prevEntity.state);
                if (!isNaN(prevValue)) minValue = prevValue + this.config.step;
            }
        }

        return {
            minValue,
            maxValue
        };
    }

    _addDragBehavior(handle, index) {
        const container = this.shadowRoot.querySelector('#slider-container');
        const handleId = `handle-${index}`;

        const updateValue = (clientX) => {
            const rect = container.getBoundingClientRect();
            const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
            let newValue = this.percentToValue((x / rect.width) * 100);
            newValue = this.snapToStep(newValue);

            const {
                minValue,
                maxValue
            } = this.getConstraints(index);
            newValue = Math.max(minValue, Math.min(maxValue, newValue));

            // SANS TRANSITION pendant drag
            handle.classList.add('dragging');
            handle.style.left = this.valueToPercent(newValue) + '%';

            const labelParts = handle.getAttribute('aria-label').split(':');
            handle.setAttribute('aria-label', `${labelParts[0]}: ${newValue}`);

            this._throttleApiCall(handle.dataset.entity, newValue);
        };

        const onMouseMove = (e) => {
            if (this._state.dragState.isDragging) {
                e.preventDefault();
                updateValue(e.clientX);
            }
        };

        const onMouseUp = () => {
            handle.classList.remove('dragging'); // Réactiver transition
            this._state.clearDragState();
            this._state.removeAllEventListeners('mouse-' + handleId);
        };

        const onTouchMove = (e) => {
            if (this._state.dragState.isDragging && e.touches.length > 0) {
                e.preventDefault();
                updateValue(e.touches[0].clientX);
            }
        };

        const onTouchEnd = () => {
            handle.classList.remove('dragging'); // Réactiver transition

            // Feedback haptique
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }

            this._state.clearDragState();
            this._state.removeAllEventListeners('touch-' + handleId);
        };

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();

            // NETTOYER LES ANCIENS LISTENERS avant d'en ajouter de nouveaux
            this._state.removeAllEventListeners('mouse-' + handleId);

            this._state.setDragState(handle, e.clientX);
            this._state.addEventListener('mouse-' + handleId, document, 'mousemove', onMouseMove, {
                passive: false
            });
            this._state.addEventListener('mouse-' + handleId, document, 'mouseup', onMouseUp);
        });

        handle.addEventListener('touchstart', (e) => {
            e.preventDefault();

            if (e.touches.length > 0) {
                // NETTOYER LES ANCIENS LISTENERS
                this._state.removeAllEventListeners('touch-' + handleId);

                // Feedback haptique et visual
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                handle.classList.add('touch-active');

                this._state.setDragState(handle, e.touches[0].clientX);
                this._state.addEventListener('touch-' + handleId, document, 'touchmove', onTouchMove, {
                    passive: false
                });
                this._state.addEventListener('touch-' + handleId, document, 'touchend', onTouchEnd);
            }
        });

        // Support clavier amélioré
        handle.addEventListener('keydown', (e) => {
            const current = parseFloat(this._hass.states[handle.dataset.entity].state);
            if (isNaN(current)) return;

            let newValue = current;
            let changed = false;

            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                newValue = Math.max(this.config.min, current - this.config.step);
                changed = true;
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                newValue = Math.min(this.config.max, current + this.config.step);
                changed = true;
            } else if (e.key === 'Home') {
                e.preventDefault();
                newValue = this.config.min;
                changed = true;
            } else if (e.key === 'End') {
                e.preventDefault();
                newValue = this.config.max;
                changed = true;
            }

            if (changed) {
                handle.style.left = this.valueToPercent(newValue) + '%';
                const labelParts = handle.getAttribute('aria-label').split(':');
                handle.setAttribute('aria-label', `${labelParts[0]}: ${newValue}`);
                this._callApiWithThrottle(handle.dataset.entity, newValue);
            }
        });
    }

    _throttleApiCall(entityId, value) {
        if (!this._state.timers.throttle) {
            this._callApiWithThrottle(entityId, value);
            this._state.setTimer('throttle', setTimeout(() => {
                this._state.timers.throttle = null;
            }, SLIDER_CONSTANTS.THROTTLE_API_CALL_MS));
        }
    }

    _callApiWithThrottle(entityId, value) {
        if (!this._hass) return;
        this._hass.callService('input_number', 'set_value', {
            entity_id: entityId,
            value: value
        }).catch(error => {
            console.error(`Failed to set ${entityId} to ${value}:`, error);
        });
    }

    getGridOptions() {
        return {
            rows: 3, // 3 lignes par défaut
            columns: 4, // 4 colonnes (sur 12 totales)
            min_rows: 2, // Minimum 2 lignes
            min_columns: 3 // Minimum 3 colonnes
        };
    }

    render() {
        const gradient = this.config.gradient.map(c => escapeHtmlAttribute(c)).join(', ');

        const styles = `
      :host { display: block; }
      .card-content { padding: 16px; }
      #title { font-size: 24px; font-weight: 500; margin-bottom: 12px; }
      #title:empty { display: none; }
      #slider-wrapper { position: relative; margin: 16px 0 12px 0; display: flex; align-items: center; }
      #grid-canvas { position: absolute; top: 50%; left: 0; transform: translateY(-50%); pointer-events: none; z-index: 1; width: 100%; }
      #slider-container { 
        position: relative; background: linear-gradient(to right, ${gradient});
        border-radius: 8px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); z-index: 5; width: 100%; height: ${this.config.height}px;
      }
      .slider-handle {
        position: absolute; top: 50%; width: ${SLIDER_CONSTANTS.HANDLE_WIDTH_BASE}px;
        transform: translate(-50%, -50%); cursor: ew-resize; background-color: currentColor;
        box-shadow: 0 0 8px rgba(0,0,0,0.4), 0 0 0 2px white; z-index: 10; 
        border: none; outline: none;
        transition: all 0.2s ease-out;
      }
      .slider-handle.dragging { 
        transition: none; 
        box-shadow: 0 0 12px rgba(0,0,0,0.6), 0 0 0 3px white;
      }
      .slider-handle.touch-active {
        box-shadow: 0 0 20px rgba(0,0,0,0.8), 0 0 0 4px white;
      }
      .slider-handle:hover { 
        box-shadow: 0 0 12px rgba(0,0,0,0.6), 0 0 0 3px white; 
        width: ${SLIDER_CONSTANTS.HANDLE_WIDTH_HOVER}px; 
      }
      .slider-handle:active { cursor: grabbing; }
      .slider-handle:focus { 
        outline: 2px solid white; 
        outline-offset: 2px; 
      }
      #details { margin-top: 16px; }
      .detail-row { 
        display: flex; 
        align-items: center; 
        padding: 8px 0; 
        border-bottom: 1px solid rgba(255,255,255,0.1); 
      }
      .detail-icon { 
        width: 24px; 
        height: 24px; 
        margin-right: 8px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
      }
      .detail-color { 
        width: 20px; 
        height: 20px; 
        border-radius: 4px; 
        margin-right: 12px; 
        border: 2px solid white; 
      }
      .detail-name { 
        flex: 1; 
        font-weight: 500; 
      }
      .detail-value { 
        font-weight: 700; 
        padding: 4px 12px; 
        background: rgba(255,255,255,0.1); 
        border-radius: 12px; 
      }
    `;

        this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <ha-card>
        <div class="card-content">
          <div id="title">${escapeHtml(this.config.title)}</div>
          <div id="slider-wrapper">
            <canvas id="grid-canvas"></canvas>
            <div id="slider-container"></div>
          </div>
          <div id="details"></div>
        </div>
      </ha-card>
    `;

        this.updateCard();
    }

    getCardSize() {
        return 3;
    }

    static getConfigElement() {
        return document.createElement('ordered-sliders-card-editor');
    }

    static getStubConfig() {
        return {
            title: 'Ordered Sliders',
            min: 0,
            max: 100,
            step: 1,
            height: 20,
            handle_height: 50,
            show_grid: true,
            free_mode: false,
            gradient: ['#2196F3', '#4CAF50', '#FF9800', '#F44336'],
            entities: []
        };
    }

    disconnectedCallback() {
        this._state.resetOnDisconnect();
    }
}

// ============================================================================
// EDITOR CLASS
// ============================================================================

class OrderedSlidersCardEditor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open'
        });
        this._config = {};
        this._hass = null;
        this._langHelper = new LanguageHelper(null);
    }

    getLanguage() {
        return this._langHelper.getLanguage();
    }
    t(key) {
        return this._langHelper.t(key);
    }

    setConfig(config) {
        this._config = config || {};
        this._config.entities = Array.isArray(this._config.entities) ? this._config.entities : [];
        this._config.gradient = Array.isArray(this._config.gradient) ? this._config.gradient : ['#2196F3', '#4CAF50'];
        this._config.show_grid = this._config.show_grid !== false;
        this._config.free_mode = this._config.free_mode === true;
        this.render();
    }

    set hass(hass) {
        this._hass = hass;
        this._langHelper.setHass(hass);
    }

    fireConfigChanged() {
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: {
                config: this._config
            }
        }));
    }

    render() {
        const t = this.t.bind(this);

        const styles = `
      :host { display: block; }
      ha-card { padding: 16px; }
      .title { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
      .section { margin-bottom: 20px; }
      .section-title { font-weight: 600; margin-bottom: 10px; }
      .row { margin-bottom: 12px; }
      .row label { font-weight: 500; display: block; margin-bottom: 5px; font-size: 13px; }
      input, select { width: 100%; padding: 8px; border: 1px solid var(--divider-color); border-radius: 4px; background: var(--primary-background-color); color: var(--primary-text-color); box-sizing: border-box; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .add-btn { width: 100%; padding: 10px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; margin-top: 10px; }
      .add-btn:hover { opacity: 0.9; }
    `;

        const html = `
      <div class="title">${t('card_title')} Editor</div>
      
      <div class="section">
        <div class="section-title">${t('card_title')}</div>
        <div class="row">
          <input type="text" id="title" value="${escapeHtml(this._config.title || '')}" placeholder="${t('card_title')}">
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t('min_label')} / ${t('max_label')} / ${t('step_label')}</div>
        <div class="grid">
          <div><label>${t('min_label')}</label><input type="number" id="min" value="${this._config.min || 0}"></div>
          <div><label>${t('max_label')}</label><input type="number" id="max" value="${this._config.max || 100}"></div>
          <div><label>${t('step_label')}</label><input type="number" id="step" value="${this._config.step || 1}" step="0.1"></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Options</div>
        <div class="row">
          <label>${t('show_grid_label')}</label>
          <select id="show_grid">
            <option value="true" ${this._config.show_grid !== false ? 'selected' : ''}>${t('yes')}</option>
            <option value="false" ${this._config.show_grid === false ? 'selected' : ''}>${t('no')}</option>
          </select>
        </div>
        <div class="row">
          <label>${t('free_mode_label')}</label>
          <select id="free_mode">
            <option value="false" ${!this._config.free_mode ? 'selected' : ''}>${t('no')}</option>
            <option value="true" ${this._config.free_mode ? 'selected' : ''}>${t('yes')}</option>
          </select>
        </div>
      </div>
    `;

        this.shadowRoot.innerHTML = `<style>${styles}</style><ha-card>${html}</ha-card>`;

        this._attachListeners();
    }

    _attachListeners() {
        const titleInput = this.shadowRoot.querySelector('#title');
        const minInput = this.shadowRoot.querySelector('#min');
        const maxInput = this.shadowRoot.querySelector('#max');
        const stepInput = this.shadowRoot.querySelector('#step');
        const showGridSelect = this.shadowRoot.querySelector('#show_grid');
        const freeModeSelect = this.shadowRoot.querySelector('#free_mode');

        if (!titleInput) return;

        titleInput.addEventListener('change', (e) => {
            this._config.title = e.target.value;
            this.fireConfigChanged();
        });

        ['min', 'max', 'step'].forEach(field => {
            const input = this.shadowRoot.querySelector(`#${field}`);
            if (input) {
                input.addEventListener('change', (e) => {
                    this._config[field] = parseFloat(e.target.value) || 0;
                    this.fireConfigChanged();
                });
            }
        });

        if (showGridSelect) {
            showGridSelect.addEventListener('change', (e) => {
                this._config.show_grid = e.target.value === 'true';
                this.fireConfigChanged();
            });
        }

        if (freeModeSelect) {
            freeModeSelect.addEventListener('change', (e) => {
                this._config.free_mode = e.target.value === 'true';
                this.fireConfigChanged();
            });
        }
    }
}

customElements.define("ordered-sliders-card", OrderedSlidersCard);
customElements.define("ordered-sliders-card-editor", OrderedSlidersCardEditor);

console.info(
    "%c Ordered Sliders Card %c v2.0.0 %c",
    "background:#2196F3;color:white;padding:2px 8px;border-radius:3px 0 0 3px;font-weight:bold",
    "background:#4CAF50;color:white;padding:2px 8px;border-radius:0 3px 3px 0;font-weight:bold",
    "background:none"
);

window.customCards = window.customCards || [];
window.customCards.push({
    type: "ordered-sliders-card",
    name: "Ordered Sliders Card",
    description: "Ordered Sliders Card v2.0.0 - Ordered vertical sliders with gradient, centralized state management, memory optimization, API throttling, keyboard/touch support, and accessibility."
});
