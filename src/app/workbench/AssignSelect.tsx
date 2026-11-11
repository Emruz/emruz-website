'use client';

import { assignSelf } from './actions';

/** Assign a self-assessment to an analyst; saves on change. */
export default function AssignSelect({ id, value, staff }: { id: string; value: string | null; staff: { account_id: string; label: string }[] }) {
  return (
    <form action={assignSelf}>
      <input type="hidden" name="id" value={id} />
      <select
        name="assigned_to"
        defaultValue={value ?? ''}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        aria-label="Assigned analyst"
        className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white max-w-44"
      >
        <option value="">Unassigned</option>
        {staff.map((s) => (
          <option key={s.account_id} value={s.account_id}>{s.label}</option>
        ))}
      </select>
    </form>
  );
}
