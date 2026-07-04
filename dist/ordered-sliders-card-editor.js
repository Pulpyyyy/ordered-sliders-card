// ordered-sliders-card-editor.js
// Editor for Ordered Sliders Card
// Uses Home Assistant helper elements: ha-textfield, ha-number-input, ha-switch, ha-entity-picker
// Translations come from dist/lang/<code>.js via window.__orderedSlidersTranslations

(function () {
    if (!window.__orderedSlidersTranslations) {
        console.error('[OrderedSlidersCardEditor] Translations not found. Make sure ordered-sliders-card.js is loaded first.');
    }

    class LanguageHelperEditor {
        constructor(hass) {
            this._hass = hass;
        }
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

    class OrderedSlidersCardEditor extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this._config = {};
            this._hass = null;
            this._lang = new LanguageHelperEditor(null);
        }

        t(key) {
            return this._lang.t(key);
        }

        set hass(hass) {
            this._hass = hass;
            this._lang.setHass(hass);
            // Forward hass to HA pickers already in the DOM
            this.shadowRoot.querySelectorAll('ha-entity-picker').forEach(el => {
                el.hass = hass;
            });
        }

        setConfig(config) {
            this._config = JSON.parse(JSON.stringify(config || {}));
            this._config.entities = Array.isArray(this._config.entities) ? this._config.entities : [];
            this._config.gradient = Array.isArray(this._config.gradient) ? this._config.gradient : ['#2196F3', '#4CAF50'];
            this._config.show_grid = this._config.show_grid !== false;
            this._config.free_mode = this._config.free_mode === true;
            this._render();
        }

        _fireConfigChanged() {
            this.dispatchEvent(new CustomEvent('config-changed', {
                detail: { config: this._config },
                bubbles: true,
                composed: true
            }));
        }

        // Patch a single field of the entity at `idx`, normalizing a legacy
        // string entry ("input_number.x") into an object first so the other
        // per-entity options are preserved. Does not re-render (keeps focus).
        _updateEntityField(idx, key, value) {
            const entities = [...(this._config.entities || [])];
            let ent = entities[idx];
            ent = (typeof ent === 'string') ? { entity: ent } : { ...(ent || {}) };
            ent[key] = value;
            entities[idx] = ent;
            this._config = { ...this._config, entities };
            this._fireConfigChanged();
        }

        _entityTextField(idx, key, label, value, placeholder) {
            const field = document.createElement('ha-textfield');
            field.label = label;
            field.value = value || '';
            if (placeholder) field.placeholder = placeholder;
            field.style.width = '100%';
            field.addEventListener('change', e => this._updateEntityField(idx, key, e.target.value));
            return field;
        }

        _entitySwitch(idx, key, label, checked) {
            const rowEl = document.createElement('div');
            rowEl.className = 'switch-row';
            const span = document.createElement('span');
            span.textContent = label;
            const sw = document.createElement('ha-switch');
            sw.checked = checked;
            sw.addEventListener('change', e => this._updateEntityField(idx, key, e.target.checked));
            rowEl.append(span, sw);
            return rowEl;
        }

        _render() {
            const root = this.shadowRoot;
            root.innerHTML = '';

            // ── Styles ──────────────────────────────────────────────────────
            const style = document.createElement('style');
            style.textContent = `
                :host {
                    display: block;
                    padding: 16px;
                }
                .section {
                    margin-bottom: 16px;
                }
                .section-header {
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--secondary-text-color);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    padding: 12px 0 6px;
                }
                .grid-3 {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                }
                .grid-2 {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px;
                }
                ha-textfield {
                    width: 100%;
                }
                .native-number {
                    display: flex;
                    flex-direction: column;
                    border-bottom: 2px solid var(--primary-color, #03a9f4);
                    padding: 4px 0 2px;
                    background: transparent;
                }
                .native-number label {
                    font-size: 11px;
                    color: var(--primary-color, #03a9f4);
                    margin-bottom: 2px;
                    pointer-events: none;
                }
                .native-number input {
                    border: none;
                    background: transparent;
                    color: var(--primary-text-color, #000);
                    font-size: 16px;
                    outline: none;
                    width: 100%;
                    padding: 0;
                    font-family: inherit;
                }
                .switch-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid var(--divider-color, rgba(0,0,0,0.12));
                }
                .switch-row span {
                    font-size: 14px;
                }
                .entity-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                }
                .entity-row ha-entity-picker {
                    flex: 1;
                }
                ha-icon-button {
                    --mdc-icon-button-size: 36px;
                    flex-shrink: 0;
                }
                .add-btn-row {
                    margin-top: 8px;
                }
                .entity-block {
                    border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
                    border-radius: 8px;
                    padding: 8px;
                    margin-bottom: 8px;
                }
                .entity-block .entity-row {
                    margin-bottom: 0;
                }
                .entity-options {
                    margin-top: 4px;
                }
                .entity-options summary {
                    cursor: pointer;
                    font-size: 13px;
                    color: var(--secondary-text-color);
                    padding: 4px 0;
                    user-select: none;
                }
                .entity-options .fields {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding-top: 8px;
                }
            `;
            root.appendChild(style);

            // ── Title ────────────────────────────────────────────────────────
            const titleField = document.createElement('ha-textfield');
            titleField.label = this.t('card_title');
            titleField.value = this._config.title || '';
            titleField.style.width = '100%';
            titleField.addEventListener('change', e => {
                this._config = { ...this._config, title: e.target.value };
                this._fireConfigChanged();
            });
            root.appendChild(titleField);

            // ── Min / Max / Step ─────────────────────────────────────────────
            const mmsHeader = document.createElement('div');
            mmsHeader.className = 'section-header';
            mmsHeader.textContent = `${this.t('min_label')} / ${this.t('max_label')} / ${this.t('step_label')}`;
            root.appendChild(mmsHeader);

            const mmsGrid = document.createElement('div');
            mmsGrid.className = 'grid-3 section';
            [
                { key: 'min',  label: this.t('min_label'),  step: '1',   def: 0   },
                { key: 'max',  label: this.t('max_label'),  step: '1',   def: 100 },
                { key: 'step', label: this.t('step_label'), step: '0.1', def: 1   }
            ].forEach(({ key, label, step, def }) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'native-number';
                const lbl = document.createElement('label');
                lbl.textContent = label;
                const input = document.createElement('input');
                input.type = 'number';
                input.step = step;
                input.value = this._config[key] ?? def;
                input.addEventListener('change', e => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                        this._config = { ...this._config, [key]: val };
                        this._fireConfigChanged();
                    }
                });
                wrapper.appendChild(lbl);
                wrapper.appendChild(input);
                mmsGrid.appendChild(wrapper);
            });
            root.appendChild(mmsGrid);

            // ── Heights ──────────────────────────────────────────────────────
            const heightHeader = document.createElement('div');
            heightHeader.className = 'section-header';
            heightHeader.textContent = `${this.t('bar_height_label')} / ${this.t('handle_height_label')}`;
            root.appendChild(heightHeader);

            const heightGrid = document.createElement('div');
            heightGrid.className = 'grid-2 section';
            [
                { key: 'height',        label: this.t('bar_height_label'),    def: 60 },
                { key: 'handle_height', label: this.t('handle_height_label'), def: 40 }
            ].forEach(({ key, label, def }) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'native-number';
                const lbl = document.createElement('label');
                lbl.textContent = label;
                const input = document.createElement('input');
                input.type = 'number';
                input.min = '20';
                input.step = '1';
                input.value = this._config[key] ?? def;
                input.addEventListener('change', e => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                        this._config = { ...this._config, [key]: val };
                        this._fireConfigChanged();
                    }
                });
                wrapper.appendChild(lbl);
                wrapper.appendChild(input);
                heightGrid.appendChild(wrapper);
            });
            root.appendChild(heightGrid);

            // ── Show Grid toggle ─────────────────────────────────────────────
            const showGridRow = document.createElement('div');
            showGridRow.className = 'switch-row';
            const showGridLabel = document.createElement('span');
            showGridLabel.textContent = this.t('show_grid_label');
            const showGridSwitch = document.createElement('ha-switch');
            showGridSwitch.checked = this._config.show_grid !== false;
            showGridSwitch.addEventListener('change', e => {
                this._config = { ...this._config, show_grid: e.target.checked };
                this._fireConfigChanged();
            });
            showGridRow.append(showGridLabel, showGridSwitch);
            root.appendChild(showGridRow);

            // ── Free Mode toggle ─────────────────────────────────────────────
            const freeModeRow = document.createElement('div');
            freeModeRow.className = 'switch-row';
            const freeModeLabel = document.createElement('span');
            freeModeLabel.textContent = this.t('free_mode_label');
            const freeModeSwitch = document.createElement('ha-switch');
            freeModeSwitch.checked = this._config.free_mode === true;
            freeModeSwitch.addEventListener('change', e => {
                this._config = { ...this._config, free_mode: e.target.checked };
                this._fireConfigChanged();
            });
            freeModeRow.append(freeModeLabel, freeModeSwitch);
            root.appendChild(freeModeRow);

            // ── Entities ─────────────────────────────────────────────────────
            const entitiesHeader = document.createElement('div');
            entitiesHeader.className = 'section-header';
            entitiesHeader.textContent = this.t('entities_label');
            root.appendChild(entitiesHeader);

            (this._config.entities || []).forEach((entity, idx) => {
                const ent = typeof entity === 'string' ? { entity } : (entity || {});
                const entityId = ent.entity || '';

                const block = document.createElement('div');
                block.className = 'entity-block';

                // ── Entity picker + delete ──
                const row = document.createElement('div');
                row.className = 'entity-row';

                const picker = document.createElement('ha-entity-picker');
                picker.hass = this._hass;
                picker.value = entityId;
                picker.includeDomains = ['input_number'];
                picker.allowCustomEntity = false;
                picker.addEventListener('value-changed', e => {
                    this._updateEntityField(idx, 'entity', e.detail.value);
                });
                row.appendChild(picker);

                const deleteBtn = document.createElement('ha-icon-button');
                deleteBtn.label = this.t('remove');
                deleteBtn.innerHTML = '<ha-icon icon="mdi:delete"></ha-icon>';
                deleteBtn.addEventListener('click', () => {
                    const newEntities = this._config.entities.filter((_, i) => i !== idx);
                    this._config = { ...this._config, entities: newEntities };
                    this._fireConfigChanged();
                    this._render();
                });
                row.appendChild(deleteBtn);
                block.appendChild(row);

                // ── Collapsible per-entity options ──
                const details = document.createElement('details');
                details.className = 'entity-options';
                const summary = document.createElement('summary');
                summary.textContent = this.t('edit_entity');
                details.appendChild(summary);

                const fields = document.createElement('div');
                fields.className = 'fields';

                const nameUnit = document.createElement('div');
                nameUnit.className = 'grid-2';
                nameUnit.appendChild(this._entityTextField(idx, 'name', this.t('name_label'), ent.name));
                nameUnit.appendChild(this._entityTextField(idx, 'unit', this.t('unit_label'), ent.unit));
                fields.appendChild(nameUnit);

                const colorIcon = document.createElement('div');
                colorIcon.className = 'grid-2';
                colorIcon.appendChild(this._entityTextField(idx, 'color', this.t('color_label_optional'), ent.color, '#RRGGBB / var(--…)'));
                colorIcon.appendChild(this._entityTextField(idx, 'icon', this.t('icon_label'), ent.icon, 'mdi:…'));
                fields.appendChild(colorIcon);

                fields.appendChild(this._entitySwitch(idx, 'show_unit', this.t('show_unit'), ent.show_unit !== false));
                fields.appendChild(this._entitySwitch(idx, 'hide_icon', this.t('hide_icon'), ent.hide_icon === true));

                details.appendChild(fields);
                block.appendChild(details);

                root.appendChild(block);
            });

            // Add entity button
            const addRow = document.createElement('div');
            addRow.className = 'add-btn-row';
            const addBtn = document.createElement('mwc-button');
            addBtn.setAttribute('outlined', '');
            addBtn.style.width = '100%';
            addBtn.textContent = this.t('add_entity');
            addBtn.addEventListener('click', () => {
                const newEntities = [
                    ...(this._config.entities || []),
                    { entity: '', name: '', color: '', icon: '', show_unit: true, hide_icon: false }
                ];
                this._config = { ...this._config, entities: newEntities };
                this._fireConfigChanged();
                this._render();
            });
            addRow.appendChild(addBtn);
            root.appendChild(addRow);
        }
    }

    customElements.define('ordered-sliders-card-editor', OrderedSlidersCardEditor);
})();
