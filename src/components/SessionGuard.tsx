'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/*
 * Admin and workbench pages ask for a fresh sign-in before sensitive changes.
 * This keeps whatever is typed into forms on those pages, checks the sign-in
 * before a form is submitted, and if it has lapsed sends the user to sign in
 * and puts their changes back when they return. It also warns ahead of time.
 */

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type Draft = { at: number; values: Record<string, string | boolean> };
type Me = { account: unknown; isAdmin?: boolean; stepUp?: boolean };

const TTL = 24 * 3600_000;
const PASS = 'guardPass';

const guarded = (path: string) => path.startsWith('/admin') || path.startsWith('/workbench');
/** Pages whose actions need a recent sign-in, not just a session. */
const stepUpPath = (path: string) => path.startsWith('/admin') || path.startsWith('/workbench/staff');

const fieldsOf = (form: HTMLFormElement) =>
  Array.from(form.elements).filter(
    (el): el is Field =>
      (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) &&
      !!el.name &&
      !['hidden', 'submit', 'button', 'file', 'password'].includes(el.type),
  );

const isGet = (f: HTMLFormElement) => f.getAttribute('method')?.toLowerCase() === 'get';
const formsOf = () => Array.from(document.querySelectorAll('form')).filter((f) => !isGet(f));

const keyFor = (form: HTMLFormElement) => {
  const i = Array.from(document.querySelectorAll('form')).indexOf(form);
  return `emruz-draft:${location.pathname}${location.search}:${form.id || i}`;
};

function read(key: string): Draft | null {
  try {
    const d = JSON.parse(localStorage.getItem(key) || 'null') as Draft | null;
    return d && Date.now() - d.at < TTL ? d : null;
  } catch {
    return null;
  }
}
function clear(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}
function save(form: HTMLFormElement) {
  const values: Draft['values'] = {};
  for (const el of fieldsOf(form)) {
    if (el instanceof HTMLInputElement && el.type === 'checkbox') values[el.name] = el.checked;
    else if (el instanceof HTMLInputElement && el.type === 'radio') {
      if (el.checked) values[el.name] = el.value;
    } else values[el.name] = el.value;
  }
  try {
    localStorage.setItem(keyFor(form), JSON.stringify({ at: Date.now(), values }));
  } catch {}
}

/** Set a value so React-controlled fields notice it too. */
function setField(el: Field, v: string | boolean) {
  if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
    const want = el.type === 'checkbox' ? v === true : v === el.value;
    if (el.checked !== want) el.click();
    return;
  }
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')?.set?.call(el, String(v));
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
}

function restore(): string[] {
  const keys: string[] = [];
  for (const form of formsOf()) {
    const key = keyFor(form);
    const d = read(key);
    if (!d) continue;
    let changed = false;
    for (const el of fieldsOf(form)) {
      if (!(el.name in d.values)) continue;
      const v = d.values[el.name];
      if (el instanceof HTMLInputElement && el.type === 'radio') {
        if (v === el.value && !el.checked) {
          setField(el, v);
          changed = true;
        }
        continue;
      }
      const now = el instanceof HTMLInputElement && el.type === 'checkbox' ? el.checked : el.value;
      if (now !== v) {
        setField(el, v);
        changed = true;
      }
    }
    if (changed) keys.push(key);
    else clear(key);
  }
  return keys;
}

async function me(): Promise<Me | null> {
  try {
    const r = await fetch('/api/me', { cache: 'no-store' });
    return (await r.json()) as Me;
  } catch {
    return null;
  }
}

const lapsed = (m: Me | null, path: string) => !!m && (!m.account || (!!m.isAdmin && !!m.stepUp && stepUpPath(path)));
const signInUrl = () => `/signin?reauth=1&next=${encodeURIComponent(location.pathname + location.search)}`;

export default function SessionGuard() {
  const path = usePathname();
  const [restored, setRestored] = useState<string[]>([]);
  const [due, setDue] = useState(false);
  const on = guarded(path);

  // Bring back unsaved changes after a sign-in
  useEffect(() => {
    if (!on) return;
    const t = setTimeout(() => setRestored(restore()), 50);
    return () => clearTimeout(t);
  }, [on, path]);

  // Keep drafts and check the sign-in before submitting
  useEffect(() => {
    if (!on) return;
    const draft = (e: Event) => {
      const form = (e.target as Element | null)?.closest?.('form');
      if (form && !isGet(form)) save(form);
    };
    const submit = async (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (!(form instanceof HTMLFormElement) || isGet(form)) return;
      if (form.dataset[PASS]) {
        delete form.dataset[PASS];
        clear(keyFor(form));
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      const submitter = e.submitter as HTMLButtonElement | null;
      if (fieldsOf(form).length) save(form);
      const m = await me();
      if (lapsed(m, location.pathname)) {
        location.href = signInUrl();
        return;
      }
      form.dataset[PASS] = '1';
      form.requestSubmit(submitter && submitter.form === form ? submitter : undefined);
    };
    document.addEventListener('input', draft, true);
    document.addEventListener('change', draft, true);
    window.addEventListener('submit', submit, true);
    return () => {
      document.removeEventListener('input', draft, true);
      document.removeEventListener('change', draft, true);
      window.removeEventListener('submit', submit, true);
    };
  }, [on]);

  // Warn before a change would hit the sign-in check
  useEffect(() => {
    if (!on) return;
    let stop = false;
    const check = async () => {
      const m = await me();
      if (!stop) setDue(lapsed(m, location.pathname));
    };
    check();
    const t = setInterval(check, 60_000);
    const vis = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', vis);
    return () => {
      stop = true;
      clearInterval(t);
      document.removeEventListener('visibilitychange', vis);
    };
  }, [on, path]);

  if (!on || (!due && !restored.length)) return null;
  return (
    <div className="fixed bottom-4 inset-x-4 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {restored.length > 0 && (
        <div role="status" className="pointer-events-auto max-w-lg w-full flex items-center justify-between gap-3 p-3 rounded-lg shadow-lg bg-blue-50 border border-blue-200 text-sm text-blue-900">
          <span>Your unsaved changes are back. Review and save.</span>
          <button
            type="button"
            className="font-semibold underline shrink-0"
            onClick={() => {
              restored.forEach(clear);
              location.reload();
            }}
          >
            Discard
          </button>
        </div>
      )}
      {due && (
        <div role="status" className="pointer-events-auto max-w-lg w-full flex items-center justify-between gap-3 p-3 rounded-lg shadow-lg bg-amber-50 border border-amber-300 text-sm text-amber-900">
          <span>For your security, sign in again before making changes. Anything you type now is kept.</span>
          <a href={signInUrl()} className="font-semibold underline shrink-0">Sign in</a>
        </div>
      )}
    </div>
  );
}
