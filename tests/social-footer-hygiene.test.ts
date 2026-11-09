import {describe,test,expect} from 'bun:test';
import {readFileSync,existsSync} from 'node:fs';
import {SOCIAL_KEYS,cleanHome,isValidSocialProfile} from '../src/lib/cmsData';

const src=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

describe('social footer release contracts',()=>{
  test('all nine official brand icons exist locally and have no external icon CDN dependency',()=>{
    expect(SOCIAL_KEYS).toEqual([
      'instagram','facebook','youtube','pinterest','threads','x',
      'tiktok','snapchat','linkedin',
    ]);
    for(const key of SOCIAL_KEYS){
      const path='public/social/'+key+'.svg';
      expect(existsSync(new URL('../'+path,import.meta.url))).toBe(true);
      const xml=src(path);
      expect(xml).toContain('<svg');
      expect(xml).toContain('viewBox');
      expect(xml).toContain('<path');
      expect(xml).not.toMatch(/<script|<foreignObject|onload=|<image /i);
    }
  });
  test('links are restricted to HTTPS profiles at their own platform host',()=>{
    expect(isValidSocialProfile('instagram','https://www.instagram.com/nomaanbrothers/')).toBe(true);
    expect(isValidSocialProfile('facebook','https://www.facebook.com/profile.php?id=123')).toBe(true);
    expect(isValidSocialProfile('youtube','https://www.youtube.com/@nomaanbrothers')).toBe(true);
    expect(isValidSocialProfile('threads','https://www.threads.com/@nomaanbrothers')).toBe(true);
    expect(isValidSocialProfile('x','https://x.com/nomaanbrothers')).toBe(true);
    expect(isValidSocialProfile('linkedin','https://www.linkedin.com/company/nomaanbrothers')).toBe(true);
    for(const bad of [
      'https://instagram.com.evil.example/profile',
      'https://evil.example/account',
      'http://instagram.com/account',
      'https://instagram.com/',
      'https://user:pass@instagram.com/account',
      'https://instagram.com:8443/account',
      'javascript:alert(1)',
    ])expect(isValidSocialProfile('instagram',bad)).toBe(false);
    expect(isValidSocialProfile('instagram','https://facebook.com/nomaanbrothers')).toBe(false);
  });
  test('unconfigured profiles remain visible, disabled and do not become guessed live links',()=>{
    const social=src('src/components/SocialLinks.tsx');
    expect(social).toContain("showUnconfigured=false");
    expect(social).toContain('role="img"');
    expect(social).toContain('profile not connected yet');
    expect(social).toContain('rel="noopener noreferrer"');
    expect(social).not.toContain('cdn.');
    const footer=src('src/components/V2Footer.tsx');
    expect(footer).toContain('<SocialLinks home={home} showUnconfigured/>');
    expect(footer).toContain('Connect on social');
    const contact=src('src/App.tsx');
    expect(contact).toContain('variant="dark" showUnconfigured');
  });
  test('CMS sanitizes mismatched domains without losing legitimate owner profile links',()=>{
    const home=cleanHome({
      socialLinks:{
        instagram:'https://instagram.com/nomaanbrothers',
        youtube:'https://evil.example/fake',
        facebook:'https://facebook.com.evil.example/nomaanbrothers',
      }
    });
    expect(home.socialLinks.instagram).toBe('https://instagram.com/nomaanbrothers');
    expect(home.socialLinks.youtube).toBe('');
    expect(home.socialLinks.facebook).toBe('');
    const studio=src('src/components/studio/CmsHomepage.tsx');
    expect(studio).toContain('isValidSocialProfile');
    expect(studio).toContain('profile URLs become clickable');
  });
  test('branch cleanup never deletes unmerged or changed refs and executes after CI',()=>{
    const workflow=src('.github/workflows/quality.yml');
    expect(workflow).toContain('cleanup-merged-working-branches:');
    expect(workflow).toContain('needs: [typecheck-and-build, browser-ui-smoke]');
    expect(workflow).toContain("github.ref == 'refs/heads/main'");
    expect(workflow).toContain("pr.get('merged_at')");
    expect(workflow).toContain("pr.get('head',{}).get('sha')==branch['commit']['sha']");
    expect(workflow).toContain("if name=='main':continue");
    expect(workflow).toContain('contents: write');
  });
});
