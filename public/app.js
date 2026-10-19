const homes=window.RENTAL_LISTINGS || [];
const $=selector=>document.querySelector(selector);
const image=home=>home.image;
const esc=window.RentalSharing.escape;
const inCategory=(home,type)=>type==='all'||home.categories.includes(type);
let visibleLimit=9;
let saved=new Set();try{saved=new Set(JSON.parse(localStorage.getItem('rental-favorites')||'[]').filter(id=>homes.some(h=>h.id===id)))}catch{}
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').style.display='none',2800)}
// Prices are in millions of VND per month. The two "under" options intentionally overlap.
// At shared boundaries, 20 belongs to 20–30, 30 to 30–50; exactly 50 stays in 30–50.
function matchesBudget(price, budget) {
  switch (budget) {
    case 'all': return true;
    case 'under-5': return price < 5;
    case 'under-10': return price < 10;
    case '10-20': return price >= 10 && price < 20;
    case '20-30': return price >= 20 && price < 30;
    case '30-50': return price >= 30 && price <= 50;
    case 'over-50': return price > 50;
    default: return false;
  }
}
// Category descriptions guide customers without inventing live property listings.
const categoryContent = {
  all: {
    title: 'Tất cả BĐS cho thuê',
    description: 'Khám phá các loại bất động sản theo nhu cầu kinh doanh, làm việc, sản xuất hoặc sinh sống. Chọn một danh mục phía trên để xem thông tin riêng.',
    checklist: ['Khu vực mong muốn', 'Ngân sách mỗi tháng', 'Mục đích sử dụng']
  },
  'Mặt bằng kinh doanh': {
    description: 'Tìm không gian phù hợp để mở cửa hàng, quán ăn, showroom hoặc điểm cung cấp dịch vụ. Cần trao đổi rõ ngành nghề và điều kiện hoạt động trước khi hẹn xem.',
    checklist: ['Mặt tiền và lối vào', 'Chỗ để xe', 'Ngành nghề được phép kinh doanh']
  },
  'Văn phòng': {
    description: 'Lựa chọn nơi làm việc theo quy mô đội ngũ và nhu cầu tiếp khách. Hỏi rõ diện tích sử dụng, giờ ra vào và các khoản phí ngoài tiền thuê.',
    checklist: ['Số chỗ làm việc', 'Phí quản lý và gửi xe', 'Điều kiện đăng ký kinh doanh']
  },
  'Kho xưởng': {
    description: 'Tìm kho lưu hàng hoặc nhà xưởng theo yêu cầu vận hành. Cần xác nhận công năng, điều kiện an toàn và khả năng tiếp cận của phương tiện vận chuyển.',
    checklist: ['Đường xe tải và khu bốc dỡ', 'Nguồn điện và chiều cao', 'Điều kiện phòng cháy, chữa cháy']
  },
  'Nhà nguyên căn': {
    description: 'Không gian riêng cho gia đình hoặc nhu cầu sử dụng nhiều tầng, nhiều phòng. Kiểm tra hiện trạng, nội thất bàn giao và mục đích sử dụng được chủ nhà đồng ý.',
    checklist: ['Số tầng và số phòng', 'Nội thất bàn giao', 'Thời hạn thuê và tiền đặt cọc']
  },
  'Căn hộ chung cư': {
    description: 'Chọn căn hộ theo số phòng ngủ, tiện ích và quãng đường đi làm. So sánh tổng chi phí sinh hoạt cùng các quy định của tòa nhà.',
    checklist: ['Số phòng ngủ', 'Phí dịch vụ và gửi xe', 'Nội quy tòa nhà']
  },
  'Căn hộ dịch vụ': {
    description: 'Phù hợp với nhu cầu ở có kèm tiện ích hoặc dịch vụ hỗ trợ. Cần hỏi cụ thể hạng mục nào đã bao gồm trong giá và thời gian lưu trú tối thiểu.',
    checklist: ['Nội thất có sẵn', 'Dịch vụ và điện nước', 'Thời gian thuê tối thiểu']
  },
  'Phòng trọ': {
    description: 'Tìm phòng theo ngân sách và vị trí đi học, đi làm. Xem kỹ không gian sinh hoạt, điều kiện an ninh và cách tính các khoản phí hằng tháng.',
    checklist: ['Diện tích và số người ở', 'Giá điện, nước và Internet', 'Giờ giấc và chỗ để xe']
  },
  'Biệt thự, nhà liền kề': {
    description: 'Lựa chọn không gian rộng theo nhu cầu gia đình hoặc hoạt động được phép. Trao đổi về sân vườn, chỗ đỗ xe, phí khu đô thị và trách nhiệm bảo trì.',
    checklist: ['Diện tích nhà và sân vườn', 'Chỗ đỗ ô tô', 'Phí quản lý và bảo trì']
  },
  'Ki-ốt': {
    description: 'Tìm điểm bán gọn tại chợ, khu dân cư hoặc khu thương mại. Cần kiểm tra vị trí gian hàng, thời gian hoạt động và quy định kinh doanh tại địa điểm.',
    checklist: ['Vị trí và lối tiếp cận', 'Ngành hàng được phép', 'Phí dịch vụ và giờ hoạt động']
  },
  'Đất cho thuê': {
    description: 'Tìm diện tích đất theo nhu cầu sử dụng cụ thể. Xác minh quyền cho thuê, mục đích sử dụng đất và điều kiện được phép triển khai trước khi ký hợp đồng.',
    checklist: ['Mục đích sử dụng đất', 'Đường vào và hạ tầng', 'Hồ sơ và thời hạn thuê']
  },
  'Bất động sản khác': {
    description: 'Anh/chị có nhu cầu đặc thù hoặc chưa tìm thấy danh mục phù hợp? Chia sẻ mục đích sử dụng, diện tích và khu vực để trao đổi cụ thể.',
    checklist: ['Nhu cầu sử dụng', 'Diện tích dự kiến', 'Điều kiện cần đáp ứng']
  }
};
function renderCategory(type, count) {
  const content = categoryContent[type] || categoryContent.all;
  $('#category-title').textContent = content.title || type;
  $('#category-description').textContent = content.description;
  $('#category-checklist').replaceChildren(...content.checklist.map(text => {
    const item = document.createElement('li'); item.textContent = text; return item;
  }));
  $('#results-title').textContent = type === 'all' ? 'Danh sách BĐS' : `Danh sách ${type.toLocaleLowerCase('vi')}`;
  $('#category-consult').textContent = type === 'all' ? 'Tư vấn tìm BĐS' : 'Tư vấn loại BĐS này';
  const empty = $('#properties .empty');
  if (empty) {
    const hasCategoryListings = homes.some(home => inCategory(home,type));
    const title = document.createElement('strong');
    title.textContent = hasCategoryListings ? 'Chưa có kết quả phù hợp với bộ lọc.' : `Chưa có tin đăng trong mục ${type.toLocaleLowerCase('vi')}.`;
    const body = document.createElement('span');
    body.textContent = hasCategoryListings ? 'Anh/chị có thể đổi khu vực, ngân sách hoặc liên hệ để được tư vấn.' : 'Anh/chị có thể liên hệ để trao đổi nhu cầu. Tin được tổng hợp từ nguồn cung cấp; ảnh là minh họa bằng AI.';
    const link = document.createElement('a'); link.href = '#tu-van'; link.className = 'text-link';
    link.textContent = 'Trao đổi nhu cầu thuê'; link.addEventListener('click', prepareCategoryConsultation);
    empty.replaceChildren(title, body, link);
  }
}
function prepareCategoryConsultation() {
  const type = $('#type').value;
  $('[name=preferredType]').value = type === 'all' ? '' : type;
  $('[name=preferredArea]').value = $('#area').value === 'all' ? '' : $('#area').value;
  $('[name=preferredBudget]').value = $('#budget').value === 'all' ? '' : $('#budget').value;
}
$('#category-consult').addEventListener('click', prepareCategoryConsultation);

