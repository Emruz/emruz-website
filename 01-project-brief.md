# Project Brief: Emruz Website

## Project Name
**Emruz Consultancy Website** | Strategic security, cloud, and AI advisory platform

## Tagline
"Strategy and execution. Technical clarity without the overhead."

## Business Goals
1. **Generate qualified leads** through assessment bookings (primary entry point)
2. **Establish consultancy authority** across vCISO, GRC, Security, Cloud, and AI domains
3. **Reduce sales cycle friction** through pre-qualifying content and clear positioning
4. **Support inbound partnership inquiries** (WhiteDog Cyber platform delivery model, kept invisible in most messaging)
5. **Build ongoing engagement** through insights, frameworks, and thought leadership

## Target Audiences

### Primary Personas
- **CIO / CISO / CTO** — Strategic decision-makers, risk-focused, board-accountable
- **Technical Evaluator / Architect** — Deep technical assessment, methodology-focused

### Secondary Personas
- **CEO / Founder / Business Owner** — Risk and business continuity focused
- **IT Director / Infrastructure Lead** — Operational delivery and team capability focused

## Key Constraints

### Timeline
- Phase 1-3 (Core): 2-3 weeks
- Phase 4-7 (Full build): 4-6 weeks total
- Phase 8-10 (QA, SEO, deployment): 1-2 weeks
- **Total: 6-8 weeks part-time, 3-4 weeks full-time**

### Budget
- No third-party dependencies beyond Next.js + Tailwind
- Self-hosted content (no expensive CMS initially; markdown-based or Contentful)
- Netlify hosting (generous free tier, scale as needed)

### Technical
- Next.js 14+ with App Router (SSR/SSG for SEO)
- Tailwind CSS for design system
- No heavy JavaScript libraries; focus on performance
- Mobile-first responsive design
- WCAG 2.1 Level AA accessibility minimum

### Brand
- Consultancy-first positioning (not MSP, not vendor)
- Premium, modern, minimal aesthetic (not corporate sterile, not trendy)
- Framework-grounded (NIST CSF, CIS Controls, CSF visible on every service page)
- Technical depth without elitism
- WhiteDog Cyber partnership **invisible in primary messaging** (can be named in About or Trust sections if strategic)

## Success Criteria

### Functional
- [ ] All pages load and render correctly on mobile, tablet, desktop
- [ ] Assessment scheduling CTA functional (link or embedded scheduler)
- [ ] Contact forms submit and generate email notifications
- [ ] Internal links have no 404s
- [ ] Responsive design passes mobile audit

### Brand & Messaging
- [ ] Consultancy positioning clear on every page (not MSP, not vendor)
- [ ] Proof points specific and verifiable (framework alignment, team credentials, outcomes)
- [ ] Copy consistent with brand voice (professional, clear, technical, no buzzwords)
- [ ] Framework logos (NIST, CIS, CSF) visible on every service page
- [ ] CTAs assessment-first (primary focus is "Schedule an Assessment")

### Performance & Quality
- [ ] Lighthouse score > 80 (mobile and desktop)
- [ ] WCAG 2.1 Level AA compliant (tested with WAVE, Axe, screen reader)
- [ ] SEO setup complete (meta, sitemap, schema, search console)
- [ ] No console errors or warnings
- [ ] Deployed to Netlify with custom domain (emruz.com)

### Conversion
- [ ] Primary CTA (assessment scheduling) visible above fold on every page
- [ ] Secondary CTA (consultation) available on service pages
- [ ] Insight/content download options present for lead capture
- [ ] Forms capturing email for nurture/follow-up

## Hidden Constraints & Strategic Considerations

### WhiteDog Cyber Partnership
- **What:** Emruz delivers outcomes through WhiteDog Cyber platform (operational delivery layer)
- **How to handle:** 
  - Keep invisible in primary messaging (no mention on homepage, service pages, hero)
  - Can be mentioned in About page as "strategic partner" if appropriate
  - Reference operational capability through language: "platform-backed delivery", "24/7 operations", "production-grade infrastructure"
  - If buyer asks directly in sales: can name and explain relationship
  - Never position as "WhiteDog reseller" or "white-label"
- **Why:** Protects positioning as consultancy (not vendor), avoids confusing buyer about who they're hiring

### Proof Points Strategy
- Framework alignment (NIST, CIS, CSF) is primary proof (methodology credibility)
- Certifications and team credentials (CISSP, CCSK, AWS, Azure, GCP)
- Outcomes and scale ("deployed across 200+ organizations", specific metrics if available)
- Methodology clarity (how we approach the work)
- **Avoid:** Generic testimonials, vague claims, vendor buzzwords

### Owner-Operator Copy Tone
- Assume reader is technically competent (CIO, architect, IT director)
- No hand-holding or "for dummies" language
- Use industry terminology (NIST CSF, governance, compliance frameworks)
- Jargon OK if industry-standard; vendor-speak NOT OK
- Problem-first, then solution/outcome

## Assumptions & Dependencies

- Stakeholder reviews and approves copy before launch
- Proof points (team credentials, client outcomes, certifications) are ready and verified
- Domain (emruz.com) is registered and ready to point to Netlify
- GitHub account (https://github.com/Emruz) exists and is accessible
- Netlify account exists and is accessible
- No external APIs required for MVP (forms can use email or basic backend)

## Out of Scope (Phase 1)
- User accounts or member portal
- Real-time booking/scheduling integration (can be link to Calendly or form initially)
- Blog/insights CMS (can start with markdown or basic content structure)
- Case study deep dives (can be summary cards initially)
- Multi-language support
- AI chatbot or advanced interactivity
