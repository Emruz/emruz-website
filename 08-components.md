# Component Architecture

## Reusable Component Catalog

All components follow responsive, accessible standards and use design system tokens.

### 1. Header / Navigation

**Purpose:** Site branding, primary navigation, CTA accessibility

**Location:** Top of all pages, typically sticky

**Variants:**
- Default (light background)
- Sticky (stays at top on scroll)
- Transparent (over hero, becomes opaque on scroll)

**Content Fields:**
- Logo (image/SVG, link to home)
- Navigation menu (links to primary pages)
- Secondary CTA button (e.g., "Schedule Assessment")
- Mobile hamburger trigger

**Responsive Behavior:**
- Desktop (768px+): Horizontal nav with logo left, nav center, CTA right
- Mobile (<768px): Logo left, hamburger icon right

**Accessibility:**
- Semantic `<nav>` element
- Keyboard navigation (Tab between items)
- ARIA labels on menu button
- Focus indicators on links

---

### 2. Mobile Navigation / Hamburger Menu

**Purpose:** Collapsible menu for mobile/tablet

**Variants:**
- Slide-in drawer (from left)
- Full-screen overlay modal
- Backdrop overlay with semi-transparent background

**Content Fields:**
- Hamburger icon trigger
- Menu items (navigation links)
- Close button (X icon)
- Secondary CTA (prominent button in drawer)

**Responsive Behavior:**
- Show hamburger on screens <768px
- Full-width drawer or modal
- Touchable items (minimum 44px height)

**Accessibility:**
- `aria-expanded` on hamburger button
- `aria-label` on close button
- Keyboard: Escape to close, Tab to navigate
- Focus trap within menu when open

---

### 3. Hero Section

**Purpose:** First impression, headline, primary value proposition

**Variants:**
- Headline + subheadline + CTA (text-only)
- With background image/gradient
- With accent shape or illustration
- Split layout (text left, visual right)

**Content Fields:**
- Headline (H1, typically 48-56px)
- Subheadline (18-24px, secondary color)
- Primary CTA button
- Secondary CTA (link)
- Background (color, image, or gradient)
- Optional accent visual

**Responsive Behavior:**
- Mobile: Single column, headline 36-40px, full-width button
- Tablet: Centered or left-aligned, headline 44px
- Desktop: Can be split layout or centered, headline 48-56px
- Generous padding (60-80px vertical)

**Accessibility:**
- Semantic H1 tag (first heading on page)
- High contrast for text over background
- Alt text for background image (if informational)
- CTA button accessible (role, label, focus)

---

### 4. Section Intro / Subheading

**Purpose:** Introduce new section or topic with heading and description

**Variants:**
- Text only (heading + description)
- With accent (colored bar, icon, or background shape)
- With visual separator (divider line)

**Content Fields:**
- Heading (H2, 36-44px)
- Description (optional, secondary text)
- Accent color or visual
- Alignment (left, center, or split)

**Responsive Behavior:**
- Mobile: Center-aligned, heading 28-32px
- Desktop: Left or center, heading 36-44px

**Accessibility:**
- Semantic heading tag (H2)
- Description linked to heading (visually related)

---

### 5. Capability Cards

**Purpose:** Display services, features, or offerings in grid/carousel

**Variants:**
- Icon + title + description
- Icon + title + description + link
- With color accent (border, background, or icon color)

**Content Fields:**
- Icon (24-32px, brand-colored or monochrome)
- Title (H3, 20-24px)
- Description (14-16px body text, 2-3 lines max)
- Optional link ("Learn more" or arrow)
- Optional color/accent

**Responsive Behavior:**
- Mobile: Single column
- Tablet: 2 columns
- Desktop: 3-4 columns (depends on context)
- Cards maintain consistent height (text clamping if needed)

**Hover State:**
- Shadow increases (light → medium)
- Subtle lift effect (translateY(-2px))

**Accessibility:**
- Semantic card container
- Links have descriptive text or aria-label
- Icons have aria-hidden="true" if decorative

---

### 6. Package Cards / Service Cards

**Purpose:** Showcase service packages or offerings prominently

**Variants:**
- Vertical card (icon top, text below)
- Horizontal card (icon left, text right)
- With accent top border or colored left border

**Content Fields:**
- Icon (24-32px or 48x48px)
- Service name (H3, 20-24px)
- 2-3 benefit bullets
- "Learn More" link
- Primary CTA button ("Schedule Assessment")
- Optional color accent