function rentMatches(home,budget){return (home.priceOptions||[{price:home.price}]).some(option=>matchesBudget(option.price,budget))}
function card(home){
  return `<article class="card"><div class="card-photo"><a href="${esc(home.href||'/bds/'+home.slug)}" aria-label="Xem ${esc(home.title)}"><img src="${image(home)}" alt="${esc(home.imageAlt)}" loading="lazy" width="1200" height="800"></a><span class="tag">${home.transferPrice?'SANG NHƯỢNG':'CHO THUÊ'} · ${esc(home.code)}</span><button class="favorite" data-save="${home.id}" aria-label="Lưu ${esc(home.title)}" aria-pressed="${saved.has(home.id)}">${saved.has(home.id)?'♥':'♡'}</button><span class="illustration-label">${home.isIllustration===false?'Ảnh do người đăng cung cấp':'Ảnh minh họa bằng AI'}</span></div><div class="card-info"><p class="location">${esc(home.area||'Cần xác nhận quận/huyện')} · ${esc(home.type)}</p><h3><a href="${esc(home.href||'/bds/'+home.slug)}">${esc(home.title)}</a></h3><p class="card-address">${esc(home.address)}</p><div class="specs"><span>${esc(home.areaText)}</span></div><p class="card-summary">${esc(home.description)}</p>${home.notes.length?'<p class="listing-warning">Có thông tin cần xác nhận — xem chi tiết.</p>':''}<div class="card-bottom"><div class="price">${home.priceOptions?'Từ ':''}${String(home.price).replace('.',',')} triệu <small>đồng/tháng</small></div><button class="detail-button" data-detail="${home.id}" aria-label="Xem chi tiết ${esc(home.title)}">Xem chi tiết</button></div>${home.transferPrice?`<p class="transfer-price">Sang nhượng: ${home.transferPrice} triệu đồng, tính riêng.</p>`:''}<div class="card-share"><button type="button" data-share-action="copy" data-share-id="${home.id}">Sao chép bài</button><button type="button" data-share-action="native" data-share-id="${home.id}">Chia sẻ bài & ảnh</button></div></div></article>`;
}
function render(){
  const area=$('#area').value,type=$('#type').value,budget=$('#budget').value,query=($('#property-query')?.value||'').trim().toLocaleLowerCase('vi');
  const selected=homes.filter(home=>(area==='all'||home.area===area)&&inCategory(home,type)&&rentMatches(home,budget)&&(!query||`${home.code} ${home.title} ${home.address} ${home.categories.join(' ')}`.toLocaleLowerCase('vi').includes(query)));
  selected.sort((a,b)=>(b.publishedDate||'').localeCompare(a.publishedDate||''));
  $('#result-count').textContent=`${selected.length} BĐS phù hợp`;
  $('#properties').innerHTML=selected.length?selected.slice(0,visibleLimit).map(card).join(''):'<div class="empty"></div>';
  $('#load-more').hidden=selected.length<=visibleLimit;
  $('#load-more').textContent=`Xem thêm BĐS (${Math.max(0,selected.length-visibleLimit)} tin còn lại)`;
  renderCategory(type,selected.length);
  document.querySelectorAll('[data-type]').forEach(button=>{button.classList.toggle('active',button.dataset.type===type);button.setAttribute('aria-pressed',String(button.dataset.type===type))});
}
$('#load-more').addEventListener('click',()=>{visibleLimit+=9;render()});
$('#search').addEventListener('submit',e=>{e.preventDefault();visibleLimit=9;render();$('#bat-dong-san').scrollIntoView({behavior:'smooth'})});document.querySelectorAll('[data-type]').forEach(b=>b.addEventListener('click',()=>{$('#type').value=b.dataset.type;visibleLimit=9;render()}));
$('#properties').addEventListener('click',e=>{const save=e.target.closest('[data-save]'),detail=e.target.closest('[data-detail]');if(save){const id=Number(save.dataset.save);saved.has(id)?saved.delete(id):saved.add(id);try{localStorage.setItem('rental-favorites',JSON.stringify([...saved]))}catch{}render();toast(saved.has(id)?'Đã lưu căn yêu thích trên trình duyệt này':'Đã bỏ lưu căn nhà')}if(detail)showDetail(Number(detail.dataset.detail))});
function showDetail(id){
  const home=homes.find(record=>record.id===id);if(!home)return;
  const prices=home.priceOptions?home.priceOptions.map(o=>`<li>${esc(o.label)}: <strong>${o.price} triệu đồng/tháng</strong></li>`).join(''):`<li>Giá thuê: <strong>${home.price} triệu đồng/tháng</strong></li>`;
  $('#detail-content').innerHTML=`<img src="${image(home)}" alt="${esc(home.imageAlt)}"><div><p class="eyebrow">${esc(home.code)} · ${esc(home.type)}</p><h2>${esc(home.title)}</h2><p>${esc(home.address)}</p><p>${esc(home.areaText)}</p><ul class="detail-facts">${prices}${home.transferPrice?`<li>Giá sang nhượng: <strong>${home.transferPrice} triệu đồng</strong>, tách riêng tiền thuê.</li>`:''}${home.facts.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>${home.notes.length?`<div class="detail-notes"><h3>Thông tin cần xác nhận</h3><ul>${home.notes.map(note=>`<li>${esc(note)}</li>`).join('')}</ul></div>`:''}<p class="sample-note">Thông tin theo nguồn cung cấp; cần xác nhận giá, tình trạng còn trống và các khoản phí trước khi thuê. ${home.isIllustration===false?'Ảnh do người đăng cung cấp; cần xác nhận hiện trạng.':'Ảnh minh họa bằng AI, không phải ảnh hiện trạng.'}</p><div class="detail-actions"><button class="button" id="choose-home">Tư vấn về BĐS này</button><a href="${esc(home.href||'/bds/'+home.slug)}">Mở trang riêng</a><a href="tel:0906215365">Gọi 0906 215 365</a></div>${RentalSharing.markup(home)}<details class="share-caption"><summary>Bài đăng để chia sẻ</summary><pre>${esc(RentalSharing.text(home))}</pre></details></div>`;
  RentalSharing.prepare(home);$('#detail').showModal();
  $('#choose-home').onclick=()=>{preparePropertyInquiry(home);$('#detail').close();$('#tu-van').scrollIntoView({behavior:'smooth'});$('#lead-form input[name=name]').focus({preventScroll:true})};
}
function preparePropertyInquiry(home){
  const intent=$('#lead-intent');if(intent){intent.value='tenant';intent.dispatchEvent(new Event('change'))}
  $('#lead-property').value=String(home.id);$('[name=preferredType]').value=home.type;$('[name=preferredArea]').value=home.area||'';
  $('.extra-fields').hidden=false;$('.extra-fields').open=true;
}
$('#close-detail').onclick=()=>$('#detail').close();$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')){const r=$('#detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#detail').close()}});
homes.forEach(h=>{const o=document.createElement('option');o.value=String(h.id);o.textContent=`${h.code} · ${h.title}`;$('#lead-property').append(o)});
const dateField=$('input[name=date]');const now=new Date();const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;dateField.min=today;
$('input[name=name]').addEventListener('input',e=>e.target.setCustomValidity(''));dateField.addEventListener('input',()=>dateField.setCustomValidity(''));render();
// Vietnamese feedback instead of browser-default messages in another language.
const form=$('#lead-form');
form.addEventListener('invalid',event=>{const field=event.target;if(field.validity.valueMissing){field.setCustomValidity(field.type==='checkbox'?'Vui lòng xác nhận trước khi tiếp tục.':({name:'Vui lòng nhập họ và tên.',phone:'Vui lòng nhập số điện thoại.',ownerAddress:'Vui lòng nhập địa chỉ BĐS.',ownerSize:'Vui lòng nhập diện tích BĐS.'}[field.name]||'Vui lòng điền thông tin này.'))}else if(field.name==='phone'&&field.validity.patternMismatch){field.setCustomValidity('Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số hoặc bắt đầu bằng +84.')}else if(field.name==='date'&&field.validity.rangeUnderflow){field.setCustomValidity('Vui lòng chọn hôm nay hoặc ngày sắp tới.')}},true);
form.addEventListener('input',event=>event.target.setCustomValidity?.(''));

const inquiry=new URLSearchParams(location.search).get('inquiry');
if(inquiry){const property=homes.find(home=>home.slug===inquiry);if(property)window.addEventListener('load',()=>preparePropertyInquiry(property),{once:true})}

window.addEventListener('catalog-ready',event=>{
 const added=event.detail.filter(row=>!homes.some(existing=>existing.id===row.id));homes.push(...added);
 for(const home of added){const option=document.createElement('option');option.value=String(home.id);option.textContent=home.code+' · '+home.title;$('#lead-property').append(option)}
 render();const slug=new URLSearchParams(location.search).get('inquiry'),record=added.find(row=>row.slug===slug);if(record)preparePropertyInquiry(record);
});
