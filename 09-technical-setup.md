# Technical Architecture & Setup

## Recommended Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS (utility-first)
- **Components:** Headless components (Radix UI, Shadcn) or custom built
- **Language:** TypeScript

**Why Next.js:**
- SSR/SSG for SEO optimization
- Built-in performance optimization (image, code splitting)
- API routes for form handling
- Simple deployment to Vercel or Netlify
- Growing ecosystem and great DX

**Why Tailwind:**
- Utility-first aligns with design system
- Rapid prototyping
- Automatic dark mode support
- Smaller CSS bundle (tree-shaking)
- Design tokens configured centrally

### Backend (Minimal)
- **API Routes:** Next.js API routes (Node.js)
- **Database:** Optional (only needed for analytics, form storage)
- **Email Service:** SendGrid, Mailgun, or Nodemailer for form submissions

### Deployment
- **Hosting:** Netlify or Vercel
- **DNS:** Custom domain (emruz.com)
- **SSL/HTTPS:** Automatic via hosting provider
- **CDN:** Automatic via hosting provider
- **Analytics:** Google Analytics 4 or Plausible (privacy-focused)

---

## Project Structure

```
emruz-website/
├── public/
│   ├── images/
│   │   ├── logos/
│   │   │   ├── nist-logo.svg
│   │   │   ├── cis-logo.svg
│   │   │   └── csf-logo.svg
│   │   ├── illustrations/
│   │   │   ├── hero-bg.svg
│   │   │   ├── engagement-model.svg
│   │   │   └── ...
│   │   ├── icons/
│   │   │   ├── vciso.svg
│   │   │   ├── security.svg
│   │   │   ├── cloud.svg
│   │   │   └── ...
│   │   └── meta/
│   │       ├── og-image.jpg (1200x630)
│   │       └── favicon.ico
│   ├── documents/
│   │   ├── security-assessment-checklist.pdf
│   │   ├── cloud-readiness-guide.pdf
│   │   └── ...
│   └── fonts/
│       └── (if self-hosting)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx (root layout, header/footer)
│   │   ├── page.tsx (home page)
│   │   ├── globals.css (Tailwind config)
│   │   ├── (routes)/
│   │   │   ├── services/
│   │   │   │   ├── page.tsx (services hub)
│   │   │   │   ├── vciso/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── grc/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── security-ops/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── cloud/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── data-science/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── ai/
│   │   │   │       └── page.tsx
│   │   │   ├── assessments/
│   │   │   │   └── page.tsx
│   │   │   ├── about/
│   │   │   │   └── page.tsx
│   │   │   ├── insights/
│   │   │   │   ├── page.tsx (insights hub)
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx (individual article)
│   │   │   ├── contact/
│   │   │   │   └── page.tsx
│   │   │   ├── privacy/
│   │   │   │   └── page.tsx
│   │   │   └── terms/
│   │   │       └── page.tsx
│   │   └── api/
│   │       ├── contact/route.ts (form submission)
│   │       └── insights/route.ts (if dynamic)
│   │
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── MobileNav.tsx
│   │   ├── Hero.tsx
│   │   ├── SectionIntro.tsx
│   │   ├── CapabilityCard.tsx
│   │   ├── ServiceCard.tsx
│   │   ├── ProofStrip.tsx
│   │   ├── CTABanner.tsx
│   │   ├── ContactForm.tsx
│   │   ├── InsightCard.tsx
│   │   ├── FAQAccordion.tsx
│   │   ├── SocialProof.tsx
│   │   ├── Navigation.tsx
│   │   └── (other reusable components)
│   │
│   ├── content/
│   │   ├── insights/
│   │   │   ├── security-frameworks-explained.md
│   │   │   ├── cloud-strategy-guide.md
│   │   │   └── ...
│   │   └── services/
│   │       ├── vciso-service.md
│   │       ├── grc-service.md
│   │       └── ...
│   │
│   ├── hooks/
│   │   ├── useScrollEffect.ts
│   │   ├── useIntersectionObserver.ts
│   │   └── useFormSubmit.ts
│   │
│   ├── lib/
│   │   ├── api.ts (API call helpers)
│   │   ├── seo.ts (SEO metadata generation)
│   │   ├── constants.ts (URLs, site config)
│   │   └── utils.ts (utility functions)
│   │
│   ├── styles/
│   │   ├── globals.css (Tailwind imports)
│   │   ├── typography.css (font setup)
│   │   └── variables.css (CSS custom properties)
│   │
│   ├── types/
│   │   ├── index.ts (shared types)
│   │   ├── api.ts (API response types)
│   │   └── components.ts (component prop types)
│   │
│   └── utils/
│       ├── cn.ts (classname utility)
│       └── formatting.ts (date, text formatting)
│
├── .env.local (NOT COMMITTED)
│   ├── NEXT_PUBLIC_SITE_URL=https://emruz.com
│   └── FORM_HANDLER_EMAIL=...
│
├── .env.example (template for environment variables)
├── .gitignore
├── next.config.js
├── tailwind.config.js (with design tokens)
├── tsconfig.json
├── package.json
├── package-lock.json
├── README.md
└── public/sitemap.xml (generated or static)
```

