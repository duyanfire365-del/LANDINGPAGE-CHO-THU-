(() => {
 const esc=RentalSharing.escape;
 const intents={tenant:'KH quan tâm thuê (nhượng)',owner:'Ký gửi cho thuê',owner_sale:'Ký gửi bán',owner_transfer:'Ký gửi chuyển nhượng'};
 const states={new:'Mới',contacted:'Đã liên hệ',following:'Đang chăm sóc',closed:'Đã hoàn tất'};
 const budgets={'under-5':'Dưới 5 triệu/tháng','under-10':'Dưới 10 triệu/tháng','10-20':'10–20 triệu/tháng','20-30':'20–30 triệu/tháng','30-50':'30–50 triệu/tháng','over-50':'Trên 50 triệu/tháng','over-100':'Trên 100 triệu/tháng','over-200':'Trên 200 triệu/tháng','over-300':'Trên 300 triệu/tháng'};
 const date=value=>{const parsed=new Date(value);return Number.isFinite(parsed.getTime())?parsed.toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):'Chưa cập nhật'};
 function mount(element){
  element.innerHTML=`<form class="crm-filters"><label>Tìm khách hàng<input name="q" type="search" maxlength="100" placeholder="Họ tên, điện thoại hoặc khu vực"></label><label>Nhu cầu<select name="intent"><option value="">Tất cả nhu cầu</option>${Object.entries(intents).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></label><label>Trạng thái<select name="status"><option value="">Tất cả trạng thái</option>${Object.entries(states).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></label><button class="button small" type="submit">Tra cứu</button></form><div class="crm-toolbar"><p class="crm-count"></p><button class="button outline small" type="button" data-crm-refresh>Làm mới</button></div><p class="crm-status portal-status" role="status"></p><div class="crm-records"></div><div class="crm-pager"><button type="button" class="button outline small" data-crm-prev disabled>← Trang trước</button><span class="crm-page"></span><button type="button" class="button outline small" data-crm-next disabled>Trang sau →</button></div>`;
  const q=s=>element.querySelector(s);let page=0,rows=[],controller=null,active=false;
  const field=(label,value)=>value!==null&&value!==undefined&&value!==''?`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`:'';
  function card(row){
   const status=row.management_status||'new',price=row.owner_price??row.owner_rent,phone=/^(0|\+84)\d{9}$/.test(row.phone)?row.phone:null;
   const amount=price==null?'Thỏa thuận':new Intl.NumberFormat('vi-VN').format(price)+(row.intent==='owner'?' triệu đồng/tháng':' triệu đồng');
   return `<article class="crm-card" data-crm-id="${esc(row.id)}"><div class="crm-card-top"><div><h4>${esc(row.name)}</h4><p>${esc(intents[row.intent]||'Nhu cầu khác')} · ${esc(date(row.created_at))}</p></div><span class="crm-badge">${esc(states[status]||'Mới')}</span></div><dl class="crm-details">${field('Số điện thoại',row.phone)}${field('Khu vực',row.area)}${field('Loại BĐS',row.type)}${row.intent==='tenant'?field('Ngân sách',budgets[row.budget]||row.budget)+field('BĐS quan tâm',row.property)+field('Ngày muốn xem',row.date)+field('Tiêu chí và ngành nghề',row.owner_notes):field('Địa chỉ ký gửi (riêng tư)',row.owner_address)+field('Diện tích',row.owner_size==null?'':row.owner_size+' m²')+field(row.intent==='owner'?'Giá cho thuê':row.intent==='owner_sale'?'Giá bán':'Giá chuyển nhượng',amount)+field('Tiền thuê hiện tại',row.transfer_monthly_rent==null?'':row.transfer_monthly_rent+' triệu đồng/tháng')+field('Mô tả khách cung cấp',row.owner_notes)}</dl><div class="portal-links">${phone?`<a href="tel:${phone}">Gọi khách</a><a href="https://zalo.me/${phone.startsWith('+84')?'0'+phone.slice(3):phone}" target="_blank" rel="noopener noreferrer">Mở Zalo</a>`:''}</div><form class="crm-edit" data-crm-edit="${esc(row.id)}"><label>Trạng thái xử lý<select name="status">${Object.entries(states).map(([value,label])=>`<option value="${value}" ${value===status?'selected':''}>${label}</option>`).join('')}</select></label><label>Ghi chú nội bộ<textarea name="notes" rows="3" maxlength="4000" placeholder="Nội dung trao đổi, lịch liên hệ tiếp theo…">${esc(row.admin_notes||'')}</textarea></label><button class="button small" type="submit">Lưu cập nhật</button><p class="crm-save-status portal-status" role="status"></p></form><p class="sample-note">Mã hồ sơ: ${esc(row.id)}${row.updated_at?' · Cập nhật: '+esc(date(row.updated_at)):''}</p></article>`;
  }
  async function load(reset=false){
   active=true;if(reset)page=0;controller?.abort();const current=new AbortController();controller=current;
   const params=new URLSearchParams(new FormData(q('.crm-filters')));params.set('view','inquiries');params.set('page',String(page));q('.crm-status').textContent='Đang tải hồ sơ…';
   try{const response=await fetch('/api/workspace?'+params,{cache:'no-store',signal:current.signal}),data=await response.json();if(!active||controller!==current)return;if(!response.ok)throw Error(data.error||'Chưa tải được hồ sơ.');
    rows=data.inquiries;q('.crm-records').innerHTML=rows.length?rows.map(card).join(''):'<p class="portal-notice">Chưa có hồ sơ phù hợp. Chỉ những yêu cầu gửi thành công và được lưu vào hệ thống mới xuất hiện ở đây; yêu cầu khách tự gửi qua Zalo không tự đồng bộ.</p>';
    q('.crm-count').textContent=`${rows.length} hồ sơ trên trang này`;q('.crm-page').textContent='Trang '+(page+1);q('[data-crm-prev]').disabled=page===0;q('[data-crm-next]').disabled=!data.hasMore;q('.crm-status').textContent='';
   }catch(error){if(error.name!=='AbortError'&&active&&controller===current){q('.crm-status').textContent=error.message;q('.crm-records').replaceChildren();q('.crm-count').textContent='';q('[data-crm-next]').disabled=true}}
  }
  q('.crm-filters').addEventListener('submit',event=>{event.preventDefault();load(true)});
  q('[data-crm-refresh]').addEventListener('click',()=>load());q('[data-crm-prev]').addEventListener('click',()=>{if(page>0){page--;load()}});q('[data-crm-next]').addEventListener('click',()=>{page++;load()});
  element.addEventListener('submit',async event=>{
   const form=event.target.closest('[data-crm-edit]');if(!form)return;event.preventDefault();const button=event.submitter;button.disabled=true;const target=form.querySelector('.crm-save-status');
   try{await RentalEditor.request('/api/workspace',{action:'inquiry-update',id:form.dataset.crmEdit,status:form.elements.status.value,notes:form.elements.notes.value});if(!active)return;target.textContent='Đã lưu cập nhật.';form.closest('.crm-card').querySelector('.crm-badge').textContent=states[form.elements.status.value]}
   catch(error){if(active)target.textContent=error.message}finally{button.disabled=false}
  });
  function clear(){active=false;controller?.abort();rows=[];q('.crm-records').replaceChildren();q('.crm-filters').reset();q('.crm-status').textContent='';q('.crm-count').textContent='';q('.crm-page').textContent='';page=0}
  return {load,clear};
 }
 window.RentalCRM={mount};
})();
