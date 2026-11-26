/**
 * Secure Controls Framework (SCF) content, imported verbatim by scripts/scf-import.py.
 * CC BY-ND 4.0: never reword SCF text, maturity criteria or mappings, and show
 * SCF_ATTRIBUTION wherever SCF content appears. Refresh with a new SCF release;
 * do not edit scf.json by hand (tests/obligations.test.mts checks scf.sha256).
 */
import data from './scf.json' with { type: 'json' };

export type ScfMapKey = 'csf' | 'hipaa' | 'nist171r2' | 'nist171r3' | 'iso27001' | 'iso27002' | 'soc2';

export interface ScfControl {
  id: string;
  domain: string;
  name: string;
  description: string;
  erl: string | null;
  question: string | null;
  weight: number | null;
  maps: Partial<Record<ScfMapKey, string>>;
}

export interface ScfEvidence {
  id: string;
  area: string;
  artifact: string;
  description: string;
  controls: string | null;
}

export const SCF_VERSION: string = data.version;
export const SCF_ATTRIBUTION: string = data.attribution;
export const SCF_URL = 'https://securecontrolsframework.com';
export const scfControls = data.controls as ScfControl[];
export const scfEvidence = data.erl as ScfEvidence[];

/** Split a multi-value SCF cell (one value per line) without changing the values. */
export const splitCell = (v: string | null | undefined): string[] =>
  String(v ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

export const scfControlById = new Map(scfControls.map((c) => [c.id, c]));
export const scfEvidenceById = new Map(scfEvidence.map((e) => [e.id, e]));

/** Evidence Request List items for an SCF control. */
export const erlFor = (c: ScfControl): string[] => splitCell(c.erl).filter((id) => scfEvidenceById.has(id));

/** IDs an SCF control maps to in one framework. */
export const mapsFor = (c: ScfControl, key: ScfMapKey): string[] => splitCell(c.maps[key]);
