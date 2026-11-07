import {describe,expect,test} from 'bun:test';
import {readFileSync} from 'node:fs';
import {cmsRole,cmsRoleHelp,cmsSignInError} from '../src/lib/cmsAuth';

describe('Noman CMS authentication and role recovery',()=>{
  test('allows only the three server-provisioned staff roles',()=>{
    expect(cmsRole('owner')).toBe('owner');
    expect(cmsRole('admin')).toBe('admin');
    expect(cmsRole('editor')).toBe('editor');
    expect(cmsRole('authenticated')).toBeNull();
    expect(cmsRole(undefined)).toBeNull();
  });
  test('identifies unconfirmed email as an Auth failure',()=>{
    expect(cmsSignInError({code:'email_not_confirmed',status:400})).toContain('not been confirmed');
  });
  test('identifies invalid passwords without echoing sensitive details',()=>{
    const msg=cmsSignInError({code:'invalid_credentials',message:'Invalid login credentials',status:400});
    expect(msg).toContain('Email or password');
    expect(msg).not.toContain('admin@123');
  });
  test('distinguishes network, rate limits and key mismatch',()=>{
    expect(cmsSignInError({message:'Failed to fetch'})).toContain('Cannot reach');
    expect(cmsSignInError({status:429})).toContain('Too many');
    expect(cmsSignInError({status:401,message:'Invalid API key'})).toContain('publishable key');
  });
  test('requires privileged app_metadata, never user_metadata',()=>{
    expect(cmsRoleHelp()).toContain('app_metadata.nb_role');
    const studio=readFileSync(new URL('../src/components/CmsStudio.tsx',import.meta.url),'utf8');
    expect(studio).toContain('cmsRole(user?.app_metadata?.nb_role)');
    expect(studio).toContain('client.auth.signInWithPassword');
    expect(studio).toContain('client.auth.getSession()');
    expect(studio).toContain('client.auth.getUser()');
    expect(studio).toContain('client.auth.refreshSession()');
    expect(studio).toContain('Refresh CMS permissions');
    expect(studio).not.toContain("if (!error) setStaff({id:'admin'");
  });
  test('readiness API reads only public endpoints and never returns credentials',()=>{
    const api=readFileSync(new URL('../api/cms-status.ts',import.meta.url),'utf8');
    expect(api).toContain('/auth/v1/health');
    expect(api).toContain('/rest/v1/nb_categories?select=path&limit=1');
    expect(api).not.toContain('service_role');
    expect(api).not.toContain('supabaseAdmin');
    expect(api).toContain('Cache-Control');
  });
  test('owner SQL grant refuses unconfirmed or missing users',()=>{
    const sql=readFileSync(new URL('../docs/OWNER_ROLE_SQL_TEMPLATE.sql',import.meta.url),'utf8');
    expect(sql).toContain('email_confirmed_at is not null');
    expect(sql).toContain('found_count <> 1');
    expect(sql).toContain("'{nb_role}'").not.toBeNull();
  });
});
