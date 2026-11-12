'use client';

import { useState } from 'react';
import { contactForEngagement } from '../actions';
import { input, label } from '../ui';

type Contact = Awaited<ReturnType<typeof contactForEngagement>>;

/** Pick a contact to start from; their company becomes the client and their profile shows here. */
export default function ClientPicker({
  clients,
  contacts,
  defaultClient,
}: {
  clients: { id: string; name: string }[];
  contacts: { id: string; name: string | null; email: string; company: string | null }[];
  defaultClient: string;
}) {
  const [contact, setContact] = useState<Contact>(null);
  const [clientId, setClientId] = useState(defaultClient);
  const [newClient, setNewClient] = useState('');
  const [loading, setLoading] = useState(false);

  async function pick(id: string) {
    if (!id) return setContact(null);
    setLoading(true);
    const c = await contactForEngagement(id);
    setLoading(false);
    setContact(c);
    if (c?.clientId) {
      setClientId(c.clientId);
      setNewClient('');
    } else if (c?.company) {
      setClientId('');
      setNewClient(c.company);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={label} htmlFor="contact_id">Start from a contact (optional)</label>
        <select id="contact_id" name="contact_id" className={input} defaultValue="" onChange={(e) => pick(e.target.value)}>
          <option value="">None</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {[c.name, c.company].filter(Boolean).join(', ') || c.email} ({c.email})
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Fills in the client, executive sponsor and locations from their profile.</p>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading profile…</p>}
      {contact && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 text-sm space-y-2">
          <p className="font-semibold text-gray-900">
            {contact.name || contact.email}
            {(contact.job_title || contact.company) && (
              <span className="font-normal text-gray-600"> · {[contact.job_title, contact.company].filter(Boolean).join(', ')}</span>
            )}
          </p>
          <p className="text-gray-700">
            {contact.email}
            {contact.phone_mobile && <> · {contact.phone_mobile} (mobile)</>}
            {contact.phone_work && <> · {contact.phone_work} (work)</>}
          </p>
          {contact.addresses.length > 0 && (
            <ul className="grid sm:grid-cols-2 gap-2 text-gray-700">
              {contact.addresses.map((a, i) => (
                <li key={i} className="whitespace-pre-line">
                  <span className="font-semibold">{a.label || 'Address'}{a.is_default && contact.addresses.length > 1 ? ' (default)' : ''}</span>
                  {'\n'}
                  {a.text}
                </li>
              ))}
            </ul>
          )}
          <label className="flex gap-2 text-gray-800 pt-1">
            <input type="checkbox" name="contact_portal" defaultChecked /> Add them as a client contact with portal access
          </label>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="client_id">Client</label>
          <select id="client_id" name="client_id" value={clientId} onChange={(e) => { setClientId(e.target.value); if (e.target.value) setNewClient(''); }} className={input}>
            <option value="">Choose…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="new_client">Or new client</label>
          <input id="new_client" name="new_client" value={newClient} onChange={(e) => { setNewClient(e.target.value); if (e.target.value) setClientId(''); }} className={input} placeholder="Company name" />
        </div>
      </div>
    </div>
  );
}
