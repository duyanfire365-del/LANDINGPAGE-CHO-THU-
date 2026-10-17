const homes=[
{id:1,title:'Căn hộ ngập tràn ánh sáng',area:'Tây Hồ',type:'Căn hộ chung cư',price:18,size:75,beds:2,image:'photo-1600210492486-724fe5c67fb0',tag:'KHÔNG GIAN THOÁNG',description:'Phòng khách mở, ban công đón nắng và nội thất tông gỗ ấm. Một gợi ý cho người yêu không gian sống thư thái.'},
{id:2,title:'Studio nhỏ, cảm hứng lớn',area:'Cầu Giấy',type:'Căn hộ dịch vụ',price:8.5,size:35,beds:1,image:'photo-1522708323590-d24dbb6b0267',tag:'SỐNG TỐI GIẢN',description:'Không gian gọn gàng, khu bếp riêng và góc làm việc đón sáng. Gợi ý dành cho một người hoặc cặp đôi.'},
{id:3,title:'Tổ ấm giữa lòng phố',area:'Ba Đình',type:'Nhà nguyên căn',price:24,size:110,beds:3,image:'photo-1600607687939-ce8a6c25118c',tag:'DÀNH CHO GIA ĐÌNH',description:'Không gian sinh hoạt rộng rãi, nhiều phòng riêng cùng góc xanh để cả gia đình tận hưởng thời gian bên nhau.'},
{id:4,title:'Một khoảng xanh bên cửa sổ',area:'Tây Hồ',type:'Căn hộ chung cư',price:14,size:60,beds:2,image:'photo-1600566753086-00f18fb6b3ea',tag:'GẦN GŨI THIÊN NHIÊN',description:'Nội thất dịu nhẹ và không gian mở tạo cảm giác gần gũi. Gợi ý cho những ngày làm việc tại nhà.'},
{id:5,title:'Góc riêng đầy chất thơ',area:'Ba Đình',type:'Căn hộ dịch vụ',price:9,size:40,beds:1,image:'photo-1505693416388-ac5ce068fe85',tag:'ẤM CÚNG & RIÊNG TƯ',description:'Phòng ngủ ấm áp, nội thất tối giản và ánh sáng tự nhiên. Một góc riêng để trở về sau ngày dài.'},
{id:6,title:'Sống rộng, tận hưởng nhiều hơn',area:'Cầu Giấy',type:'Căn hộ chung cư',price:28,size:95,beds:3,image:'photo-1600607687920-4e2a09cf159d',tag:'KHÔNG GIAN RỘNG MỞ',description:'Căn hộ rộng với khu sinh hoạt chung thoáng đãng, phù hợp cho gia đình cần nhiều không gian.'}
];
const $=s=>document.querySelector(s);const image=h=>`/room-${(h.id-1)%6}.svg`;
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
    const hasCategoryListings = homes.some(home => type === 'all' || home.type === type);
    const title = document.createElement('strong');
    title.textContent = hasCategoryListings ? 'Chưa có kết quả phù hợp với bộ lọc.' : `Chưa có tin đăng trong mục ${type.toLocaleLowerCase('vi')}.`;
    const body = document.createElement('span');
    body.textContent = hasCategoryListings ? 'Anh/chị có thể đổi khu vực, ngân sách hoặc liên hệ để được tư vấn.' : 'Anh/chị có thể liên hệ để trao đổi nhu cầu. Các tin trên trang hiện là dữ liệu minh họa.';
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

