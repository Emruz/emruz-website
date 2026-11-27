import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/server/config';
import { db, logEvent, rateLimit } from '@/lib/server/db';
import { exportSubject, subjectForAccount } from '@/lib/server/privacy';
import { currentAccount, needsStepUp } from '@/lib/server/session';

/** Download everything we hold about the signed-in user as JSON. Needs a recent sign-in. */
export async function GET() {
  const to = (path: string) => NextResponse.redirect(new URL(path, SITE_URL), 303);
  const a = await currentAccount();
  if (!a) return to('/signin?next=/account/export');
  if (a.impersonatedBy) return new NextResponse('Switch back to your own account to export data.', { status: 403 });
  if (needsStepUp(a)) return to(`/signin?reauth=1&next=${encodeURIComponent('/account/export')}`);
  if (!(await rateLimit(`data-export:${a.id}`, 10, 3600))) return to('/account?data=limit');
  const data = await exportSubject(db(), await subjectForAccount(db(), a.id));
  await logEvent('data_exported', {}, { accountId: a.id });
  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="emruz-data-${day}.json"`,
      'cache-control': 'no-store',
    },
  });
}
