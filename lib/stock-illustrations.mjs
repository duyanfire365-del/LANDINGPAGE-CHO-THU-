export const stockIllustrations=[
 {id:'hanoi-storefront-v1',localSource:'../public/reference-images/hanoi-storefront-v1.jpg',author:'Nguonchothue.vn — AI illustration',license:'Generated illustration; not a photo of a listed property',category:'Mặt bằng kinh doanh'},
 {id:'coffee-daylight',photo:'1572138330970-e00624dce62f',author:'Leilani Angel',source:'https://unsplash.com/photos/empty-chairs-and-tables-6ithdqBUaZQ',category:'Mặt bằng kinh doanh'},
 {id:'coffee-windows',photo:'1564849744694-348ecd00c279',author:'Angela Bailey',source:'https://unsplash.com/photos/empty-chairs-beside-window-_uHBJNuKyk8',category:'Mặt bằng kinh doanh'},
 {id:'office-workspace',photo:'1497366672149-e5e4b4d34eb3',author:'Nastuh Abootalebi',source:'https://unsplash.com/photos/room-with-pendant-lamps-and-rectangular-dining-set-JdcJn85xD2k',category:'Văn phòng'},
 {id:'warehouse-open',photo:'1694885169342-909981fb408a',author:'Brian Wangenheim',source:'https://unsplash.com/photos/a-large-empty-warehouse-with-no-people-in-it-D7A6CiIFVk8',category:'Kho xưởng'},
 {id:'home-interior',photo:'1560448204-603b3fc33ddc',author:'Francesca Tosolini',source:'https://unsplash.com/photos/empty-living-room-KJFKCed0YKo',category:'Nhà nguyên căn'}
];
export function stockForIllustration(item){const category=['Căn hộ chung cư','Căn hộ dịch vụ','Biệt thự, nhà liền kề'].includes(item.type)?'Nhà nguyên căn':item.type==='Ki-ốt'?'Mặt bằng kinh doanh':item.type;if(category==='Mặt bằng kinh doanh')return stockIllustrations.find(s=>s.id==='hanoi-storefront-v1');const items=stockIllustrations.filter(s=>s.category===category);return items[item.variant%items.length]||null}
