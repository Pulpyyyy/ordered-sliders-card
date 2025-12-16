// Translations for ordered sliders card
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
    show_icon: "Show Icon",
    save: "Save",
    cancel: "Cancel",
    no_entities: "No entities",
    yes: "Yes",
    no: "No"
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
    show_icon: "Afficher l'icône",
    save: "Enregistrer",
    cancel: "Annuler",
    no_entities: "Aucune entité",
    yes: "Oui",
    no: "Non"
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
    show_icon: "Symbol anzeigen",
    save: "Speichern",
    cancel: "Abbrechen",
    no_entities: "Keine Entitäten",
    yes: "Ja",
    no: "Nein"
  },
  es: {
    card_title: "Deslizadores Ordenados",
    min_label: "Mín",
    max_label: "Máx",
    step_label: "Paso",
    bar_height_label: "Altura barra",
    handle_height_label: "Altura cursores",
    show_grid_label: "Mostrar cuadrícula",
    free_mode_label: "Modo libre",
    gradient_label: "Degradado de colores",
    entities_label: "Entidades (input_number)",
    add_entity: "Añadir entidad",
    add_color: "Añadir color",
    color_label: "Color",
    remove: "Eliminar",
    edit_entity: "Editar entidad",
    entity_id_label: "ID de entidad",
    name_label: "Nombre (opcional)",
    color_label_optional: "Color (opcional)",
    icon_label: "Icono (opcional)",
    show_unit: "Mostrar unidad",
    show_icon: "Mostrar icono",
    save: "Guardar",
    cancel: "Cancelar",
    no_entities: "Sin entidades",
    yes: "Sí",
    no: "No"
  },
  pt: {
    card_title: "Controles Deslizantes Ordenados",
    min_label: "Mín",
    max_label: "Máx",
    step_label: "Passo",
    bar_height_label: "Altura da barra",
    handle_height_label: "Altura dos controles",
    show_grid_label: "Mostrar grade",
    free_mode_label: "Modo livre",
    gradient_label: "Gradiente de cores",
    entities_label: "Entidades (input_number)",
    add_entity: "Adicionar entidade",
    add_color: "Adicionar cor",
    color_label: "Cor",
    remove: "Remover",
    edit_entity: "Editar entidade",
    entity_id_label: "ID da entidade",
    name_label: "Nome (opcional)",
    color_label_optional: "Cor (opcional)",
    icon_label: "Ícone (opcional)",
    show_unit: "Mostrar unidade",
    show_icon: "Mostrar ícone",
    save: "Salvar",
    cancel: "Cancelar",
    no_entities: "Sem entidades",
    yes: "Sim",
    no: "Não"
  }
};

class OrderedSlidersCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entities || !Array.isArray(config.entities)) {
      throw new Error('Vous devez définir des entités');
    }
    
    this.config = {
      min: config.min || 0,
      max: config.max || 100,
      step: config.step || 1,
      height: config.height || 60,
      handle_height: config.handle_height || 40,
      gradient: config.gradient || ['#ff0000', '#ffff00', '#00ff00'],
      entities: config.entities,
      title: config.title || '',
      show_grid: config.show_grid !== false,
      free_mode: config.free_mode || false
    };
    
    // Utiliser le shadowRoot pour isoler complètement chaque instance
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .card-content { padding: 16px; }
        #title { 
          font-size: 24px; 
          font-weight: 500; 
          margin-bottom: 12px;
        }
        #title:empty {
          display: none;
          margin: 0;
        }
        #slider-wrapper {
          position: relative;
          margin: 16px 0 12px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #grid-canvas {
          position: absolute;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          pointer-events: none;
          z-index: 1;
          width: 100%;
        }
        #slider-container { 
          position: relative;
          background: linear-gradient(to right, ${this.config.gradient.join(', ')});
          border-radius: 8px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
          z-index: 5;
        }
        .slider-handle {
          position: absolute;
          top: 50%;
          width: 4px;
          transform: translate(-50%, -50%);
          cursor: ew-resize;
          background-color: currentColor;
          box-shadow: 0 0 8px rgba(0,0,0,0.4), 0 0 0 2px white;
          z-index: 10;
          transition: box-shadow 0.2s, width 0.2s;
        }
        .slider-handle:hover { 
          box-shadow: 0 0 12px rgba(0,0,0,0.6), 0 0 0 3px white;
          width: 6px;
        }
        .slider-handle:active { 
          cursor: grabbing;
          box-shadow: 0 0 16px rgba(0,0,0,0.8), 0 0 0 3px white;
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
        .detail-icon ha-icon {
          --mdc-icon-size: 24px;
        }
        .detail-color {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          margin-right: 12px;
          border: 2px solid white;
        }
        .detail-name { flex: 1; font-weight: 500; }
        .detail-value { 
          font-weight: 700; 
          padding: 4px 12px; 
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
        }
      </style>
      <ha-card>
        <div class="card-content">
          <div id="title"></div>
          <div id="slider-wrapper">
            <canvas id="grid-canvas"></canvas>
            <div id="slider-container"></div>
          </div>
          <div id="details"></div>
        </div>
      </ha-card>
    `;
  }

  set hass(hass) {
    this._hass = hass;
    this.updateCard();
  }

  updateCard() {
    if (!this._hass || !this.config) return;

    const titleEl = this.shadowRoot.querySelector('#title');
    if (this.config.title) {
      titleEl.textContent = this.config.title;
    } else {
      titleEl.textContent = '';
    }

    const sliderContainer = this.shadowRoot.querySelector('#slider-container');
    const detailsContainer = this.shadowRoot.querySelector('#details');
    const canvas = this.shadowRoot.querySelector('#grid-canvas');
    const wrapper = this.shadowRoot.querySelector('#slider-wrapper');
    
    // Adjust spacing based on title presence
    if (this.config.title) {
      wrapper.style.marginTop = '16px';
    } else {
      wrapper.style.marginTop = '8px';
    }
    
    // Add space for grid and labels to overflow
    const maxHeight = Math.max(this.config.height, this.config.handle_height) + 30;
    wrapper.style.height = maxHeight + 'px';
    wrapper.style.paddingTop = '20px';
    
    sliderContainer.style.height = this.config.height + 'px';
    sliderContainer.style.width = '100%';
    
    // Forcer le canvas à se redessiner après le rendu
    requestAnimationFrame(() => {
      if (this.config.show_grid) {
        this.drawGrid(canvas);
      }
    });
    
    sliderContainer.innerHTML = '';
    detailsContainer.innerHTML = '';

    this.config.entities.forEach((entityConfig, index) => {
      const entity = this._hass.states[entityConfig.entity];
      if (!entity) return;

      const value = parseFloat(entity.state);
      const name = entityConfig.name || entity.attributes.friendly_name || entityConfig.entity;
      
      const color = entity.attributes.icon_color || entityConfig.color || '#ffffff';
      
      const showUnit = entityConfig.show_unit !== false;
      const showIcon = entityConfig.show_icon !== false;
      
      const icon = entity.attributes.icon || entityConfig.icon || '';
      const iconColor = entity.attributes.icon_color || entityConfig.icon_color || color;
      
      let unit = '';
      if (showUnit && entity.attributes) {
        unit = entity.attributes.unit_of_measurement || 
               entity.attributes.unit || 
               entityConfig.unit || 
               '';
      }
      
      const displayValue = unit ? `${value.toFixed(1)} ${unit}` : value.toFixed(1);

      const handle = document.createElement('div');
      handle.className = 'slider-handle';
      handle.style.color = color;
      handle.style.height = this.config.handle_height + 'px';
      handle.style.left = this.valueToPercent(value) + '%';
      handle.dataset.entity = entityConfig.entity;
      handle.dataset.index = index;

      this.addDragBehavior(handle, index);

      sliderContainer.appendChild(handle);

      const detailRow = document.createElement('div');
      detailRow.className = 'detail-row';
      
      let iconHtml = '';
      if (showIcon && icon) {
        iconHtml = `<div class="detail-icon"><ha-icon icon="${icon}" style="color: ${iconColor};"></ha-icon></div>`;
      }
      
      detailRow.innerHTML = `
        ${iconHtml}
        <div class="detail-color" style="background-color: ${color};"></div>
        <div class="detail-name">${name}</div>
        <div class="detail-value">${displayValue}</div>
      `;
      detailsContainer.appendChild(detailRow);
    });
  }

  drawGrid(canvas) {
    const container = this.shadowRoot.querySelector('#slider-container');
    const rect = container.getBoundingClientRect();
    
    // Canvas exactement de la même largeur que la barre
    canvas.width = rect.width;
    canvas.height = this.config.height + 20;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const { min, max, step } = this.config;
    const range = max - min;
    const numSteps = Math.floor(range / step);
    
    // Lignes de grille discrètes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= numSteps; i++) {
      const value = min + (i * step);
      const x = (value - min) / range * canvas.width;
      
      // Ligne simple sans dépassement
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, canvas.height - 10);
      ctx.stroke();
    }
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
    return Math.round((value - min) / step) * step + min;
  }

  getConstraints(index) {
    let minValue = this.config.min;
    let maxValue = this.config.max;

    // Si le mode libre est activé, pas de contraintes entre curseurs
    if (this.config.free_mode) {
      return { minValue, maxValue };
    }

    if (index < this.config.entities.length - 1) {
      const nextEntity = this._hass.states[this.config.entities[index + 1].entity];
      if (nextEntity) {
        // Le curseur doit être au moins un pas en dessous du suivant
        maxValue = parseFloat(nextEntity.state) - this.config.step;
      }
    }

    if (index > 0) {
      const prevEntity = this._hass.states[this.config.entities[index - 1].entity];
      if (prevEntity) {
        // Le curseur doit être au moins un pas au-dessus du précédent
        minValue = parseFloat(prevEntity.state) + this.config.step;
      }
    }

    return { minValue, maxValue };
  }

  addDragBehavior(handle, index) {
    let isDragging = false;
    const container = this.shadowRoot.querySelector('#slider-container');

    const updateValue = (clientX) => {
      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = (x / rect.width) * 100;
      let newValue = this.percentToValue(percent);

      newValue = this.snapToStep(newValue);

      const { minValue, maxValue } = this.getConstraints(index);
      newValue = Math.max(minValue, Math.min(maxValue, newValue));

      handle.style.left = this.valueToPercent(newValue) + '%';

      this._hass.callService('input_number', 'set_value', {
        entity_id: handle.dataset.entity,
        value: newValue
      });
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      updateValue(e.clientX);
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    handle.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isDragging = true;
    });

    const onTouchMove = (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      updateValue(touch.clientX);
    };

    const onTouchEnd = () => {
      isDragging = false;
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  }

  getCardSize() {
    return 3;
  }

  static getConfigElement() {
    return document.createElement('ordered-sliders-card-editor');
  }

  static getStubConfig() {
    return {
      title: 'Curseurs Ordonnés',
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
}

class OrderedSlidersCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._originalConfig = {};
    this._hass = null;
  }

  getLanguage() {
    if (this._hass?.locale?.language) {
      return TRANSLATIONS[this._hass.locale.language] ? this._hass.locale.language : 'en';
    }
    return 'en';
  }

  t(key) {
    const lang = this.getLanguage();
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
  }

  setConfig(config) {
    // Conserver l'ordre original du YAML
    this._config = config;
    
    // Copier la config originale pour tracer ce qui était déjà là
    if (!this._originalConfig || Object.keys(this._originalConfig).length === 0) {
      this._originalConfig = {};
      for (const key in config) {
        if (config.hasOwnProperty(key)) {
          this._originalConfig[key] = config[key];
        }
      }
    }
    
    // Ajouter les valeurs par défaut seulement si elles n'existent pas
    if (this._config.show_grid === undefined) {
      this._config.show_grid = true;
    }
    if (this._config.free_mode === undefined) {
      this._config.free_mode = false;
    }
    if (!this._config.gradient) {
      this._config.gradient = ['#2196F3', '#4CAF50', '#FF9800', '#F44336'];
    }
    if (!this._config.entities) {
      this._config.entities = [];
    }
    
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  fireConfigChanged(immediate = false) {
    // Créer une copie propre sans réorganiser les clés
    const cleanConfig = {};
    
    // Copier dans l'ordre original
    for (const key in this._config) {
      if (this._config.hasOwnProperty(key)) {
        cleanConfig[key] = this._config[key];
      }
    }
    
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: cleanConfig }
    }));
  }

  render() {
    const t = this.t.bind(this);
    const style = `
      :host { display: block; }
      .config-row { margin-bottom: 15px; }
      .config-row label { font-weight: bold; display: block; margin-bottom: 5px; }
      .config-row input, .config-row select { 
        width: 100%; padding: 8px; border: 1px solid var(--divider-color); 
        border-radius: 4px; background: var(--primary-background-color); 
        color: var(--primary-text-color); box-sizing: border-box; 
      }
      .number-input { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .gradient-section { margin: 15px 0; padding: 15px; background: var(--secondary-background-color); border-radius: 4px; }
      .gradient-colors { display: flex; flex-direction: column; gap: 8px; }
      .gradient-item { display: flex; align-items: center; gap: 8px; }
      .gradient-item input[type="color"] { width: 60px; height: 36px; border: none; border-radius: 4px; cursor: pointer; }
      .gradient-item button { padding: 6px 12px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; }
      .add-gradient-btn { margin-top: 10px; padding: 8px; width: 100%; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; }
      .entity-list { border: 1px solid var(--divider-color); border-radius: 4px; margin-bottom: 10px; }
      .entity-row { display: flex; align-items: center; padding: 10px; border-bottom: 1px solid var(--divider-color); gap: 10px; }
      .entity-row:last-child { border-bottom: none; }
      .entity-name { flex: 1; display: flex; align-items: center; gap: 8px; }
      .entity-name ha-icon { color: var(--primary-color); }
      .entity-actions { display: flex; gap: 5px; }
      .entity-actions button { background: none; border: none; cursor: pointer; padding: 4px; color: var(--primary-text-color); }
      .entity-actions button:hover { color: var(--primary-color); }
      .entity-form { background: var(--secondary-background-color); padding: 15px; border-radius: 4px; margin-top: 10px; }
      .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
      .form-row label { display: block; font-size: 12px; margin-bottom: 3px; font-weight: 600; }
      .form-row input, .form-row select { 
        width: 100%; padding: 6px; border: 1px solid var(--divider-color); 
        border-radius: 3px; background: var(--primary-background-color); 
        color: var(--primary-text-color); box-sizing: border-box; 
      }
      .checkbox-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
      .add-entity-btn { margin-top: 10px; width: 100%; padding: 10px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
    `;

    const gradientHtml = this._config.gradient.map((color, i) => `
      <div class="gradient-item">
        <input type="color" value="${color}" data-gradient-index="${i}">
        <span>${t('color_label')} ${i + 1}</span>
        ${this._config.gradient.length > 2 ? `<button data-remove-gradient="${i}">${t('remove')}</button>` : ''}
      </div>
    `).join('');

    const entitiesHtml = this._config.entities.length > 0 ? this._config.entities.map((entity, i) => {
      const entityState = this._hass?.states?.[entity.entity];
      const name = entity.name || entityState?.attributes?.friendly_name || entity.entity;
      const icon = entity.icon || entityState?.attributes?.icon || 'mdi:thermometer';
      
      return `
        <div class="entity-row">
          <div class="entity-name">
            <ha-icon icon="${icon}"></ha-icon>
            <span>${name}</span>
          </div>
          <div class="entity-actions">
            <button data-edit="${i}" title="Modifier"><ha-icon icon="mdi:pencil"></ha-icon></button>
            <button data-remove="${i}" title="Supprimer"><ha-icon icon="mdi:delete"></ha-icon></button>
          </div>
        </div>
      `;
    }).join('') : '<div style="padding: 10px; text-align: center; color: var(--secondary-text-color);">Aucune entité</div>';

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="config-row">
        <label>${t('card_title')}</label>
        <input id="title" value="${this._config.title || ''}" placeholder="${t('card_title')}">
      </div>

      <div class="config-row">
        <label>${t('min_label')} / ${t('max_label')} / ${t('step_label')}</label>
        <div class="number-input">
          <div>
            <label style="font-size: 11px;">${t('min_label')}</label>
            <input type="number" id="min" value="${this._config.min || 0}">
          </div>
          <div>
            <label style="font-size: 11px;">${t('max_label')}</label>
            <input type="number" id="max" value="${this._config.max || 100}">
          </div>
          <div>
            <label style="font-size: 11px;">${t('step_label')}</label>
            <input type="number" id="step" value="${this._config.step || 1}" step="0.1">
          </div>
        </div>
      </div>

      <div class="config-row">
        <label>${t('bar_height_label')} / ${t('handle_height_label')}</label>
        <div class="number-input">
          <div>
            <label style="font-size: 11px;">${t('bar_height_label')}</label>
            <input type="number" id="height" value="${this._config.height || 20}">
          </div>
          <div>
            <label style="font-size: 11px;">${t('handle_height_label')}</label>
            <input type="number" id="handle_height" value="${this._config.handle_height || 50}">
          </div>
          <div style="display: flex; flex-direction: column; gap: 5px;">
            <div>
              <label style="font-size: 11px;">${t('show_grid_label')}</label>
              <select id="show_grid">
                <option value="true" ${this._config.show_grid !== false ? 'selected' : ''}>${t('yes')}</option>
                <option value="false" ${this._config.show_grid === false ? 'selected' : ''}>${t('no')}</option>
              </select>
            </div>
            <div>
              <label style="font-size: 11px;">${t('free_mode_label')}</label>
              <select id="free_mode">
                <option value="false" ${!this._config.free_mode ? 'selected' : ''}>${t('no')}</option>
                <option value="true" ${this._config.free_mode ? 'selected' : ''}>${t('yes')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="gradient-section">
        <label style="font-weight: bold; margin-bottom: 10px; display: block;">${t('gradient_label')}</label>
        <div class="gradient-colors" id="gradient-colors">${gradientHtml}</div>
        <button class="add-gradient-btn" id="add-gradient">+ ${t('add_color')}</button>
      </div>

      <div class="config-row">
        <label>${t('entities_label')}</label>
        <div class="entity-list" id="entity-list">${entitiesHtml}</div>
        <button class="add-entity-btn" id="add-entity">+ ${t('add_entity')}</button>
      </div>

      <div id="entity-form-container"></div>
    `;

    this.attachListeners();
  }

  attachListeners() {
    // Titre - mise à jour à la perte de focus
    const titleInput = this.shadowRoot.querySelector('#title');
    titleInput?.addEventListener('blur', (e) => {
      this._config.title = e.target.value;
      this.fireConfigChanged(true);
    });

    // Champs numériques - mise à jour à la perte de focus
    ['min', 'max', 'step', 'height', 'handle_height'].forEach(field => {
      const input = this.shadowRoot.querySelector(`#${field}`);
      input?.addEventListener('blur', (e) => {
        this._config[field] = parseFloat(e.target.value);
        this.fireConfigChanged(true);
      });
    });

    this.shadowRoot.querySelector('#show_grid')?.addEventListener('change', (e) => {
      this._config.show_grid = e.target.value === 'true';
      this.fireConfigChanged(true);
    });

    this.shadowRoot.querySelectorAll('input[data-gradient-index]').forEach(input => {
      input.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.gradientIndex);
        this._config.gradient[index] = e.target.value;
        this.fireConfigChanged(true);
      });
    });

    this.shadowRoot.querySelectorAll('[data-remove-gradient]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.removeGradient);
        this._config.gradient.splice(index, 1);
        this.fireConfigChanged(true);
        this.render();
      });
    });

    this.shadowRoot.querySelector('#add-gradient')?.addEventListener('click', () => {
      this._config.gradient.push('#ffffff');
      this.fireConfigChanged(true);
      this.render();
    });

    this.shadowRoot.querySelector('#add-entity')?.addEventListener('click', () => {
      this._config.entities.push({ entity: '', name: '', color: '', icon: '' });
      this.fireConfigChanged(true);
      this.render();
    });

    this.shadowRoot.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.edit);
        this.showEntityForm(index);
      });
    });

    this.shadowRoot.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.remove);
        this._config.entities.splice(index, 1);
        this.fireConfigChanged(true);
        this.render();
      });
    });
  }

  showEntityForm(index) {
    const t = this.t.bind(this);
    const entity = this._config.entities[index];
    const container = this.shadowRoot.querySelector('#entity-form-container');
    
    container.innerHTML = `
      <div class="entity-form">
        <h3 style="margin-top: 0;">${t('edit_entity')}</h3>
        <div class="form-row">
          <div>
            <label>${t('entity_id_label')}</label>
            <input type="text" id="form-entity" value="${entity.entity || ''}" placeholder="input_number.exemple">
          </div>
          <div>
            <label>${t('name_label')}</label>
            <input type="text" id="form-name" value="${entity.name || ''}" placeholder="${t('name_label')}">
          </div>
        </div>
        <div class="form-row">
          <div>
            <label>${t('color_label_optional')}</label>
            <input type="color" id="form-color" value="${entity.color || '#ffffff'}">
          </div>
          <div>
            <label>${t('icon_label')}</label>
            <input type="text" id="form-icon" value="${entity.icon || ''}" placeholder="mdi:thermometer">
          </div>
        </div>
        <div class="form-row">
          <div class="checkbox-row">
            <input type="checkbox" id="form-show-unit" ${entity.show_unit !== false ? 'checked' : ''}>
            <label for="form-show-unit">${t('show_unit')}</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="form-show-icon" ${entity.show_icon !== false ? 'checked' : ''}>
            <label for="form-show-icon">${t('show_icon')}</label>
          </div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 15px;">
          <button id="save-entity" style="flex: 1; padding: 10px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">${t('save')}</button>
          <button id="cancel-entity" style="flex: 1; padding: 10px; background: var(--secondary-background-color); color: var(--primary-text-color); border: 1px solid var(--divider-color); border-radius: 4px; cursor: pointer;">${t('cancel')}</button>
        </div>
      </div>
    `;

    // Listeners pour les champs du formulaire - mise à jour à la perte de focus
    const entityInput = this.shadowRoot.querySelector('#form-entity');
    const nameInput = this.shadowRoot.querySelector('#form-name');
    const colorInput = this.shadowRoot.querySelector('#form-color');
    const iconInput = this.shadowRoot.querySelector('#form-icon');
    const showUnitInput = this.shadowRoot.querySelector('#form-show-unit');
    const showIconInput = this.shadowRoot.querySelector('#form-show-icon');

    entityInput?.addEventListener('blur', (e) => {
      this._config.entities[index].entity = e.target.value;
      this.fireConfigChanged(true);
    });

    nameInput?.addEventListener('blur', (e) => {
      this._config.entities[index].name = e.target.value;
      this.fireConfigChanged(true);
    });

    colorInput?.addEventListener('change', (e) => {
      this._config.entities[index].color = e.target.value;
      this.fireConfigChanged(true);
    });

    iconInput?.addEventListener('blur', (e) => {
      this._config.entities[index].icon = e.target.value;
      this.fireConfigChanged(true);
    });

    showUnitInput?.addEventListener('change', (e) => {
      this._config.entities[index].show_unit = e.target.checked;
      this.fireConfigChanged(true);
    });

    showIconInput?.addEventListener('change', (e) => {
      this._config.entities[index].show_icon = e.target.checked;
      this.fireConfigChanged(true);
    });

    this.shadowRoot.querySelector('#save-entity').addEventListener('click', () => {
      container.innerHTML = '';
      this.fireConfigChanged(true);
      this.render();
    });

    this.shadowRoot.querySelector('#cancel-entity').addEventListener('click', () => {
      container.innerHTML = '';
    });
  }
}

customElements.define('ordered-sliders-card', OrderedSlidersCard);
customElements.define('ordered-sliders-card-editor', OrderedSlidersCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'ordered-sliders-card',
  name: 'Ordered Sliders Card',
  description: 'Curseurs verticaux ordonnés avec grille'
});