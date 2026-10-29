import {expandedIllustrations} from './illustration-photo-catalog.mjs';
export const stockIllustrations=[
 ...expandedIllustrations,
 {id:'hanoi-townhouse',localSource:'../public/reference-images/hanoi-townhouse.jpg',author:'Nguonchothue.vn — AI illustration',license:'Generated illustration; not a photo of a listed property',category:'Nhà nguyên căn'},
 {id:'hanoi-empty-shop',localSource:'../public/reference-images/hanoi-empty-shop.jpg',author:'Nguonchothue.vn — AI illustration',license:'Generated illustration; not a photo of a listed property',category:'Mặt bằng kinh doanh'},
 {id:'hanoi-cafe',localSource:'../public/reference-images/hanoi-cafe.jpg',author:'Nguonchothue.vn — AI illustration',license:'Generated illustration; not a photo of a listed property',category:'Mặt bằng kinh doanh'},
 {id:'hanoi-eatery',localSource:'../public/reference-images/hanoi-eatery.jpg',author:'Nguonchothue.vn — AI illustration',license:'Generated illustration; not a photo of a listed property',category:'Mặt bằng kinh doanh'},
 {id:'hanoi-restaurant',localSource:'../public/reference-images/hanoi-restaurant.jpg',author:'Nguonchothue.vn — AI illustration',license:'Generated illustration; not a photo of a listed property',category:'Mặt bằng kinh doanh'},
 {id:'hanoi-open-dining',localSource:'../public/reference-images/hanoi-open-dining.jpg',author:'Nguonchothue.vn — AI illustration',license:'Generated illustration; not a photo of a listed property',category:'Mặt bằng kinh doanh'},
 {id:'hanoi-villa',localSource:'../public/reference-images/hanoi-villa.jpg',author:'Nguonchothue.vn — AI illustration',license:'Generated illustration; not a photo of a listed property',category:'Biệt thự, nhà liền kề'},

 {id:'hanoi-storefront-v1',localSource:'../public/reference-images/hanoi-storefront-v1.jpg',author:'Nguonchothue.vn — AI illustration',license:'Generated illustration; not a photo of a listed property',category:'Mặt bằng kinh doanh'},
 {id:'coffee-daylight',photo:'1572138330970-e00624dce62f',author:'Leilani Angel',source:'https://unsplash.com/photos/empty-chairs-and-tables-6ithdqBUaZQ',category:'Mặt bằng kinh doanh'},
 {id:'coffee-windows',photo:'1564849744694-348ecd00c279',author:'Angela Bailey',source:'https://unsplash.com/photos/empty-chairs-beside-window-_uHBJNuKyk8',category:'Mặt bằng kinh doanh'},
 {id:'office-workspace',photo:'1497366672149-e5e4b4d34eb3',author:'Nastuh Abootalebi',source:'https://unsplash.com/photos/room-with-pendant-lamps-and-rectangular-dining-set-JdcJn85xD2k',category:'Văn phòng'},
 {id:'warehouse-open',photo:'1694885169342-909981fb408a',author:'Brian Wangenheim',source:'https://unsplash.com/photos/a-large-empty-warehouse-with-no-people-in-it-D7A6CiIFVk8',category:'Kho xưởng'},
 {id:'home-interior',photo:'1560448204-603b3fc33ddc',author:'Francesca Tosolini',source:'https://unsplash.com/photos/empty-living-room-KJFKCed0YKo',category:'Nhà nguyên căn'}
];
export function illustrationCandidates(item){const category=item.type==='Ki-ốt'?'Mặt bằng kinh doanh':item.type;const expanded=expandedIllustrations.filter(a=>(a.types||[a.category]).includes(category));const existing=stockIllustrations.filter(a=>!a.distinctOriginal&&a.category===category&&!(item.noFood&&['hanoi-eatery','hanoi-restaurant','hanoi-open-dining','coffee-daylight','coffee-windows','hanoi-cafe'].includes(a.id)));return [...expanded,...existing];}
export function stockForIllustration(item){const pool=illustrationCandidates(item),exact=item.assetId&&pool.find(a=>a.id===item.assetId);if(exact)return exact;const category=['Căn hộ chung cư','Căn hộ dịch vụ'].includes(item.type)?'Nhà nguyên căn':item.type;const fallback=pool.length?pool:stockIllustrations.filter(a=>a.category===category);return fallback[item.variant%fallback.length]||null;}
