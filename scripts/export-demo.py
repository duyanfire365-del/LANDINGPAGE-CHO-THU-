"""Export an offline, single-file HTML demo. No network dependencies."""
from pathlib import Path
import base64
import json
root = Path(__file__).resolve().parents[1]
p = root / 'public'
page = (p / 'index.html').read_text()
images = ['data:image/svg+xml;base64,' + base64.b64encode((p / f'room-{i}.svg').read_bytes()).decode() for i in range(6)]
for i, image in enumerate(images):
    page = page.replace(f'/room-{i}.svg', image)
logo = 'data:image/png;base64,' + base64.b64encode((p / 'logo.png').read_bytes()).decode()
page = page.replace('/logo.png', logo)
banner = 'data:image/png;base64,' + base64.b64encode((p / 'banner.png').read_bytes()).decode()
page = page.replace('/banner.png', banner)
script = (p / 'app.js').read_text().replace('`/room-${(h.id-1)%6}.svg`', 'demoImages[(h.id-1)%6]')
script = 'const demoImages=' + json.dumps(images) + ';\n' + script
page = page.replace('<link rel="stylesheet" href="/styles.css">', '<style>' + (p / 'styles.css').read_text() + '</style>')
page = page.replace('<script src="/app.js" defer></script>', '')
page = page.replace('<script src="/chatbot.js" defer></script>', '')
page = page.replace('<link rel="stylesheet" href="/chatbot.css">', '<style>' + (p / 'chatbot.css').read_text() + '</style>')
script += '\n;' + (p / 'chatbot.js').read_text()
page = page.replace('</body>', '<script>' + script + '</script></body>')
out = root / 'dist' / 'Nguon-cho-Thue-Ha-Noi-demo.html'
out.parent.mkdir(exist_ok=True)
out.write_text(page)
print(out)
