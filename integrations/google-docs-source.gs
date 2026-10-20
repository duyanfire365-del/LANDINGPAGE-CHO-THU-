// Google Apps Script: script.google.com -> New project -> paste this file.
// Project Settings -> Script properties: WEBSITE_GOOGLE_KEY, GOOGLE_COMMAND_ID, GOOGLE_DOC_ID.
// Trigger guiNguonGoogleDocs every 5 minutes. No secrets go in this source code.
function guiNguonGoogleDocs() {
  const lock=LockService.getScriptLock();if(!lock.tryLock(500))return;
  try {
  const p=PropertiesService.getScriptProperties();
  const key=p.getProperty('WEBSITE_GOOGLE_KEY'),command=p.getProperty('GOOGLE_COMMAND_ID'),doc=p.getProperty('GOOGLE_DOC_ID');
  if(!key||!command||!doc)throw new Error('Thiếu 3 thuộc tính kết nối trong Project Settings.');
  const site=p.getProperty('WEBSITE_URL'); if(!site||!/^https:\/\//.test(site))throw new Error('Cần đặt WEBSITE_URL bằng địa chỉ HTTPS website của bạn.');
  const endpoint=site.replace(/\/$/,'')+'/api/workspace?google-docs-hook=1';
  const headers={'X-Google-Docs-Key':key};
  const run=p.getProperty('LAST_DOCS_RUN');
  if(run){
    const response=UrlFetchApp.fetch(endpoint+'&commandId='+encodeURIComponent(command)+'&runId='+encodeURIComponent(run),{headers:headers,muteHttpExceptions:true});
    if(response.getResponseCode()!==200)throw new Error('Chưa đọc được trạng thái website. Kiểm tra cổng lệnh; không in khóa kết nối.');
    const result=JSON.parse(response.getContentText());
    if(result.status==='running'||result.status==='preview')return;
    if(result.status==='done'||result.status==='review')p.setProperty('LAST_DOCS_DONE',p.getProperty('LAST_DOCS_SUBMITTED')||'');
    p.deleteProperty('LAST_DOCS_RUN');
  }
  const modified=String(DriveApp.getFileById(doc).getLastUpdated().getTime());
  if(modified===p.getProperty('LAST_DOCS_DONE')||Date.now()-Number(modified)<120000)return;
  const response=UrlFetchApp.fetch(endpoint,{method:'post',contentType:'application/json',headers:headers,payload:JSON.stringify({commandId:command,docId:doc}),muteHttpExceptions:true});
  if(response.getResponseCode()!==202)throw new Error('Website chưa nhận lệnh. Kiểm tra cấu hình/bật lệnh trong quản trị; không chia sẻ khóa.');
  const result=JSON.parse(response.getContentText());
  p.setProperties({LAST_DOCS_RUN:result.id,LAST_DOCS_SUBMITTED:modified});
  } finally {lock.releaseLock();}
}
