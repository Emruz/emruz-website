/** One or two initials for an avatar, from the name or else the email. */
export function initials(a: { email: string; name: string | null }): string {
  const fromName = (a.name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  return (fromName || a.email[0] || '?').toUpperCase();
}
