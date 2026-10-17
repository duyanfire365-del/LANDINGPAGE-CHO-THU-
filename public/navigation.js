(() => {
 document.querySelectorAll('[data-back]').forEach(button=>button.addEventListener('click',()=>{
  let ownReferrer=false;try{ownReferrer=new URL(document.referrer).origin===location.origin}catch{}
  if(ownReferrer&&history.length>1)history.back();else location.assign('/');
 }));
})();
