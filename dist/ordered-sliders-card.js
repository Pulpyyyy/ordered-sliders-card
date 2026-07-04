// Translations live in dist/lang/<code>.js (one file per language) and merge into
// window.__orderedSlidersTranslations, shared with the editor. Load them here,
// deriving the URLs from this card's own <script src> (same trick used to load
// the editor). The language helpers read the global lazily, so a late load only
// affects console warnings until the next render.
(function loadTranslations() {
    if (window.__orderedSlidersTranslations?.en) return;
    const cardScript = document.querySelector('script[src*="ordered-sliders-card.js"]');
    if (!cardScript?.src) return;
    // Supported languages — add a new dist/lang/<code>.js file and list it here.
    ['en', 'fr'].forEach(lang => {
        const src = cardScript.src.replace('ordered-sliders-card.js', `lang/${lang}.js`);
        const script = document.createElement('script');
        script.src = src;
        script.onerror = () => console.error('[OrderedSlidersCard] Could not load translations from', src);
        document.head.appendChild(script);
    });
})();

const CARD_VERSION = "2.2.1";

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

// Strict CSS color validation — used before injecting a color into inline
// styles / <style>. None of the accepted forms allow ';' or ':' , so extra CSS
// declarations cannot be smuggled in via a config color.
function isValidCssColor(value) {
    const str = String(value).trim();
    if (!str || str.length > 64) return false;
    // #RGB, #RGBA, #RRGGBB, #RRGGBBAA
    if (/^#([0-9A-F]{3,4}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(str)) return true;
    // rgb()/rgba()/hsl()/hsla() with numeric content only
    if (/^(rgb|rgba|hsl|hsla)\(\s*[\d.,%/\s]+\)$/i.test(str)) return true;
    // var(--custom-prop) with an optional simple fallback
    if (/^var\(\s*--[\w-]+\s*(,\s*[#\w().,%\s-]+)?\)$/i.test(str)) return true;
    // named colors / keywords: letters only (red, transparent, currentColor…)
    if (/^[a-z]+$/i.test(str)) return true;
    return false;
}

class LanguageHelper {
    constructor(hass) {
        this._hass = hass;
    }

    // Read the shared translations lazily so a late-loaded translations file is
    // still picked up (falls back to an empty map, then to the key itself).
    _translations() {
        return window.__orderedSlidersTranslations || {};
    }

    getLanguage() {
        const t = this._translations();
        if (this._hass?.locale?.language && t[this._hass.locale.language]) {
            return this._hass.locale.language;
        }
        return "en";
    }

    t(key) {
        const t = this._translations();
        const lang = this.getLanguage();
        return t[lang]?.[key] || t.en?.[key] || key;
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
        this.dragState = { isDragging: true, currentHandle: handle, startX };
        this.log('Drag started', { handle: handle.dataset.entity, startX });
    }

    clearDragState() {
        this.dragState = { isDragging: false, currentHandle: null, startX: 0 };
        this.log('Drag ended');
    }

    setTimer(key, timerId) {
        if (this.timers[key]) clearTimeout(this.timers[key]);
        this.timers[key] = timerId;
        this.log('Timer set', { key, timerId });
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
        this.eventListeners.get(id).push({ target, event, handler, options });
        target.addEventListener(event, handler, options);
        this.log('Event listener added', { id, event, options });
    }

    removeAllEventListeners(id) {
        if (this.eventListeners.has(id)) {
            this.eventListeners.get(id).forEach(({ target, event, handler, options }) => {
                target.removeEventListener(event, handler, options);
            });
            this.eventListeners.delete(id);
            this.log('Event listeners removed', { id });
        }
    }

    clearAllEventListeners() {
        const count = Array.from(this.eventListeners.values()).reduce((sum, arr) => sum + arr.length, 0);
        this.eventListeners.forEach((listeners) => {
            listeners.forEach(({ target, event, handler, options }) => {
                target.removeEventListener(event, handler, options);
            });
        });
        this.eventListeners.clear();
        this.log('All event listeners cleared', { count });
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
        this.attachShadow({ mode: 'open' });

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

    getLanguage() { return this._langHelper.getLanguage(); }
    t(key) { return this._langHelper.t(key); }

    setConfig(config) {
        if (!config || typeof config !== 'object') throw new Error('Invalid configuration');

        let entities = config.entities || [];
        if (!Array.isArray(entities)) throw new Error('entities must be an array');

        const validatedEntities = entities.map((e, i) => this._validateEntity(e, i)).filter(e => e);
        const gradient = this._validateGradient(config.gradient || ['#ff0000', '#ffff00', '#00ff00']);

        const min = this._validateNumericValue(config.min, 0);
        const max = this._validateNumericValue(config.max, 100);
        let step = this._validateNumericValue(config.step, 1);
        let height = this._validateNumericValue(config.height, 60);
        let handleHeight = this._validateNumericValue(config.handle_height, 40);

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

        // Clamp into local variables so the applied config always matches the
        // warning messages (do not rely on mutating the input `config`).
        if (step > (max - min)) {
            step = (max - min) / 2;
            console.warn(`Warning: step is larger than range (${max - min}), adjusting to ${step}`);
        }

        if (height < 20) {
            console.warn(`Warning: height (${height}) is too small, setting to 20`);
            height = 20;
        }

        if (handleHeight < 20) {
            console.warn(`Warning: handle_height (${handleHeight}) is too small, setting to 20`);
            handleHeight = 20;
        }

        this.config = {
            min,
            max,
            step,
            height,
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
                const trimmed = entity.trim().toLowerCase();
                if (!trimmed) { console.warn(`Empty entity at index ${index}`); return null; }
                if (!validateEntityId(trimmed)) {
                    console.warn(`Invalid entity ID at index ${index}: "${trimmed}". Expected format: domain.entity`);
                    return null;
                }
                return { entity: trimmed, name: '', color: '', icon: '', show_unit: true, hide_icon: false, unit: '' };
            }

            if (typeof entity !== 'object' || !entity) {
                console.warn(`Invalid entity object at index ${index}`);
                return null;
            }

            let entityId = String(entity.entity || '').trim().toLowerCase();

            if (!entityId) { console.warn(`Missing entity ID at index ${index}`); return null; }
            if (!validateEntityId(entityId)) {
                console.warn(`Invalid entity ID at index ${index}: "${entityId}". Expected format: domain.entity`);
                return null;
            }

            const rawColor = String(entity.color || '').trim();
            const color = isValidCssColor(rawColor) ? rawColor : '';
            if (rawColor && !color) {
                console.warn(`Ignoring invalid color at index ${index}: "${rawColor}"`);
            }

            return {
                entity: entityId,
                name: String(entity.name || '').trim().substring(0, 100),
                color,
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
        const validated = gradient
            .map(c => String(c).trim())
            .filter(c => isValidCssColor(c))
            .slice(0, 10);
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
        if (!this._hass || !this.config || !Array.isArray(this.config.entities)) return;
        // Do not rebuild the DOM while a handle is being dragged: recreating the
        // handles would detach the one under the cursor when the optimistic state
        // update comes back from HA, breaking the drag mid-gesture.
        if (this._state.dragState.isDragging) return;

        // Include the displayed attributes in the hash so a change of
        // friendly_name / unit / icon / icon_color also triggers a refresh,
        // not only a change of state.
        const entitiesHash = JSON.stringify(
            this.config.entities.map(e => {
                const s = this._hass.states[e.entity];
                const a = s?.attributes;
                return {
                    entity: e.entity,
                    value: s?.state,
                    name: a?.friendly_name,
                    unit: a?.unit_of_measurement,
                    icon: a?.icon,
                    icon_color: a?.icon_color
                };
            })
        );

        if (entitiesHash === this._state.caches.entitiesHash && this._lastRenderedHash === entitiesHash) {
            return;
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
            // cfg.color is already validated in setConfig; icon_color comes from the
            // entity's attributes (integration-controlled) so validate it too.
            const attrColor = isValidCssColor(entity.attributes.icon_color) ? entity.attributes.icon_color : '';
            const color = cfg.color || attrColor || '#ffffff';
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
            // setAttribute goes through the DOM API (no HTML parsing) so the raw
            // name is safe here; the value lives in aria-valuenow, not the label.
            handle.setAttribute('aria-label', name);
            handle.setAttribute('aria-valuemin', String(this.config.min));
            handle.setAttribute('aria-valuemax', String(this.config.max));
            handle.setAttribute('aria-valuenow', String(value));
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

        if (this._state.caches.gridCanvas &&
            this._state.caches.gridCanvas.width === rect.width &&
            this._state.caches.gridCanvas.height === this.config.height + 20) {
            return;
        }

        canvas.width = rect.width;
        canvas.height = this.config.height + 20;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const isDarkMode = this._hass?.themes?.darkMode ||
            window.matchMedia('(prefers-color-scheme: dark)').matches;

        ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = SLIDER_CONSTANTS.GRID_LINE_WIDTH;

        const { min, max, step } = this.config;
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
        const { min, max } = this.config;
        return ((value - min) / (max - min)) * 100;
    }

    percentToValue(percent) {
        const { min, max } = this.config;
        return min + (percent / 100) * (max - min);
    }

    snapToStep(value) {
        const { step, min } = this.config;
        const snapped = Math.round((value - min) / step) * step + min;
        // Strip binary float artifacts (e.g. 0.30000000000000004) using the
        // step's own decimal precision, so the value sent to input_number and the
        // displayed value stay clean.
        const decimals = Math.min((String(step).split('.')[1] || '').length, 10);
        return Number(snapped.toFixed(decimals));
    }

    getConstraints(index) {
        let minValue = this.config.min;
        let maxValue = this.config.max;

        if (this.config.free_mode) return { minValue, maxValue };

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

        // Neighbors closer than one step apart can make minValue exceed maxValue.
        // Collapse to a single valid point so the later clamp stays well-defined.
        if (minValue > maxValue) {
            minValue = maxValue = (minValue + maxValue) / 2;
        }

        return { minValue, maxValue };
    }

    _addDragBehavior(handle, index) {
        const container = this.shadowRoot.querySelector('#slider-container');
        const handleId = `handle-${index}`;

        // Remember the last value produced during the drag so it can be flushed
        // on release — the leading-edge throttle can otherwise drop the final one.
        let lastValue = null;

        const flush = () => {
            if (lastValue !== null) {
                this._callApiWithThrottle(handle.dataset.entity, lastValue);
                lastValue = null;
            }
        };

        const updateValue = (clientX) => {
            const rect = container.getBoundingClientRect();
            const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
            let newValue = this.percentToValue((x / rect.width) * 100);
            newValue = this.snapToStep(newValue);

            const { minValue, maxValue } = this.getConstraints(index);
            newValue = Math.max(minValue, Math.min(maxValue, newValue));
            lastValue = newValue;

            handle.classList.add('dragging');
            handle.style.left = this.valueToPercent(newValue) + '%';
            handle.setAttribute('aria-valuenow', String(newValue));

            this._throttleApiCall(handle.dataset.entity, newValue);
        };

        const onMouseMove = (e) => {
            if (this._state.dragState.isDragging) {
                e.preventDefault();
                updateValue(e.clientX);
            }
        };

        const onMouseUp = () => {
            handle.classList.remove('dragging');
            flush();
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
            // Haptic feedback is already fired on touchstart; avoid a second buzz.
            handle.classList.remove('dragging');
            flush();
            this._state.clearDragState();
            this._state.removeAllEventListeners('touch-' + handleId);
        };

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this._state.removeAllEventListeners('mouse-' + handleId);
            this._state.setDragState(handle, e.clientX);
            this._state.addEventListener('mouse-' + handleId, document, 'mousemove', onMouseMove, { passive: false });
            this._state.addEventListener('mouse-' + handleId, document, 'mouseup', onMouseUp);
        });

        handle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                this._state.removeAllEventListeners('touch-' + handleId);
                if (navigator.vibrate) navigator.vibrate(50);
                handle.classList.add('touch-active');
                this._state.setDragState(handle, e.touches[0].clientX);
                this._state.addEventListener('touch-' + handleId, document, 'touchmove', onTouchMove, { passive: false });
                this._state.addEventListener('touch-' + handleId, document, 'touchend', onTouchEnd);
            }
        });

        handle.addEventListener('keydown', (e) => {
            const state = this._hass?.states[handle.dataset.entity];
            if (!state) return;
            const current = parseFloat(state.state);
            if (isNaN(current)) return;

            let newValue = current;
            let changed = false;

            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                newValue = current - this.config.step;
                changed = true;
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                newValue = current + this.config.step;
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
                // Snap to the step grid and apply the ordering constraints
                // (getConstraints already handles free_mode) so keyboard moves
                // stay on-grid and cannot cross neighboring handles.
                newValue = this.snapToStep(newValue);
                const { minValue, maxValue } = this.getConstraints(index);
                newValue = Math.max(minValue, Math.min(maxValue, newValue));

                handle.style.left = this.valueToPercent(newValue) + '%';
                handle.setAttribute('aria-valuenow', String(newValue));
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
        return { rows: 3, columns: 4, min_rows: 2, min_columns: 3 };
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

        // The DOM was just rebuilt from scratch — invalidate the render caches so
        // updateCard() repopulates it instead of short-circuiting on an unchanged
        // hash (otherwise a config-only change leaves a blank card / stale grid).
        this._lastRenderedHash = null;
        this._state.caches.entitiesHash = null;
        this._state.caches.gridCanvas = null;
        this.updateCard();
    }

    getCardSize() {
        return 3;
    }

    static async getConfigElement() {
        if (!customElements.get('ordered-sliders-card-editor')) {
            // Derive editor URL from the card script URL
            const cardScript = document.querySelector('script[src*="ordered-sliders-card.js"]');
            if (cardScript?.src) {
                const editorSrc = cardScript.src.replace('ordered-sliders-card.js', 'ordered-sliders-card-editor.js');
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = editorSrc;
                    script.onload = resolve;
                    script.onerror = () => {
                        console.error('[OrderedSlidersCard] Could not load editor from', editorSrc);
                        reject(new Error('Editor script not found'));
                    };
                    document.head.appendChild(script);
                });
            }
        }
        return document.createElement('ordered-sliders-card-editor');
    }

    static getStubConfig(hass, entities, entitiesFallback) {
        // Pre-fill an input_number entity for the 2026.6 entity-first card picker.
        // 1) entities selected in the picker, 2) fallback list, 3) first available in hass.
        const pickInputNumber = (list) =>
            (list || []).filter(id => id.startsWith('input_number.'));

        let chosen = pickInputNumber(entities);
        if (!chosen.length) chosen = pickInputNumber(entitiesFallback);
        if (!chosen.length && hass) {
            chosen = Object.keys(hass.states).filter(id => id.startsWith('input_number.'));
        }

        // Localized default title (falls back to English, then a literal) — the
        // translations may not have finished loading, hence the safe chain.
        const trans = window.__orderedSlidersTranslations || {};
        const lang = (hass?.locale?.language && trans[hass.locale.language]) ? hass.locale.language : 'en';
        const title = trans[lang]?.card_title || trans.en?.card_title || 'Ordered Sliders';

        return {
            title,
            min: 0,
            max: 100,
            step: 1,
            height: 20,
            handle_height: 50,
            show_grid: true,
            free_mode: false,
            gradient: ['#2196F3', '#4CAF50', '#FF9800', '#F44336'],
            entities: chosen.slice(0, 1).map(entity => ({ entity }))
        };
    }

    disconnectedCallback() {
        this._state.resetOnDisconnect();
    }
}

customElements.define("ordered-sliders-card", OrderedSlidersCard);

console.info(
    `%c Ordered Sliders Card %c v${CARD_VERSION} %c`,
    "background:#2196F3;color:white;padding:2px 8px;border-radius:3px 0 0 3px;font-weight:bold",
    "background:#4CAF50;color:white;padding:2px 8px;border-radius:0 3px 3px 0;font-weight:bold",
    "background:none"
);

window.customCards = window.customCards || [];
window.customCards.push({
    type: "ordered-sliders-card",
    name: "Ordered Sliders Card",
    description: `Ordered Sliders Card v${CARD_VERSION} - Ordered vertical sliders with gradient, centralized state management, memory optimization, API throttling, keyboard/touch support, and accessibility.`,
    documentationURL: "https://github.com/Pulpyyyy/ordered-sliders-card",
    getEntitySuggestion: (hass, entityId) => {
        if (entityId.split(".")[0] !== "input_number") {
            return null;
        }
        return {
            config: {
                type: "custom:ordered-sliders-card",
                entities: [{ entity: entityId }]
            }
        };
    }
});
