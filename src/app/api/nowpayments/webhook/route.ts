import { NextRequest, NextResponse } from 'next/server';

/**
 * Optional public webhook alias on the frontend domain.
 *
 * The Express backend remains the only place that verifies the NOWPayments
 * HMAC signature. This route forwards the raw request body and signature
 * header unchanged, so https://accuracy.tools/api/nowpayments/webhook and
 * https://our-project-bk.vercel.app/api/nowpayments/webhook both work.
 *
 * No secret is read or exposed here.
 */
function resolveBackendBaseUrl(): string | null {
  const explicit = process.env.BACKEND_URL || process.env.PAYMENT_BACKEND_URL;
  if (explicit) return explicit.replace(/\/+$/, '');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    return apiUrl.replace(/\/api\/v1\/?$/i, '').replace(/\/+$/, '');
  }

  return null;
}

export async function POST(request: NextRequest) {
  const backendBase = resolveBackendBaseUrl();
  if (!backendBase) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PAYMENT_BACKEND_NOT_CONFIGURED',
          message: 'BACKEND_URL or NEXT_PUBLIC_API_URL must be configured on the frontend deployment.'
        }
      },
      { status: 503 }
    );
  }

  const rawBody = await request.text();
  if (!rawBody) {
    return NextResponse.json(
      { success: false, error: { code: 'EMPTY_PAYLOAD', message: 'Webhook payload is empty.' } },
      { status: 400 }
    );
  }

  const signature = request.headers.get('x-nowpayments-sig');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const backendResponse = await fetch(`${backendBase}/api/nowpayments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        ...(signature ? { 'x-nowpayments-sig': signature } : {})
      },
      body: rawBody,
      signal: controller.signal,
      cache: 'no-store'
    });

    const responseBody = await backendResponse.text();
    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        'Content-Type': backendResponse.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: any) {
    const timedOut = error?.name === 'AbortError';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: timedOut ? 'PAYMENT_BACKEND_TIMEOUT' : 'PAYMENT_BACKEND_UNREACHABLE',
          message: timedOut
            ? 'Payment backend did not respond in time.'
            : 'Payment backend is unreachable.'
        }
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
