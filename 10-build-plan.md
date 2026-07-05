# Build Plan & Implementation Sequence

## Overview

**Total Estimated Timeline:** 6-8 weeks part-time | 3-4 weeks full-time

**Approach:** Phased, with validation gate between each phase

---

## Phase 1: Foundation & Design System (2-3 days)

### Objectives
- Initialize Next.js project with all dependencies
- Configure Tailwind CSS with design system tokens
- Set up typography, colors, spacing, shadows
- Create CSS custom properties for consistency
- Build reusable layout wrapper
- Verify no build errors

### Deliverables
- [ ] Next.js project initialized (App Router, TypeScript)
- [ ] Tailwind configured with all design tokens
- [ ] Fonts imported (Outfit, Geist)
- [ ] CSS variables defined and working
- [ ] Basic page layout structure (header, footer, wrapper)
- [ ] Build script passes without errors
- [ ] Git repository initialized and first commit

### QA Checklist
- [ ] `npm run dev` starts without errors
- [ ] Tailwind styles apply to test page
- [ ] Typography renders correctly (all font sizes, weights)
- [ ] Color palette accessible (check contrast)
- [ ] Responsive breakpoints work on test page
- [ ] No console errors or warnings

### Output
- Foundation committed to git
- Ready for component building

---

## Phase 2: Core Components (4-5 days)

### Objectives
- Build all 15 reusable components
- Ensure responsive behavior
- Verify accessibility attributes
- Test interactions (hover, focus, active states)

### Components to Build
1. [ ] Header (desktop + mobile nav)
2. [ ] Footer
3. [ ] Hero
4. [ ] SectionIntro
5. [ ] CapabilityCard
6. [ ] ServiceCard / PackageCard
7. [ ] ProofStrip
8. [ ] CTABanner
9. [ ] ContactForm
10. [ ] InsightCard
11. [ ] FAQAccordion
12. [ ] MobileNav (drawer/modal)
13. [ ] Navigation (shared nav logic)
14. [ ] (Additional UI components as needed)
15. [ ] (Layout components: Container, Grid, etc.)

### QA Checklist per Component
- [ ] Renders without errors
- [ ] Responsive on mobile (320px), tablet (768px), desktop (1024px)
- [ ] Hover/focus/active states work
- [ ] Accessibility attributes present (aria-labels, semantic HTML)
- [ ] Forms submit correctly (if applicable)
- [ ] Links navigate correctly (if applicable)

### Output
- Component library committed
- Components tested individually
- Ready for page assembly

---

## Phase 3: Homepage (3-4 days)

### Objectives
- Assemble homepage using components
- Add all sections from wireframe
- Implement copy and CTAs
- Optimize images
- Verify SEO metadata

### Sections to Build
1. [ ] Hero
2. [ ] Trust Strip (framework logos)
3. [ ] Capabilities Grid (5 cards)
4. [ ] Assessments Entry Section
5. [ ] Why Emruz (3 value props)
6. [ ] Engagement Model
7. [ ] Proof/Trust Section (outcomes, team)
8. [ ] Insights Preview
9. [ ] Final CTA Banner
10. [ ] Footer

### QA Checklist
- [ ] All sections render correctly
- [ ] Copy reviewed and approved
- [ ] Images optimized and responsive
- [ ] CTAs functional (links, buttons)
- [ ] Mobile layout flows properly (no horizontal scroll)
- [ ] Lighthouse performance > 80
- [ ] SEO metadata complete (title, description, og tags)
- [ ] No console errors

### Output
- Homepage deployed to staging
- Accessible at localhost:3000 and later deployed URL

---

## Phase 4: Service Pages (5-6 days)

### Pages to Build
1. **Services Hub** (`/services`)
   - Service portfolio overview
   - Service selector tool
   - All services linked
   
2. **vCISO & Leadership** (`/services/vciso`)
   - Hero, overview, approach, deliverables, team, proof, FAQ, CTA

3. **Security & Compliance Hub** (`/services/security`)
   - Overview of GRC + Ops
   - Links to both sub-services

4. **GRC Program** (`/services/grc`)
   - Complete service page template

5. **Security Operations** (`/services/security-ops`)
   - Complete service page template

6. **Cloud Strategy & Security** (`/services/cloud`)
   - Complete service page template

7. **Data Science & Analytics** (`/services/data-science`)
   - Complete service page template

8. **AI Advisory & Enablement** (`/services/ai`)
   - Complete service page template

