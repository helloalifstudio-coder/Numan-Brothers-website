import {describe,test,expect} from 'bun:test';
import {HOME_TEMPLATE,cleanHome} from '../src/lib/cmsData';
import {SITE_FIELDS,SITE_PAGES,siteText,cleanSiteText,HOME_SECTIONS,FEATURED_CARDS,normalizeOrder,homeSectionStyle,featuredCardStyle} from '../src/lib/siteContent';

describe('versioned website CMS',()=>{
  test('each page has controlled text slots, with no arbitrary HTML',()=>{
    expect(SITE_PAGES.length).toBe(9);
    expect(Object.values(SITE_FIELDS).flat().length).toBeGreaterThan(90);
    expect(cleanSiteText({'nav.brand':'Noman Bros','untrusted.script':'<script>alert(1)</script>'})).toEqual({'nav.brand':'Noman Bros'});
    expect(siteText(HOME_TEMPLATE,'footer.slogan')).toContain('Tradition');
  });
  test('published data normalizes old pre-CMS homepage records',()=>{
    const migrated=cleanHome({heroTitle:'Welcome',contactWhatsapp:'919876543210'});
    expect(migrated.heroTitle).toBe('Welcome');
    expect(migrated.sectionOrder).toEqual(HOME_SECTIONS.map(x=>x.id));
    expect(migrated.featuredOrder).toEqual(FEATURED_CARDS.map(x=>x.id));
    expect(migrated.siteText).toEqual({});
  });
  test('section ordering accepts only known IDs once',()=>{
    const raw={heroTitle:'Welcome',sectionOrder:['featured','featured','bad','hero'],featuredOrder:['three','one'],hiddenSections:['story','hero','madeup'],siteText:{'home.card1Title':'Wedding Sherwani','bad.key':'secret'}};
    const changed=cleanHome(raw);
    expect(changed.sectionOrder.slice(0,2)).toEqual(['featured','hero']);
    expect(changed.sectionOrder.length).toBe(HOME_SECTIONS.length);
    expect(changed.featuredOrder.slice(0,2)).toEqual(['three','one']);
    expect(changed.hiddenSections).toEqual(['story']);
    expect(siteText(changed,'home.card1Title')).toBe('Wedding Sherwani');
    expect(homeSectionStyle(changed,'story').display).toBe('none');
    expect(homeSectionStyle(changed,'hero').display).toBeUndefined();
    expect(featuredCardStyle(changed,'three').order).toBe(0);
    expect(normalizeOrder(['bad'],['hero','story'])).toEqual(['hero','story']);
  });
  test('field text is length-limited on publication',()=>{
    const big=cleanSiteText({'nav.brand':'a'.repeat(500),'contact.description':'b'.repeat(1000)});
    expect(big['nav.brand'].length).toBe(240);
    expect(big['contact.description'].length).toBe(900);
  });
});