---

## Naming Conventions

### Files & Folders
- **React Components:** PascalCase (e.g., `Header.tsx`, `ServiceCard.tsx`)
- **Pages/Routes:** kebab-case, lowercase (e.g., `/services/cloud`, `/insights/article-slug`)
- **Utilities/Hooks:** camelCase (e.g., `useFormSubmit.ts`, `api.ts`)
- **Content files:** kebab-case (e.g., `security-assessment-checklist.md`)
- **CSS/Tailwind:** kebab-case (e.g., `.service-card`, `.cta-banner`)
- **Image files:** kebab-case (e.g., `hero-background.jpg`, `framework-logos.svg`)

### Variables & Functions
- **Components/Classes:** PascalCase (e.g., `ServiceCard`)
- **Functions/Variables:** camelCase (e.g., `handleFormSubmit`, `siteConfig`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `SITE_URL`, `FORM_ENDPOINT`)
- **Booleans:** Prefix with `is`, `has`, `can` (e.g., `isLoading`, `hasError`)

### CSS Classes
- **Semantic:** Describe content/purpose (e.g., `.service-card`, `.assessment-cta`)
- **State:** Prefix with modifier (e.g., `.is-active`, `.has-error`)
- **Utility:** Tailwind classes (automatically generated)

---

## Configuration Files

### tailwind.config.js
```javascript
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0E6BA0',
          'primary-light': '#4A9FD8',
          'primary-dark': '#084C6F',
        },
        'light-gray': '#F8F9FA',
        'light-gray-alt': '#F3F5F7',
        // ... other colors from design system
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
        // ... other spacing
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(0, 0, 0, 0.05)',
        light: '0 2px 4px rgba(0, 0, 0, 0.08)',
        md: '0 4px 8px rgba(0, 0, 0, 0.10)',
        lg: '0 8px 16px rgba(0, 0, 0, 0.12)',
        xl: '0 12px 24px rgba(0, 0, 0, 0.15)',
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Geist', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [], // Add if loading images from external sources
  },
  redirects: async () => {
    return [
      // Any redirects here
    ]
  },
  rewrites: async () => {
    return {
      beforeFiles: [],
    }
  },
}

module.exports = nextConfig
```

---

## Environment Variables

### `.env.local` (DO NOT COMMIT)
```
NEXT_PUBLIC_SITE_URL=https://emruz.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX (if using Google Analytics)
FORM_HANDLER_EMAIL=contact@emruz.com
SENDGRID_API_KEY=... (if using SendGrid)
```

### `.env.example` (COMMIT THIS)
```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_GA_ID=
FORM_HANDLER_EMAIL=
SENDGRID_API_KEY=
```

---

## Build & Deploy

### Local Development
```bash
npm run dev
# Runs on http://localhost:3000
```

