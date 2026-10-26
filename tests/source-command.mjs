import assert from 'node:assert/strict';
import {sourceControl} from '../lib/source-command.mjs';
for(const text of ['status','/status',' /STATUS@Nguonbdschothueduy_inbox_bot ','/status kiểm tra','start','/help','/unknown'])assert.ok(sourceControl(text),text);
for(const text of ['/dang Cho thuê mặt bằng 40m² giá 30 triệu/tháng','Cho thuê quán bánh cuốn Cầu Giấy','/danglai','/retry','#hot KX - 7777',''])assert.equal(sourceControl(text),null,text);
console.log('PASS: control commands and bare status cannot be ingested as listings; property and edit commands remain supported.');
