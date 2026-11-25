(()=>{'use strict';
const CURRENT='2.0.3';
const LOCAL_HISTORY=[{"version":"2.0.3","date":"2026-11-25","changes":["Eksport JSON z wyborem zapisu, pobrania lub udostępnienia oraz uczciwym statusem zapisu.","Poprawione niedestrukcyjne usuwanie jednolitego tła miniatur w magazynie."]},{"version":"2.0.2","date":"2026-11-24","changes":["Automatyczne sprawdzanie aktualizacji po uruchomieniu i powrocie do aplikacji.","Ręczne sprawdzanie i instalowanie aktualizacji z poziomu ustawień.","Powiadomienie o dostępnej wersji i historia zmian.","Wersjonowana pamięć offline; bez zmian w lokalnej bazie danych."]},{"version":"2.0.1","date":"2026-11-24","changes":["Pierwsza publikacja PWA pod stałym adresem.","Manifest instalacyjny i podstawowa obsługa offline."]}];
let registration=null, checking=null, pending=false, applying=false, status='Sprawdzanie dostępności aktualizacji…', lastCheck=0, remoteHistory=null, banner=null;
const find=id=>document.getElementById(id);
function draw(){
 const s=find('kg-update-status');if(s&&s.textContent!==status)s.textContent=status;
 const b=find('kg-apply-update');if(b){b.hidden=!pending;b.style.display=pending?'':'none';}
 if(banner){banner.hidden=!pending;banner.style.display=pending?'flex':'none';}
}
function report(message){status=message;draw();}
function available(){pending=true;report('Dostępna aktualizacja. Zapisz bieżącą pracę przed instalacją.');}
function watch(reg){
 registration=reg;
 if(reg.waiting&&navigator.serviceWorker.controller)available();
 reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)available();if(worker.state==='redundant'&&!pending)report('Nie udało się przygotować aktualizacji. Spróbuj ponownie.');});});
}
async function check(manual=false){
 if(checking)return checking;
 if(!('serviceWorker' in navigator)){report('Ta przeglądarka nie obsługuje aktualizacji PWA.');return;}
 if(!navigator.onLine){report(pending?'Aktualizacja jest gotowa do instalacji.':'Tryb offline. Połącz się z internetem, aby sprawdzić aktualizacje.');return;}
 checking=(async()=>{
  try{
   lastCheck=Date.now();if(!pending)report('Sprawdzanie aktualizacji…');
   if(!registration){watch(await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}));}
   await registration.update();
   let version=null;try{const res=await fetch('./version.json',{cache:'no-store'});if(res.ok){const data=await res.json();if(typeof data.version==='string')version=data.version;if(Array.isArray(data.history))remoteHistory=data.history;}}catch{}
   if(registration.waiting&&navigator.serviceWorker.controller){available();return;}
   if(pending){draw();return;}
   if(version&&version!==CURRENT){report('Nowa wersja '+version+' jest publikowana lub pobierana. Sprawdź ponownie za chwilę.');return;}
   report(version===CURRENT?'Masz aktualną wersję '+CURRENT+'.':'Nie udało się potwierdzić wersji na serwerze. Spróbuj ponownie.');
  }catch(e){if(!pending)report('Nie udało się sprawdzić aktualizacji. Sprawdź połączenie.');}
  finally{checking=null;}
 })();
 return checking;
}
window.kgCheckUpdate=check;
window.kgApplyUpdate=async()=>{
 if(applying)return;
 if(!confirm('Zapisz rozpoczęte zmiany przed aktualizacją. Czy odświeżyć aplikację i zainstalować nową wersję?'))return;
 try{applying=true;if(registration?.waiting){report('Instalowanie aktualizacji…');registration.waiting.postMessage({type:'KG_SKIP_WAITING'});setTimeout(()=>{if(applying){applying=false;report('Aktualizacja nie została potwierdzona. Spróbuj ponownie lub zamknij aplikację i otwórz ją ponownie.');}},12000);}else if(pending){location.reload();}else{applying=false;await check(true);}}catch(e){applying=false;report('Nie udało się zainstalować aktualizacji.');}
};
window.kgShowHistory=()=>{const h=remoteHistory||LOCAL_HISTORY;const dialog=document.createElement('dialog');dialog.style.cssText='background:#171611;color:#eee1ca;border:1px solid #796243;border-radius:12px;max-width: min(520px,90vw);max-height:80vh;overflow:auto;padding:20px';const title=document.createElement('h2');title.textContent='HISTORIA ZMIAN';dialog.append(title);for(const entry of h){if(!entry||!Array.isArray(entry.changes))continue;const head=document.createElement('h3');head.textContent='Wersja '+entry.version+' · '+entry.date;dialog.append(head);const list=document.createElement('ul');for(const change of entry.changes){const li=document.createElement('li');li.textContent=String(change);list.append(li);}dialog.append(list);}const close=document.createElement('button');close.className='outlineaction';close.textContent='ZAMKNIJ';close.onclick=()=>dialog.close();dialog.append(close);dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();};
function start(){
 banner=document.createElement('div');banner.setAttribute('role','status');banner.style.cssText='position:fixed;z-index:999;left:12px;right:12px;top:max(8px,env(safe-area-inset-top));padding:12px;background:#252117;color:#f6e1b8;border:1px solid #b28e4c;border-radius:8px;gap:10px;align-items:center;justify-content:space-between;box-shadow:0 4px 15px #0008';const msg=document.createElement('span');msg.textContent='Dostępna aktualizacja Kwatery Głównej';const btn=document.createElement('button');btn.className='outlineaction';btn.textContent='AKTUALIZUJ';btn.onclick=window.kgApplyUpdate;const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','Ukryj powiadomienie');close.onclick=()=>{banner.style.display='none';};banner.append(msg,btn,close);document.body.append(banner);draw();
 const view=find('view');if(view)new MutationObserver(()=>draw()).observe(view,{childList:true});
 if('serviceWorker'in navigator){navigator.serviceWorker.addEventListener('controllerchange',()=>{if(applying){applying=false;location.reload();}else if(pending)report('Nowa wersja jest gotowa. Zapisz pracę i wybierz aktualizację.');});}
 check();
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&Date.now()-lastCheck>60000)check();});window.addEventListener('online',()=>check());setInterval(()=>{if(document.visibilityState==='visible'&&Date.now()-lastCheck>900000)check();},900000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
;(()=>{'use strict';
function notify(title,message){if(typeof window.showModal==='function')window.showModal(title,message);else alert(title+'\n'+message);}
function backupDialog(name,content,type){
 const stamp=new Date().toLocaleTimeString('pl-PL',{hour12:false}).replace(/:/g,'-');
 const filename=name.replace(/\.json$/i,'-'+stamp+'.json');
 const blob=new Blob([content],{type:type||'application/json'}),file=new File([blob],filename,{type:'application/json'});
 const dialog=document.createElement('dialog');dialog.style.cssText='width:min(520px,92vw);max-height:85vh;overflow:auto;background:#171611;color:#eee1ca;border:1px solid #796243;border-radius:12px;padding:20px;box-sizing:border-box';
 const title=document.createElement('h2');title.textContent='KOPIA GOTOWA DO ZAPISU';
 const info=document.createElement('p');info.textContent=filename+' · '+Math.ceil(blob.size/1024)+' KB';
 const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Wybierz zapis lub pobranie. Samo przygotowanie kopii nie oznacza zapisania pliku.';
 const row=document.createElement('div');row.style.cssText='display:grid;gap:10px';
 function button(label,fn){const b=document.createElement('button');b.type='button';b.className='gun-button';b.textContent=label;b.onclick=fn;row.append(b);return b;}
 if(typeof window.showSaveFilePicker==='function')button('ZAPISZ W WYBRANYM MIEJSCU',async()=>{let writer;try{const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Kopia JSON',accept:{'application/json':['.json']}}]});writer=await handle.createWritable();await writer.write(blob);await writer.close();status.textContent='Zapisano: '+handle.name+'. Lokalizacja: folder wybrany w oknie zapisu.';}catch(e){if(writer)try{await writer.abort()}catch{}status.textContent=e.name==='AbortError'?'Anulowano zapis.':'Nie zapisano: '+(e.message||'błąd zapisu')+'. Użyj Pobierz plik.';}});
 button('POBIERZ PLIK JSON',()=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),120000);status.textContent='Zlecono pobranie: '+filename+'. Sprawdź Pobrane lub lokalizację wybraną przez przeglądarkę. Aplikacja nie może potwierdzić zapisu w tym trybie.';});
 if(navigator.canShare&&navigator.share&&navigator.canShare({files:[file]}))button('UDOSTĘPNIJ / ZAPISZ PRZEZ ANDROIDA',async()=>{try{await navigator.share({files:[file],title:'Kopia Kwatery Głównej'});status.textContent='Przekazano kopię do wybranej aplikacji. Sprawdź, czy została zapisana.';}catch(e){status.textContent=e.name==='AbortError'?'Anulowano udostępnienie.':'Nie udało się udostępnić pliku.';}});
 button('ZAMKNIJ',()=>dialog.close());dialog.append(title,info,status,row);dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
}
function installBackup(){if(typeof window.downloadText==='function'){const old=window.downloadText;window.downloadText=function(name,content,type){if(/\.json$/i.test(name)){try{return backupDialog(name,content,type)}catch(e){notify('Błąd przygotowania kopii',e.message);return;}}return old.apply(this,arguments);};}}
/* Non-destructive, local thumbnail cleanup for uniform backgrounds. */
function maskBackground(d,w,h){
 const n=w*h,edge=[];if(w<8||h<8)return false;
 const step=Math.max(1,Math.floor(Math.min(w,h)/48));
 for(let x=0;x<w;x+=step){edge.push(x,(h-1)*w+x)}
 for(let y=1;y<h-1;y+=step){edge.push(y*w,y*w+w-1)}
 const bins=new Map();for(const i of edge){const k=i*4;if(d[k+3]<32)continue;const key=[d[k]>>5,d[k+1]>>5,d[k+2]>>5].join(',');const b=bins.get(key)||[0,0,0,0];b[0]++;b[1]+=d[k];b[2]+=d[k+1];b[3]+=d[k+2];bins.set(key,b);}
 let top=null;for(const b of bins.values())if(!top||b[0]>top[0])top=b;if(!top)return false;
 const rgb=top.slice(1).map(x=>x/top[0]);const dist=i=>{const k=i*4;return Math.max(Math.abs(d[k]-rgb[0]),Math.abs(d[k+1]-rgb[1]),Math.abs(d[k+2]-rgb[2]));};
 const similar=i=>d[i*4+3]<32||dist(i)<=34;
 if(edge.filter(similar).length/edge.length<.60)return false;
 const seen=new Uint8Array(n),queue=new Int32Array(n);let head=0,tail=0;
 function push(i){if(!seen[i]&&similar(i)){seen[i]=1;queue[tail++]=i;}}
 for(let x=0;x<w;x++){push(x);push((h-1)*w+x)}
 for(let y=0;y<h;y++){push(y*w);push(y*w+w-1)}
 while(head<tail){const i=queue[head++],x=i%w,y=(i/w)|0;if(x>0)push(i-1);if(x<w-1)push(i+1);if(y>0)push(i-w);if(y<h-1)push(i+w)}
 if(tail<n*.10||tail>n*.94)return false;
 for(let j=0;j<tail;j++)d[queue[j]*4+3]=0;return true;
}
const cache=new Map();
function cleanCabinet(){
 document.querySelectorAll('.cabinet-grid img[data-clean-cabinet]').forEach(img=>{
  if(img.dataset.kgCleanV3)return;img.dataset.kgCleanV3='1';img.dataset.cleanStarted='1';
  const src=img.getAttribute('src');if(!src)return;
  function apply(cleaned){if(cleaned&&img.isConnected){img.src=cleaned;img.classList.add('photo-cleaned');}}
  if(cache.has(src)){apply(cache.get(src));return;}
  const source=new Image();source.onload=()=>{try{const c=document.createElement('canvas'),scale=Math.min(1,1000/Math.max(source.naturalWidth,source.naturalHeight));c.width=Math.max(1,Math.round(source.naturalWidth*scale));c.height=Math.max(1,Math.round(source.naturalHeight*scale));const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0,c.width,c.height);const frame=ctx.getImageData(0,0,c.width,c.height);let result=null;if(maskBackground(frame.data,c.width,c.height)){ctx.putImageData(frame,0,0);result=c.toDataURL('image/png');}if(cache.size>=24)cache.clear();cache.set(src,result);apply(result);}catch{}};source.src=src;
 });
}
function startFix(){installBackup();if(typeof window.enhanceCabinetImages==='function')window.enhanceCabinetImages=cleanCabinet;const view=document.getElementById('view');if(view)new MutationObserver(cleanCabinet).observe(view,{childList:true,subtree:true});cleanCabinet();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startFix,{once:true});else startFix();
})();