### Production Build
```bash
npm run build
npm run start
# Or deploy directly to Netlify/Vercel
```

### Deployment to Netlify
1. Connect GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard
5. Set custom domain: emruz.com
6. Enable auto-deploy on branch push

### Deployment to Vercel
1. Connect GitHub repo to Vercel
2. Vercel auto-detects Next.js
3. Set environment variables
4. Connect custom domain: emruz.com
5. Deploy (automatic on main branch push)

---

## Performance Optimization

### Image Optimization
- Use `next/image` component (automatic optimization)
- Serve WebP format (with JPG fallback)
- Lazy-load images below fold (automatic with `next/image`)
- Responsive image sizes (srcset, sizes attributes)

### Code Splitting
- Automatic per route with Next.js App Router
- Use `next/dynamic` for large components
- Lazy-load heavy libraries if needed

### CSS Optimization
- Tailwind purges unused CSS automatically
- No additional CSS-in-JS overhead
- Critical CSS inlined in HTML

### Caching Strategy
- Static pages: Cache indefinitely
- Dynamic pages: Revalidate on demand (ISR)
- Assets (images, fonts): Cache for 1 year (with content-hash)

---

## SEO Setup

### Metadata per Page
- `title` (60 characters max)
- `description` (150-160 characters)
- `og:title`, `og:description`, `og:image`
- Canonical URL (auto-included)

### Structured Data
- JSON-LD for organization schema
- Breadcrumb schema for navigation
- Article schema for blog posts

### Technical SEO
- Sitemap.xml (auto-generated)
- robots.txt (guide crawlers)
- Mobile responsive (mobile-first design)
- Fast performance (Lighthouse > 80)
- No duplicate content

### Tools for Validation
- Google Search Console
- Google Lighthouse
- Bing Webmaster Tools
- Schema.org validator

---

## Accessibility Standards

### WCAG 2.1 Level AA
- Color contrast: 4.5:1 for text, 3:1 for UI
- Focus indicators: Visible and clear
- Keyboard navigation: Full site navigable via Tab
- Semantic HTML: Proper heading hierarchy, labels
- ARIA labels: For complex components
- Alt text: All images described

### Testing Tools
- axe DevTools (browser extension)
- WAVE (accessibility checker)
- Lighthouse (accessibility audit)
- Screen reader testing (NVDA, VoiceOver, JAWS)

---

## Analytics & Monitoring

### Google Analytics 4
```typescript
// src/lib/gtag.ts
export const pageview = (url: string) => {
  if (process.env.NEXT_PUBLIC_GA_ID) {
    window.gtag?.('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: url,
    })
  }
}

export const event = (action: string, params: Record<string, any>) => {
  if (process.env.NEXT_PUBLIC_GA_ID) {
    window.gtag?.('event', action, params)
  }
}
```

### Events to Track
- Page views
- CTA clicks (assessment, contact, consultation)
- Form submissions
- Link clicks (external, internal)
- Scroll depth (if implemented)

### Error Tracking (Optional)
- Sentry for error monitoring
- Set up on Next.js error boundary

---

## Git Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches

### Commit Messages
```
feat: Add vCISO service page
fix: Correct hero section responsive layout
docs: Update README with deployment steps
style: Format button hover states
refactor: Extract common card component
```

### Before Committing
- Run Tailwind build: `npm run build`
- Check TypeScript: `npx tsc --noEmit`
- Run linter: `npm run lint` (if configured)
- Test locally: `npm run dev`

---

## Monitoring & Maintenance

### Dependency Management
- Regularly update Next.js, Tailwind, dependencies
- Use `npm audit` to check for vulnerabilities
- Test updates in staging before production

### Performance Monitoring
- Lighthouse score > 80 (target)
- Core Web Vitals monitoring
- Error rate monitoring (Sentry)

### Uptime Monitoring
- Netlify/Vercel built-in monitoring
- Optional: Uptime monitoring service

### Content Updates
- Blog/insights: Update via markdown or CMS
- Copy: Update via React component props or CMS
- Images: Optimize and compress before uploading
