"""Build server-side FAQ knowledge from the visible FAQ; contains no credentials."""
from pathlib import Path
from html.parser import HTMLParser
import json
root=Path(__file__).resolve().parents[1]
class FAQ(HTMLParser):
    def __init__(self):
        super().__init__();self.items=[];self.active=False;self.section='';self.q=[];self.a=[];self.number=False
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='details' and attrs.get('id','').startswith('faq-'):
            self.active=True;self.q=[];self.a=[]
        if self.active and tag=='summary':self.section='q'
        if self.active and tag=='p':self.section='a'
        if self.active and tag=='span' and attrs.get('class')=='faq-number':self.number=True
    def handle_endtag(self,tag):
        if tag=='span':self.number=False
        if self.active and tag in ['p','summary']:self.section=''
        if self.active and tag=='details':
            self.items.append({'question':' '.join(self.q),'answer':' '.join(self.a)})
            self.active=False
    def handle_data(self,text):
        if self.active and text.strip() and not self.number:
            if self.section=='q':self.q.append(text.strip())
            if self.section=='a':self.a.append(text.strip())
parser=FAQ();parser.feed((root/'public/index.html').read_text())
assert len(parser.items)==10, 'Expected the 10 visible FAQs'
knowledge={'brand':'Nguồn cho thuê BĐS Hà Nội','phone':'0906215365','faq':parser.items,'status':'Tin đăng theo tài liệu nguồn cung cấp; hình ảnh là minh họa bằng AI, không phải ảnh hiện trạng. Không xác nhận nhà còn trống, phí môi giới, lịch hẹn hoặc giá cuối cùng khi chưa trao đổi trực tiếp.'}
(root/'lib/chat-knowledge.json').write_text(json.dumps(knowledge,ensure_ascii=False,indent=2))
print('Synced 10 FAQ answers for the AI endpoint.')