**Responsive Behavior:**
- Mobile: Single column, vertical layout, full-width button
- Tablet: 2 columns
- Desktop: 3-4 columns or grid
- Cards feel clickable and premium

**Hover State:**
- Card shadow increases
- CTA button becomes more prominent
- Link underlines or color changes

**Accessibility:**
- Card links should be clear (button or linked headline)
- Color not sole differentiator (use text or icon)

---

### 7. Proof Strip / Testimonial / Stat Block

**Purpose:** Build trust through logos, credentials, outcomes, or testimonials

**Variants:**
- Logo carousel (client logos, framework badges)
- Quote + attribution (testimonial)
- Stat + label (outcome proof, e.g., "200+ Organizations")
- Mixed (logos + quote + stat)

**Content Fields:**
- Logos or badge images (60-80px height max)
- Quote text (18-24px, italic or styled)
- Attribution (name, title, company)
- Stats (number + label)

**Responsive Behavior:**
- Mobile: Scrollable horizontal carousel or stacked
- Desktop: Grid or carousel

**Accessibility:**
- Logo alt text (if linked to client site, use company name)
- Quote source properly attributed
- Stats have clear labels (not just numbers)

---

### 8. CTA Banner / Call-to-Action Section

**Purpose:** High-impact CTA, typically at end of section or page

**Variants:**
- Solid background with centered text and button
- Gradient background
- With background image or accent shape
- Left/right split (text left, visual right)

**Content Fields:**
- Heading (H2, 28-36px)
- Supporting text (optional, 16-18px)
- Primary button (CTA)
- Secondary link (optional)
- Background (color, gradient, or image)

**Responsive Behavior:**
- Mobile: Single column, full-width button, 60-80px padding
- Desktop: Can be two-column if visual, 60-80px padding

**Color/Style:**
- High-contrast background (brand accent color or gradient)
- Clear white or light text
- CTA button stands out (contrasting color or bold styling)

**Accessibility:**
- High contrast for text and button
- Button accessible (clear text/label)
- If background image, ensure text is readable

---

### 9. Contact / Inquiry Form

**Purpose:** Capture inquiries or assessment requests

**Variants:**
- Simple (name, email, message)
- Assessment-focused (service type, company, contact info)
- Partnership inquiry (company, type, contact info)

**Content Fields:**
- Name input (required, text)
- Email input (required, email)
- Company input (optional, text)
- Service/inquiry type (optional, dropdown or radio)
- Message textarea (optional)
- Submit button
- Privacy/data handling note
- Success/error messages

**Responsive Behavior:**
- Mobile: Full-width inputs, stacked, clear spacing
- Desktop: Single or two-column layout

**Validation:**
- Required field indicators
- Real-time validation (optional)
- Clear error messages
- Success confirmation

**Accessibility:**
- Labels associated with inputs (`<label for="">`)
- Clear required indicators
- Error messages linked to inputs
- Focus management after submit (success/error message)

---

### 10. Insight Cards / Article Cards

**Purpose:** Showcase blog articles, tools, frameworks, or resources

**Variants:**
- Title + excerpt + date + read link
- With thumbnail image
- With author info and credentials
- With topic tags or category

**Content Fields:**
- Optional image (16:9 or 4:3 aspect ratio)
- Title (H3, 20-24px)
- Excerpt (14-16px, 2-3 lines max)
- Date or topic tag (12px, secondary color)
- Optional author name/avatar
- Read more link or button

**Responsive Behavior:**
- Mobile: Single column
- Tablet: 2 columns
- Desktop: 3 columns or grid
- Consistent card height (title and excerpt truncation)

**Hover State:**
- Card shadow increases
- Image slight zoom or scale (if present)
- Link underlines or color changes
- CTA becomes more prominent

**Accessibility:**
- Image alt text (article title or summary)
- Link text descriptive ("Read: [Article Title]")
- Date in machine-readable format (`<time>`)

---

### 11. Footer

**Purpose:** Navigation, legal, contact, social links

**Content Sections:**
- Logo and tagline
- Company links (About, Team, Careers)
- Services links (all main services)
- Resources (Insights, Frameworks, Tools)
- Legal (Privacy, Terms)
- Social links (LinkedIn, etc.)
- Contact info (optional)
- Newsletter signup (optional)

