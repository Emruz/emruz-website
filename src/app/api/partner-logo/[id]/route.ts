import { NextResponse } from 'next/server';
import { isUuid } from '@/lib/server/api';
import { getPartnerLogo } from '@/lib/server/partners';
import { detectType } from '@/lib/server/filetype';
import { currentAccount } from '@/lib/server/session';

// Partner logos are shown to signed-in people only (reports, workbench).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id) || !(await currentAccount())) return new NextResponse(null, { status: 404 });
  const data = await getPartnerLogo(id);
  if (!data) return new NextResponse(null, { status: 404 });
  const type = await detectType(data);
  if (type !== 'image/jpeg' && type !== 'image/png' && type !== 'image/webp') return new NextResponse(null, { status: 404 });
  return new NextResponse(data, {
    headers: {
      'content-type': type,
      'cache-control': 'private, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
    },
  });
}
