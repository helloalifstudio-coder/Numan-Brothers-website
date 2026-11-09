/** Review these paths with src/storefront/navigation.ts; CI verifies parity. */
const paths=[
  '/','/men','/men/kurta-pyjama','/men/pathani','/men/sherwani',
  '/men/sherwani/handwork','/men/sherwani/plain','/men/suits',
  '/men/suits/handwork','/men/suits/plain','/men/jodhpuri',
  '/men/marriage','/men/marriage/jutti','/men/marriage/pagdi',
  '/men/marriage/sadi','/men/tope',
  '/kids','/kids/kurta-pyjama','/kids/sherwani','/kids/pathani',
  '/kids/sadi','/kids/suits','/kids/jodhpuri','/kids/tope',
];
const overrides={
  '/':'Nomaan Brothers — Occasionwear in Warangal',
  '/men':"Men's Wear",'/kids':'Kids Wear',
  '/men/sherwani/plain':'Plain Sherwani',
  '/men/suits/plain':'Plain Suits',
  '/men/marriage/sadi':'Sadi',
};
export const seoRoutes=paths.map(path=>{
  const part=path.split('/').filter(Boolean).at(-1)||'home';
  const title=overrides[path]||part.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' ');
  return {path,title,description:title+' at Nomaan Brothers, Mandi Bazar, Warangal.'};
});

/** Dedicated legal routes get meaningful social titles, without indexing
 * owner-unapproved statements or misrepresenting pending policies. */
export const legalRoutes=[
  {path:'/privacy-policy',title:'Privacy Policy',description:'Store privacy information, subject to owner confirmation.',noindex:true},
  {path:'/terms-and-conditions',title:'Terms & Conditions',description:'Terms for Nomaan Brothers, subject to owner confirmation.',noindex:true},
  {path:'/returns-and-exchanges',title:'Returns & Exchanges',description:'Return and exchange information, subject to owner confirmation.',noindex:true},
];