**Responsive Behavior:**
- Mobile: Stacked sections, full width
- Tablet: 2-column layout
- Desktop: Multi-column grid

**Styling:**
- Typically darker or contrasting background
- Light text for contrast
- Clear visual separation from content

**Accessibility:**
- Semantic `<footer>` element
- Heading structure for sections
- Links have descriptive text
- Sufficient contrast for links

---

### 12. FAQ / Accordion

**Purpose:** Structured Q&A section, expandable answers

**Variants:**
- Single accordion (one answer open at a time)
- Multi-open accordion (multiple answers open simultaneously)
- With icons or visual indicators

**Content Fields:**
- Question (clickable trigger)
- Answer (expandable content)
- Open/close icon (+ / −)

**Behavior:**
- Click to expand/collapse
- Smooth animation (200-300ms)
- Keyboard accessible (Enter to toggle, Arrow keys to navigate)
- One or multiple can be open (depends on variant)

**Accessibility:**
- Semantic `<button>` for trigger (not div)
- `aria-expanded` attribute
- `aria-controls` linking trigger to content
- `id` on answer container
- Keyboard navigation support

---

### 13. Assessment Selector / Service Matcher

**Purpose:** Interactive tool to help buyers choose correct assessment/service

**Variants:**
- Multi-step quiz (questions → recommendation)
- Problem selector (choose your challenge → recommendation)
- Service comparison table (side-by-side comparison)

**Content Fields:**
- Question or problem statement
- Answer options (multiple choice)
- Recommended service/assessment
- CTA to book/learn more

**Behavior:**
- Clear, single-step or multi-step flow
- Immediate feedback (recommendation updates)
- Simple and intuitive

**Accessibility:**
- Semantic form elements (radio buttons, buttons)
- Labels for all options
- Clear next/back navigation
- Results accessible (not just visual)

---

### 14. Service Comparison Table

**Purpose:** Compare similar services or options side-by-side

**Variants:**
- Full table (rows and columns)
- Card layout (for mobile, converts table to cards)

**Content Fields:**
- Service names (columns)
- Comparison criteria (rows)
- Values (check marks, text, or descriptions)

**Responsive Behavior:**
- Desktop: Traditional table layout
- Mobile: Card layout (each row becomes a card)

**Accessibility:**
- Semantic `<table>` with `<thead>` and `<tbody>`
- `<th>` for headers with `scope` attribute
- Captions or titles for context

---

### 15. Testimonial / Quote Block

**Purpose:** Social proof through customer quotes

**Variants:**
- Quote with attribution (name, title, company)
- Quote with photo
- Pull quote (large, decorative)

**Content Fields:**
- Quote text (18-24px, italic or styled)
- Attribution (name)
- Title/company (optional)
- Photo (optional)

**Styling:**
- Often indented or visually distinct
- Quote marks or decorative element (optional)
- Attribution in smaller, secondary text

**Accessibility:**
- Semantic `<blockquote>` for quotes
- Attribution in `<cite>` if possible
- Alt text for photos

---

## Component Composition Rules

### Don't Rebuild, Reuse
- If a component exists in the system, use it
- Customize with props/variants, don't fork

### Single Responsibility
- Each component has one clear purpose
- Nested components are explicit and intentional

### Responsive-First
- All components work on mobile (first), then scale up
- No mobile-specific versions; one component, flexible

### Accessibility Built-In
- Semantic HTML and ARIA included by default
- Focus states, color contrast, keyboard navigation assumed

### Naming Convention
- File: `ComponentName.tsx` or `.jsx` (PascalCase)
- Props: descriptive, clear (not abbreviated)
- CSS classes: kebab-case (`.component-name`)

---

## Interaction States (All Components)

### Button/Link States
- Default
- Hover
- Focus (visible focus ring)
- Active
- Disabled
- Loading (if async)

### Form Input States
- Default (empty)
- Placeholder visible
- Focused (with focus ring)
- Filled
- Disabled
- Error (with message)
- Success (if validation feedback)

### Card States
- Default (rest)
- Hover (shadow, lift, visual feedback)
- Active (if clickable)

### All States Should:
- Use design system colors and spacing
- Include smooth transitions (200-300ms)
- Maintain accessibility (sufficient contrast, visible focus)
- Be intentional and meaningful (not gratuitous animation)
