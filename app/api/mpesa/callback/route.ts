import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { Body } = body;

    if (Body?.stkCallback) {
      const { ResultCode, ResultDesc, CallbackMetadata, CheckoutRequestID } = Body.stkCallback;

      if (ResultCode === 0) {
        const metadata = CallbackMetadata?.Item || [];
        const amount = metadata.find((item: { Name: string }) => item.Name === 'Amount')?.Value;
        const mpesaRef = metadata.find((item: { Name: string }) => item.Name === 'MpesaReceiptNumber')?.Value;
        const phone = metadata.find((item: { Name: string }) => item.Name === 'PhoneNumber')?.Value;

        console.log('M-Pesa Payment Success:', {
          checkoutRequestId: CheckoutRequestID,
          amount,
          mpesaRef,
          phone,
        });

        // Update payment record in Supabase
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);

          // Update pos_sales where mpesa_phone matches and status is pending
          await supabase
            .from('mpesa_transactions')
            .upsert({
              checkout_request_id: CheckoutRequestID,
              mpesa_receipt_number: mpesaRef,
              phone: String(phone),
              amount,
              result_code: ResultCode,
              result_desc: ResultDesc,
              status: 'completed',
              updated_at: new Date().toISOString(),
            }, { onConflict: 'checkout_request_id' });
        }
      } else {
        console.log('M-Pesa Payment Failed:', { ResultCode, ResultDesc, CheckoutRequestID });

        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          await supabase
            .from('mpesa_transactions')
            .upsert({
              checkout_request_id: CheckoutRequestID,
              result_code: ResultCode,
              result_desc: ResultDesc,
              status: 'failed',
              updated_at: new Date().toISOString(),
            }, { onConflict: 'checkout_request_id' });
        }
      }
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Error' });
  }
}
