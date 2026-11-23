import { NextResponse } from 'next/server';
import { removeClosure } from '@/lib/server/rates';
import { signedIn } from '@/lib/server/admin-auth';

export const dynamic = 'force-dynamic';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await signedIn())) {
    return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  }
  const { id } = await params;
  return NextResponse.json({ ok: await removeClosure(id) });
}
