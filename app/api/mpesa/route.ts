import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// M-Pesa Daraja API Integration
const MPESA_AUTH_URL = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
  : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

const MPESA_STK_URL = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
  : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

const MPESA_QUERY_URL = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
  : 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';

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

function formatPhone(phone: string): string {
  let formatted = phone.replace(/\s/g, '');
  if (formatted.startsWith('+')) formatted = formatted.substring(1);
  if (formatted.startsWith('0')) formatted = '254' + formatted.substring(1);
  if (!formatted.startsWith('254')) formatted = '254' + formatted;
  return formatted;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle STK query
    if (body.action === 'query') {
      return handleStkQuery(body.checkoutRequestId);
    }

    // Handle STK push
    const { phone, amount, accountReference, description } = body;

    if (!phone || !amount) {
      return NextResponse.json(
        { success: false, message: 'Phone number and amount are required' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhone(phone);
    const accessToken = await getAccessToken();
    const timestamp = generateTimestamp();
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY || '';
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const callbackUrl = process.env.MPESA_CALLBACK_URL || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bakery-system-new.netlify.app'}/api/mpesa/callback`;

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference || 'SNACKOH',
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
      // Store the transaction in Supabase for tracking
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          await supabase.from('mpesa_transactions').insert({
            checkout_request_id: data.CheckoutRequestID,
            merchant_request_id: data.MerchantRequestID,
            phone: formattedPhone,
            amount: Math.ceil(amount),
            account_reference: accountReference || 'SNACKOH',
            status: 'pending',
          });
        }
      } catch (e) {
        console.error('Failed to store mpesa transaction:', e);
      }

      return NextResponse.json({
        success: true,
        message: 'STK Push sent successfully. Check your phone.',
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
      });
    } else {
      return NextResponse.json(
        { success: false, message: data.errorMessage || data.CustomerMessage || 'STK Push failed', data },
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

async function handleStkQuery(checkoutRequestId: string) {
  try {
    // First check our database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: txn } = await supabase
        .from('mpesa_transactions')
        .select('*')
        .eq('checkout_request_id', checkoutRequestId)
        .single();

      if (txn && txn.status === 'completed') {
        return NextResponse.json({
          success: true,
          status: 'completed',
          mpesaRef: txn.mpesa_receipt_number,
          amount: txn.amount,
        });
      }

      if (txn && txn.status === 'failed') {
        return NextResponse.json({
          success: false,
          status: 'failed',
          message: txn.result_desc || 'Payment failed or cancelled',
        });
      }
    }

    // Fall back to querying M-Pesa API directly
    const accessToken = await getAccessToken();
    const timestamp = generateTimestamp();
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY || '';
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const response = await fetch(MPESA_QUERY_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
    });

    const data = await response.json();

    if (data.ResultCode === '0' || data.ResultCode === 0) {
      return NextResponse.json({
        success: true,
        status: 'completed',
        message: data.ResultDesc,
      });
    } else {
      return NextResponse.json({
        success: false,
        status: data.ResultCode === '1032' ? 'cancelled' : 'pending',
        message: data.ResultDesc || 'Payment pending',
      });
    }
  } catch (error) {
    console.error('STK query error:', error);
    return NextResponse.json({
      success: false,
      status: 'pending',
      message: 'Unable to verify payment status',
    });
  }
}
