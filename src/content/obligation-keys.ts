/**
 * Obligation keys and labels, kept apart from ./obligations so client code
 * (the self-assessment scoping step) does not bundle the SCF content.
 */
export type ObligationKey = 'hipaa' | 'nist171' | 'iso27001' | 'insurance';
export const OBLIGATION_KEYS: ObligationKey[] = ['hipaa', 'nist171', 'iso27001', 'insurance'];

export const obligationInfo: Record<ObligationKey, { name: string; short: string; scoping: string; note: string }> = {
  hipaa: {
    name: 'HIPAA Security Rule',
    short: 'HIPAA',
    scoping: 'HIPAA (we create, receive or keep electronic protected health information)',
    note: '45 CFR Part 164 Subpart C, with HHS 405(d) Health Industry Cybersecurity Practices (HICP) references. Status is an estimate from the CSF ratings; it is not a HIPAA risk analysis.',
  },
  nist171: {
    name: 'NIST SP 800-171',
    short: '800-171',
    scoping: 'NIST SP 800-171 or CMMC Level 2 (we handle CUI for the DoD)',
    note: 'Rev. 2 requirements with an estimated SPRS score (DoD Assessment Methodology v1.2.1 weights) and a POA&M starter list; Rev. 3 status shown alongside. An estimate, not a score to submit to SPRS.',
  },
  iso27001: {
    name: 'ISO/IEC 27001:2022 Annex A',
    short: 'ISO 27001',
    scoping: 'ISO/IEC 27001 (we are certified or working toward it)',
    note: 'Annex A controls by number only; see your copy of the standard for the control text. Status is an estimate, not a certification audit.',
  },
  insurance: {
    name: 'Cyber insurance controls',
    short: 'Insurance',
    scoping: 'Cyber insurance (we renew or apply for a policy)',
    note: 'Controls cyber insurers commonly ask about on applications and renewals. Written by Emruz; your insurer’s questionnaire is the final word.',
  },
};

/** Clean a list of obligation keys from user input. */
export const cleanObligations = (v: unknown): ObligationKey[] =>
  Array.isArray(v) ? OBLIGATION_KEYS.filter((k) => v.includes(k)) : [];

export const isObligation = (v: unknown): v is ObligationKey => OBLIGATION_KEYS.includes(v as ObligationKey);
