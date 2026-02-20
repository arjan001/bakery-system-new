import { NextRequest, NextResponse } from 'next/server';

// M-Pesa Daraja API Integration
const MPESA_AUTH_URL = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
  : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

const MPESA_STK_URL = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
  : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const response = await fetch(MPESA_AUTH_URL, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
  });

  const data = await response.json();
  return data.access_token;
}

function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export async function POST(request: NextRequest) {
  try {
    const { phone, amount, accountReference, description } = await request.json();

    if (!phone || !amount) {
      return NextResponse.json(
        { success: false, message: 'Phone number and amount are required' },
        { status: 400 }
      );
    }

    // Format phone number (remove leading 0 or +254, add 254)
    let formattedPhone = phone.replace(/\s/g, '');
    if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);

    const accessToken = await getAccessToken();
    const timestamp = generateTimestamp();
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY || '';
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/mpesa/callback',
      AccountReference: accountReference || 'BakeryPOS',
      TransactionDesc: description || 'POS Payment',
    };

    const response = await fetch(MPESA_STK_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    });

    const data = await response.json();

    if (data.ResponseCode === '0') {
      return NextResponse.json({
        success: true,
        message: 'STK Push sent successfully. Check your phone.',
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
      });
    } else {
      return NextResponse.json(
        { success: false, message: data.errorMessage || 'STK Push failed', data },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, message: `M-Pesa error: ${message}` },
      { status: 500 }
    );
  }
}
