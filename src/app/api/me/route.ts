import { NextResponse } from 'next/server';
import { currentAccount, isAdmin, needsStepUp } from '@/lib/server/session';
import { db } from '@/lib/server/db';
import { staffRole } from '@/lib/server/workbench';

// Who is signed in, for the header's account menu. Pages stay static; the
// header asks this after load.
export async function GET() {
  try {
    const a = await currentAccount();
    const isStaff = a ? !!(await staffRole(a)) : false;
    const isClient = a ? !!(await db()`select 1 from client_contacts where account_id = ${a.id} limit 1`).length : false;
    return NextResponse.json(
      a
        ? { account: { email: a.email, name: a.name }, isAdmin: isAdmin(a), isStaff, isClient, impersonatedBy: a.impersonatedBy?.email ?? null, stepUp: needsStepUp(a) }
        : { account: null },
      { headers: { 'cache-control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json({ account: null }, { headers: { 'cache-control': 'no-store' } });
  }
}
