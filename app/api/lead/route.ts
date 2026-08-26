import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_GAS_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbyQOHCmm_HnucXSwAWej6K_UCsNxeiJlWljyH2nlmd_gcC1xmbcudzy30hUaQIrOqon/exec';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null);
    if (!payload || !payload.phone) {
      return NextResponse.json({ ok: false, error: 'Invalid lead payload' }, { status: 400 });
    }

    const endpoint = process.env.GOOGLE_APPS_SCRIPT_LEAD_URL || DEFAULT_GAS_ENDPOINT;

    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
