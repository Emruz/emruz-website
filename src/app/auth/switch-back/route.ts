import { NextResponse } from 'next/server';
import { sameOrigin } from '@/lib/server/api';
import { logEvent } from '@/lib/server/db';
import { currentAccount, stopImpersonation } from '@/lib/server/session';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return new NextResponse('Forbidden', { status: 403 });
  const viewing = await currentAccount();
  if (await stopImpersonation()) {
    if (viewing?.impersonatedBy) {
      await logEvent('switch_user_ended', { viewed: viewing.email }, { accountId: viewing.id, actor: `admin:${viewing.impersonatedBy.email}` });
    }
    return NextResponse.redirect(new URL('/admin/users', req.url), 303);
  }
  return NextResponse.redirect(new URL('/', req.url), 303);
}
