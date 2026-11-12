'use client';

import { useState, type ReactNode } from 'react';
import { Mail, MapPin, Pencil, Phone, Building2 } from 'lucide-react';
import type { Address, ContactProfile } from '@/lib/server/profile';
import PhotoPicker from './PhotoPicker';
import { addEmailAddress, makeDefaultEmail, removeEmailAddress, removePhoto, saveProfile } from './actions';

const input = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100';
const label = 'block text-sm font-semibold text-gray-900 mb-1';
const btn = 'px-4 py-2 rounded-md font-semibold bg-blue-600 text-white hover:bg-blue-700';
const ghost = 'px-4 py-2 rounded-md font-semibold border border-gray-300 text-gray-800 hover:bg-gray-50';
const small = 'text-sm font-semibold text-blue-700 hover:underline';
const F = 'profile-form';

const blankAddress: Address = { label: null, line1: '', line2: null, city: null, region: null, postal_code: null, country: null, is_default: false };

function addressLines(a: Address) {
  return [a.line1, a.line2, [a.city, [a.region, a.postal_code].filter(Boolean).join(' ')].filter(Boolean).join(', '), a.country].filter(Boolean);
}

function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid sm:grid-cols-[9rem_1fr] gap-1 sm:gap-4 py-4 border-t border-gray-100 first:border-0">
      <dt className="text-sm font-semibold text-gray-500">{title}</dt>
      <dd className="text-gray-900">{children}</dd>
    </div>
  );
}