9. **Assessments Hub** (`/assessments`)
   - Assessment overview
   - All assessment types
   - FAQ, CTA

### Service Page Template Structure
- Hero section (problem statement, headline)
- Service overview
- Who it's for
- Core outcomes (bullet points)
- Engagement model (phases diagram)
- Scope and deliverables
- Team credentials and certifications
- Proof/outcome cards
- FAQ section
- CTA (assessment, consultation)

### QA Checklist per Page
- [ ] Hero and all sections render
- [ ] Copy consistent with brand voice
- [ ] Framework logos visible
- [ ] CTAs functional and appropriate
- [ ] Internal links correct
- [ ] Mobile layout works
- [ ] SEO metadata complete
- [ ] No broken links

### Output
- 9 service pages deployed
- All services consistently structured

---

## Phase 5: Secondary Pages (3-4 days)

### Pages to Build
1. **About** (`/about`)
   - Company story section
   - Approach/principles section
   - Team bios and credentials
   - Partnerships (optional: WhiteDog if strategic)
   - Careers link (if applicable)

2. **Insights/Blog Hub** (`/insights`)
   - Article cards and grid
   - Featured article section
   - Newsletter signup
   - Topic/tag filtering (optional)

3. **Individual Article Pages** (`/insights/[slug]`)
   - Article hero (title, date, author)
   - Article body (markdown or rich text)
   - Related articles
   - Newsletter signup
   - Back to Insights link

4. **Contact** (`/contact`)
   - Assessment scheduler (embedded or link)
   - Inquiry form
   - Contact information
   - Social links
   - Office locations (if applicable)

5. **Privacy Policy** (`/privacy`)
   - Legal/compliance page
   - Privacy policy text

6. **Terms of Service** (`/terms`)
   - Legal/compliance page
   - Terms text

### QA Checklist
- [ ] All pages render correctly
- [ ] Forms test end-to-end (submission, confirmation)
- [ ] Links to external resources work
- [ ] Team photos optimize correctly
- [ ] Newsletter signup backend integrated
- [ ] Internal links correct
- [ ] SEO metadata complete

### Output
- 6 secondary pages deployed
- Contact/newsletter system working

---

## Phase 6: Responsive Design & Mobile Optimization (2-3 days)

### Objectives
- Test all pages on multiple devices
- Verify touch-friendly targets
- Optimize mobile navigation
- Check horizontal scroll (none expected)
- Verify font sizes on mobile

### Testing Checklist
- [ ] Test on iPhone (iOS Safari)
- [ ] Test on Android (Chrome)
- [ ] Test on iPad (Safari)
- [ ] Test on Android tablet
- [ ] Test on desktop (Chrome, Safari, Firefox, Edge)
- [ ] No horizontal scrolling on any breakpoint
- [ ] Touch targets minimum 44x44px
- [ ] Form inputs properly sized
- [ ] Images responsive (srcset, sizes)
- [ ] Mobile nav works smoothly
- [ ] Font sizes readable on mobile

### Lighthouse Performance Target
- [ ] Mobile: > 70 (good) or > 90 (excellent)
- [ ] Desktop: > 90 (excellent)

### Output
- All pages responsive and tested
- Lighthouse mobile scores documented

---

## Phase 7: Accessibility Audit & Optimization (2-3 days)

### Objectives
- Verify WCAG 2.1 Level AA compliance
- Test keyboard navigation
- Test with screen reader
- Fix any accessibility issues

### Tools & Testing
- [ ] Run axe DevTools on all pages
- [ ] Run WAVE (WebAIM) on all pages
- [ ] Check color contrast (WebAIM Contrast Checker)
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Test with screen reader (Narrator, NVDA, or VoiceOver)
- [ ] Check form labels and error messages
- [ ] Verify skip navigation link present

### Accessibility Checklist
- [ ] Color contrast 4.5:1 minimum for text
- [ ] Focus indicators visible on all interactive elements
- [ ] Heading hierarchy correct (no skipped levels)
- [ ] Form inputs have labels
- [ ] All images have alt text
- [ ] Keyboard navigation works everywhere
- [ ] No focus traps (except modals)
- [ ] Modals have focus management
- [ ] Error messages linked to inputs
- [ ] Color not sole differentiator

### Output
- Accessibility issues fixed
- All pages WCAG AA compliant
- Screen reader tested and approved

---

## Phase 8: SEO & Metadata Setup (1-2 days)

