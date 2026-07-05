# Design System Specification

## Typography

### Font Stack
- **Display/Headlines:** `Outfit` or `Inter` (modern sans-serif)
- **Body/Text:** `Geist` or `Inter` (neutral, readable, technical-friendly)
- **Monospace (code):** `Fira Code` or `Monaco`

### Typography Scale

```css
/* Display Sizes */
h1 {
  font-size: 48-56px;
  font-weight: 600-700;
  line-height: 1.2;
  letter-spacing: -0.5px;
}

h2 {
  font-size: 36-44px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.25px;
}

h3 {
  font-size: 28-32px;
  font-weight: 600;
  line-height: 1.4;
}

h4 {
  font-size: 20-24px;
  font-weight: 600;
  line-height: 1.4;
}

h5 {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.5;
}

h6 {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
}

/* Body Sizes */
.text-lg {
  font-size: 18px;
  font-weight: 400;
  line-height: 1.6;
}

.text-base {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
}

.text-sm {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
}

.text-xs {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
}

/* UI/Label Sizes */
.label {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.button {
  font-size: 14-16px;
  font-weight: 600;
  line-height: 1.5;
}
```

---

## Color Palette

### Primary Colors

```css
/* Neutral/Background */
:root {
  --white: #FFFFFF;
  --light-gray: #F8F9FA;
  --light-gray-alt: #F3F5F7;
  --gray-200: #E8EAF0;
  --gray-400: #CCCCCC;
  --gray-600: #8B8B8B;
  --gray-800: #5B6572;
  --dark-gray: #2A3140;
  --black: #0F1419;
}

/* Brand Primary (Warm Professional Blue or Teal) */
:root {
  /* Option A: Warm Blue */
  --brand-primary: #0E6BA0;
  --brand-primary-light: #4A9FD8;
  --brand-primary-dark: #084C6F;
  
  /* Option B: Warm Teal (alternative) */
  /* --brand-primary: #0D7C5C;
  --brand-primary-light: #4DAAA0;
  --brand-primary-dark: #075540; */
}

/* Semantic Colors */
:root {
  --success: #27AE60;
  --success-light: #7FD9A8;
  --success-dark: #1B7F42;
  
  --warning: #F59E0B;
  --warning-light: #FCD34D;
  --warning-dark: #D97706;
  
  --error: #E74C3C;
  --error-light: #EE9394;
  --error-dark: #B42621;
  
  --info: #5B6572;
  --info-light: #8B8B8B;
  --info-dark: #2A3140;
}

/* Text Colors */
:root {
  --text-primary: #1A2332;
  --text-secondary: #5B6572;
  --text-tertiary: #8B8B8B;
  --text-on-brand: #FFFFFF;
}

/* Border Colors */
:root {
  --border-light: #E0E0E0;
  --border-medium: #CCCCCC;
  --border-dark: #8B8B8B;
}
```

### Dark Mode (If Supported)

```css
@media (prefers-color-scheme: dark) {
  :root {
    --white: #0F1419;
    --light-gray: #1A1F2E;
    --light-gray-alt: #202936;
    --gray-200: #2A3140;
    --gray-400: #5B6572;
    --gray-600: #8B8B8B;
    --gray-800: #CCCCCC;
    --dark-gray: #E8EAF0;
    --black: #FFFFFF;
    
    --text-primary: #E8E8E8;
    --text-secondary: #B0B0B0;
    --text-tertiary: #8B8B8B;
    
    --brand-primary: #4A9FD8; /* Lighter version for contrast */
    --border-light: #5B6572;
  }
}
```

---

## Spacing System

### Base Unit: 8px

```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  --space-4xl: 80px;
  --space-5xl: 96px;
}
```

### Component-Level Spacing