export default function ProfileCard({
  profile,
  photo,
  initials,
  startEditing,
  message,
  locked,
}: {
  profile: ContactProfile;
  photo: string | null;
  initials: string;
  startEditing: boolean;
  message: { text: string; ok: boolean } | null;
  locked: boolean;
}) {
  const [editing, setEditing] = useState(startEditing && !locked);
  const [addresses, setAddresses] = useState<Address[]>(profile.addresses.length ? profile.addresses : []);
  const [def, setDef] = useState(Math.max(0, profile.addresses.findIndex((a) => a.is_default)));
  const none = <span className="text-gray-400">Not set</span>;

  const status = message && (
    <p role="status" className={`mb-4 text-sm font-semibold ${message.ok ? 'text-emerald-700' : 'text-red-700'}`}>
      {message.text}
    </p>
  );

  if (!editing) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
        {status}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="w-20 h-20 rounded-full object-cover border border-gray-200" />
            ) : (
              <span className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl font-semibold flex items-center justify-center">
                {initials}
              </span>
            )}
            <div>
              <p className="text-xl font-bold text-gray-900">{profile.name || profile.email}</p>
              {(profile.job_title || profile.company) && <p className="text-gray-600">{[profile.job_title, profile.company].filter(Boolean).join(', ')}</p>}
            </div>
          </div>
          {!locked && (
            <button onClick={() => setEditing(true)} className={`${ghost} inline-flex items-center gap-1.5`}>
              <Pencil className="w-4 h-4" aria-hidden /> Edit
            </button>
          )}
        </div>
        <dl>
          <Row title="Full name">{profile.name || none}</Row>
          <Row title="Title">{profile.job_title || none}</Row>
          <Row title="Email">
            <ul className="space-y-1">
              {profile.emails.map((e) => (
                <li key={e.email} className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" aria-hidden />
                  {e.email}
                  {e.isDefault && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Default</span>}
                </li>
              ))}
            </ul>
          </Row>
          <Row title="Phone">
            {profile.phone_mobile || profile.phone_work ? (
              <ul className="space-y-1">
                {profile.phone_mobile && <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" aria-hidden />{profile.phone_mobile} <span className="text-sm text-gray-500">mobile</span></li>}
                {profile.phone_work && <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" aria-hidden />{profile.phone_work} <span className="text-sm text-gray-500">work</span></li>}
              </ul>
            ) : none}
          </Row>
          <Row title="Company">{profile.company ? <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-400" aria-hidden />{profile.company}</span> : none}</Row>
          <Row title="Address">
            {profile.addresses.length ? (
              <ul className="grid sm:grid-cols-2 gap-4">
                {profile.addresses.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1 shrink-0" aria-hidden />
                    <span>
                      <span className="text-sm font-semibold text-gray-700">
                        {a.label || 'Address'}
                        {a.is_default && profile.addresses.length > 1 && <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Default</span>}
                      </span>
                      {addressLines(a).map((l) => <span key={l} className="block">{l}</span>)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : none}
          </Row>
        </dl>
      </div>
    );
  }

  const setAddr = (i: number, k: keyof Address, v: string) =>
    setAddresses((list) => list.map((a, n) => (n === i ? { ...a, [k]: v } : a)));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 space-y-6">
      {status}
      {/* Fields below belong to this form through form="profile-form", so the email forms can sit between them */}
      <form id={F} action={saveProfile} />

      <section>
        <h3 className={label}>Photo</h3>
        <PhotoPicker current={photo} initials={initials} />
        {photo && (
          <form action={removePhoto} className="mt-2">
            <button className="text-sm font-semibold text-red-700 hover:underline">Remove photo</button>
          </form>
        )}
      </section>

      <section>
        <label className={label} htmlFor="name">Full name</label>
        <input id="name" name="name" form={F} defaultValue={profile.name ?? ''} maxLength={120} className={input} />
      </section>

      <section>
        <label className={label} htmlFor="job_title">Title</label>
        <input id="job_title" name="job_title" form={F} defaultValue={profile.job_title ?? ''} maxLength={120} placeholder="e.g. Director of IT" className={input} />
      </section>

      <section>
        <h3 className={label}>Email</h3>
        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-md mb-3">
          {profile.emails.map((e) => (
            <li key={e.email} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                {e.email}
                {e.isDefault && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Default</span>}
              </span>
              {!e.isDefault && (
                <span className="flex gap-4">
                  <form action={makeDefaultEmail}>
                    <input type="hidden" name="email" value={e.email} />
                    <button className={small}>Make default</button>
                  </form>
                  {e.removableId && (
                    <form action={removeEmailAddress}>
                      <input type="hidden" name="identity" value={e.removableId} />
                      <button className="text-sm font-semibold text-red-700 hover:underline">Remove</button>
                    </form>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
        <form action={addEmailAddress} className="flex flex-wrap gap-2">
          <label htmlFor="new_email" className="sr-only">Add an email</label>
          <input id="new_email" name="email" type="email" required placeholder="Add another email" className={`${input} flex-1 min-w-56`} />
          <button className={ghost}>Send confirmation link</button>
        </form>
        <p className="text-xs text-gray-500 mt-1">We email a link to confirm the address before it is added. The default is where we send everything.</p>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="phone_mobile">Mobile phone</label>
          <input id="phone_mobile" name="phone_mobile" type="tel" form={F} defaultValue={profile.phone_mobile ?? ''} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="phone_work">Work phone</label>
          <input id="phone_work" name="phone_work" type="tel" form={F} defaultValue={profile.phone_work ?? ''} className={input} />
        </div>
      </section>

      <section>
        <label className={label} htmlFor="company">Company</label>
        <input id="company" name="company" form={F} defaultValue={profile.company ?? ''} maxLength={160} className={input} />
      </section>

      <section>
        <h3 className={label}>Addresses</h3>
        <div className="space-y-4">
          {addresses.map((a, i) => (
            <fieldset key={i} className="border border-gray-200 rounded-md p-4 space-y-3">
              <legend className="sr-only">Address {i + 1}</legend>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <input aria-label="Label" name="addr_label" form={F} value={a.label ?? ''} onChange={(e) => setAddr(i, 'label', e.target.value)} placeholder="Label, e.g. Office or Home" className={`${input} max-w-xs`} />
                <span className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-1.5">
                    <input type="radio" name="addr_default" form={F} value={i} checked={def === i} onChange={() => setDef(i)} /> Default
                  </label>
                  <button type="button" className="font-semibold text-red-700 hover:underline" onClick={() => { setAddresses((l) => l.filter((_, n) => n !== i)); setDef((d) => (d === i ? 0 : d > i ? d - 1 : d)); }}>
                    Remove
                  </button>
                </span>
              </div>
              <input aria-label="Street address" name="addr_line1" form={F} value={a.line1} onChange={(e) => setAddr(i, 'line1', e.target.value)} placeholder="Street address" className={input} />
              <input aria-label="Suite, floor" name="addr_line2" form={F} value={a.line2 ?? ''} onChange={(e) => setAddr(i, 'line2', e.target.value)} placeholder="Suite, floor (optional)" className={input} />
              <div className="grid sm:grid-cols-4 gap-3">
                <input aria-label="City" name="addr_city" form={F} value={a.city ?? ''} onChange={(e) => setAddr(i, 'city', e.target.value)} placeholder="City" className={`${input} sm:col-span-2`} />
                <input aria-label="State or region" name="addr_region" form={F} value={a.region ?? ''} onChange={(e) => setAddr(i, 'region', e.target.value)} placeholder="State" className={input} />
                <input aria-label="ZIP or postal code" name="addr_postal" form={F} value={a.postal_code ?? ''} onChange={(e) => setAddr(i, 'postal_code', e.target.value)} placeholder="ZIP" className={input} />
              </div>
              <input aria-label="Country" name="addr_country" form={F} value={a.country ?? ''} onChange={(e) => setAddr(i, 'country', e.target.value)} placeholder="Country" className={input} />
            </fieldset>
          ))}
        </div>
        <button type="button" className={`${small} mt-3`} onClick={() => setAddresses((l) => [...l, { ...blankAddress }])}>
          + Add an address
        </button>
      </section>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button form={F} className={btn}>Save</button>
        <button type="button" className={ghost} onClick={() => {
            setAddresses(profile.addresses);
            setDef(Math.max(0, profile.addresses.findIndex((a) => a.is_default)));
            setEditing(false);
          }}>Cancel</button>
      </div>
    </div>
  );
}
