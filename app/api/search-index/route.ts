// ফাইলের পাথ: app/api/search-index/route.ts
// [NEW] নেভবার-সার্চ, কার্ট সাইডবার ও কুইক-অর্ডার — এই তিন জায়গা আগে প্রতিটা ভিজিটরের ব্রাউজার
// থেকে সরাসরি Supabase-এ গিয়ে পুরো ক্যাটালগ (প্রতিটা প্রোডাক্টের পুরো ডেটা) নামাত।
// ৫০০ প্রোডাক্টে সেটা ভিজিটর-প্রতি ~৭০০ KB+ এবং প্রতিবার ডাটাবেস হিট।
//
// এখন: একটা হালকা "ইনডেক্স" (শুধু সার্চ/কার্টে দরকারি ফিল্ড, বড় বর্ণনা ছাঁটা) — সার্ভারে একবার
// বানিয়ে ৫ মিনিট CDN-এ ক্যাশ হয়; হাজারো ভিজিটর একই কপি পায়, ডাটাবেসে মাত্র একটা কোয়েরি যায়।
// অ্যাডমিন থেকে প্রোডাক্ট বদলালে /api/revalidate-catalog এই ক্যাশও মুছে দেয়।

import { NextResponse } from 'next/server';
import { getCachedCatalogIndex } from '@/lib/catalogIndex';

export const dynamic = 'force-static';
export const revalidate = 300;

export async function GET() {
  try {
    const products = await getCachedCatalogIndex();
    return NextResponse.json(
      { products },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
    );
  } catch {
    return NextResponse.json({ products: [] });
  }
}
