export const stockIllustrations=[
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
export function stockForIllustration(item){
 const category=['Căn hộ chung cư','Căn hộ dịch vụ'].includes(item.type)?'Nhà nguyên căn':item.type==='Ki-ốt'?'Mặt bằng kinh doanh':item.type;
 let pool;
 if(category==='Mặt bằng kinh doanh'){
  if(item.scene==='cafe')pool=['hanoi-cafe','hanoi-empty-shop'];
  else if(item.scene==='restaurant'&&!item.noFood)pool=['hanoi-eatery','hanoi-restaurant','hanoi-open-dining'];
  else pool=['hanoi-empty-shop','hanoi-townhouse','hanoi-storefront-v1'];
 }else if(category==='Nhà nguyên căn')pool=['hanoi-townhouse','home-interior'];
 else if(category==='Biệt thự, nhà liền kề')pool=['hanoi-villa'];
 else pool=stockIllustrations.filter(s=>s.category===category).map(s=>s.id);
 return pool?.length?stockIllustrations.find(s=>s.id===pool[item.variant%pool.length]):null;
}
