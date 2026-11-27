// Visually reviewed composition families: original files alone are not enough to avoid lookalikes.
const families={
 'context-warehouse-large':'warehouse-racked-aisles',
 'context-reserve-warehouse-01':'warehouse-low-rack-storage',
 'context-reserve-warehouse-02':'warehouse-low-rack-storage',
 'context-reserve-warehouse-03':'warehouse-low-rack-storage',
 'context-reserve-warehouse-04':'warehouse-workshop-floor',
 'context-reserve-warehouse-05':'warehouse-racked-aisles',
 'context-reserve-warehouse-06':'warehouse-workshop-floor',
 'context-reserve-warehouse-07':'warehouse-racked-aisles',
 'context-reserve-warehouse-08':'warehouse-open-loading-bay',
 'context-reserve-warehouse-09':'warehouse-racked-aisles'
};
export const warehouseVisualFamily=a=>families[a.id]||a.visualFamily;
export const warehouseDiversityPhotos=[
 ['frontage-night','street',20,'warehouse-frontage','night'],
 ['empty-span','interior',null,'warehouse-empty-span','day'],
 ['brick-workshop','street',15,'warehouse-frontage','day'],
 ['loading-dock','street',null,'warehouse-exterior-loading-dock','dusk']
].map(([key,setting,depictedFrontage,visualFamily,time])=>({id:'context-warehouse-'+key,distinctOriginal:'context-warehouse-'+key,visualFamily,localSource:'../public/reference-images/context-warehouse-'+key+'.jpg',sector:'warehouse',scale:'large',category:'Kho xưởng',types:['Kho xưởng'],setting,scene:setting==='street'?'loading':'warehouse',time,...(setting==='street'?{depictedFloors:1,corner:false,depictedFrontage}:{}),author:'Nguonchothue.vn — generated illustration',license:'Generated fictional scene, not a photo of a listed property'}));

// Reviewed legacy warehouse stock: category alone had not supplied the sector required by matching.
export function reviewedWarehouseAsset(asset){
 const match=asset.id.match(/^hanoi-warehouse-(\d+)$/);if(!match)return asset;
 const n=Number(match[1]),interior=n%2===0;
 const hall={2:'warehouse-red-frame-span',4:'warehouse-brick-empty-hall',6:'warehouse-blue-frame-span',8:'warehouse-brick-empty-hall',10:'warehouse-grey-empty-span',12:'warehouse-brick-empty-hall',14:'warehouse-green-frame-span',16:'warehouse-brick-empty-hall',18:'warehouse-empty-span',20:'warehouse-brick-empty-hall',22:'warehouse-dark-column-span',24:'warehouse-brick-empty-hall'};
 return {...asset,sector:'warehouse',scale:'large',setting:interior?'interior':'street',scene:interior?'warehouse':'loading',visualFamily:interior?hall[n]:[3,7,11,15,19,23].includes(n)?'warehouse-exterior-loading-dock':'warehouse-frontage',...(!interior?{depictedFloors:1,corner:false}:{})};
}