function render(){const area=$('#area').value,type=$('#type').value,budget=$('#budget').value;const selected=homes.filter(h=>(area==='all'||h.area===area)&&(type==='all'||h.type===type)&&matchesBudget(h.price,budget));$('#result-count').textContent=`${selected.length} bất động sản phù hợp`;$('#properties').innerHTML=selected.length?selected.map(h=>`<article class="card"><div class="card-photo"><img src="${image(h)}" alt="Hình minh họa ${h.title.toLowerCase()}" loading="lazy"><span class="tag">${h.tag}</span><button class="favorite" data-save="${h.id}" aria-label="Lưu ${h.title}" aria-pressed="${saved.has(h.id)}">${saved.has(h.id)?'♥':'♡'}</button></div><div class="card-info"><p class="location">${h.area}, Hà Nội · ${h.type}</p><h3>${h.title}</h3><div class="specs"><span>${h.size} m²</span><span>${h.beds} phòng ngủ</span><span>Đầy đủ nội thất</span></div><div class="card-bottom"><div class="price">${String(h.price).replace('.',',')} triệu <small>đồng/tháng</small></div><button class="detail-button" data-detail="${h.id}" aria-label="Xem chi tiết ${h.title}">Xem chi tiết</button></div></div></article>`).join(''):'<p class="empty">Chưa có bất động sản phù hợp với bộ lọc. Anh/chị hãy thử khu vực, loại bất động sản hoặc mức giá khác.</p>';renderCategory(type,selected.length);document.querySelectorAll('[data-type]').forEach(b=>{b.classList.toggle('active',b.dataset.type===type);b.setAttribute('aria-pressed',String(b.dataset.type===type))})}
$('#search').addEventListener('submit',e=>{e.preventDefault();render();$('#bat-dong-san').scrollIntoView({behavior:'smooth'})});document.querySelectorAll('[data-type]').forEach(b=>b.addEventListener('click',()=>{$('#type').value=b.dataset.type;render()}));
$('#properties').addEventListener('click',e=>{const save=e.target.closest('[data-save]'),detail=e.target.closest('[data-detail]');if(save){const id=Number(save.dataset.save);saved.has(id)?saved.delete(id):saved.add(id);try{localStorage.setItem('rental-favorites',JSON.stringify([...saved]))}catch{}render();toast(saved.has(id)?'Đã lưu căn yêu thích trên trình duyệt này':'Đã bỏ lưu căn nhà')}if(detail)showDetail(Number(detail.dataset.detail))});
function showDetail(id){const h=homes.find(h=>h.id===id);$('#detail-content').innerHTML=`<img src="${image(h)}" alt="Hình minh họa ${h.title}"><div><p class="eyebrow">${h.area.toUpperCase()} · HÀ NỘI</p><h2>${h.title}</h2><p>${h.description}</p><p>${h.size} m² · ${h.beds} phòng ngủ · Đầy đủ nội thất</p><p class="price">${String(h.price).replace('.',',')} triệu đồng/tháng</p><p class="sample-note">Thông tin minh họa. Vui lòng gọi để xác nhận nhà còn trống, giá thuê, tiền đặt cọc và các khoản phí khác.</p><button class="button" id="choose-home">Tư vấn về căn này</button></div>`;$('#detail').showModal();$('#choose-home').onclick=()=>{$('#lead-property').value=String(id);$('[name=preferredType]').value=h.type;$('.extra-fields').open=true;$('#detail').close();$('#tu-van').scrollIntoView({behavior:'smooth'});$('#lead-form input[name=name]').focus({preventScroll:true})}}
$('#close-detail').onclick=()=>$('#detail').close();$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')){const r=$('#detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#detail').close()}});
homes.forEach(h=>{const o=document.createElement('option');o.value=String(h.id);o.textContent=`${h.title} — ${h.area}`;$('#lead-property').append(o)});
const dateField=$('input[name=date]');const now=new Date();const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;dateField.min=today;
$('input[name=name]').addEventListener('input',e=>e.target.setCustomValidity(''));dateField.addEventListener('input',()=>dateField.setCustomValidity(''));render();
// Vietnamese feedback instead of browser-default messages in another language.
const form=$('#lead-form');
form.addEventListener('invalid',event=>{const field=event.target;if(field.validity.valueMissing){field.setCustomValidity(field.type==='checkbox'?'Vui lòng xác nhận trước khi tiếp tục.':({name:'Vui lòng nhập họ và tên.',phone:'Vui lòng nhập số điện thoại.',ownerAddress:'Vui lòng nhập địa chỉ BĐS.',ownerSize:'Vui lòng nhập diện tích BĐS.'}[field.name]||'Vui lòng điền thông tin này.'))}else if(field.name==='phone'&&field.validity.patternMismatch){field.setCustomValidity('Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số hoặc bắt đầu bằng +84.')}else if(field.name==='date'&&field.validity.rangeUnderflow){field.setCustomValidity('Vui lòng chọn hôm nay hoặc ngày sắp tới.')}},true);
form.addEventListener('input',event=>event.target.setCustomValidity?.(''));
