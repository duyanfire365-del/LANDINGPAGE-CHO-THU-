// Visually reviewed existing illustrations: tags describe the artwork, never the real listing.
const tall=new Map([[4,5],[10,4],[13,4],[20,4],[28,5],[32,4],[36,4],[40,4],[44,5],[48,5]]);
const low=new Map([[1,3],[2,3],[5,3],[6,3],[8,3],[9,3],[12,3],[14,3],[16,3],[17,3],[18,2],[21,3],[22,3],[24,3],[25,3],[26,3],[29,3],[30,3],[33,3],[34,3],[37,2],[38,2],[41,3],[42,3],[45,3],[46,3]]);
const moving=new Set([4,12,16,22,30,40,48]),some=new Set([2,5,8,9,14,18,20,24,26,28,29,32,34,38,42,46]);
export function visualMetadata(n){return {depictedFloors:tall.get(n)||low.get(n)||null,streetActivity:moving.has(n)?2:some.has(n)?1:0,...([1,25,41].includes(n)?{visualFamily:'beige-storefront-family'}:[4,28,44].includes(n)?{visualFamily:'white-tall-family'}:{})}}