### Objectives
- Add metadata to all pages
- Create sitemap
- Set up robots.txt
- Add schema markup
- Verify search console setup

### SEO Setup Checklist
- [ ] Meta title on all pages (< 60 characters)
- [ ] Meta description on all pages (150-160 characters)
- [ ] Open Graph tags (og:title, og:description, og:image)
- [ ] Canonical tags (auto-included by Next.js)
- [ ] Sitemap.xml created and valid
- [ ] Robots.txt configured
- [ ] Schema.json markup added (organization, breadcrumb, article)
- [ ] No duplicate meta tags
- [ ] No missing descriptions

### Validation Tools
- [ ] Google Search Console
- [ ] SEMrush or similar (free audit)
- [ ] Schema.org structured data tester
- [ ] Google Lighthouse SEO audit

### Output
- All metadata verified
- Sitemap submitted to Google Search Console
- Ready for production launch

---

## Phase 9: Content Review & Polish (2-3 days)

### Objectives
- Stakeholder review of all copy
- Verify proof points and metrics
- Final typo/grammar check
- Brand consistency audit
- Image optimization final pass

### Content Review Checklist
- [ ] All copy reviewed by stakeholder
- [ ] Proof points verified (metrics accurate)
- [ ] Team bios and credentials verified
- [ ] Service descriptions match package definitions
- [ ] CTAs consistent and compelling
- [ ] No typos or grammar errors
- [ ] Framework terminology used correctly
- [ ] No buzzwords or vendor-speak
- [ ] Links all point to correct destinations

### Brand Consistency Audit
- [ ] Voice and tone consistent across all pages
- [ ] Messaging hierarchy followed
- [ ] Framework logos visible where required
- [ ] CTA hierarchy respected (assessment first)
- [ ] Approved vocabulary used

### Image Optimization
- [ ] All images compressed
- [ ] WebP format with JPG fallback
- [ ] Alt text descriptive
- [ ] Dimensions appropriate (no oversized files)

### Output
- All copy approved
- Final polish complete
- Ready for deployment

---

## Phase 10: Final QA, Deployment & Launch (2-3 days)

### Pre-Deployment QA Checklist

**Functional Testing:**
- [ ] All pages load without errors
- [ ] All links work (internal and external)
- [ ] Forms submit and receive responses
- [ ] Email notifications working
- [ ] No 404 errors

**Browser Compatibility:**
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] iOS Safari
- [ ] Android Chrome

**Performance:**
- [ ] Lighthouse Desktop > 80
- [ ] Lighthouse Mobile > 70
- [ ] Core Web Vitals good (LCP, FID, CLS)
- [ ] Page load time < 3 seconds

**Accessibility:**
- [ ] WCAG 2.1 Level AA compliant
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] axe DevTools passes

**SEO:**
- [ ] All metadata present
- [ ] Sitemap valid
- [ ] robots.txt configured
- [ ] Schema markup validates
- [ ] No duplicate content

**Security:**
- [ ] HTTPS enabled
- [ ] No hardcoded secrets
- [ ] Form validation working
- [ ] CORS configured (if needed)
- [ ] CSP headers set (if applicable)

### Deployment Steps

1. **Domain Setup**
   - [ ] emruz.com DNS configured
   - [ ] Domain points to Netlify/Vercel

2. **Hosting Setup**
   - [ ] Netlify or Vercel project created
   - [ ] GitHub repo connected
   - [ ] Environment variables set
   - [ ] Build and deploy scripts verified

3. **Pre-Launch Testing**
   - [ ] Deploy to staging environment
   - [ ] Smoke test staging (key pages load)
   - [ ] Run full test suite on staging
   - [ ] Verify staging links work

4. **Production Deployment**
   - [ ] Final code review
   - [ ] Deploy to production
   - [ ] Verify production site loads
   - [ ] Check all key pages
   - [ ] Monitor error logs for 1 hour

5. **Post-Launch Setup**
   - [ ] Submit sitemap to Google Search Console
   - [ ] Submit sitemap to Bing Webmaster Tools
   - [ ] Set up Google Analytics 4 tracking
   - [ ] Set up error monitoring (Sentry if configured)
   - [ ] Configure uptime monitoring
   - [ ] Set up email notifications for errors

6. **Marketing & Announcement**
   - [ ] Send launch announcement to team
   - [ ] Update social media profiles
   - [ ] Share with key stakeholders
   - [ ] Add to email signature

