# Site Information Architecture & Sitemap

## URL Structure

```
emruz.com/                          # Home
emruz.com/services                  # Services Hub
emruz.com/services/vciso            # vCISO & Leadership
emruz.com/services/security         # Security & Compliance Hub
emruz.com/services/grc              # GRC Program
emruz.com/services/security-ops     # Security Operations
emruz.com/services/cloud            # Cloud Strategy & Security
emruz.com/services/data-science     # Data Science & Analytics
emruz.com/services/ai               # AI Advisory & Enablement
emruz.com/assessments               # Assessments Hub
emruz.com/about                     # About
emruz.com/insights                  # Insights Hub (Blog)
emruz.com/insights/[slug]           # Individual Article
emruz.com/contact                   # Contact / Get in Touch
```

## Primary Navigation (Header)

- **Home** → /
- **Services** → /services (dropdown or dedicated page)
  - vCISO & Leadership → /services/vciso
  - Security & Compliance → /services/security (or hub for GRC + Ops)
  - Cloud Strategy → /services/cloud
  - Data Science → /services/data-science
  - AI Advisory → /services/ai
- **About** → /about
- **Insights** → /insights
- **Contact** → /contact

## Secondary Navigation (Services Submenu)

When Services is expanded or on Services Hub page:

- vCISO & Leadership
- Security & Compliance
  - GRC Program
  - Security Operations
- Cloud Strategy & Security
- Data Science & Analytics
- AI Advisory & Enablement
- Assessments (prominent entry point)

## Footer Navigation

**Company**
- About
- Team
- Careers (if applicable)

**Services**
- All Services
- vCISO
- GRC
- Security
- Cloud
- Data Science
- AI
- Assessments

**Resources**
- Insights / Blog
- Frameworks & Guides
- Tools & Checklists
- Whitepapers

**Legal & Social**
- Privacy Policy
- Terms of Service
- LinkedIn (if applicable)
- Contact

## Page Hierarchy

```
ROOT
├── Home (/)
│   ├── Trust Strip (framework logos)
│   ├── Capabilities Overview (links to services)
│   ├── Assessments Entry Point
│   ├── Why Emruz (differentiators)
│   ├── Engagement Model
│   ├── Proof/Outcomes
│   ├── Insights Preview
│   └── CTAs

├── Services (/services)
│   ├── Service Portfolio Overview
│   ├── Service Type Selector/Matcher
│   ├── Service Cards (links to deep dives)
│   ├── Assessment Hub Link
│   └── FAQ

├── Service Deep Dives
│   ├── vCISO & Leadership (/services/vciso)
│   ├── Security & Compliance (/services/security) [or separate hub]
│   │   ├── GRC Program (/services/grc)
│   │   └── Security Operations (/services/security-ops)
│   ├── Cloud Strategy & Security (/services/cloud)
│   ├── Data Science & Analytics (/services/data-science)
│   └── AI Advisory & Enablement (/services/ai)

├── Assessments (/assessments)
│   ├── Assessment Hub (all types)
│   ├── Assessment Selector Tool
│   ├── FAQ (what is an assessment, timeline, cost)
│   └── CTA per assessment type

├── About (/about)
│   ├── Company Story
│   ├── Our Approach
│   ├── Team & Credentials
│   ├── Partnerships (optional: mention WhiteDog if strategic)
│   └── Careers (if applicable)

├── Insights (/insights)
│   ├── Blog/Article Hub
│   ├── Article Cards (with filters)
│   ├── Featured Article
│   ├── Newsletter Signup
│   └── Topic/Tag Browse

├── Individual Articles (/insights/[slug])
│   ├── Article Hero (title, date, author)
│   ├── Article Body (markdown or rich text)
│   ├── Related Articles
│   ├── Author Bio
│   ├── Newsletter Signup
│   └── Service CTA (back to relevant service)

└── Contact (/contact)
    ├── Assessment Scheduler (embedded or link)
    ├── Inquiry Form
    ├── Contact Information
    ├── Social Links
    └── Office Locations (if applicable)
```

## Page Inventory

| Page | URL | Purpose | Priority | Status |
|------|-----|---------|----------|--------|
| Home | / | First impression, capabilities overview, CTAs | P0 | TBD |
| Services Hub | /services | Service portfolio overview, selector | P0 | TBD |
| vCISO | /services/vciso | Deep dive, detailed offering | P1 | TBD |
| Security Hub | /services/security | GRC + Ops overview | P1 | TBD |
| GRC | /services/grc | Detailed GRC offering | P1 | TBD |
| Security Ops | /services/security-ops | Detailed Ops offering | P1 | TBD |
| Cloud | /services/cloud | Detailed Cloud offering | P1 | TBD |
| Data Science | /services/data-science | Detailed Data offering | P1 | TBD |
| AI | /services/ai | Detailed AI offering | P1 | TBD |
| Assessments | /assessments | Assessment hub, entry point | P1 | TBD |
| About | /about | Company story, team, approach | P1 | TBD |
| Insights Hub | /insights | Blog/resources hub | P2 | TBD |
| Insight Article | /insights/[slug] | Individual articles | P2 | TBD |
| Contact | /contact | Inquiry forms, scheduler | P0 | TBD |
| Privacy | /privacy | Legal/compliance | P3 | TBD |
| Terms | /terms | Legal/compliance | P3 | TBD |

## Navigation Recommendations

### Desktop Navigation
- Logo (top left)
- Horizontal menu (Services, About, Insights, Contact)
- Services has dropdown submenu
- Assessment CTA button (top right)
- Sticky header on scroll

### Mobile Navigation
- Logo (top left)
- Hamburger menu (top right)
- Full-screen drawer menu when opened
- All navigation items accessible
- Assessment CTA visible in drawer

### Breadcrumbs
- Use on service pages: Home > Services > [Service Name]
- Use on article pages: Home > Insights > [Article Title]
- Use on contact page if needed

### Footer
- Multi-column layout (desktop)
- Stacked layout (mobile)
- Newsletter signup optional
- Social links optional

## SEO Considerations

### Keyword Targets by Page

**Home**
- "Security consulting", "cloud consulting", "AI advisory"
- Brand awareness keywords

**Services Hub**
- "Security services", "cloud strategy", "vCISO services"
- Service category keywords

**vCISO**
- "vCISO services", "fractional CISO", "virtual CISO"

**GRC**
- "GRC consulting", "compliance program", "SOC 2 consulting", "ISO 27001"

**Security Ops**
- "Security operations", "SOC services", "incident response"

**Cloud**
- "Cloud strategy", "cloud security", "cloud migration"

**Data Science**
- "Security analytics", "threat hunting", "data science consulting"

**AI**
- "AI strategy", "AI governance", "enterprise AI"

**Assessments**
- "Security assessment", "cloud assessment", "compliance assessment"

### Internal Linking Strategy
- Homepage links to all main service pages
- Service pages link to Assessment hub
- Service pages link to related services
- Insights articles link back to relevant service page
- About page links to services

## Navigation Labels (Final Check)

- "Services" not "Offerings"
- "vCISO & Leadership" not "vCISO Services"
- "GRC Program" not "GRC Tier 1"
- "Security Operations" not "Managed Security"
- "Cloud Strategy & Security" not "Cloud Services"
- "Data Science & Analytics" not "Analytics Services"
- "AI Advisory & Enablement" not "AI Services"
- "Assessments" as its own hub, not buried under Services
- "Insights" not "Blog" or "Resources"
- "About" not "Company" or "Who We Are"
- "Contact" not "Get in Touch" (though subtitle can be)
