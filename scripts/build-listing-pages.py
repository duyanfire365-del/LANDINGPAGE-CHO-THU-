"""Build stable shareable property URLs and public browser data from reviewed listings."""
from pathlib import Path
from html import escape
import json, os
from urllib.parse import quote

root=Path(__file__).resolve().parents[1]
public=root/'public'
records=json.loads((public/'listings.json').read_text())
assert all('hashtags' not in row and 'sourceNumber' not in row for row in records), 'Refusing to publish private source records; export the public dataset first.'
site=os.environ.get('SITE_URL','https://webchothue.vercel.app').rstrip('/')
assert site.startswith('https://')
for record in records:
    record.setdefault('shareImage',f"/images/{record['slug']}.jpg")
    title=escape(record['title']);url=site+'/bds/'+record['slug']
    prices=record.get('priceOptions',[{'label':'Giá thuê','price':record['price']}])
    rent=''.join(f"<li>{escape(option['label'])}: <strong>{option['price']} triệu đồng/tháng</strong></li>" for option in prices)
    transfer=f"<li>Giá sang nhượng: <strong>{record['transferPrice']} triệu đồng</strong>, tách riêng tiền thuê.</li>" if record.get('transferPrice') else ''
    facts=''.join('<li>'+escape(fact)+'</li>' for fact in record['facts'])
    notes='<section class="detail-notes"><h3>Thông tin cần xác nhận</h3><ul>'+''.join('<li>'+escape(note)+'</li>' for note in record['notes'])+'</ul></section>' if record['notes'] else ''
    caption=escape(record['shareText']+'\n\nXem thông tin: '+url)
    price_prefix='Từ ' if record.get('priceOptions') else ''
    html=f'''<!doctype html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="{escape(record['description'],quote=True)}"><title>{title} | {record['code']} — Nguồn cho thuê Hà Nội</title><link rel="canonical" href="{url}"><meta property="og:type" content="article"><meta property="og:title" content="{title}"><meta property="og:description" content="{escape(record['description'],quote=True)} Ảnh minh họa bằng AI, cần xác nhận thông tin thực tế."><meta property="og:url" content="{url}"><meta property="og:image" content="{site+record['shareImage']}"><meta property="og:image:alt" content="{escape(record['imageAlt'],quote=True)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="800"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{site+record['shareImage']}"><link rel="icon" href="/logo.png"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/listings.css"><script src="/listings-data.js" defer></script><script src="/sharing.js" defer></script><script src="/property.js" defer></script></head><body data-property-id="{record['id']}"><header><a class="logo" href="/"><img class="brand-logo" src="/logo.png" alt="Logo Cho thuê nhà Hà Nội" width="64" height="64">Nguồn cho thuê Hà Nội</a><a class="button outline small" href="/#bat-dong-san">Xem tất cả BĐS</a></header><main class="property-page"><nav class="property-breadcrumb" aria-label="Đường dẫn"><a href="/">Trang chủ</a> / <a href="/#bat-dong-san">BĐS cho thuê</a> / {record['code']}</nav><p class="eyebrow">{record['code']} · {escape(record['type'])}</p><h1 class="property-title">{title}</h1><p>{escape(record['address'])}</p><div class="property-layout"><article class="property-content"><img class="property-photo" src="{record['image']}" alt="{escape(record['imageAlt'],quote=True)}" width="1200" height="800"><p class="property-image-note">Ảnh minh họa bằng AI — không phải ảnh hiện trạng BĐS.</p><h2>Thông tin BĐS</h2><p>{escape(record['description'])}</p><ul class="detail-facts"><li>Diện tích theo nguồn: {escape(record['areaText'])}</li>{rent}{transfer}{facts}</ul>{notes}<p class="sample-note">Thông tin theo tài liệu nguồn cung cấp. Giá, tình trạng còn trống, chi phí dịch vụ và điều kiện giao dịch cần được xác nhận trực tiếp trước khi quyết định thuê.</p><h2>Chia sẻ tin này</h2><div id="property-sharing"></div><details class="share-caption"><summary>Bài đăng để chia sẻ</summary><pre>{caption}</pre></details></article><aside class="property-contact" aria-label="Liên hệ về BĐS"><p class="price">{price_prefix}{record['price']} triệu <small>đồng/tháng</small></p>{f'<p>Sang nhượng: {record["transferPrice"]} triệu đồng, tính riêng.</p>' if record.get('transferPrice') else ''}<p>Cần xác nhận tình trạng cho thuê và hẹn xem trước khi giao dịch.</p><a href="tel:0906215365">Gọi 0906 215 365</a><a class="button" href="https://zalo.me/0906215365" target="_blank" rel="noopener noreferrer">Trao đổi qua Zalo</a><a class="button outline" href="/?inquiry={record['slug']}#tu-van">Quan tâm BĐS này</a><p>Văn phòng: 17 Vũ Phạm Hàm, Cầu Giấy, Hà Nội.</p></aside></div></main><div class="property-footer">© 2026 Nguồn cho thuê Hà Nội · <a href="/#bat-dong-san">Trở về danh sách BĐS</a></div></body></html>'''
    destination=public/'bds'/record['slug']/'index.html';destination.parent.mkdir(parents=True,exist_ok=True);destination.write_text(html)
(public/'listings.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
(public/'listings-data.js').write_text('window.RENTAL_LISTINGS = '+json.dumps(records,ensure_ascii=False,indent=2)+';\n')
urls=[site]+[site+'/bds/'+record['slug'] for record in records]
(public/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+escape(url)+'</loc></url>' for url in urls)+'</urlset>')
print(f'Built {len(records)} property pages with individual sharing metadata.')