```css
/* Section Spacing (vertical margins) */
.section {
  margin-top: var(--space-2xl);     /* 48px */
  margin-bottom: var(--space-2xl);  /* 48px */
}

@media (min-width: 768px) {
  .section {
    margin-top: var(--space-3xl);    /* 64px */
    margin-bottom: var(--space-3xl); /* 64px */
  }
}

/* Card Padding */
.card {
  padding: var(--space-lg); /* 24px */
}

/* Button Padding */
.button {
  padding: var(--space-md) var(--space-lg); /* 16px 24px */
  min-height: 44px; /* Mobile-accessible */
}

/* Input Padding */
input, textarea, select {
  padding: 10px var(--space-md); /* 10px 16px */
  min-height: 44px; /* Mobile-accessible */
}

/* Hero Section Padding */
.hero {
  padding-top: var(--space-3xl);    /* 64px */
  padding-bottom: var(--space-3xl); /* 64px */
}

@media (min-width: 768px) {
  .hero {
    padding-top: var(--space-4xl);    /* 80px */
    padding-bottom: var(--space-4xl); /* 80px */
  }
}
```

---

## Border Radius

```css
:root {
  --rounded-none: 0px;
  --rounded-sm: 4px;
  --rounded-md: 8px;
  --rounded-lg: 12px;
  --rounded-full: 9999px;
}
```

### Usage
- `--rounded-none`: Structured layouts, tables
- `--rounded-sm`: Form inputs, small components
- `--rounded-md`: Cards, buttons, containers
- `--rounded-lg`: Large cards, modals
- `--rounded-full`: Avatars, badges, pills

---

## Shadows

```css
:root {
  --shadow-none: none;
  --shadow-subtle: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-light: 0 2px 4px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.10);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.15);
}
```

### Usage
- `--shadow-subtle`: Hover states on elements
- `--shadow-light`: Cards, buttons on hover
- `--shadow-md`: Medium elevation (cards default)
- `--shadow-lg`: Deep elevation (modals, floating elements)
- `--shadow-xl`: Highest elevation (overlays, emphasis)

---

## Button Styles

### Primary Button
```css
.button-primary {
  background-color: var(--brand-primary);
  color: var(--text-on-brand);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--rounded-md);
  font-weight: 600;
  font-size: 14-16px;
  min-height: 44px;
  border: none;
  cursor: pointer;
  transition: all 200ms ease-in-out;
}

.button-primary:hover {
  background-color: darken(var(--brand-primary), 10%);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.button-primary:active {
  background-color: darken(var(--brand-primary), 20%);
  transform: translateY(0);
}

.button-primary:disabled {
  background-color: var(--gray-400);
  cursor: not-allowed;
  opacity: 0.6;
}
```

### Secondary Button
```css
.button-secondary {
  background-color: var(--light-gray);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--rounded-md);
  font-weight: 600;
  font-size: 14-16px;
  min-height: 44px;
  cursor: pointer;
  transition: all 200ms ease-in-out;
}

.button-secondary:hover {
  border-color: var(--border-medium);
  background-color: var(--white);
  box-shadow: var(--shadow-light);
}

.button-secondary:active {
  border-color: var(--border-dark);
}
```

### Ghost/Text Button
```css
.button-ghost {
  background-color: transparent;
  color: var(--brand-primary);
  border: none;
  padding: var(--space-sm) var(--space-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease-in-out;
}

.button-ghost:hover {
  background-color: var(--light-gray);
  text-decoration: underline;
}
```

---

## Card Styles

### Standard Card
```css
.card {
  background-color: var(--white);
  border: none;
  border-radius: var(--rounded-md);
  padding: var(--space-lg);
  box-shadow: var(--shadow-light);
  transition: all 300ms ease-in-out;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### Bordered Card
```css
.card-bordered {
  background-color: var(--white);
  border: 1px solid var(--border-light);
  border-radius: var(--rounded-md);
  padding: var(--space-lg);
  box-shadow: var(--shadow-subtle);
}
```

---

## Form Elements

### Input/Textarea
```css
input, textarea, select {
  background-color: var(--white);
  border: 1px solid var(--border-light);
  border-radius: var(--rounded-sm);
  padding: 10px var(--space-md);
  font-family: inherit;
  font-size: 16px;
  min-height: 44px;
  transition: all 200ms ease-in-out;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 3px rgba(14, 107, 160, 0.1);
}

input::placeholder, textarea::placeholder {
  color: var(--text-tertiary);
}
```

### Label
```css
label {
  display: block;
  margin-bottom: var(--space-sm);
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}
```

---

## Links

```css
a {
  color: var(--brand-primary);
  text-decoration: none;
  transition: all 200ms ease-in-out;
}

