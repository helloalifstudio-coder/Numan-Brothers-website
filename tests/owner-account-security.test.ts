import {describe,test,expect} from 'bun:test';
import {readFileSync} from 'node:fs';

const content=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

describe('owner-only self-service Auth account settings',()=>{
  test('cannot use the account panel without an authenticated owner',()=>{
    const studio=content('src/components/CmsStudio.tsx');
    expect(studio).toContain("section==='account'&&staff.role==='owner'");
    expect(studio).toContain("id!=='account'||staff.role==='owner'");
    expect(studio).toContain("onPasswordChanged={logoutAfterPasswordChange}");
    const account=content('src/components/studio/CmsAccount.tsx');
    expect(account).toContain("client.auth.getUser()");
    expect(account).toContain("data.user.app_metadata?.nb_role!=='owner'");
    expect(account).toContain('Only a signed-in CMS owner');
    expect(account).not.toContain('client.auth.admin.');
    expect(account).not.toContain('service_role');
  });
  test('updates own email through Auth confirmation and never writes account identity SQL',()=>{
    const account=content('src/components/studio/CmsAccount.tsx');
    expect(account).toContain('client.auth.reauthenticate()');
    expect(account).toContain('client.auth.updateUser({email:target,nonce:nonce.trim()})');
    expect(account).toContain('Confirm the links in the old and new inboxes');
    expect(account).not.toContain("client.from('auth.users')");
    expect(account).not.toContain('setUserMetadata');
  });
  test('requires old password, new password confirmation and OTP, and signs out',()=>{
    const account=content('src/components/studio/CmsAccount.tsx');
    expect(account).toContain('newPassword.length<12');
    expect(account).toContain('newPassword!==confirmPassword');
    expect(account).toContain('current_password:currentPassword');
    expect(account).toContain('nonce:nonce.trim()');
    expect(account).toContain('await onPasswordChanged()');
    expect(account).not.toContain('localStorage');
    expect(account).not.toContain('sessionStorage');
    const studio=content('src/components/CmsStudio.tsx');
    expect(studio).toContain("Password updated. Sign in with your new password.");
  });
  test('owner bootstrap targets a confirmed example email without hardcoded password',()=>{
    const sql=content('supabase/sql-editor/NOMAN_BROTHERS_ASSIGN_OWNER_AFTER_AUTH.sql');
    expect(sql).toContain("owner_email text := 'admin@gmail.com'");
    expect(sql).toContain('email_confirmed_at is not null');
    expect(sql).toContain('conflicting_staff');
    expect(sql).toContain('raw_app_meta_data');
    expect(sql).not.toMatch(/password\\s*(?::=|=)\\s*'[^']+'/i);
    expect(sql).not.toContain('encrypted_password');
    expect(sql).not.toContain('INSERT INTO auth.users');
  });
});
