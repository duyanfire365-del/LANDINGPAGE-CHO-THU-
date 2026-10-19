(() => {
 const box=document.createElement('details');box.className='portal-card';box.innerHTML=`<summary>Nguồn từ bot Telegram</summary><p>Bot: @Nguonbdschothueduy_inbox_bot. Khi bật tự động, nguồn hợp lệ sẽ được phân tích, kiểm tra trùng và đăng cùng ảnh minh họa AI. Địa chỉ chi tiết và hashtag giữ riêng.</p><div class="portal-links"><button class="button outline small" type="button" data-connect>Kết nối bot nhận nguồn</button><button class="button outline small" type="button" data-refresh>Tải nguồn mới</button></div><p role="status" data-status></p><div data-items></div>`;
 document.querySelector('#management').prepend(box);
 const status=box.querySelector('[data-status]'),items=box.querySelector('[data-items]');let generation=0;
 const labels={received:'Đã nhận',processing:'Đang phân tích / tạo ảnh',published:'Đã tự đăng',duplicate:'Bỏ qua nguồn trùng',review:'Cần bổ sung thông tin',blocked:'Thiếu cấu hình AI',failed:'Xử lý gián đoạn'};
 async function load(){
  const version=generation;const response=await fetch('/api/telegram-inbox',{cache:'no-store'}),data=await response.json();if(version!==generation)return;if(!response.ok)throw Error(data.error);items.replaceChildren();
  for(const item of data.items){
   const article=document.createElement('article');article.className='portal-record';const date=document.createElement('p');date.textContent=new Date(item.created_at).toLocaleString('vi-VN')+' · '+(labels[item.processing_status]||'Đã nhận');
   const text=document.createElement('pre');text.className='portal-source';text.style.whiteSpace='pre-wrap';text.textContent=item.content||'(Tin chỉ có tệp đính kèm)';
   const note=document.createElement('p');note.textContent=item.processing_error||((item.media||[]).length?'Có tệp đính kèm trong Telegram. Luồng tự đăng hiện đọc phần văn bản, tạo ảnh minh họa mới; không dùng ảnh đính kèm làm ảnh thực tế.':'Nội dung gốc được lưu riêng trong quản trị.');
   const copy=document.createElement('button');copy.type='button';copy.className='button outline small';copy.textContent='Sao chép nguồn';copy.onclick=async()=>{try{await navigator.clipboard.writeText(item.content);status.textContent='Đã sao chép nguồn. Anh có thể soạn thủ công trong Nhập tài liệu / Đăng tin.'}catch{status.textContent='Anh chọn văn bản nguồn để sao chép.'}};
   article.append(date,text,note,copy);
   if(item.result_url&&/^\/(?:tin\?|bds\/)/.test(item.result_url)){const link=document.createElement('a');link.className='button outline small';link.href=item.result_url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Xem tin trên website';article.append(link)}
   if(data.automation?.enabled&&['received','blocked','failed','processing'].includes(item.processing_status||'received')){const retry=document.createElement('button');retry.type='button';retry.className='button outline small';retry.textContent='Xử lý / Thử lại';retry.onclick=async()=>{retry.disabled=true;try{await RentalEditor.request('/api/telegram-inbox',{action:'process',id:item.id});status.textContent='Đã yêu cầu xử lý. Đợi vài phút rồi bấm Tải nguồn mới; nguồn đang chạy sẽ không chạy lặp.'}catch(error){status.textContent=error.message}finally{retry.disabled=false}};article.append(retry)}
   items.append(article);
  }
  const a=data.automation;status.textContent=(a?.enabled?(a.aiReady?'Tự đăng: đã bật.':'Tự đăng: đang thiếu OPENAI_API_KEY.'):'Tự đăng chưa bật. Thêm TELEGRAM_AUTO_PUBLISH=true trong Vercel rồi Redeploy.')+' Hiển thị '+data.items.length+' nguồn gần nhất. Bấm Tải nguồn mới để cập nhật kết quả.';
 }
 box.addEventListener('click',async event=>{const button=event.target.closest('[data-connect],[data-refresh]');if(!button)return;button.disabled=true;try{if(button.hasAttribute('data-connect')){await RentalEditor.request('/api/telegram-inbox',{action:'connect'});status.textContent='Đã kết nối. Anh gửi bài văn bản vào bot; quá trình phân tích và tạo ảnh có thể mất vài phút.'}else await load()}catch(error){status.textContent=error.message}finally{button.disabled=false}});
 window.addEventListener('admin-session',()=>{generation++;items.replaceChildren();status.textContent='';box.open=false});
})();
