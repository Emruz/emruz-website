# Vendors that handle personal data

Source: `src/app/privacy/page.tsx` (vendor table), code scan in `LAUNCH/profile.md`. DPA and transfer status could not be verified from the repo, so each is OPEN until the owner checks the vendor's own dashboard or signed terms and records the link.

| Vendor | Role (proposed) | What it handles | DPA status | Transfer method (to US) | Link to terms |
|---|---|---|---|---|---|
| Netlify | Processor | Hosting, Postgres database, Netlify Functions, Blobs (avatars and evidence files), deploy logs | OPEN: [[TODO]] confirm signed DPA | [[TODO]] DPF certification or SCCs | https://www.netlify.com/legal/dpa/ (verify) |
| Stripe | Processor for billing; independent controller for some fraud and tax uses | Name, email, billing country and postal code, plan and payment references | OPEN: Stripe provides a DPA in its terms; [[TODO]] confirm acceptance in account | [[TODO]] confirm DPF or SCCs | https://stripe.com/legal/dpa (verify) |
| Resend | Processor | Email delivery: sign-in links, purchase and subscription emails, contact form messages, self-assessment results | OPEN: [[TODO]] confirm signed DPA | [[TODO]] DPF or SCCs | [[TODO]] |
| Microsoft (sign-in) | Independent controller for its own account | Sign-in identifier, email, verification status | N/A (provider terms apply to the user's sign-in) | Provider's own transfer basis | https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA |
| Google (sign-in) | Independent controller for its own account | Sign-in identifier, name, email | N/A (provider terms apply) | Provider's own basis | https://developers.google.com/terms/api-services-user-data-policy |
| Apple (sign-in) | Independent controller for its own account | Sign-in identifier, email or private relay address | N/A (provider terms apply) | Provider's own basis | [[TODO]] |
| WhiteDog Cyber | Role [[TODO]]: processor for managed products, or separate controller. The policy says data is handled under the service agreement and WhiteDog's terms. | Data processed to deliver managed EDR, MDR, XDR and ΔDR services | OPEN: [[TODO]] | [[TODO]] | https://www.whitedogcyber.com/legal |

## Notes

- No analytics, advertising, or tracking vendors were found in the code (`LAUNCH/profile.md`, scan notes). No pixels, so no sharing for advertising.
- The Motiv desktop app talks only to emruz.com (check-in). It has no third-party SDKs in this repo; the desktop repo was not checked.
- Operational cross-check: Netlify and Stripe are the two vendors with the largest data holdings. Start the DPA check there.
