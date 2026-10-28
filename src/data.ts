/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from './types';

export const CATEGORIES = [
  { id: 'all', name: 'All Collections' },
  { id: 'new-arrivals', name: 'New Arrivals 2026' },
  { id: 'sherwanis', name: 'Royal Groom Sherwanis' },
  { id: 'kurtas', name: 'Sequence & Festive Kurtas' },
  { id: 'thoobs', name: 'Arabic Thoobs & Jubbas' },
  { id: 'indo-western', name: 'Indo-Western & Jodhpuris' },
  { id: 'accessories', name: 'Safas, Malas & Mojaris' },
  { id: 'unstitched', name: 'Sherwani Fabrics' },
  { id: 'best-sellers', name: 'Wedding Best Sellers' },
  { id: 'sale', name: 'Special Festive Offers' }
];

export const FABRICS = [
  'Raw Silk & Zardozi',
  'Micro Velvet & Zari',
  'Georgette Sequence',
  'Pure Cotton Chikan',
  'Saudi Twill Matte Spun',
  'Italian Suiting Fabric',
  'Jacquard Brocade Silk'
];

export const SIZES = ['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)'];
export const OCCASIONS = ['Wedding / Groom', 'Reception & Sangeet', 'Festive / Eid', 'Jumma & Casual'];