a:hover {
  text-decoration: underline;
  color: darken(var(--brand-primary), 10%);
}

a:visited {
  color: #6B4BA0; /* Purple-tinted */
}

a:focus {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}
```

---

## Accessibility

### Color Contrast
- Text on background: **4.5:1 minimum** (WCAG AA)
- UI components: **3:1 minimum** (WCAG AA)
- Test with WebAIM Contrast Checker

### Focus States
- Visible focus outline on all interactive elements
- Minimum 2px outline width
- Outline color: brand primary or high-contrast alternative

### Touch Targets
- Minimum 44x44px (mobile)
- Minimum 40x40px (desktop)

### Semantic HTML
- Use `<button>` for buttons (not `<div>`)
- Use `<a>` for links (not `<button>`)
- Use heading hierarchy (h1, h2, h3)
- Use `<label>` for form inputs

### ARIA Labels
- Form inputs: associated `<label>` or `aria-label`
- Buttons: clear text or `aria-label`
- Images: `alt` text descriptive
- Icons: `aria-hidden="true"` if decorative, or `aria-label` if functional

---

## Motion & Transitions

### Timing
- Quick interactions: 200ms (buttons, hover states)
- Medium transitions: 300-400ms (slides, fades, layout shifts)
- Slow animations: 600-800ms (hero entrance, scroll reveals)

### Easing
- Quick: `ease-in-out` (200ms)
- Medium: `ease-out` (300-400ms)
- Slow: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (smooth entrance)

### What to Animate
✓ Button hover, focus, active states
✓ Link underlines, color changes
✓ Card shadows and lift on hover
✓ Form input focus glow
✓ Section fade-in on scroll (if Intersection Observer)
✓ Modal entrance/exit

### Respect prefers-reduced-motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Light/Dark Mode

### Implementation
- Use CSS `@media (prefers-color-scheme: dark)` as primary signal
- Override with `[data-theme="light"]` or `[data-theme="dark"]` on root
- Provide user toggle button (optional)

### Recommendation
- **Default to Light Mode** for initial release
- **Add Dark Mode Support** if design is validated
- **Test both modes** for accessibility and contrast

---

## Responsive Design Breakpoints

```css
:root {
  --mobile: 320px;
  --sm: 640px;
  --md: 768px;
  --lg: 1024px;
  --xl: 1280px;
  --2xl: 1536px;
}
```

### Grid System
- Mobile-first: Base styles for mobile, enhance for larger screens
- Max-width container: 1200-1400px on desktop
- Padding/margin responsive: 16px mobile, 32-48px desktop

### Typical Breakpoints in Use
- **Mobile (320px-767px):** Single column, full-width, touch-friendly
- **Tablet (768px-1023px):** 2 columns, responsive padding
- **Desktop (1024px+):** 3+ columns, max-width container, generous spacing

---

## CSS Custom Properties for Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      white: '#FFFFFF',
      'light-gray': '#F8F9FA',
      'light-gray-alt': '#F3F5F7',
      gray: {
        200: '#E8EAF0',
        400: '#CCCCCC',
        600: '#8B8B8B',
        800: '#5B6572',
      },
      'dark-gray': '#2A3140',
      black: '#0F1419',
      brand: {
        primary: '#0E6BA0',
        'primary-light': '#4A9FD8',
        'primary-dark': '#084C6F',
      },
      success: '#27AE60',
      warning: '#F59E0B',
      error: '#E74C3C',
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      '2xl': '48px',
      '3xl': '64px',
      '4xl': '80px',
      '5xl': '96px',
    },
    borderRadius: {
      none: '0px',
      sm: '4px',
      md: '8px',
      lg: '12px',
      full: '9999px',
    },
    boxShadow: {
      none: 'none',
      subtle: '0 1px 2px rgba(0, 0, 0, 0.05)',
      light: '0 2px 4px rgba(0, 0, 0, 0.08)',
      md: '0 4px 8px rgba(0, 0, 0, 0.10)',
      lg: '0 8px 16px rgba(0, 0, 0, 0.12)',
      xl: '0 12px 24px rgba(0, 0, 0, 0.15)',
    },
  },
}
```
