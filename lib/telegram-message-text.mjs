// Telegram Bot API RichMessage/RichText: https://core.telegram.org/bots/api#richmessage
// Read visible content only, never concatenate metadata such as IDs or link targets.
export function telegramRichText(value,depth=0){
 if(depth>32)return '';
 if(typeof value==='string')return value;
 if(Array.isArray(value))return value.map(v=>telegramRichText(v,depth+1)).join('');
 if(!value||typeof value!=='object')return '';
 if(value.text!==undefined)return telegramRichText(value.text,depth+1);
 if(value.type==='custom_emoji')return value.alternative_text||'';
 if(value.type==='mathematical_expression')return value.expression||'';
 return '';
}
export function telegramRichBlocks(blocks,depth=0){
 if(depth>32||!Array.isArray(blocks))return '';
 return blocks.map(block=>{
  if(!block||typeof block!=='object')return '';
  const parts=[];
  if(block.summary)parts.push(telegramRichText(block.summary));
  if(block.text!==undefined)parts.push(telegramRichText(block.text));
  if(block.type==='mathematical_expression')parts.push(block.expression||'');
  if(Array.isArray(block.items))parts.push(block.items.map(item=>'• '+telegramRichBlocks(item.blocks,depth+1)).join('\n'));
  if(Array.isArray(block.cells))parts.push(block.cells.map(row=>Array.isArray(row)?row.map(cell=>telegramRichText(cell.text)).join('\t'):'').join('\n'));
  if(block.blocks)parts.push(telegramRichBlocks(block.blocks,depth+1));
  if(block.caption)parts.push(telegramRichText(block.caption.text??block.caption));
  return parts.filter(Boolean).join('\n');
 }).filter(Boolean).join('\n');
}
export function telegramMessageText(message){
 if(typeof message?.text==='string'&&message.text.trim())return message.text;
 if(typeof message?.caption==='string'&&message.caption.trim())return message.caption;
 return telegramRichBlocks(message?.rich_message?.blocks);
}
// Normalize a copy for all existing command/Reply paths; retain rich_message intact.
export function readableTelegramMessage(message,depth=0){
 if(!message||depth>4)return message;
 const text=telegramMessageText(message);
 return {...message,...(text&&!message.text?{text}:{}),...(message.reply_to_message?{reply_to_message:readableTelegramMessage(message.reply_to_message,depth+1)}:{})};
}
