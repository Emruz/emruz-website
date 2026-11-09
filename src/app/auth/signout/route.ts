import { SITE_URL } from '@/lib/server/config';
import { NextResponse } from 'next/server';
import { sameOrigin } from '@/lib/server/api';
import { destroySession } from '@/lib/server/session';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return new NextResponse('Forbidden', { status: 403 });
  await destroySession();
  return NextResponse.redirect(new URL('/', SITE_URL), 303);
}
