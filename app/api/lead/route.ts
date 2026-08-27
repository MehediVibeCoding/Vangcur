import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null);

    if (!payload || typeof payload !== 'object' || !payload.phone) {
      return NextResponse.json({ ok: false, error: 'Invalid lead payload' }, { status: 400 });
    }

    const phoneStr = String(payload.phone || '').trim();
    if (phoneStr.length < 10 || phoneStr.length > 15) {
      return NextResponse.json({ ok: false, error: 'Invalid phone format' }, { status: 400 });
    }

    const endpoint = process.env.GOOGLE_APPS_SCRIPT_LEAD_URL;
    if (!endpoint) {
      // যদি সার্ভারে Apps Script লিংক কনফিগার করা না থাকে তবে রিকোয়েস্ট আটকে না রেখে সফটলি পাস করা হবে
      return NextResponse.json({ ok: true });
    }

    const safePayload = {
      action: 'addLead',
      leadId: String(payload.leadId || '').slice(0, 50),
      date: String(payload.date || '').slice(0, 50),
      name: String(payload.name || '').slice(0, 100),
      phone: phoneStr,
      dist: String(payload.dist || '').slice(0, 50),
      addr: String(payload.addr || '').slice(0, 300),
      email: String(payload.email || '').slice(0, 150),
      items: String(payload.items || '').slice(0, 500),
      total: Number(payload.total) || 0,
    };

    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safePayload),
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