export const PRODUCTS: Product[] = [
  {
    id: 'nb-001',
    title: 'Royal Zardozi Hand-Embroidered Groom Sherwani Set',
    price: 14999,
    mrp: 24999,
    images: [
      'https://img.youtube.com/vi/HmOWSHSZNtM/maxresdefault.jpg',
      'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'sherwanis',
    fabric: 'Raw Silk & Zardozi',
    length: 'Top: 43", Churidar: 42"',
    sizes: ['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)'],
    description: 'Nomaan Brothers signature groom masterpiece. Handcrafted in pure raw silk with intricate gold dabka, cutdana, and zardozi embroidery across the royal mandarin collar, cuffs, and chest placket. Accompanied by premium matching churidar and brocade stole.',
    specs: [
      { label: 'Sherwani Fabric', value: 'Pure Raw Silk with Hand Zardozi Embroidery' },
      { label: 'Bottom Fabric', value: 'Stretch Chanderi Silk Churidar' },
      { label: 'Set Inclusions', value: 'Designer Sherwani, Chudidar Bottom, Royal Stole' },
      { label: 'Embroidery', value: 'Handmade Zardozi, Cutdana, Resham & Zari Work' },
      { label: 'Origin', value: 'Nomaan Brothers Exclusive Atelier, Warangal' },
      { label: 'Occasion', value: 'Wedding Day, Nikah, Grand Reception' }
    ],
    badges: ['Set', 'Best Seller', 'Groom Special'],
    colors: [
      { name: 'Royal Ivory Gold', hex: '#FFF8DC' },
      { name: 'Imperial Maroon', hex: '#800000' }
    ],
    rating: 5.0,
    reviewsCount: 168,
    type: 'Set',
    hasBottom: true,
    sizeChart: {
      top: [
        { size: '38 (M)', chestOrWaist: '40" Chest', length: '42"', extra: '17.5" Shoulder' },
        { size: '40 (L)', chestOrWaist: '42" Chest', length: '43"', extra: '18" Shoulder' },
        { size: '42 (XL)', chestOrWaist: '44" Chest', length: '44"', extra: '18.5" Shoulder' },
        { size: '44 (XXL)', chestOrWaist: '46" Chest', length: '44"', extra: '19" Shoulder' }
      ],
      bottom: [
        { size: '38 (M)', chestOrWaist: '32" - 36" (Elastic/Drawstring)', length: '42"', extra: 'Comfort Knee Stretch' },
        { size: '40 (L)', chestOrWaist: '34" - 38" (Elastic/Drawstring)', length: '42"', extra: 'Comfort Knee Stretch' },
        { size: '42 (XL)', chestOrWaist: '36" - 40" (Elastic/Drawstring)', length: '43"', extra: 'Comfort Knee Stretch' },
        { size: '44 (XXL)', chestOrWaist: '38" - 42" (Elastic/Drawstring)', length: '43"', extra: 'Comfort Knee Stretch' }
      ]
    },
    reviews: [
      { id: 'r1', name: 'Mohammed Rizwan (Warangal)', rating: 5, date: '2026-08-14', comment: 'Bought this for my Nikah at Mandi Bazar showroom. The zardozi work is majestic and fitting was completed in just 1 hour. Highly recommended for every groom!', verified: true },
      { id: 'r2', name: 'Syed Farhan (Hanamkonda)', rating: 5, date: '2026-07-28', comment: 'Pure royal look! Everyone in my wedding reception was complimenting the fabric shine and neck work. Nomaan Brothers is truly the best in Warangal.', verified: true }
    ]
  },
  {
    id: 'nb-002',
    title: 'Regal Velvet Heritage Embroidered Sherwani Set',
    price: 18499,
    mrp: 28999,
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=800&q=80',
      'https://content.jdmagicbox.com/v2/comp/warangal/l1/9999px870.x870.231109200012.z2l1/catalogue/nomaan-brothers-dresses-sherpura-warangal-costume-dealers-z9jc7cr190-250.jpg'
    ],
    category: 'sherwanis',
    fabric: 'Micro Velvet & Zari',
    length: 'Top: 44", Churidar: 42"',
    sizes: ['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)'],
    description: 'A stately velvet sherwani designed for high-profile winter weddings and royal celebrations. Tailored from imported micro-velvet, embellished with golden floral zardozi motifs and antique metal buttons.',
    specs: [
      { label: 'Sherwani Fabric', value: 'High GSM Micro Velvet with Inner Satin Lining' },
      { label: 'Bottom Fabric', value: 'Raw Silk Cream Churidar' },
      { label: 'Work', value: 'Antique Gold Zari & Zardozi Threadwork' },
      { label: 'Length', value: 'Top 44" | Chudidar 42"' },
      { label: 'Buttons', value: 'Handcrafted Antique Royal Brass Buttons' },
      { label: 'Occasion', value: 'Wedding, Baraat, Royal Reception' }
    ],
    badges: ['Set', 'Premium', 'Royal Velvet'],
    colors: [
      { name: 'Royal Emerald Velvet', hex: '#004B49' },
      { name: 'Midnight Navy Velvet', hex: '#0A1172' },
      { name: 'Deep Wine Velvet', hex: '#58111A' }
    ],
    rating: 4.9,
    reviewsCount: 94,
    type: 'Set',
    hasBottom: true,
    sizeChart: {
      top: [
        { size: '38 (M)', chestOrWaist: '40" Chest', length: '44"', extra: '17.5" Shoulder' },
        { size: '40 (L)', chestOrWaist: '42" Chest', length: '44"', extra: '18" Shoulder' },
        { size: '42 (XL)', chestOrWaist: '44" Chest', length: '45"', extra: '18.5" Shoulder' },
        { size: '44 (XXL)', chestOrWaist: '46" Chest', length: '45"', extra: '19" Shoulder' }
      ],
      bottom: [
        { size: '38 (M)', chestOrWaist: '32" - 36" (Elastic/Drawstring)', length: '42"', extra: 'Comfort Knee Stretch' },
        { size: '40 (L)', chestOrWaist: '34" - 38" (Elastic/Drawstring)', length: '42"', extra: 'Comfort Knee Stretch' },
        { size: '42 (XL)', chestOrWaist: '36" - 40" (Elastic/Drawstring)', length: '43"', extra: 'Comfort Knee Stretch' },
        { size: '44 (XXL)', chestOrWaist: '38" - 42" (Elastic/Drawstring)', length: '43"', extra: 'Comfort Knee Stretch' }
      ]
    },
    reviews: [
      { id: 'r3', name: 'Abdul Majeed', rating: 5, date: '2026-06-19', comment: 'The velvet quality is ultra heavy and luxurious. Got the emerald green shade, looks 10x better in person than photos.', verified: true }
    ]
  },
  {
    id: 'nb-003',
    title: 'Designer Sequence Mirror-Work Festive Kurta Pajama Set',
    price: 2499,
    mrp: 4499,
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1608748010899-18f300247112?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'kurtas',
    fabric: 'Georgette Sequence',
    length: 'Kurta: 40", Pajama: 40"',
    sizes: ['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)'],
    description: 'The viral Sangeet and Haldi kurta of 2026! Features thousands of micro-sequence embroidery stitches that catch the stage lighting gracefully, paired with comfortable cotton silk pajamas.',
    specs: [
      { label: 'Kurta Fabric', value: 'Georgette with Heavy Micro-Sequence & Mirror Work' },
      { label: 'Inner Lining', value: 'Soft Breathable Malmal Cotton' },
      { label: 'Pajama', value: 'Pure Cotton Silk Straight Fit Pajama' },
      { label: 'Collar Style', value: 'Embroidered Mandarin Collar' },
      { label: 'Occasion', value: 'Sangeet, Haldi, Eid, Engagement' }
    ],
    badges: ['Set', 'Trending', '5 Colours'],
    colors: [
      { name: 'Mustard Gold (Haldi)', hex: '#E1AD01' },
      { name: 'Sky Ice Blue', hex: '#87CEEB' },
      { name: 'Powder Rose Pink', hex: '#FFB6C1' },
      { name: 'Olive Sage', hex: '#808000' },
      { name: 'Jet Black Sparkle', hex: '#1C1C1C' }
    ],
    rating: 4.9,
    reviewsCount: 312,
    type: 'Set',
    hasBottom: true,
    sizeChart: {
      top: [
        { size: '38 (M)', chestOrWaist: '40" Chest', length: '40"', extra: '17.5" Shoulder' },
        { size: '40 (L)', chestOrWaist: '42" Chest', length: '40"', extra: '18" Shoulder' },
        { size: '42 (XL)', chestOrWaist: '44" Chest', length: '41"', extra: '18.5" Shoulder' },
        { size: '44 (XXL)', chestOrWaist: '46" Chest', length: '41"', extra: '19" Shoulder' }
      ],
      bottom: [
        { size: '38 (M)', chestOrWaist: '30" - 36" (Elastic Waist)', length: '40"', extra: 'Straight Leg' },
        { size: '40 (L)', chestOrWaist: '32" - 38" (Elastic Waist)', length: '40"', extra: 'Straight Leg' },
        { size: '42 (XL)', chestOrWaist: '34" - 40" (Elastic Waist)', length: '41"', extra: 'Straight Leg' },
        { size: '44 (XXL)', chestOrWaist: '36" - 42" (Elastic Waist)', length: '41"', extra: 'Straight Leg' }
      ]
    },
    reviews: [
      { id: 'r4', name: 'Imran Pasha', rating: 5, date: '2026-07-09', comment: 'Wore the mustard yellow one for my brother’s Haldi function. Super comfortable inside cotton lining, does not poke the skin at all!', verified: true },
      { id: 'r5', name: 'Zeeshan Ali', rating: 5, date: '2026-06-30', comment: 'Quality is unmatched at ₹2,499. The sequence shines so well in night events. Delivery was lightning fast.', verified: true }
    ]
  },
  {
    id: 'nb-004',
    title: 'Pure Lucknowi Chikan Threadwork Royal Kurta',
    price: 1799,
    mrp: 3299,
    images: [
      'https://images.unsplash.com/photo-1608748010899-18f300247112?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'kurtas',
    fabric: 'Pure Cotton Chikan',
    length: '41"',
    sizes: ['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)'],
    description: 'An elegant hand-embroidered Lucknowi Chikan kurta tailored from pure 60s count breathable cotton. Featuring classic Bakhiya and Phanda needle stitches with pearl buttons.',
    specs: [
      { label: 'Fabric', value: '100% Pure Superfine Cotton' },
      { label: 'Embroidery', value: 'Authentic Lucknowi Chikan Threadwork' },
      { label: 'Length', value: '41 inches' },
      { label: 'Buttons', value: 'Mother-of-Pearl Hand Stitched Buttons' },
      { label: 'Occasion', value: 'Festive, Jumma Prayers, Family Get-togethers' }
    ],
    badges: ['Top Only', 'Handcrafted', '3 Colours'],
    colors: [
      { name: 'Pristine White', hex: '#FFFFFF' },
      { name: 'Soft Mint Green', hex: '#98FF98' },
      { name: 'Peach Cream', hex: '#FFE5B4' }
    ],
    rating: 4.8,
    reviewsCount: 145,
    type: 'Top Only',
    hasBottom: false,
    sizeChart: {
      top: [
        { size: '38 (M)', chestOrWaist: '40" Chest', length: '41"', extra: '17.5" Shoulder' },
        { size: '40 (L)', chestOrWaist: '42" Chest', length: '41"', extra: '18" Shoulder' },
        { size: '42 (XL)', chestOrWaist: '44" Chest', length: '42"', extra: '18.5" Shoulder' },
        { size: '44 (XXL)', chestOrWaist: '46" Chest', length: '42"', extra: '19" Shoulder' }
      ]
    },
    reviews: [
      { id: 'r6', name: 'Dr. Tariq Anwar', rating: 5, date: '2026-07-02', comment: 'Pure cotton and very soft. Ideal for Warangal summers and Eid prayer. Stitching quality is 10/10.', verified: true }
    ]
  },
  {
    id: 'nb-005',
    title: 'Emirati Royal Cut Arabic Thoob / Jubba',
    price: 2199,
    mrp: 3999,
    images: [
      'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'thoobs',
    fabric: 'Saudi Twill Matte Spun',
    length: '56", 58", 60"',
    sizes: ['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)'],
    description: 'Imported Gulf-standard Arabic Thoob (Jubba) tailored in authentic Emirati silhouette. Crafted from wrinkle-resistant Saudi twill fabric with collarless V-neck, detachable royal tarboosh tassel, and dual concealed side pockets.',
    specs: [
      { label: 'Fabric Quality', value: 'High-Density Saudi Twill Matte Poly-Cotton' },
      { label: 'Cut & Style', value: 'Traditional UAE Emirati Cut with Flowing Flare' },
      { label: 'Pockets', value: '2 Deep Side Pockets + 1 Internal Mobile Phone Pocket' },
      { label: 'Tassel', value: 'Removable Handcrafted Tarboosh Tassel' },
      { label: 'Occasion', value: 'Eid, Jumma, Nikah, Umrah & Daily Modest Elegance' }
    ],
    badges: ['Top Only', 'Gulf Import', 'Wrinkle-Free'],
    colors: [
      { name: 'Saudi Pure White', hex: '#FAFAFA' },
      { name: 'Desert Camel Khaki', hex: '#C19A6B' },
      { name: 'Onyx Black', hex: '#1C1C1C' },
      { name: 'Steel Slate Grey', hex: '#708090' }
    ],
    rating: 5.0,
    reviewsCount: 228,
    type: 'Top Only',
    hasBottom: false,
    sizeChart: {
      top: [
        { size: '38 (M)', chestOrWaist: '40" Chest', length: '56"', extra: 'Height 5ft 6in - 5ft 8in' },
        { size: '40 (L)', chestOrWaist: '42" Chest', length: '58"', extra: 'Height 5ft 8in - 5ft 10in' },
        { size: '42 (XL)', chestOrWaist: '44" Chest', length: '60"', extra: 'Height 5ft 10in - 6ft 1in' },
        { size: '44 (XXL)', chestOrWaist: '46" Chest', length: '60"', extra: 'Height 6ft + / Broad' }
      ]
    },
    reviews: [
      { id: 'r7', name: 'Hafeez Ur Rahman', rating: 5, date: '2026-06-25', comment: 'Authentic Gulf quality right here in Warangal! Fabric has weight, does not wrinkle after sitting, and the tassel is high grade.', verified: true }
    ]
  },
  {
    id: 'nb-006',
    title: 'Omani Embroidered Luxury Arabic Jubba',
    price: 2499,
    mrp: 4299,
    images: [
      'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'thoobs',
    fabric: 'Luxury Japanese Poly-Viscose',
    length: '56", 58", 60"',
    sizes: ['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)'],
    description: 'Traditional Sultanate of Oman styled Jubba featuring intricate neck and chest cord embroidery. Silky soft hand-feel, structured drape, and premium stitching.',
    specs: [
      { label: 'Fabric', value: 'Japanese Poly-Viscose with Breathable Weave' },
      { label: 'Work', value: 'Omani Heritage Cord Embroidery along Collar & Chest' },
      { label: 'Fit', value: 'Classic Regular Flowing Cut' },
      { label: 'Occasion', value: 'Eid Celebration, Family Functions, Friday Prayers' }
    ],
    badges: ['Top Only', 'New Arrival', '3 Colours'],
    colors: [
      { name: 'Pearl White', hex: '#FDFBF7' },
      { name: 'Olive Tan', hex: '#6B8E23' },
      { name: 'Navy Blue', hex: '#000080' }
    ],
    rating: 4.8,
    reviewsCount: 86,
    type: 'Top Only',
    hasBottom: false,
    sizeChart: {
      top: [
        { size: '38 (M)', chestOrWaist: '40" Chest', length: '56"', extra: '17.5" Shoulder' },
        { size: '40 (L)', chestOrWaist: '42" Chest', length: '58"', extra: '18" Shoulder' },
        { size: '42 (XL)', chestOrWaist: '44" Chest', length: '60"', extra: '18.5" Shoulder' },
        { size: '44 (XXL)', chestOrWaist: '46" Chest', length: '60"', extra: '19" Shoulder' }
      ]
    },
    reviews: [
      { id: 'r8', name: 'Mustafa Khan', rating: 5, date: '2026-06-12', comment: 'The neck cord embroidery gives it an authentic Arab prince look. Ordered via WhatsApp and got it delivered next day.', verified: true }
    ]
  },
  {
    id: 'nb-007',
    title: 'Royal Jodhpuri Bandhgala Suit Set',
    price: 7999,
    mrp: 13999,
    images: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'indo-western',
    fabric: 'Italian Suiting Fabric',
    length: 'Coat: 30", Trousers: 41"',
    sizes: ['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)'],
    description: 'Sophisticated royal Bandhgala suit handcrafted from premium Italian suiting blend. Structured shoulder pads, satin bound pockets, and tailored formal trousers suitable for receptions and cocktail evenings.',
    specs: [
      { label: 'Suit Fabric', value: 'Imported Italian Poly-Wool Blend' },
      { label: 'Trousers', value: 'Slim-Tapered Tailored Formal Trousers' },
      { label: 'Collar', value: 'Structured Mandarin Royal Stand Bandhgala' },
      { label: 'Lining', value: 'Full Jacquard Paisley Lining' },
      { label: 'Occasion', value: 'Reception, Engagement, Formal Wedding Dinners' }
    ],
    badges: ['Set', 'Premium', 'Royal Cut'],
    colors: [
      { name: 'Imperial Black', hex: '#111111' },
      { name: 'Royal Navy Blue', hex: '#1B263B' },
      { name: 'Wine Velvet Accent', hex: '#4A1525' }
    ],
    rating: 4.9,
    reviewsCount: 112,
    type: 'Set',
    hasBottom: true,
    sizeChart: {
      top: [
        { size: '38 (M)', chestOrWaist: '39" Chest', length: '29.5"', extra: '17.5" Shoulder' },
        { size: '40 (L)', chestOrWaist: '41" Chest', length: '30"', extra: '18" Shoulder' },
        { size: '42 (XL)', chestOrWaist: '43" Chest', length: '30.5"', extra: '18.5" Shoulder' },
        { size: '44 (XXL)', chestOrWaist: '45" Chest', length: '31"', extra: '19" Shoulder' }
      ],
      bottom: [
        { size: '38 (M)', chestOrWaist: '32" Waist', length: '40"', extra: '24" Thigh' },
        { size: '40 (L)', chestOrWaist: '34" Waist', length: '40.5"', extra: '25" Thigh' },
        { size: '42 (XL)', chestOrWaist: '36" Waist', length: '41"', extra: '26" Thigh' },
        { size: '44 (XXL)', chestOrWaist: '38" Waist', length: '41.5"', extra: '27" Thigh' }
      ]
    },
    reviews: [
      { id: 'r9', name: 'Karthik Rao', rating: 5, date: '2026-07-15', comment: 'Fitting was spot-on. Looks like a bespoke ₹25k Raymond made suit. Nomaan Brothers master tailors did fantastic work.', verified: true }
    ]
  },
  {
    id: 'nb-008',
    title: 'Asymmetric Indo-Western Groom Sherwani Kurta',
    price: 5499,
    mrp: 9999,
    images: [
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'indo-western',
    fabric: 'Jacquard Brocade Silk',
    length: 'Top: 42", Dhoti/Pajama: 40"',
    sizes: ['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)'],
    description: 'Modern asymmetric overlapping front silhouette with antique metal brooches and subtle woven Jacquard gold motifs. Perfect for grooms who want a stylish blend of tradition and modernity.',
    specs: [
      { label: 'Fabric', value: 'Woven Jacquard Brocade Silk' },
      { label: 'Cut', value: 'Asymmetric Overlapping Angrakha Hem' },
      { label: 'Bottom', value: 'Ready-to-wear Silk Dhoti or Churidar' },
      { label: 'Occasion', value: 'Sangeet, Reception, Cocktail Night' }
    ],
    badges: ['Set', 'Designer Cut', 'Trending'],
    colors: [
      { name: 'Rose Gold Peach', hex: '#ECC5C0' },
      { name: 'Pistachio Sage', hex: '#9CAF88' },
      { name: 'Royal Ivory', hex: '#FFFFF0' }
    ],
    rating: 4.7,
    reviewsCount: 78,
    type: 'Set',
    hasBottom: true,
    sizeChart: {
      top: [
        { size: '38 (M)', chestOrWaist: '40" Chest', length: '42"', extra: '17.5" Shoulder' },
        { size: '40 (L)', chestOrWaist: '42" Chest', length: '42"', extra: '18" Shoulder' },
        { size: '42 (XL)', chestOrWaist: '44" Chest', length: '43"', extra: '18.5" Shoulder' },
        { size: '44 (XXL)', chestOrWaist: '46" Chest', length: '43"', extra: '19" Shoulder' }
      ],
      bottom: [
        { size: '38 (M)', chestOrWaist: '30" - 36" (Elastic)', length: '40"', extra: 'Comfort Drape' },
        { size: '40 (L)', chestOrWaist: '32" - 38" (Elastic)', length: '40"', extra: 'Comfort Drape' },
        { size: '42 (XL)', chestOrWaist: '34" - 40" (Elastic)', length: '41"', extra: 'Comfort Drape' },
        { size: '44 (XXL)', chestOrWaist: '36" - 42" (Elastic)', length: '41"', extra: 'Comfort Drape' }
      ]
    },
    reviews: [
      { id: 'r10', name: 'Naveen Kumar', rating: 5, date: '2026-06-18', comment: 'The angrakha overlap style received huge praise during my sangeet. Light on body and very rich look.', verified: true }
    ]
  },
  {
    id: 'nb-009',
    title: 'Groom Maharaja Safa Turban with Pearl Mala & Kalgi Set',
    price: 1999,
    mrp: 3499,
    images: [
      'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'accessories',
    fabric: 'Chanderi Silk & Kundan',
    length: 'Pre-Tied Standard Fits All',
    sizes: ['Free Size (Adjustable)'],
    description: 'Complete the royal groom ensemble with our handcrafted Chanderi Silk pre-tied Maharaja Pagdi (Safa). Accompained by a 3-layer royal pearl necklace (Groom Mala) and dazzling Kundan Kalgi feather brooch.',
    specs: [
      { label: 'Safa Fabric', value: 'Chanderi Brocade Silk (Ready to Wear Pre-Tied)' },
      { label: 'Kalgi Brooch', value: 'Gold Plated Kundan & Emerald Stone Work' },
      { label: 'Groom Mala', value: 'Multi-Strand Shell Pearl Mala with Antique Brooch' },
      { label: 'Size', value: 'Free Size with Elastic Adjustment (21" to 23.5" head circumference)' },
      { label: 'Occasion', value: 'Baraat, Nikah, Wedding Mandap' }
    ],
    badges: ['Set', 'Wedding Essential', 'Ready to Wear'],
    colors: [
      { name: 'Royal Maroon & Gold', hex: '#800020' },
      { name: 'Peach & Cream Gold', hex: '#FFE5B4' },
      { name: 'Rose Gold', hex: '#B76E79' }
    ],
    rating: 5.0,
    reviewsCount: 194,
    type: 'Top Only',
    hasBottom: false,
    sizeChart: {
      top: [
        { size: 'Free Size (Adjustable)', chestOrWaist: 'Head Circumference 21" - 24"', length: 'Pre-tied Safa', extra: 'Comfort inner cushion lining' }
      ]
    },
    reviews: [
      { id: 'r11', name: 'Shabbir Hussain', rating: 5, date: '2026-07-04', comment: 'Pre-tied safa saved us so much time on the wedding morning! Fits snugly and kalgi is very grand.', verified: true }
    ]
  },
  {
    id: 'nb-010',
    title: 'Handcrafted Zardozi Embroidered Royal Groom Mojaris',
    price: 1299,
    mrp: 2199,
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'accessories',
    fabric: 'Genuine Leather & Zardozi',
    length: 'Ind Size 7, 8, 9, 10, 11',
    sizes: ['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)'],
    description: 'Traditional Jodhpur-style royal sherwani juttis / mojaris with curved toe, padded leather insole, and authentic zardozi gold thread embroidery. Designed for zero bite and day-long wedding comfort.',
    specs: [
      { label: 'Upper', value: 'Silk Velvet with Zardozi Hand Embroidery' },
      { label: 'Sole', value: '100% Genuine Soft Buff Leather Sole' },
      { label: 'Insole', value: 'Extra Cushion Padded Anti-Bite Insole' },
      { label: 'Occasion', value: 'Groom Wedding Wear, Festive Celebrations' }
    ],
    badges: ['Handcrafted', 'Pure Leather', 'Best Seller'],
    colors: [
      { name: 'Antique Gold', hex: '#D4AF37' },
      { name: 'Royal Maroon', hex: '#800000' },
      { name: 'Jet Black Zari', hex: '#1C1C1C' }
    ],
    rating: 4.9,
    reviewsCount: 88,
    type: 'Top Only',
    hasBottom: false,
    sizeChart: {
      top: [
        { size: '38 (M)', chestOrWaist: 'Ind / UK Size 7', length: '26 cm Foot', extra: 'Cushioned' },
        { size: '40 (L)', chestOrWaist: 'Ind / UK Size 8', length: '27 cm Foot', extra: 'Cushioned' },
        { size: '42 (XL)', chestOrWaist: 'Ind / UK Size 9', length: '28 cm Foot', extra: 'Cushioned' },
        { size: '44 (XXL)', chestOrWaist: 'Ind / UK Size 10', length: '29 cm Foot', extra: 'Cushioned' }
      ]
    },
    reviews: [
      { id: 'r12', name: 'Arif Ahmed', rating: 5, date: '2026-06-22', comment: 'Extremely soft inside leather, no shoe bite throughout 8 hours of wedding ceremony! Matched my sherwani perfectly.', verified: true }
    ]
  },
  {
    id: 'nb-011',
    title: 'Unstitched Banarasi Brocade Sherwani & Achkan Fabric Material',
    price: 3499,
    mrp: 5999,
    images: [
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'unstitched',
    fabric: 'Jacquard Brocade Silk',
    length: '3.5 Meters Sherwani + 2.5 Meters Churidar Fabric',
    sizes: ['Unstitched'],
    description: 'Premium uncut 3.5-meter Banarasi brocade silk fabric featuring woven meenakari zari vines. Accompanied by 2.5 meters of heavy raw silk for churidar or straight trousers. Perfect for custom tailoring by your preferred master cutter.',
    specs: [
      { label: 'Sherwani Fabric Cut', value: '3.5 Meters Pure Banarasi Zari Brocade' },
      { label: 'Bottom Fabric Cut', value: '2.5 Meters Heavy Dupion Raw Silk' },
      { label: 'Width (Panna)', value: '44 Inches Big Width' },
      { label: 'Customization', value: 'Can be tailored into Sherwani, Indo-Western, Prince Coat or Achkan' },
      { label: 'Occasion', value: 'Bespoke Wedding Tailoring' }
    ],
    badges: ['Unstitched', 'Pure Brocade', 'Bespoke'],
    colors: [
      { name: 'Royal Ivory Gold', hex: '#FFFFF0' },
      { name: 'Golden Champagne', hex: '#F7E7CE' },
      { name: 'Royal Blue Zari', hex: '#002366' }
    ],
    rating: 5.0,
    reviewsCount: 64,
    type: 'Unstitched',
    hasBottom: true,
    sizeChart: {
      top: [
        { size: 'Unstitched Material', chestOrWaist: 'Can be tailored up to 54" Chest', length: '3.5 Meters Cut', extra: 'Fits all body builds' }
      ],
      bottom: [
        { size: 'Unstitched Material', chestOrWaist: 'Can be tailored up to 48" Waist', length: '2.5 Meters Cut', extra: 'Fits all body builds' }
      ]
    },
    reviews: [
      { id: 'r13', name: 'Dr. Shakeel', rating: 5, date: '2026-06-15', comment: 'Took this unstitched fabric to Nomaan Brothers master tailor at Mandi Bazar for bespoke fitting. Finished garment looks stunning!', verified: true }
    ]
  }
];

export const TRUST_ANNOUNCEMENTS = [
  "👑 Warangal's Premier Groom & Ethnic Menswear Destination",
  "📍 Opp. Madras Masjid, Mandi Bazar, Warangal — Visit Our Showroom",
  "✨ Custom Tailoring & Made-to-Measure Groom Sherwanis",
  "⚡ WhatsApp Video Call Consultation & Express Doorstep Delivery",
  "🤝 Cash On Delivery (COD) & In-Store Trial Available"
];

export const STORIES_INFO = {
  about: "Located opposite Madras Masjid in the historic textile hub of Mandi Bazar, Warangal, Nomaan Brothers (The Designer Sherwani House) is Telangana's distinguished landmark for groom wedding attire and festive menswear. For decades, we have dressed grooms in bespoke Zardozi Sherwanis, Jodhpuris, Sequence Kurtas, and authentic Gulf-imported Arabic Thoobs. Each garment is crafted with meticulous tailoring, imperial embroidery, and custom made-to-measure fitting.",
  shipping: "We deliver across Warangal and dispatch express parcels all over Telangana, Hyderabad, and across India within 2-4 business days. In-store pickup, custom trial sessions at Mandi Bazar, and Cash On Delivery (COD) are readily available.",
  returns: "We offer complete fitting assurance. If any made-to-measure adjustment is needed, visit our Mandi Bazar store for instant master-tailor alteration or raise an online size exchange within 7 days."
};
