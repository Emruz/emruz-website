/**
 * The Save button for a form with several fields: blue, at the top of the form, and kept in
 * view under the sticky header while the form scrolls. Put it first inside the <form>, or pass
 * `form` with the form's id when it sits outside. A single-field inline form can keep a small
 * blue Save button next to its field instead.
 */
export default function SaveBar({
  label = 'Save changes',
  note = 'Changes apply when you save.',
  form,
}: {
  label?: string;
  note?: string;
  form?: string;
}) {
  return (
    <div className="sticky top-16 z-30 -mx-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
      <p className="text-sm text-gray-700">{note}</p>
      <button form={form} className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        {label}
      </button>
    </div>
  );
}
