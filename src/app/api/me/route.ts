import { NextResponse } from 'next/server';
import { currentAccount, isAdmin } from '@/lib/server/session';

// Who is signed in, for the header's account menu. Pages stay static; the
// header asks this after load.
export async function GET() {
  try {
    const a = await currentAccount();
    return NextResponse.json(
      a
        ? { account: { email: a.email, name: a.name }, isAdmin: isAdmin(a), impersonatedBy: a.impersonatedBy?.email ?? null }
        : { account: null },
      { headers: { 'cache-control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json({ account: null }, { headers: { 'cache-control': 'no-store' } });
  }
}
