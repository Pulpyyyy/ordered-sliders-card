# Ordered Sliders Card for Home Assistant

A custom Lovelace card for Home Assistant that displays multiple `input_number` entities as ordered vertical sliders on a customizable gradient bar.

![Ordered Sliders Card](.img/screenshot.png)

## Features

- 🎨 **Customizable gradient** - Define your own color gradient for the background bar
- 📊 **Ordered constraints** - Sliders maintain order automatically (each slider is constrained by its neighbors)
- 🔓 **Free mode** - Optional mode where sliders can move independently
- 📏 **Grid display** - Visual grid with configurable step values
- 🎯 **Adjustable dimensions** - Customize bar height and slider height independently
- 🌈 **Auto-color detection** - Automatically uses `icon_color` from entities if available
- 🔢 **Unit display** - Show or hide units for each entity
- 🎭 **Icon support** - Display icons for each entity (shown by default)
- 🌍 **Multi-language** - Supports English, French, German, Spanish, and Portuguese
- 🎛️ **Visual editor** - User-friendly configuration interface

## Installation

### HACS (Recommended)

1. Open HACS in your Home Assistant instance
2. Go to "Frontend"
3. Click the three dots menu and select "Custom repositories"
4. Add this repository URL and select "Lovelace" as the category
5. Click "Install"
6. Restart Home Assistant

### Manual Installation

1. Download `ordered-sliders-card.js` from the latest release
2. Copy it to `<config>/www/ordered-sliders-card.js`
3. Add the resource to your Lovelace configuration:

```yaml
resources:
  - url: /local/ordered-sliders-card.js
    type: module
```

4. Restart Home Assistant

## Usage

### Basic Configuration

```yaml
type: custom:ordered-sliders-card
title: Temperature Settings
min: 10
max: 30
step: 0.5
entities:
  - entity: input_number.temp_min
  - entity: input_number.temp_comfort
  - entity: input_number.temp_max
```

### Advanced Configuration

```yaml
type: custom:ordered-sliders-card
title: Temperature Zones
min: 10
max: 30
step: 0.5
height: 20
handle_height: 50
show_grid: true
free_mode: false
gradient:
  - '#2196F3'  # Blue (cold)
  - '#4CAF50'  # Green
  - '#FF9800'  # Orange
  - '#F44336'  # Red (hot)
entities:
  - entity: input_number.temp_away
    name: Away Temperature
    color: '#00aaff'
    icon: 'mdi:home-off'
    show_unit: true
    hide_icon: false  # Icons are shown by default
  - entity: input_number.temp_eco
    name: Eco Temperature
    color: '#22ff00'
  - entity: input_number.temp_comfort
    name: Comfort Temperature
    color: '#ffaa00'
  - entity: input_number.temp_max
    name: Maximum Temperature
    color: '#ff0000'
    hide_icon: true  # Hide icon and show colored square instead
```

## Configuration Options

### Card Options

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `type` | string | **Required** | Must be `custom:ordered-sliders-card` |
| `title` | string | `''` | Card title (optional) |
| `min` | number | `0` | Minimum value |
| `max` | number | `100` | Maximum value |
| `step` | number | `1` | Step value for grid and slider snapping |
| `height` | number | `60` | Height of the gradient bar in pixels |
| `handle_height` | number | `40` | Height of slider handles in pixels |
| `show_grid` | boolean | `true` | Show vertical grid lines |
| `free_mode` | boolean | `false` | Allow sliders to overlap (no ordering constraint) |
| `gradient` | array | `['#ff0000', '#ffff00', '#00ff00']` | Array of color codes for the gradient |
| `entities` | array | **Required** | List of entity configurations |

### Entity Options

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `entity` | string | **Required** | Entity ID (must be `input_number`) |
| `name` | string | Entity's friendly name | Custom display name |
| `color` | string | Auto-generated or from `icon_color` | Custom slider color (hex code) |
| `icon` | string | Entity's icon | Custom icon (e.g., `mdi:thermometer`) |
| `show_unit` | boolean | `true` | Show unit of measurement |
| `hide_icon` | boolean | `false` | Hide icon and show colored square instead |
| `unit` | string | Entity's unit | Override unit display |

## Icon Display Behavior

