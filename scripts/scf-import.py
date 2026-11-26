#!/usr/bin/env python3
"""
Import a Secure Controls Framework (SCF) release into src/content/scf/.

Usage:
  python3 scripts/scf-import.py path/to/secure-controls-framework-scf-YYYY-N.xlsx

The SCF is published by SCF Council under Creative Commons Attribution-NoDerivatives 4.0
(CC BY-ND 4.0). This script copies cell values verbatim. It never rewords SCF text,
maturity criteria or mappings. Multi-value mapping cells are kept as the raw cell string;
the app splits them on line breaks when it reads them.

Get the workbook from https://github.com/securecontrolsframework/securecontrolsframework
(the .xlsx at the top of the repo is the current release). Requires openpyxl
(pip install openpyxl).

Writes:
  src/content/scf/scf.json      controls, Evidence Request List and the mapping columns we use
  src/content/scf/scf.sha256    checksum of the imported text, checked by tests/obligations.test.mts
"""
import hashlib
import json
import os
import re
import sys

try:
    import openpyxl
except ImportError:
    sys.exit("openpyxl is required: pip install openpyxl")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "src", "content", "scf")

# Mapping columns we import, keyed by our short name. Matched on the header text with
# whitespace collapsed, so line breaks in the header don't matter.
MAPPING_HEADERS = {
    "csf": "NIST CSF 2.0",
    "hipaa": "USA Federal HIPAA Security Rule NIST SP 800-66 R2",
    "nist171r2": "NIST 800-171 R2",
    "nist171r3": "NIST 800-171 R3",
    "iso27001": "ISO 27001 2022",
    "iso27002": "ISO 27002 2022",
    "soc2": "AICPA TSC 2017:2022 (used for SOC 2)",
}

CONTROL_HEADERS = {
    "domain": "SCF Domain",
    "name": "SCF Control",
    "id": "SCF #",
    "description": "Secure Controls Framework (SCF) Control Description",
    "erl": "Evidence Request List (ERL) #",
    "question": "SCF Control Question",
    "weight": "Relative Control Weighting",
}

ERL_HEADERS = {
    "id": "ERL #",
    "area": "Area of Focus",
    "artifact": "ERL Artifact",
    "description": "Evidence Request List (ERL) Artifact Description",
    "controls": "SCF Control Mappings",
}

ATTRIBUTION = (
    "Contains content from the Secure Controls Framework (SCF), version {version}, "
    "(c) SCF Council, https://securecontrolsframework.com, licensed under Creative Commons "
    "Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0), "
    "https://creativecommons.org/licenses/by-nd/4.0/. SCF content is reproduced without changes."
)


def norm(h):
    return re.sub(r"\s+", " ", str(h or "")).strip()


def find_sheet(wb, prefix):
    for ws in wb.worksheets:
        if ws.title.startswith(prefix):
            return ws
    sys.exit(f"Sheet starting with '{prefix}' not found")


def columns(header, wanted):
    idx = {norm(h): i for i, h in enumerate(header)}
    out = {}
    for key, name in wanted.items():
        if name not in idx:
            sys.exit(f"Column '{name}' not found. The SCF layout may have changed; update scripts/scf-import.py.")
        out[key] = idx[name]
    return out


def cell(v):
    """Verbatim cell text. Numbers keep their value; empty cells become None."""
    if v is None:
        return None
    if isinstance(v, float) and v.is_integer():
        return int(v)
    return v


def checksum(data):
    """sha256 over every imported SCF value, in a fixed order. Mirrored in tests/obligations.test.mts."""
    h = hashlib.sha256()
    for c in data["controls"]:
        for k in ("id", "domain", "name", "description", "erl", "question", "weight"):
            h.update(f"{k}={c[k]}\n".encode())
        for k in sorted(c["maps"]):
            h.update(f"map.{k}={c['maps'][k]}\n".encode())
    for e in data["erl"]:
        for k in ("id", "area", "artifact", "description", "controls"):
            h.update(f"{k}={e[k]}\n".encode())
    return h.hexdigest()


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    path = sys.argv[1]
    m = re.search(r"(\d{4})[.-](\d+(?:[.-]\d+)?)\.xlsx$", os.path.basename(path), re.I)
    if not m:
        sys.exit("Can't read the SCF version from the file name (expected ...-YYYY-N.xlsx)")
    version = f"{m.group(1)}.{m.group(2).replace('-', '.')}"

    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)

    ws = find_sheet(wb, "SCF 20")
    rows = ws.iter_rows(values_only=True)
    header = next(rows)
    cc = columns(header, CONTROL_HEADERS)
    mc = columns(header, MAPPING_HEADERS)

    controls = []
    for r in rows:
        if not r[cc["id"]]:
            continue
        maps = {k: r[i] for k, i in mc.items() if r[i] not in (None, "")}
        if not maps:
            continue  # maps to none of the frameworks we use
        c = {k: cell(r[i]) for k, i in cc.items()}
        c["maps"] = maps
        controls.append(c)

    ws = find_sheet(wb, "Evidence Request List")
    rows = ws.iter_rows(values_only=True)
    ec = columns(next(rows), ERL_HEADERS)
    used = set()
    for c in controls:
        for e in str(c["erl"] or "").split("\n"):
            if e.strip():
                used.add(e.strip())
    erl = []
    for r in rows:
        if r[ec["id"]] and r[ec["id"]] in used:
            erl.append({k: cell(r[i]) for k, i in ec.items()})

    data = {
        "version": version,
        "source": os.path.basename(path),
        "license": "CC BY-ND 4.0",
        "attribution": ATTRIBUTION.format(version=version),
        "mappings": MAPPING_HEADERS,
        "controls": controls,
        "erl": erl,
    }
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, "scf.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=0)
        f.write("\n")
    with open(os.path.join(OUT_DIR, "scf.sha256"), "w", encoding="utf-8") as f:
        f.write(checksum(data) + "\n")
    print(f"SCF {version}: {len(controls)} controls, {len(erl)} evidence requests -> src/content/scf/")


if __name__ == "__main__":
    main()
