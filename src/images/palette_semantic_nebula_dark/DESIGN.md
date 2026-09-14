---
name: Semantic Nebula Dark
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#bbc9cf'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#859399'
  outline-variant: '#3c494e'
  surface-tint: '#47d6ff'
  primary: '#a5e7ff'
  on-primary: '#003543'
  primary-container: '#00d2ff'
  on-primary-container: '#00566a'
  inverse-primary: '#00677f'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#69f6b9'
  on-tertiary: '#003824'
  tertiary-container: '#48d99e'
  on-tertiary-container: '#005b3d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#b6ebff'
  primary-fixed-dim: '#47d6ff'
  on-primary-fixed: '#001f28'
  on-primary-fixed-variant: '#004e60'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1.25rem
  margin-mobile: 0.75rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers a high-tier, cinematic dark-mode experience tailored for high-density semantic data visualization, graph intelligence, and analytical command centers. It balances sleek computational precision with immersive deep-space aesthetic values.

### Character & Philosophy
- **Cinematic Precision**: Grounded in obsidian and cosmic navy depths (`#070B13` to `#0D1322`), the interface makes neon cluster nodes and data paths emerge with natural luminescence without visually fatiguing operators.
- **Utilitarian Clarity**: Text hierarchy, micro-labels, and metric badges prioritize absolute legibility, ensuring dense networks of metadata and vector distances remain legible and strictly delineated.
- **Subtle Modernism**: Surfaces utilize translucent glass outlines (`rgba(255, 255, 255, 0.08)`), low-noise gradients, and crisp 8px rounded corners to communicate enterprise durability and advanced technical craftsmanship.

## Colors

The color palette is engineered for a dark workspace with high-contrast data cues and ambient illumination:

- **Primary (`#00D2FF`)**: Electric cyan used for focused search active states, glowing selected nodes, primary CTA highlights, and vector cluster anchors.
- **Secondary (`#3B82F6`)**: Deep vivid cobalt used for interactive buttons, navigation indicators, secondary active tags, and semantic link threads.
- **Semantic Accents**:
  - **Emerald Green (`#10B981`)**: Online service beacons, positive cosine similarity scores, healthy cluster statuses.
  - **Amber Gold (`#F59E0B`)**: Mid-tier proximity nodes, caution indicators, priority categorization.
  - **Electric Magenta (`#EC4899`)**: Specialty clusters, peripheral topic links, secondary entity highlights.
- **Surface & Background Tokens**:
  - **Base Canvas**: Deep space obsidian `#070B13`.
  - **Card / Panel Surface**: Midnight layered blue `#0D1322`.
  - **Elevated Interactive Tier**: High-contrast dark navy `#151E32`.
  - **Borders & Dividers**: Crisp translucent white `rgba(255, 255, 255, 0.08)` to `rgba(255, 255, 255, 0.14)`.

## Typography

Typography centers exclusively on `Inter`, leveraging its uniform tracking, tall x-height, and open counters to preserve immediate scanability in high-density data views.

- **Headlines**: Semi-bold to bold weights with tight tracking (`-0.01em` to `-0.02em`) reduce visual footprint while providing firm structural section definition.
- **Data & Body**: Kept at standard tracking with generous line-height ratios (`1.35` to `1.45`) to eliminate glyph crowding and text overlapping in compact inspector sidebars.
- **Labels & Micro-data**: Rendered at `10px` to `12px` with uppercase or medium-weight formatting and subtle positive letter-spacing (`0.03em`) for node tags, vector dimensions, and system statuses.

## Layout & Spacing

The layout adopts a multi-tier modular grid engineered for high-density command dashboards, supporting 3-column workspace architectures:

- **Sidebar (Filters & Navigation)**: Fixed width (260px–300px), padded with `space-md` inner margins and `space-sm` item separations.
- **Central Canvas (3D Visualizer & Main Graphs)**: Fluid viewport filling flexible flex/grid columns with integrated floating heads-up display (HUD) controls and edge dock indicators.
- **Inspector Panel (Semantic Results & Detail Views)**: Adaptive drawer/sidebar (320px–380px) with consistent scroll containers and segregated card segments.
- **Breakpoints**:
  - **Desktop (1440px+)**: Full three-column layout active with zero panel collapse.
  - **Tablet (768px - 1439px)**: Left navigation drawer collapses into a floating sidebar; central viewport retains priority with collateral inspector tabs.
  - **Mobile (< 768px)**: Stacked single-column card cascade with sheet-based vector inspection overlays.

## Elevation & Depth

Elevation avoids heavy, muddy drop shadows, relying instead on multi-layered tonal boundaries, glassmorphic refraction, and atmospheric cyan luminescence:

- **Tier 0 (Canvas Background)**: `#070B13`, completely flat, deep spatial substrate.
- **Tier 1 (Surface Cards & Structural Containers)**: `#0D1322` augmented with a crisp `1px solid rgba(255, 255, 255, 0.08)` outline and an ambient shadow: `0 4px 20px -2px rgba(0, 0, 0, 0.5)`.
- **Tier 2 (Popovers, Active Focus Cards & Floating HUDs)**: `#151E32` with a cyan-tinted top highlight `1px solid rgba(0, 210, 255, 0.3)` and soft ambient glow `0 8px 32px 0 rgba(0, 210, 255, 0.08)`.
- **Tier 3 (Active Focus / Selected Clusters)**: Glowing edge-ring `0 0 12px 1px rgba(0, 210, 255, 0.4)` accompanied by backdrop blur `backdrop-filter: blur(12px)` for overlay controls.

## Shapes

The design system standardizes on an engineered `Rounded` shape profile (Base `8px` / `0.5rem` radius) to balance visual warmth and rigorous mechanical structure:

- **Containers & Big Cards**: `12px` to `16px` (`rounded-lg` to `rounded-xl`) for main module frames, graph visualizers, and result groups.
- **Standard Controls & Buttons**: `8px` (`rounded-md`) for search fields, dropdown buttons, action triggers, and mini cluster indicators.
- **Micro Badges & Chips**: Pill-styled `9999px` strictly for status beads, counter chips, and dynamic keyword tags to contrast cleanly against geometric container cards.
- **Posters & Visual Media**: Standardized `2:3` aspect ratio cards with `8px` corner radius, encased in a `1px` translucent boundary with inner inset shadows.

## Components

### Buttons
- **Primary**: Solid gradient background from `#00D2FF` to `#3B82F6`, dark text `#070B13` or crisp white `#FFFFFF`, semi-bold weight, `8px` border radius, subtle hover glow `0 0 16px rgba(0, 210, 255, 0.4)`.
- **Secondary / Ghost**: Background `rgba(255, 255, 255, 0.04)`, border `1px solid rgba(255, 255, 255, 0.1)`, text `#94A3B8`, hover transition with bright cyan border and text `#00D2FF`.

### Search Input & Filters
- **Global Search**: Elevated pill or `8px` rounded shell in `#0D1322`, border `1px solid rgba(255, 255, 255, 0.12)`, text `#FFFFFF`, trailing glowing action button `#00D2FF`.
- **Checkboxes & Radios**: Custom `18px` dark boxes with `4px` corner radius, cyan `#00D2FF` tick states, accompanied by category color dots (e.g., `#10B981`, `#3B82F6`, `#EC4899`) and right-aligned count badges.

### Metric Cards & Results
- **Semantic Result Card**: `#0D1322` base, flex container with left category status bead, bold title, secondary metadata subline, and right-aligned numeric score badge (e.g., similarity `0.92`).
- **Cluster Preview Card**: Features topic icon inside a colored container, bold name, sample pill tags, and dynamic link icons with hover elevation.

### Slider & Proximity Controls
- Sleek dark track `#1E293B`, illuminated cyan filled segment `#00D2FF`, with an illuminated thumb containing an inner white core and cyan outer glow.