### Monitoring (First Week)

- [ ] Monitor error logs daily
- [ ] Check Lighthouse scores daily
- [ ] Monitor Core Web Vitals
- [ ] Review Google Analytics traffic
- [ ] Check for any 404 errors
- [ ] Test all key workflows (assessment booking, form submission, etc.)

### Output
- [ ] Site live at emruz.com
- [ ] All systems monitored
- [ ] Ready for marketing and lead generation

---

## Success Criteria (Final Delivery)

### Functional
✓ All 15+ pages built and deployed
✓ All forms working end-to-end
✓ All links functional (no 404s)
✓ Mobile responsive (tested on devices)
✓ No console errors or warnings

### Performance
✓ Lighthouse Desktop > 80
✓ Lighthouse Mobile > 70
✓ Page load time < 3 seconds
✓ Core Web Vitals in "good" range

### Accessibility
✓ WCAG 2.1 Level AA compliant
✓ Keyboard navigation functional
✓ Screen reader compatible
✓ axe DevTools passes

### Brand & Content
✓ Consultancy positioning clear
✓ Copy consistent with brand voice
✓ Framework logos visible on service pages
✓ CTAs assessment-first
✓ Proof points specific and verifiable

### SEO
✓ Meta tags complete and unique
✓ Sitemap created and submitted
✓ Schema markup validates
✓ Mobile responsive
✓ Search console set up

### Security
✓ HTTPS enabled
✓ No hardcoded secrets
✓ Form validation working
✓ Email notifications secure

### Deployment
✓ Deployed to emruz.com
✓ CI/CD pipeline working
✓ Monitoring and alerting configured
✓ Team trained on maintenance

---

## Post-Launch Maintenance

### Weekly
- [ ] Check error logs
- [ ] Review analytics highlights
- [ ] Monitor Lighthouse scores

### Monthly
- [ ] Review traffic and conversions
- [ ] Update insights/content if needed
- [ ] Test all forms and CTAs
- [ ] Check for broken links
- [ ] Review SEO performance

### Quarterly
- [ ] Audit accessibility compliance
- [ ] Update security dependencies
- [ ] Review and refresh content
- [ ] Plan content roadmap
- [ ] Analyze conversion funnel

### Annually
- [ ] Full design audit
- [ ] Performance optimization pass
- [ ] Content strategy refresh
- [ ] Technology stack review

---

## Risk Mitigation

### Common Risks & Mitigations

**Risk: Scope Creep**
- Mitigation: Strict phase definitions, no features outside scope

**Risk: Copy Not Ready**
- Mitigation: Provide placeholder copy in Phase 1, swap in Phase 9

**Risk: Performance Issues**
- Mitigation: Optimize images aggressively, test early and often

**Risk: Accessibility Non-Compliance**
- Mitigation: Build accessibility in from Phase 2, test every phase

**Risk: SEO Not Implemented**
- Mitigation: Dedicate Phase 8 to SEO, use checklists

**Risk: Browser Compatibility Issues**
- Mitigation: Test early on real devices, use cross-browser tool

**Risk: Form Submission Failures**
- Mitigation: Test contact forms before launch, have fallback email

**Risk: Mobile Responsiveness Broken**
- Mitigation: Mobile-first design from Phase 1, test on real devices

**Risk: Deployment Failure**
- Mitigation: Test on staging first, have rollback plan

---

## Rollback Plan

If critical issues discovered post-launch:

1. **Identify Issue** — Error logs, user reports, automated monitoring
2. **Create Hotfix Branch** — Branch from main for critical fix
3. **Fix & Test Locally** — Reproduce, fix, test thoroughly
4. **Deploy to Staging** — Deploy hotfix branch to staging
5. **Verify Staging** — Test that fix works without introducing new issues
6. **Deploy to Production** — Merge hotfix to main and deploy
7. **Monitor** — Watch error logs and analytics for 2 hours
8. **Communicate** — Notify team of fix and resolution

---

## Definition of Done

✓ All acceptance criteria met
✓ Code reviewed and approved
✓ Tests pass (if applicable)
✓ No console errors
✓ Responsive on mobile, tablet, desktop
✓ Accessibility verified (WCAG AA)
✓ Performance verified (Lighthouse > 80)
✓ SEO verified (meta, sitemap, schema)
✓ Deployed to production (emruz.com)
✓ Monitoring and alerts configured
✓ Team trained and ready for hand-off
