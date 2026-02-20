import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // M-Pesa callback data
    const { Body } = body;

    if (Body?.stkCallback) {
      const { ResultCode, ResultDesc, CallbackMetadata, CheckoutRequestID } = Body.stkCallback;

      if (ResultCode === 0) {
        // Payment successful
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

        // TODO: Update payment record in Supabase
        // await supabase.from('pos_sales').update({ mpesa_reference: mpesaRef, status: 'Completed' })...
      } else {
        console.log('M-Pesa Payment Failed:', { ResultCode, ResultDesc });
      }
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Error' });
  }
}
