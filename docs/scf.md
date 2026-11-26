# Secure Controls Framework (SCF) content

Obligation views (HIPAA Security Rule, NIST SP 800-171, ISO/IEC 27001:2022 Annex A, SOC 2 Trust Services Criteria and the cyber insurance checklist) are rated through NIST CSF 2.0 using SCF mappings, and evidence requests come from the SCF Evidence Request List.

## License

The SCF is licensed under Creative Commons Attribution-NoDerivatives 4.0 (CC BY-ND 4.0).

- Never reword SCF text, maturity criteria or mappings. Changing them needs an SCF commercial license.
- Show `SCF_ATTRIBUTION` (`src/content/scf/index.ts`) wherever SCF content appears.
- `tests/obligations.test.mts` fails if `src/content/scf/scf.json` no longer matches the checksum written when it was imported.

## What is ours, not SCF

- The Emruz bridge (`BRIDGE` in `src/content/obligations.ts`): SCF domain to CSF Subcategories, used only when the SCF has no CSF mapping for a requirement's controls. Labelled "Emruz mapping" in reports; assessors can override the status on the Obligations tab.
- HIPAA and 800-171 titles, HHS 405(d) HICP references and the insurer checklist.
- SPRS weights, from the NIST SP 800-171 DoD Assessment Methodology v1.2.1 (a U.S. government work).
- ISO/IEC 27001 and SOC 2 are shown by control and criterion ID only (ISO and AICPA text is copyrighted).
- NIST SP 800-171 Rev. 2 requirement text and Rev. 3 titles (`src/content/nist171.ts`) come from NIST's CPRT export and OSCAL catalog through `scripts/nist171-import.py`; both are public domain.
- Related 800-171, ISO and SOC 2 IDs on each CSF Subcategory (assess page and reports) use SCF mappings only. They replace the hand-made crosswalk; frameworks chosen in older self-assessments carry over as obligations.

## Refresh on a new SCF release

1. Download the newest workbook (`secure-controls-framework-scf-YYYY-N.xlsx`) from https://github.com/securecontrolsframework/securecontrolsframework.
2. `pip install openpyxl` (once), then `python3 scripts/scf-import.py path/to/secure-controls-framework-scf-YYYY-N.xlsx`.
3. Run `npm test`. If a column was renamed, the script stops and names it; update the header names in the script.
4. Review the change in requirement counts and statuses before shipping. Earlier reports keep the views they were generated with.
