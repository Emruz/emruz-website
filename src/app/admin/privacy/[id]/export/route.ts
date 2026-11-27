import { NextResponse } from 'next/server';
import { isUuid } from '@/lib/server/api';
import { db, logEvent } from '@/lib/server/db';
import { exportSubject, getRequest, subjectForAccount, subjectForEmail } from '@/lib/server/privacy';
import { currentAccount, isAdmin, needsStepUp } from '@/lib/server/session';

/** Access request: the requester's data as JSON, for the admin to send securely. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const a = await currentAccount();
  if (!isAdmin(a) || !isUuid(id)) return new NextResponse('Not found', { status: 404 });
  if (needsStepUp(a!)) return new NextResponse('Sign in again to export data.', { status: 403 });
  const r = await getRequest(id);
  if (!r || r.kind !== 'access' || !['open', 'in_progress'].includes(r.status)) return new NextResponse('Not found', { status: 404 });
  const subject = r.account_id ? await subjectForAccount(db(), r.account_id) : await subjectForEmail(db(), r.email);
  const data = await exportSubject(db(), subject);
  await logEvent('privacy_exported', { id }, { actor: `admin:${a!.email}` });
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="privacy-request-${id.slice(0, 8)}.json"`,
      'cache-control': 'no-store',
    },
  });
}
