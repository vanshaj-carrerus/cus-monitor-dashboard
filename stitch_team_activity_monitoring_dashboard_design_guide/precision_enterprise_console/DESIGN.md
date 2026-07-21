---
name: Precision Enterprise Console
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-tabular:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  container-margin: 24px
  gutter: 16px
  card-padding: 20px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered for high-density information environments where clarity, authority, and rapid data synthesis are paramount. The brand personality is **Secure, Authoritative, and Efficient**, catering to a professional audience that requires a reliable window into complex system health.

The aesthetic follows a **Corporate / Modern** direction with a focus on functional precision. It prioritizes clarity over decoration, using a structured hierarchy and ample whitespace to prevent cognitive overload. The UI remains unobtrusive, acting as a sophisticated framework for critical data visualizations and real-time monitoring.

## Colors

This design system utilizes a foundation of deep blues and slate grays to establish a professional, "Enterprise SaaS" atmosphere. 

- **Primary & Neutrals**: We use `slate-900` (#0F172A) for high-level navigation and primary headers to ground the interface. `slate-500` (#64748B) serves as the primary neutral for secondary text and icons.
- **Status Accents**: Vibrant colors are reserved strictly for semantic signaling. **Success (Active)** uses a crisp emerald, **Warning (Idle)** uses a warm amber, and **Error (Inactive)** uses a bright coral-red to ensure immediate visual triage.
- **Interactive**: A vibrant blue (#3B82F6) is used for primary actions, links, and selected states to provide clear affordance against the neutral backdrop.

## Typography

**Inter** is the exclusive typeface for this design system, chosen for its exceptional legibility in data-heavy contexts and its neutral, systematic aesthetic.

- **Data Presentation**: For tables and numerical values, the `data-tabular` role must be used. This utilizes OpenType "tabular lining" figures to ensure columns of numbers align perfectly for easy scanning.
- **Labels**: Small uppercase labels are used for secondary metadata and table headers to provide a distinct visual layer from the primary data.
- **Hierarchy**: Headlines use a tighter letter-spacing and heavier weights to maintain a strong presence, while body text uses standard spacing for maximum readability.

## Layout & Spacing

The design system employs a **Fluid Grid** approach based on a 4px baseline shift. This allows for a high-density layout while maintaining structural balance.

- **Grid System**: Use a 12-column grid for desktop views with 16px gutters and 24px outer margins. For tablet (768px+), transition to an 8-column grid. For mobile (<768px), move to a single column with 16px margins.
- **Density**: Components should favor "Compact" spacing for data tables and "Comfortable" spacing for dashboard overview cards.
- **Reflow**: Dashboard widgets should be designed as modular containers that can span 3, 4, 6, or 12 columns depending on the data complexity.

## Elevation & Depth

To maintain a clean and modern professional look, the design system uses **Tonal Layers** combined with **Low-Contrast Outlines**.

- **Surfaces**: The base background is a very light gray (`slate-50`). Secondary surfaces (cards, sidebars) use pure white (#FFFFFF).
- **Outlines**: Every card or container must have a 1px border using a soft slate tint (#E2E8F0).
- **Shadows**: Shadows are used sparingly to indicate interactivity or focus. Primary dashboard cards use a very soft, ambient shadow: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)`. 
- **Elevation Levels**:
    - **Level 0 (Flat)**: Backgrounds, inactive states.
    - **Level 1 (Raised)**: Standard dashboard cards and widgets.
    - **Level 2 (Overlay)**: Tooltips, dropdowns, and fly-out menus.

## Shapes

The shape language is **Soft (0.25rem)**. This provides a modern, approachable feel while maintaining a crisp, architectural structure suitable for an enterprise tool.

- **Standard Elements**: Buttons, input fields, and checkboxes use a 4px corner radius.
- **Large Elements**: Dashboard cards and modal containers use the `rounded-lg` (8px) radius to create a distinct visual container.
- **Status Indicators**: Use fully circular (pill) shapes for status badges and chips to differentiate them from interactive buttons.

## Components

- **Cards**: The primary container for widgets. Should include a consistent header area with a title (Headline-SM) and optional action icons (refresh, expand).
- **Data Tables**: Use subtle row hovering (using `slate-50`). Column headers use `label-caps` typography and include sort icons only on hover or when active.
- **Buttons**:
  - *Primary*: Solid deep blue background with white text.
  - *Secondary*: Slate-100 background with deep blue text.
  - *Ghost*: No background, slate-500 text, appearing only on hover.
- **Status Chips**: Small, pill-shaped badges. Use a light tinted background (10% opacity of the status color) with high-contrast text for maximum legibility.
- **Input Fields**: 1px slate-300 borders that transition to blue-500 on focus. Labels should be positioned above the field using `body-md` bold.
- **Charts**: Use thin 2px lines for line charts with no area fill to keep the data clean. Bar charts should use the primary blue or semantic status colors for specific categories.
- **Navigation Sidebar**: A dark-themed sidebar using `slate-900` background to provide high contrast against the main content area, featuring icons for primary modules.