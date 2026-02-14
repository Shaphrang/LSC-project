import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lsc, services } = body;

    /* 1️⃣ Get current row count to ensure the code grows with the DB */
    const { count, error: countError } = await supabaseAdmin
      .from('lscs')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    /* 2️⃣ Generate a UNIQUE 5-Digit Integer Code */
    let applicationCode: number = 0;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 15;

    while (!isUnique && attempts < maxAttempts) {
      // Generate random number between 10000 and 90000 to ensure 5 digits
      const randomBase = Math.floor(10000 + Math.random() * 80000); 
      
      // Add count to make it even more unique and sequential-ish
      const candidate = randomBase + (count || 0);

      // Check for collision in Supabase
      const { data: existing } = await supabaseAdmin
        .from('lscs')
        .select('applicationCode')
        .eq('applicationCode', candidate)
        .maybeSingle();

      if (!existing) {
        applicationCode = candidate;
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: "Could not generate a unique 5-digit code. Please try again." },
        { status: 500 }
      );
    }

    /* 3️⃣ Insert the LSC Record */
    const { data: lscRow, error: lscError } = await supabaseAdmin
      .from('lscs')
      .insert({
        ...lsc,
        applicationCode: applicationCode,
        is_active: false,
        status: 'PENDING' // Ensure status matches your Admin Panel filter
      })
      .select('id')
      .single();

    if (lscError || !lscRow) {
      return NextResponse.json(
        { error: lscError?.message || 'Failed to create LSC record' },
        { status: 400 }
      );
    }

    /* 4️⃣ Insert Related Services */
    if (services && Array.isArray(services) && services.length > 0) {
      const serviceRows = services.map((serviceId: string) => ({
        lsc_id: lscRow.id,
        service_item_id: serviceId,
      }));

      const { error: serviceError } = await supabaseAdmin
        .from('lsc_services')
        .insert(serviceRows);

      if (serviceError) {
        await supabaseAdmin.from('lscs').delete().eq('id', lscRow.id);
        return NextResponse.json(
          { error: `Service mapping failed: ${serviceError.message}` },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      applicationCode: applicationCode,
    });

  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}