By default, icons are **shown** for all entities:
- If an entity has an icon (either from its attributes or defined in the config), it will be displayed
- The icon uses the color from `icon_color` attribute or the entity's `color` setting

To **hide** the icon and display a colored square instead:
```yaml
entities:
  - entity: input_number.temp
    hide_icon: true  # Shows colored square instead of icon
```

## How It Works

### Ordered Mode (default: `free_mode: false`)

- Sliders are constrained by their position in the list
- Each slider can only move between its neighbors
- Minimum gap of one `step` between adjacent sliders
- Perfect for temperature zones, priority levels, etc.

**Example:** If you have sliders at 15°, 20°, and 25°:
- The first slider can move from 10° to 19.5° (one step below the second)
- The second slider can move from 15.5° to 24.5°
- The third slider can move from 20.5° to 30°

### Free Mode (`free_mode: true`)

- Sliders can move independently
- No constraints between sliders
- Sliders can overlap or cross each other

## Styling

The card automatically adapts to Home Assistant themes and uses:
- `--primary-color` for UI elements
- `--card-background-color` for backgrounds
- Theme-aware colors for text and borders

## Language Support

The card automatically detects your Home Assistant language setting and displays the UI in:
- 🇬🇧 English (en)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)
- 🇪🇸 Spanish (es)
- 🇵🇹 Portuguese (pt)

## Examples

### Temperature Control

```yaml
type: custom:ordered-sliders-card
title: Heating Zones
min: 12
max: 28
step: 0.5
height: 20
handle_height: 35
gradient:
  - '#2196F3'
  - '#4CAF50'
  - '#FF9800'
  - '#F44336'
entities:
  - entity: input_number.temp_away
    icon: 'mdi:home-export-outline'
  - entity: input_number.temp_eco
    icon: 'mdi:leaf'
  - entity: input_number.temp_comfort
    icon: 'mdi:sofa'
  - entity: input_number.temp_boost
    icon: 'mdi:fire'
```

### Brightness Levels

```yaml
type: custom:ordered-sliders-card
title: Brightness Thresholds
min: 0
max: 100
step: 5
height: 25
handle_height: 40
gradient:
  - '#000000'
  - '#808080'
  - '#FFFFFF'
entities:
  - entity: input_number.brightness_dim
    name: Dim
    icon: 'mdi:brightness-4'
  - entity: input_number.brightness_normal
    name: Normal
    icon: 'mdi:brightness-5'
  - entity: input_number.brightness_bright
    name: Bright
    icon: 'mdi:brightness-7'
```

### Single Slider (Free Mode)

```yaml
type: custom:ordered-sliders-card
title: Target Temperature
min: 0
max: 5
step: 0.5
height: 20
handle_height: 50
free_mode: true
gradient:
  - '#828282'
  - '#800080'
entities:
  - entity: input_number.temperature_offset
    icon: 'mdi:thermometer'
```

### Mixed Display (Icons and Colored Squares)

```yaml
type: custom:ordered-sliders-card
title: Priority Levels
min: 0
max: 100
step: 10
entities:
  - entity: input_number.priority_low
    name: Low
    color: '#4CAF50'
    hide_icon: true  # Shows green square
  - entity: input_number.priority_medium
    name: Medium
    icon: 'mdi:alert'
    color: '#FF9800'
    # Icon shown by default
  - entity: input_number.priority_high
    name: High
    icon: 'mdi:alert-octagon'
    color: '#F44336'
    # Icon shown by default
```

## Troubleshooting

### Sliders don't appear
- Ensure all entities are `input_number` types
- Check that entity IDs are correct
- Verify entities exist in Home Assistant

### Gradients look wrong on multiple cards
- This is fixed in the latest version using Shadow DOM
- Clear browser cache and hard refresh (Ctrl+F5)

### Sliders won't move past each other
- This is intentional in ordered mode
- Set `free_mode: true` to allow overlap
- Check that `step` value allows enough space between sliders

### Grid is not visible
- Increase grid opacity in your theme
- Ensure `show_grid: true`
- Try a larger `step` value

### Icons not showing
- Verify the icon name is correct (e.g., `mdi:thermometer`)
- Check that `hide_icon` is not set to `true`
- Ensure the entity or config has an `icon` attribute defined

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - See LICENSE file for details

---

**Note:** This card requires Home Assistant 2024.1 or later.
