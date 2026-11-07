/** Helpful authentication diagnostics, without granting or fabricating CMS access. */
export type CmsRole = 'owner' | 'admin' | 'editor';

export function cmsRole(value: unknown): CmsRole | null {
  return value === 'owner' || value === 'admin' || value === 'editor' ? value : null;
}

export function cmsSignInError(error: unknown): string {
  const obj = error && typeof error === 'object' ? error as {code?:unknown;message?:unknown;status?:unknown} : {};
  const code = typeof obj.code === 'string' ? obj.code.toLowerCase() : '';
  const message = typeof obj.message === 'string' ? obj.message : '';
  const status = typeof obj.status === 'number' ? obj.status : null;

  if (code === 'email_not_confirmed' || /email not confirmed/i.test(message))
    return 'This email address has not been confirmed. Check Supabase Authentication → Users, confirm the address you own, then sign in again.';
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message))
    return 'Email or password was not accepted. Check the user in this Noman Supabase project, verify the exact email, and reset the password from Supabase Authentication if needed.';
  if (code === 'email_provider_disabled' || /email signups? (?:are? )?disabled/i.test(message))
    return 'Email/password authentication is disabled for this Supabase project. Enable the Email provider in Authentication → Sign In / Providers.';
  if (status === 429 || code === 'over_request_rate_limit' || /rate limit/i.test(message))
    return 'Too many sign-in attempts. Check the Supabase Auth rate limit and retry later instead of guessing passwords.';
  if (status === 401 && /api key|apikey/i.test(message))
    return 'Supabase rejected the public project key. Verify that the Vercel publishable key belongs to the same Noman Supabase project and rebuild the site.';
  if (/failed to fetch|networkerror|network request failed|load failed/i.test(message))
    return 'Cannot reach Supabase Authentication from this browser. Check the internet connection and try disabling blocking extensions, then review the Auth service status.';
  if (status && status >= 500)
    return 'Supabase Authentication encountered a server problem. Check your project status and Authentication logs, then retry.';
  return 'Unable to sign in. Check the exact error in Supabase Authentication logs and verify this account belongs to the connected project.';
}

export function cmsRoleHelp(): string {
  return 'Supabase accepted the account, but it has no authorized CMS role. An administrator must assign app_metadata.nb_role to owner, admin or editor in Supabase Auth; changing user_metadata or simply creating the user is not sufficient.';
}
