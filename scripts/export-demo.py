"""Export an offline, single-file HTML demo. No network dependencies."""
from pathlib import Path
import base64
import json
root = Path(__file__).resolve().parents[1]
p = root / 'public'
page = (p / 'index.html').read_text()
records = json.loads((p / 'listings.json').read_text())
for record in records:
    for field, mime in [('image', 'image/webp'), ('shareImage', 'image/jpeg')]:
        record[field] = 'data:' + mime + ';base64,' + base64.b64encode((p / record[field].lstrip('/')).read_bytes()).decode()
logo = 'data:image/png;base64,' + base64.b64encode((p / 'logo.png').read_bytes()).decode()
page = page.replace('/logo.png', logo)
banner = 'data:image/png;base64,' + base64.b64encode((p / 'banner.png').read_bytes()).decode()
page = page.replace('/banner.png?v=4', banner).replace('/banner.png', banner)
script = 'window.RENTAL_LISTINGS=' + json.dumps(records, ensure_ascii=False).replace('<', '\\u003c') + ';\n'
script += 'window.RENTAL_CATALOG_PROMISE=Promise.resolve({posts:[],inventory:{}});\n'
script += (p / 'sharing.js').read_text() + '\n;' + (p / 'inventory.js').read_text() + '\n;window.RentalSources={panel:()=>""};\n' + (p / 'app.js').read_text()
for name in ['listings-data.js', 'sharing.js', 'inventory.js', 'source-info.js', 'catalog.js', 'navigation.js']:
    page = page.replace(f'<script src="/{name}" defer></script>', '')
page = page.replace('<link rel="stylesheet" href="/listings.css">', '<style>' + (p / 'listings.css').read_text() + '</style>')
page = page.replace('<link rel="stylesheet" href="/styles.css">', '<style>' + (p / 'styles.css').read_text() + '</style>')
page = page.replace('<script src="/app.js" defer></script>', '')
page = page.replace('<script src="/chatbot.js" defer></script>', '')
page = page.replace('<link rel="stylesheet" href="/chatbot.css">', '<style>' + (p / 'chatbot.css').read_text() + '</style>')
script += '\n;' + (p / 'chatbot.js').read_text() + '\n;' + (p / 'navigation.js').read_text()
page = page.replace('<link rel="stylesheet" href="/portal.css">', '<style>' + (p / 'portal.css').read_text() + '</style>')
page = page.replace('</body>', '<script>' + script + '</script></body>')
out = root / 'dist' / 'Nguon-cho-Thue-Ha-Noi-demo.html'
out.parent.mkdir(exist_ok=True)
out.write_text(page)
print(out)
