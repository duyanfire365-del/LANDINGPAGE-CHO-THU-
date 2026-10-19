export const intentLabels={tenant:'KH quan tâm thuê (nhượng)',owner:'Ký gửi cho thuê',owner_sale:'Ký gửi bán',owner_transfer:'Ký gửi chuyển nhượng'};
export const isConsignment=intent=>['owner','owner_sale','owner_transfer'].includes(intent);
export const priceLabels={owner:'Giá cho thuê (triệu đồng/tháng)',owner_sale:'Giá bán (triệu đồng)',owner_transfer:'Giá chuyển nhượng (triệu đồng)'};

export const budgetLabels={'under-5':'Dưới 5 triệu/tháng','under-10':'Dưới 10 triệu/tháng','10-20':'10–20 triệu/tháng','20-30':'20–30 triệu/tháng','30-50':'30–50 triệu/tháng','over-50':'Trên 50 triệu/tháng','over-100':'Trên 100 triệu/tháng','over-200':'Trên 200 triệu/tháng','over-300':'Trên 300 triệu/tháng'};

// New website forms store these labelled criteria in owner_notes; older forms
// retain their original budget range and free text without invented values.
export function inquiryCriteria(row){
 const notes=String(row.owner_notes||''),field=label=>notes.split('\n').find(line=>line.startsWith(label+':'))?.slice(label.length+1).trim()||'';
 const number=value=>{const m=value.match(/^(\d+(?:[.,]\d+)?)(?:\s|$)/);return m?Number(m[1].replace(',','.')):null};
 const industry=field('Ngành nghề'),extra=notes.indexOf('Yêu cầu thêm:');
 return {area:row.area||'',type:row.type||'',budget:row.budget||'',maxBudget:number(field('Ngân sách tối đa')),minSize:number(field('Diện tích tối thiểu')),industry:industry==='Chưa chọn'?'':industry,requirements:extra>=0?notes.slice(extra+'Yêu cầu thêm:'.length).trim():notes};
}
