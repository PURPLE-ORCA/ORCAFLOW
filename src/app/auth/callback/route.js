import { createServerClient } from '@supabase/ssr';
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
    const response = NextResponse.redirect(`${requestUrl.origin}/projects`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value;
          },
          set(name, value, options) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name, options) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

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

    return response;
  } else if (errorParam) {
    console.error('OAuth error from provider:', { errorParam, errorDescription });
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=oauth_error`);
  }

  // If no code or error, redirect to signin
  return NextResponse.redirect(`${requestUrl.origin}/auth/signin`);
}