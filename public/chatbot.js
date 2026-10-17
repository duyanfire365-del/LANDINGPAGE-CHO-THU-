(() => {
  const q = s => document.querySelector(s);
  const dialog = q('#rental-chat'), messages = q('#chat-messages'), options = q('#chat-options');
  const form = q('#lead-form');
  const state = {ai:false, lead:false, busy:false, draft:{}, flow:false, history:[], opened:false};
  const norm = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
  const faqs = [...document.querySelectorAll('.faq details')].map(el => ({question:el.querySelector('summary span:last-child')?.textContent || el.querySelector('summary').textContent, answer:[...el.querySelectorAll('.faq-answer p')].map(p=>p.textContent).join('\n\n')}));
  const propertyOptions = [...q('#type').options].filter(o=>o.value!=='all');
  const areaOptions = [...q('#area').options].filter(o=>o.value!=='all');
  const budgetOptions = [...q('#budget').options].filter(o=>o.value!=='all');
  function scrollLatest(){requestAnimationFrame(()=>{messages.scrollTop=messages.scrollHeight})}
  function append(role,text) {
    const bubble=document.createElement('div');bubble.className=`chat-message ${role}`;
    const label=document.createElement('span');label.className='chat-message-label';label.textContent=role==='user'?'Anh/chị':'Trợ lý';
    const content=document.createElement('p');content.textContent=text;bubble.append(label,content);messages.append(bubble);
    while(messages.children.length>60)messages.firstElementChild.remove();
    state.history.push({role:role==='user'?'user':'assistant',content:text.slice(0,1500)});state.history=state.history.slice(-12);
    scrollLatest();
  }
  function buttons(items) {
    options.replaceChildren();
    for(const [label,action]of items){const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',action);options.append(button)}
    scrollLatest();
  }
  function contactOptions() {
    buttons([['Điền thông tin quan tâm',()=>goToForm(state.draft.intent||'tenant')],['Chính chủ ký gửi',()=>start('owner')]]);
    const call=document.createElement('a');call.href='tel:0906215365';call.textContent='Gọi ngay 0906 215 365';options.append(call);
  }
  function updateSubmitLabel() {
    const owner=q('#lead-intent').value==='owner';
    form.querySelector('button[type=submit]').textContent=state.lead?(owner?'Gửi thông tin ký gửi':'Gửi nhu cầu cần thuê'):(owner?'Xem lại thông tin ký gửi':'Xem lại nhu cầu cần thuê');
  }
  function setIntent(intent) {
    const changed=q('#lead-intent').value!==intent;
    q('#lead-intent').value=intent;const owner=intent==='owner';
    q('#owner-fields').hidden=!owner;q('#owner-fields').disabled=!owner;
    q('#lead-heading').textContent=owner?'Thông tin ký gửi cho thuê':'Thông tin cần thuê';
    q('#lead-mode-description').textContent=owner?'Dành cho chính chủ hoặc người được ủy quyền: cung cấp vị trí, diện tích và giá cho thuê dự kiến.':'Chọn khu vực, loại BĐS và ngân sách để chuẩn bị nhu cầu tìm thuê.';
    q('#lead-area-label').textContent=owner?'Khu vực có BĐS':'Khu vực muốn thuê';
    q('#lead-type-label').textContent=owner?'Loại BĐS ký gửi':'BĐS muốn thuê';
    const budget=form.elements.preferredBudget;budget.closest('label').hidden=owner;budget.disabled=owner;
    const extra=form.querySelector('.extra-fields');extra.hidden=owner;
    extra.querySelectorAll('input, select').forEach(field=>field.disabled=owner);
    document.querySelectorAll('[data-lead-intent]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.leadIntent===intent)));
    if(changed){q('#lead-review').hidden=true;q('#form-status').textContent='';}
    updateSubmitLabel();
  }
  document.querySelectorAll('[data-lead-intent]').forEach(button=>button.addEventListener('click',()=>setIntent(button.dataset.leadIntent)));
  q('#lead-intent').addEventListener('change',e=>setIntent(e.target.value));
  function goToForm(intent) {
    setIntent(intent);
    const map={type:'preferredType',area:'preferredArea',budget:'preferredBudget',phone:'phone',ownerSize:'ownerSize',ownerRent:'ownerRent',ownerNotes:'ownerNotes'};
    for(const [key,name]of Object.entries(map))if(state.draft[key])form.elements[name].value=state.draft[key];
    close();q('#tu-van').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    form.elements.name.focus({preventScroll:true});
    q('#form-status').textContent=intent==='owner'?'Anh/chị điền thêm địa chỉ, diện tích và thông tin liên hệ để chuẩn bị yêu cầu ký gửi. Thông tin chưa được gửi.':'Nhu cầu đã được điền sẵn từ chat. Anh/chị bổ sung thông tin liên hệ để chuẩn bị yêu cầu. Thông tin chưa được gửi.';
  }
  function choose(field,available,prompt) {
    append('assistant',prompt);options.replaceChildren();
    const label=document.createElement('label');label.textContent=prompt;label.className='chat-sr-only';label.htmlFor='chat-choice';
    const select=document.createElement('select');select.id='chat-choice';select.setAttribute('aria-label',prompt);
    select.append(new Option('Chọn thông tin phù hợp',''));available.forEach(o=>select.append(new Option(o.textContent,o.value)));
    const button=document.createElement('button');button.type='button';button.textContent='Tiếp tục';
    button.addEventListener('click',()=>{if(!select.value){select.focus();return}state.draft[field]=select.value;append('user',select.options[select.selectedIndex].textContent);nextStep()});options.append(label,select,button);scrollLatest();
  }
  function nextStep() {
    const owner=state.draft.intent==='owner';
    if(!state.draft.type)return choose('type',propertyOptions,owner?'Anh/chị muốn ký gửi loại BĐS nào?':'Anh/chị đang cần thuê loại BĐS nào?');
    if(!state.draft.area)return choose('area',areaOptions,owner?'BĐS của anh/chị thuộc khu vực nào?':'Anh/chị ưu tiên khu vực nào của Hà Nội?');
    if(!owner&&!state.draft.budget)return choose('budget',budgetOptions,'Ngân sách thuê mỗi tháng của anh/chị khoảng bao nhiêu?');
    state.flow=false;
    append('assistant',owner?`Em đã ghi nhận nhu cầu ký gửi ${state.draft.type.toLocaleLowerCase('vi')} tại ${state.draft.area} trong cuộc chat này. Anh/chị bấm bên dưới để bổ sung địa chỉ, diện tích, giá dự kiến và số liên hệ. Sau đó gửi thông tin qua Zalo hoặc gọi hotline để trao đổi.`:`Em đã ghi nhận nhu cầu thuê ${state.draft.type.toLocaleLowerCase('vi')} tại ${state.draft.area}. Anh/chị bấm bên dưới để bổ sung họ tên, số điện thoại và chuẩn bị yêu cầu tư vấn. Chưa có thông tin nào được gửi cho tư vấn viên.`);
    buttons([[owner?'Điền thông tin ký gửi':'Điền thông tin quan tâm',()=>goToForm(state.draft.intent)],['Tôi cần gấp',urgent]]);
  }
  function start(intent) {
    state.draft={intent};state.flow=true;
    append('user',intent==='owner'?'Tôi là chính chủ muốn ký gửi cho thuê.':'Tôi đang tìm bất động sản thuê.');
    append('assistant',intent==='owner'?'Em sẽ giúp anh/chị chuẩn bị thông tin nguồn cho thuê. Anh/chị chỉ chia sẻ thông tin BĐS và liên hệ; việc xác minh quyền cho thuê sẽ được trao đổi trực tiếp.':'Em có thể giúp anh/chị làm rõ loại BĐS, khu vực và ngân sách trước khi trao đổi với tư vấn viên.');nextStep();
  }
  function urgent() {append('assistant','Nếu cần trao đổi gấp hoặc xác nhận nhà còn trống, anh/chị gọi ngay 0906 215 365. Chat tự động không xác nhận lịch xem, giá cuối cùng hoặc nhận đặt cọc.');contactOptions()}
  function showFaqs() {append('assistant','Anh/chị chọn câu hỏi cần giải đáp. Các câu trả lời dựa trên nội dung FAQ của website.');buttons(faqs.map(f=>[f.question,()=>respond(f.question)]))}
  document.querySelectorAll('[data-chat-action]').forEach(button=>button.addEventListener('click',()=>button.dataset.chatAction==='faq'?showFaqs():start(button.dataset.chatAction)));
  function detectFacts(text) {
    const normalized=norm(text);let changed=false;
    for(const [field,available]of [['type',propertyOptions],['area',areaOptions]]){const found=available.find(o=>normalized.includes(norm(o.value)));if(found){state.draft[field]=found.value;changed=true}}
    const aliases=[['mat bang','Mặt bằng kinh doanh'],['van phong','Văn phòng'],['kho','Kho xưởng'],['xuong','Kho xưởng'],['tro','Phòng trọ']];
    if(!state.draft.type)for(const [word,value]of aliases)if(new RegExp(`\\b${word}\\b`).test(normalized)){state.draft.type=value;changed=true;break}
    const phone=text.match(/(?:\+84|0)[0-9]{9}\b/);if(phone){state.draft.phone=phone[0];changed=true}
    const budget=budgetOptions.find(o=>normalized.includes(norm(o.textContent)));if(budget){state.draft.budget=budget.value;changed=true}
    else {const price=normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:trieu|tr\b)/);if(price){const n=Number(price[1].replace(',','.'));state.draft.budget=n<5?'under-5':n<10?'under-10':n<20?'10-20':n<30?'20-30':n<=50?'30-50':'over-50';if(state.draft.intent==='owner')state.draft.ownerRent=String(n);changed=true}}
    const size=text.match(/(\d+(?:[.,]\d+)?)\s*(?:m2|m²)/i);if(size&&state.draft.intent==='owner'){state.draft.ownerSize=size[1].replace(',','.');changed=true}
    return changed;
  }
  function faqAnswer(text) {
    const normalized=norm(text);const exact=faqs.find(f=>norm(f.question)===normalized);if(exact)return exact.answer;
    const patterns=[[/phi tu van|phi moi gioi|mat phi|mien phi|phi xem/,1],[/thuong luong|giam gia|dam phan/,6],[/hop dong|thoi han|hoan.*coc/,5],[/truoc khi ky|kiem tra.*gi|phap ly|phong chay/,9],[/dat coc.*(?:web|giu|online)|chuyen tien/,7],[/dat coc|tien coc/,5],[/gia thue|chi phi|dien nuoc|phi dich vu|phi quan ly/,0],[/lich xem|hen xem|di xem|xem nha|xem mat bang/,2],[/anh.*thuc|chinh xac|hinh anh|tin that|con trong/,3],[/loai hinh|co nhung loai|thue.*(?:xuong|van phong|kho)/,4],[/khong tim|ho tro tim|tim kiem/,8]];
    const found=patterns.find(([regex])=>regex.test(normalized));return found?faqs[found[1]].answer:null;
  }
  function transportHistory() {
    const result=[];let bytes=0;
    for(const message of state.history.slice(-10).reverse()){
      const length=new TextEncoder().encode(JSON.stringify(message)).length;
      if(bytes+length>12000)break;
      result.unshift(message);bytes+=length;
    }
    return result;
  }
  async function respond(text) {
    if(state.busy)return;append('user',text);options.replaceChildren();
    const normalized=norm(text);
    if(/can gap|khan cap|gap qua|can ngay|hotline|goi ngay/.test(normalized)){urgent();return}
    if(/chinh chu|ky gui|toi co (?:nha|mat bang|kho|xuong)|nha cua toi/.test(normalized)) {state.draft={intent:'owner'};state.flow=true;detectFacts(text);state.draft.ownerNotes=text;nextStep();return}
    const answer=faqAnswer(text);if(answer){append('assistant',answer);contactOptions();return}
    if(/can thue|tim thue|muon thue|tim mat bang|tim van phong/.test(normalized)&&!state.draft.intent){state.draft.intent='tenant';state.flow=true}
    const changed=detectFacts(text);
    if(state.flow||(changed&&state.draft.intent)){nextStep();return}
    if(/dien thong tin|de lai|lien he|tu van vien/.test(normalized)){append('assistant','Anh/chị có thể chuẩn bị thông tin trong biểu mẫu. Để tư vấn viên nhận được, anh/chị cần gửi nội dung qua Zalo hoặc nhận xác nhận gửi thành công.');contactOptions();return}
    if(state.ai) {
      state.busy=true;q('#chat-send').disabled=true;
      const pending=document.createElement('p');pending.className='chat-pending';pending.textContent='Đang trả lời…';messages.append(pending);messages.scrollTop=messages.scrollHeight;
      try {
        const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:transportHistory()}),signal:AbortSignal.timeout(15000)});
        const data=await response.json();if(!response.ok||typeof data.reply!=='string')throw Error('AI unavailable');append('assistant',data.reply);contactOptions();
      }catch{append('assistant','AI tạm thời chưa kết nối được. Anh/chị có thể chọn câu hỏi thường gặp, điền nhu cầu hoặc gọi 0906 215 365.');contactOptions()}
      finally{pending.remove();state.busy=false;q('#chat-send').disabled=false}
    }else {append('assistant','Em hiện trả lời tự động theo FAQ. Với nhu cầu cụ thể, anh/chị chọn “Tìm BĐS thuê” hoặc “Chính chủ ký gửi”; nếu cần xác nhận thông tin, vui lòng gọi 0906 215 365.');contactOptions()}
  }
  q('#chat-form').addEventListener('submit',e=>{e.preventDefault();const input=q('#chat-input');const text=input.value.trim();if(!text||state.busy)return;input.value='';respond(text)});
  function open() {
    if(dialog.open)return;dialog.showModal();document.body.classList.add('chat-is-open');q('#chat-launcher').setAttribute('aria-expanded','true');
    if(!state.opened){state.opened=true;append('assistant','Chào anh/chị! Em là trợ lý tư vấn của Nguồn cho thuê Hà Nội. Anh/chị đang tìm BĐS thuê hay là chính chủ muốn ký gửi cho thuê?');buttons([['Tôi đang tìm thuê',()=>start('tenant')],['Tôi là chính chủ ký gửi',()=>start('owner')],['Tôi cần hỗ trợ gấp',urgent]])}
    q('#chat-input').focus({preventScroll:true});scrollLatest();
  }
  window.addEventListener('resize',()=>{if(dialog.open)scrollLatest()});
  function close(){if(dialog.open)dialog.close()}
  q('#chat-launcher').addEventListener('click',open);q('#chat-close').addEventListener('click',close);
  dialog.addEventListener('close',()=>{document.body.classList.remove('chat-is-open');q('#chat-launcher').setAttribute('aria-expanded','false')});
  q('#chat-restart').addEventListener('click',()=>{if(state.busy)return;state.draft={};state.history=[];state.flow=false;state.opened=false;messages.replaceChildren();append('assistant','Mình bắt đầu lại nhé. Anh/chị cần tìm BĐS thuê hay muốn ký gửi cho thuê?');state.opened=true;buttons([['Tìm BĐS thuê',()=>start('tenant')],['Chính chủ ký gửi',()=>start('owner')]])});
  // A form handoff is explicit: no personal data is sent just by chatting or typing.
  function leadData() {
    const fields=form.elements;
    const selected=name=>fields[name].options[fields[name].selectedIndex]?.textContent||'';
    return {intent:fields.intent.value,name:fields.name.value.trim(),phone:fields.phone.value.trim(),area:fields.preferredArea.value,type:fields.preferredType.value,budget:fields.intent.value==='tenant'?fields.preferredBudget.value:'',budgetLabel:fields.preferredBudget.value?selected('preferredBudget'):'Chưa xác định',property:fields.intent.value==='tenant'&&fields.property.value?selected('property'):'',date:fields.intent.value==='tenant'?fields.date.value:'',ownerAddress:fields.ownerAddress.value.trim(),ownerSize:fields.ownerSize.value,ownerRent:fields.ownerRent.value,ownerNotes:fields.ownerNotes.value.trim(),ownerAuthority:fields.ownerAuthority.checked,contactConsent:fields.contactConsent.checked};
  }
  function summary(data) {
    const lines=[data.intent==='owner'?'YÊU CẦU CHÍNH CHỦ KÝ GỬI CHO THUÊ':'NHU CẦU TÌM BĐS THUÊ',`Họ và tên: ${data.name}`,`Số điện thoại: ${data.phone}`,`Khu vực: ${data.area||'Cần tư vấn'}`,`Loại BĐS: ${data.type||'Cần tư vấn'}`];
    if(data.intent==='owner')lines.push(`Địa chỉ: ${data.ownerAddress}`,`Diện tích: ${data.ownerSize} m²`,`Giá thuê dự kiến: ${data.ownerRent?data.ownerRent+' triệu đồng/tháng':'Thỏa thuận'}`,`Mô tả: ${data.ownerNotes||'Trao đổi thêm'}`,'Xác nhận: Chủ sở hữu hoặc người được ủy quyền cho thuê.');
    else{lines.push(`Ngân sách: ${data.budgetLabel}${data.budget ? ' đồng/tháng' : ''}`);if(data.property)lines.push(`BĐS quan tâm: ${data.property}`);if(data.date)lines.push(`Ngày muốn xem: ${data.date.split('-').reverse().join('/')}`)}
    return lines.join('\n');
  }
  let sending=false;
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(sending)return;
    if(!form.elements.name.value.trim()){form.elements.name.setCustomValidity('Vui lòng nhập họ và tên.');form.elements.name.reportValidity();return}
    const date=form.elements.date;if(form.elements.intent.value==='tenant'&&date.value&&date.value<date.min){date.setCustomValidity('Vui lòng chọn hôm nay hoặc ngày sắp tới.');date.reportValidity();return}
    if(!form.reportValidity())return;
    const data=leadData();q('#lead-summary').textContent=summary(data);q('#lead-review').hidden=false;
    if(!state.lead){q('#form-status').textContent='Thông tin đã sẵn sàng. Chưa gửi dữ liệu. Anh/chị sao chép nội dung bên dưới, mở Zalo và gửi cho tư vấn viên.';return}
    sending=true;const button=form.querySelector('button[type=submit]');button.disabled=true;button.textContent='Đang gửi…';
    try{const response=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(14000)});const result=await response.json();if(!response.ok||result.received!==true)throw Error('Not received');q('#form-status').textContent='Đã gửi yêu cầu thành công. Lịch xem hoặc thông tin ký gửi sẽ được xác nhận khi trao đổi trực tiếp.'}
    catch{q('#form-status').textContent='Chưa xác nhận gửi thành công. Anh/chị có thể sao chép thông tin và gửi qua Zalo hoặc gọi hotline.'}
    finally{sending=false;button.disabled=false;updateSubmitLabel()}
  });
  q('#copy-lead').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(q('#lead-summary').textContent);q('#form-status').textContent='Đã sao chép thông tin. Anh/chị mở Zalo, dán nội dung và bấm gửi để tư vấn viên nhận được.'}catch{const selection=window.getSelection(),range=document.createRange();range.selectNodeContents(q('#lead-summary'));selection.removeAllRanges();selection.addRange(range);q('#form-status').textContent='Chưa sao chép tự động được. Anh/chị sao chép phần nội dung được chọn rồi gửi qua Zalo.'}});
  fetch('/api/chat',{signal:AbortSignal.timeout(5000)}).then(r=>r.ok?r.json():null).then(data=>{
    if(!data)return;state.ai=data.aiEnabled===true;state.lead=data.leadEnabled===true;
    if(state.ai){q('#chat-mode').textContent='Trợ lý AI · FAQ và tư vấn nhu cầu';q('#chat-privacy').textContent='Câu hỏi có thể được gửi đến dịch vụ AI để tạo câu trả lời. Chat không tự gửi thông tin liên hệ cho tư vấn viên.'}
    if(state.lead){updateSubmitLabel();q('#lead-delivery-note').textContent='Thông tin chỉ được gửi sau khi anh/chị đồng ý liên hệ và bấm gửi yêu cầu.'}
  }).catch(()=>{});
  setIntent(q('#lead-intent').value);
})();
