import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const errorParam = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  console.log('=== AUTH CALLBACK DEBUG ===');
  console.log('Full URL:', request.url);
  console.log('Code present:', !!code);
  console.log('Error param:', errorParam);
  console.log('Error description:', errorDescription);
  console.log('All params:', Object.fromEntries(requestUrl.searchParams));

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    console.log('Session exchange result:', {
      hasData: !!data,
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      error: error?.message
    });

    if (error) {
      console.error('Session exchange error:', error);
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=auth_callback_error`);
    }

    // Verify session was actually created
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Session after exchange:', !!sessionData.session);
  } else if (errorParam) {
    console.error('OAuth error from provider:', { errorParam, errorDescription });
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=oauth_error`);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/projects`);
}