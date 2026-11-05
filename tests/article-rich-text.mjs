import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {newsFixture} from './news-fixture.mjs';
import {normalizeRichArticle,richArticleText,renderRichArticle,safeArticleLink} from '../lib/article-rich-text.mjs';
import {saveNews,getNews,listNews,articleBodyHTML} from '../lib/news.mjs';
const f=await newsFixture(),original=global.fetch;global.fetch=f.fetch;
const footer='Biên soạn: Tổng Nguồn BĐS Cho Thuê Hà Nội. Nội dung mang tính hướng dẫn tham khảo; cần khảo sát hiện trạng và xác minh điều kiện sử dụng tại từng mặt bằng trước khi quyết định thuê.';
try{
 const doc={version:1,ops:[{insert:'Nội dung định dạng',attributes:{font:'georgia',size:'24px',bold:true,italic:true,color:'#1d4ed8',background:'#fff'}},{insert:'\n',attributes:{align:'center'}},{insert:'Mục quan trọng'},{insert:'\n',attributes:{header:2}},{insert:'Tiêu chí thứ nhất'},{insert:'\n',attributes:{list:'ordered'}},{insert:'Tiêu chí thứ hai'},{insert:'\n',attributes:{list:'ordered'}},{insert:'Tham khảo',attributes:{link:'https://example.com/?a=1&b=2'}},{insert:'\n'},{insert:footer+'\n'}]};
 const clean=normalizeRichArticle(doc);assert.equal(clean.ops[0].attributes.background,'#ffffff');const html=renderRichArticle(clean);assert(html.includes('font-family:Georgia, serif'));assert(html.includes('font-size:24px'));assert(html.includes('<strong>'));assert(html.includes('<em>'));assert(html.includes('article-align-center'));assert(html.includes('<ol><li>Tiêu chí thứ nhất</li><li>Tiêu chí thứ hai</li></ol>'));assert(html.includes('<p class="news-credit">'+footer+'</p>'));assert(html.includes('href="https://example.com/?a=1&amp;b=2"'));
 assert.equal(safeArticleLink('/kinh-nghiem-tim-mbkd'),'/kinh-nghiem-tim-mbkd');for(const link of ['javascript:alert(1)','data:text/html,<script>','https://user:pass@example.com','\njavascript:alert(1)'])assert.throws(()=>safeArticleLink(link),{status:400});
 const escaped=renderRichArticle({ops:[{insert:'<img src=x onerror=alert(1)>\n'}]});assert(escaped.includes('&lt;img'));assert(!escaped.includes('<img'));
 for(const invalid of [{ops:[{insert:{image:'https://evil.example/pixel'}}]},{ops:[{insert:'x',attributes:{font:'Arial;position:fixed'}}]},{ops:[{insert:'x',attributes:{size:'999px'}}]},{ops:[{insert:'x',attributes:{background:'url(javascript:alert(1))'}}]},{ops:[{insert:'x',attributes:{onclick:'alert(1)'}}]},{ops:[{insert:'x',attributes:{link:'javascript:alert(1)'}}]},{ops:[{retain:4}]},{version:2,ops:[{insert:'x'}]},{ops:[{insert:'a'.repeat(50002)}]},{ops:[{insert:'\n'.repeat(2001)}]}])assert.throws(()=>normalizeRichArticle(invalid),{status:400});
 const base={id:randomUUID(),title:'Bài định dạng',content:'khác với bản định dạng',rich_content:doc,section:'experience',industry:'cafe',status:'published'};let saved=await saveNews(base);assert.equal(f.rows[0].content,richArticleText(clean));assert.deepEqual(f.rows[0].rich_content,clean);let a=await getNews(base.id,{admin:true});assert.deepEqual(a.rich_content,clean);const publicArticle=await getNews(base.id);assert(articleBodyHTML(publicArticle).includes('font-size:24px'));assert(!(JSON.stringify(await listNews({section:'experience'}))).includes('rich_content'));
 const statusOnly={...a,status:'draft'};delete statusOnly.rich_content;saved=await saveNews(statusOnly);
 // An API caller that omits rich_content during a status change preserves it.
 a=await getNews(base.id,{admin:true});delete a.rich_content;saved=await saveNews({...a,status:'published'});assert.deepEqual(f.rows[0].rich_content,clean);
 await assert.rejects(saveNews({...base,revision:'00000000-0000-0000-0000-000000000000'}),{status:409});
 saved=await saveNews({...a,revision:saved.article.revision,status:'published',content:'Văn bản mới\n\n'+footer});assert.equal(f.rows[0].rich_content,null);assert(articleBodyHTML(await getNews(base.id)).includes('<p class="news-credit">'+footer+'</p>'));assert(f.rows[0].content.endsWith(footer));
 const malformed={content:'Văn bản an toàn',richContent:{ops:[{insert:{image:'evil'}}]}};assert.equal(articleBodyHTML(malformed),'<p>Văn bản an toàn</p>');assert.equal(f.tables.posts.length,0);
 console.log('PASS rich articles: font/size/color/inline/block/list/link rendering, plain canonical text, credit styling, HTML escaping, injection/embed/size guards, save/reload and legacy/status-change compatibility.');
}finally{global.fetch=original}
