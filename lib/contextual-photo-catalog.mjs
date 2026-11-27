import extraWarehousePhotos from './warehouse-extra-photos.json' with {type:'json'};
import {warehouseVisualFamily,warehouseDiversityPhotos} from './warehouse-visual-families.mjs';
import reservePhotos from './reserve-photo-catalog.json' with {type:'json'};
const entries=[
 ['restaurant-small','restaurant','small'],['restaurant-medium','restaurant','medium'],['restaurant-large','restaurant','large'],['restaurant-small-night','restaurant','small','night'],
 ['cafe-small','cafe','small'],['cafe-medium','cafe','medium'],['cafe-large','cafe','large'],['cafe-small-night','cafe','small','night'],
 ['nail-small','nail','small'],['spa-medium','spa','medium'],['hair-small','hair','small'],['lashes-small','lashes','small'],
 ['house-three',null,null,'night','street',3,4,false],['building-six-corner',null,null,'night','street',6,12,true],['office-medium','office','medium'],['warehouse-large','warehouse','large']
];
const basePhotos=entries.map(([key,sector,scale,time='day',setting='interior',depictedFloors,depictedFrontage,corner])=>({id:'context-'+key,distinctOriginal:'context-'+key,localSource:'../public/reference-images/context-'+key+'.jpg',sector,scale,time,setting,depictedFloors,depictedFrontage,corner,scene:sector==='office'?'workspace':sector||'townhouse',category:sector==='warehouse'?'Kho xưởng':sector==='office'?'Văn phòng':'Mặt bằng kinh doanh',types:sector==='warehouse'?['Kho xưởng']:sector==='office'?['Văn phòng','Nhà nguyên căn','Mặt bằng kinh doanh']:['Mặt bằng kinh doanh','Nhà nguyên căn','Văn phòng','Ki-ốt'],author:'Nguonchothue.vn — generated illustration',license:'Generated fictional scene, not a photo of a listed property'}));

export const contextualPhotos=[...basePhotos,...reservePhotos,...warehouseDiversityPhotos,...extraWarehousePhotos].map(a=>({...a,...(warehouseVisualFamily(a)?{visualFamily:warehouseVisualFamily(a)}:{})}));
