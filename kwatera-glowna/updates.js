(()=>{'use strict';
const CURRENT='2.0.9';
const LOCAL_HISTORY=[{"version":"2.0.9","date":"2026-11-25","changes":["Domyślny filtr adaptacyjny z dodatkowym wykrywaniem dużych jasnych resztek papieru i tła.","Ponowne czyszczenie częściowo przezroczystych zdjęć; zachowany tryb delikatny i oryginał.","Odczyt zdjęcia z właściwej karty zamiast polegania wyłącznie na kolejności listy."]},{"version":"2.0.8","date":"2026-11-25","changes":["Powrót na Pulpit po wznowieniu aplikacji, także po przywróceniu procesu lub okna PWA; bez kasowania danych.","Zachowanie bieżącego widoku przy powrocie z systemowego wyboru pliku."]},{"version":"2.0.7","date":"2026-11-25","changes":["Przywrócono delikatne czyszczenie jako domyślne; dostępny mocniejszy filtr i podgląd oryginałów.","Wczytywanie PNG z zachowaniem przezroczystości, poprawiona jakość JPEG; bez zmian dotychczasowych danych."]},{"version":"2.0.6","date":"2026-11-25","changes":["Pulpit przy ponownym uruchomieniu i powrocie z tła, z wyjątkiem systemowego wyboru pliku i aktywnych okien dialogowych.","Bez zmian lokalnych danych i adresu instalacji PWA."]},{"version":"2.0.5","date":"2026-11-25","changes":["Adaptacyjne usuwanie jasnego tła z cieniami i gradientami oraz jasnych pozostałości na miniaturach.","Ponowne przetwarzanie oryginałów bez zmiany danych."]},{"version":"2.0.4","date":"2026-11-25","changes":["Poprawione usuwanie jasnych obwódek i zamkniętych obszarów tła na miniaturach.","Ponowne przetwarzanie zdjęć bez zmiany oryginałów; oznaczenie wersji mechanizmu w magazynie."]},{"version":"2.0.3","date":"2026-11-25","changes":["Eksport JSON z wyborem zapisu, pobrania lub udostępnienia oraz uczciwym statusem zapisu.","Poprawione niedestrukcyjne usuwanie jednolitego tła miniatur w magazynie."]},{"version":"2.0.2","date":"2026-11-24","changes":["Automatyczne sprawdzanie aktualizacji po uruchomieniu i powrocie do aplikacji.","Ręczne sprawdzanie i instalowanie aktualizacji z poziomu ustawień.","Powiadomienie o dostępnej wersji i historia zmian.","Wersjonowana pamięć offline; bez zmian w lokalnej bazie danych."]},{"version":"2.0.1","date":"2026-11-24","changes":["Pierwsza publikacja PWA pod stałym adresem.","Manifest instalacyjny i podstawowa obsługa offline."]}];
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
function gentleMask(d,w,h){
 const n=w*h;if(w<8||h<8)return false;
 const edge=[];for(let x=0;x<w;x++){edge.push(x,(h-1)*w+x)}for(let y=1;y<h-1;y++){edge.push(y*w,y*w+w-1)}
 const bins=new Map();let transparent=0;
 for(const i of edge){const k=i*4;if(d[k+3]<32){transparent++;continue}const key=[d[k]>>5,d[k+1]>>5,d[k+2]>>5].join(',');let b=bins.get(key);if(!b){b=[0,0,0,0];bins.set(key,b)}b[0]++;b[1]+=d[k];b[2]+=d[k+1];b[3]+=d[k+2]}
 let best=null;for(const b of bins.values())if(!best||b[0]>best[0])best=b;
 const neutralWhite= i=>{const k=i*4;return Math.min(d[k],d[k+1],d[k+2])>=225&&Math.max(d[k],d[k+1],d[k+2])-Math.min(d[k],d[k+1],d[k+2])<=30};
 const whiteShare=edge.filter(neutralWhite).length/edge.length;
 const already=transparent/edge.length>.55;
 if(!best&&!already)return false;
 const rgb=whiteShare>.28||already?[250,250,250]:best.slice(1).map(v=>v/best[0]);
 const pale=Math.min(...rgb)>180&&Math.max(...rgb)-Math.min(...rgb)<38;
 const diff=i=>{let k=i*4;return Math.max(Math.abs(d[k]-rgb[0]),Math.abs(d[k+1]-rgb[1]),Math.abs(d[k+2]-rgb[2]))};
 const close=i=>d[i*4+3]<32||diff(i)<=(pale?45:30)||(pale&&neutralWhite(i));
 const share=edge.filter(close).length/edge.length;if(share<.34&&!already)return false;
 const seen=new Uint8Array(n),q=new Int32Array(n);let head=0,tail=0;
 const push=i=>{if(!seen[i]&&close(i)){seen[i]=1;q[tail++]=i}};
 const walk=fn=>{while(head<tail){const i=q[head++],x=i%w,y=(i/w)|0;fn(i);if(x>0)push(i-1);if(x<w-1)push(i+1);if(y>0)push(i-w);if(y<h-1)push(i+w)}};
 for(const i of edge)push(i);
 walk(()=>{});const exterior=tail;
 if(exterior<n*.025&&!already||exterior>n*.975)return false;
 // Remove enclosed, substantially uniform light patches (not small highlights).
 if(pale){
 for(let i=0;i<n;i++){if(seen[i]||d[i*4+3]<32||!close(i))continue;const start=tail;push(i);let whites=0,minx=w,maxx=0,miny=h,maxy=0;walk(j=>{const x=j%w,y=(j/w)|0;minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y);if(neutralWhite(j)||diff(j)<20)whites++});const count=tail-start;
 if(count<Math.max(18,n*.00012)||whites/count<.70||maxx-minx<3||maxy-miny<3){for(let j=start;j<tail;j++)seen[q[j]]=2;} }
 }
 let removed=0,opaque=0;for(let i=0;i<n;i++){if(d[i*4+3]>32){opaque++;if(seen[i]===1)removed++}}
 if(removed<Math.max(5,opaque*.003)||opaque-removed<n*.012)return false;
 for(let i=0;i<n;i++){if(seen[i]===1)d[i*4+3]=0;}
 // Soften bright fringe adjacent to the newly transparent region.
 if(pale)for(let i=0;i<n;i++){if(seen[i]===1||d[i*4+3]===0)continue;let x=i%w,y=(i/w)|0;if(!((x>0&&seen[i-1]===1)||(x<w-1&&seen[i+1]===1)||(y>0&&seen[i-w]===1)||(y<h-1&&seen[i+w]===1)))continue;let k=i*4;const distance=diff(i);if(Math.min(d[k],d[k+1],d[k+2])>170&&distance<85)d[k+3]=Math.min(d[k+3],Math.round(255*Math.max(0,Math.min(1,(distance-35)/50))))}
 return true;
}
function strongMask(d,w,h){
 const n=w*h;if(w<8||h<8)return false;
 const edge=[];for(let x=0;x<w;x++){edge.push(x,(h-1)*w+x)}for(let y=1;y<h-1;y++){edge.push(y*w,y*w+w-1)}
 const lum=new Float32Array(n),sat=new Uint8Array(n);for(let i=0;i<n;i++){const k=i*4;lum[i]=(d[k]+d[k+1]+d[k+2])/3;sat[i]=Math.max(d[k],d[k+1],d[k+2])-Math.min(d[k],d[k+1],d[k+2]);}
 const bins=new Map();let trans=0;for(const i of edge){const k=i*4;if(d[k+3]<32){trans++;continue}const key=[d[k]>>5,d[k+1]>>5,d[k+2]>>5].join(',');const b=bins.get(key)||[0,0,0,0];b[0]++;b[1]+=d[k];b[2]+=d[k+1];b[3]+=d[k+2];bins.set(key,b);}
 let best=null;for(const b of bins.values())if(!best||b[0]>best[0])best=b;if(!best)return false;
 const rgb=best.slice(1).map(x=>x/best[0]);
 const lightEdge=edge.filter(i=>d[i*4+3]<32||lum[i]>=155&&sat[i]<38).length/edge.length;
 const pale=lightEdge>.55||trans/edge.length>.55;
 const dif=i=>{let k=i*4;return Math.max(Math.abs(d[k]-rgb[0]),Math.abs(d[k+1]-rgb[1]),Math.abs(d[k+2]-rgb[2]))};
 const near=i=>d[i*4+3]<32|| (pale?lum[i]>=150&&sat[i]<=44:dif(i)<=34);
 const seen=new Uint8Array(n),q=new Int32Array(n);let head=0,tail=0;
 function push(i,from=-1){if(seen[i]||!near(i))return;if(from>=0&&d[i*4+3]>=32&&d[from*4+3]>=32&&Math.abs(lum[i]-lum[from])>40&&lum[i]<220)return;seen[i]=1;q[tail++]=i}
 function walk(fn){while(head<tail){const i=q[head++],x=i%w,y=(i/w)|0;fn(i);if(x>0)push(i-1,i);if(x<w-1)push(i+1,i);if(y>0)push(i-w,i);if(y<h-1)push(i+w,i);}}
 if(edge.filter(near).length/edge.length<.45)return false;
 for(const i of edge)push(i);walk(()=>{});
 if(tail<n*.025||tail>n*.985)return false;
 // Enclosed bright neutral areas are background only when sufficiently large and flat.
 if(pale)for(let i=0;i<n;i++){if(seen[i]||d[i*4+3]<32||lum[i]<205||sat[i]>26)continue;const start=tail;push(i);let sum=0,sum2=0,minx=w,maxx=0,miny=h,maxy=0;walk(j=>{const x=j%w,y=(j/w)|0;sum+=lum[j];sum2+=lum[j]*lum[j];minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y)});const count=tail-start;if(!count)continue;const mean=sum/count,variance=sum2/count-mean*mean;if(count<Math.max(24,n*.0002)||mean<218||variance>420||maxx-minx<4||maxy-miny<4)for(let j=start;j<tail;j++)seen[q[j]]=2;}
 let opaque=0,removed=0;for(let i=0;i<n;i++){if(d[i*4+3]>32){opaque++;if(seen[i]===1)removed++}}
 if(removed<Math.max(5,opaque*.003)||opaque-removed<n*.012)return false;
 // Remove small disconnected, pale remnants, not dark or saturated foreground components.
 const visited=new Uint8Array(n),comp=new Int32Array(n);
 if(pale)for(let i=0;i<n;i++){if(visited[i]||seen[i]===1||d[i*4+3]<32)continue;let h0=0,t=0,bright=0;function add(j){if(!visited[j]&&seen[j]!==1&&d[j*4+3]>=32){visited[j]=1;comp[t++]=j;}}add(i);while(h0<t){const j=comp[h0++],x=j%w,y=(j/w)|0;if(lum[j]>155&&sat[j]<45)bright++;if(x>0)add(j-1);if(x<w-1)add(j+1);if(y>0)add(j-w);if(y<h-1)add(j+w);}if(t<n*.015&&bright/t>.85)for(let j=0;j<t;j++)seen[comp[j]]=1;}
 for(let i=0;i<n;i++)if(seen[i]===1)d[i*4+3]=0;
 if(pale)for(let i=0;i<n;i++){if(seen[i]===1||d[i*4+3]===0||lum[i]<160||sat[i]>45)continue;const x=i%w,y=(i/w)|0;if((x>0&&seen[i-1]===1)||(x<w-1&&seen[i+1]===1)||(y>0&&seen[i-w]===1)||(y<h-1&&seen[i+w]===1))d[i*4+3]=Math.min(d[i*4+3],Math.round(255*Math.max(0,Math.min(1,(220-lum[i])/60))));}
 return true;
}

function whiteMask(d,w,h){
 const n=w*h,seen=new Uint8Array(n),q=new Int32Array(n);let head=0,tail=0;
 const white=i=>{const k=i*4;return d[k+3]<24||Math.min(d[k],d[k+1],d[k+2])>=225&&Math.max(d[k],d[k+1],d[k+2])-Math.min(d[k],d[k+1],d[k+2])<=30};
 function push(i){if(!seen[i]&&white(i)){seen[i]=1;q[tail++]=i;}}
 const edge=[];for(let x=0;x<w;x++)edge.push(x,(h-1)*w+x);for(let y=1;y<h-1;y++)edge.push(y*w,y*w+w-1);
 if(edge.filter(white).length/edge.length<.20)return false;
 for(const i of edge)push(i);
 function walk(){while(head<tail){const i=q[head++],x=i%w,y=(i/w)|0;if(x>0)push(i-1);if(x<w-1)push(i+1);if(y>0)push(i-w);if(y<h-1)push(i+w);}}
 walk();if(tail<n*.025||tail>n*.98)return false;
 let removed=0,left=0;for(let i=0;i<n;i++){if(d[i*4+3]<24)continue;if(seen[i])removed++;else left++;}
 if(removed<n*.005||left<n*.012)return false;
 for(let i=0;i<n;i++)if(seen[i])d[i*4+3]=0;
 return true;
}
// Clean large pale paper remnants connected to transparent space or image borders.
// Only changes a display copy, never a stored photo.
function paperResidue(d,w,h,aggressive=false){
 const n=w*h,seen=new Uint8Array(n),q=new Int32Array(n);
 const light=new Uint8Array(n),alpha=new Uint8Array(n),lum=new Uint8Array(n);
 let transparent=0,opaque=0;
 for(let i=0;i<n;i++){const k=i*4,r=d[k],g=d[k+1],b=d[k+2],lo=Math.min(r,g,b),hi=Math.max(r,g,b);alpha[i]=d[k+3];lum[i]=Math.round((r+g+b)/3);if(alpha[i]<32)transparent++;else opaque++;
 light[i]=alpha[i]>=32&&lo>=(aggressive?155:175)&&hi-lo<=(aggressive?44:32)?1:0;}
 let removed=0;
 for(let i=0;i<n;i++){
  if(seen[i]||!light[i])continue;
  let head=0,tail=0,touches=0,white=0,sum=0,minx=w,maxx=0,miny=h,maxy=0;
  function push(j){if(!seen[j]&&light[j]){seen[j]=1;q[tail++]=j;}}
  push(i);
  while(head<tail){
   const j=q[head++],x=j%w,y=(j/w)|0;sum+=lum[j];if(lum[j]>=215)white++;
   minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y);
   let border=x===0||x===w-1||y===0||y===h-1;
   if(x>0){if(alpha[j-1]<32)border=true;push(j-1)}
   if(x<w-1){if(alpha[j+1]<32)border=true;push(j+1)}
   if(y>0){if(alpha[j-w]<32)border=true;push(j-w)}
   if(y<h-1){if(alpha[j+w]<32)border=true;push(j+w)}
   if(border)touches++;
  }
  const box=(maxx-minx+1)*(maxy-miny+1),mean=sum/tail;
  const broad=tail>=Math.max(50,n*.005)&&maxx-minx>=w*.10&&maxy-miny>=h*.035;
  const paper=broad&&touches>=Math.max(4,Math.sqrt(tail)*.12)&&(white/tail>.26||mean>=210)&&tail/box>.27;
  if(paper&&opaque-removed-tail>n*.025){for(let k=0;k<tail;k++)d[q[k]*4+3]=0;removed+=tail;}
 }
 return removed>0;
}
function maskBackground(d,w,h,mode){
 if(mode==='original')return false;
 const n=w*h;let pale=0,edges=0,trans=0;
 for(let i=0;i<n;i++){if(d[i*4+3]<32)trans++;const x=i%w,y=(i/w)|0;if(x!==0&&x!==w-1&&y!==0&&y!==h-1)continue;edges++;const k=i*4,lo=Math.min(d[k],d[k+1],d[k+2]),hi=Math.max(d[k],d[k+1],d[k+2]);if(d[k+3]<32||(lo>=145&&hi-lo<45))pale++;}
 let changed=false;
 if(mode==='gentle')return gentleMask(d,w,h)||whiteMask(d,w,h);
 if(mode==='strong'||pale/edges>.55)changed=strongMask(d,w,h);
 if(!changed)changed=gentleMask(d,w,h)||whiteMask(d,w,h);
 if(changed||trans/n>.08||pale/edges>.55)changed=paperResidue(d,w,h,mode==='strong')||changed;
 return changed;
}
const modeLabels={auto:'Automatyczne · adaptacyjne',gentle:'Delikatne',strong:'Mocniejsze',original:'Oryginał'};
function getMode(){try{const m=localStorage.getItem('kg-photo-filter-mode');return Object.hasOwn(modeLabels,m)?m:'auto';}catch{return 'auto';}}
let photoMode=getMode();

const cache=new Map();
function cleanCabinet(){
 const grid=document.querySelector('.cabinet-grid');if(!grid)return;
 let toolbar=grid.parentElement.querySelector('[data-kg-photo-version]');
 if(!toolbar){
  toolbar=document.createElement('div');toolbar.dataset.kgPhotoVersion='2.0.9';toolbar.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;color:#ddd1b7;font-size:11px;flex-wrap:wrap;';
  const label=document.createElement('span');label.textContent='Filtr zdjęć 2.0.9';
  const select=document.createElement('select');select.setAttribute('aria-label','Siła czyszczenia zdjęć');select.style.cssText='max-width:100%;font:inherit;background:#191b19;color:#e7decd;border:1px solid #655d4c;border-radius:5px;padding:5px;';
  for(const [v,t] of Object.entries(modeLabels)){const option=document.createElement('option');option.value=v;option.textContent=t;select.append(option);}select.value=photoMode;
  select.onchange=()=>{photoMode=select.value;try{localStorage.setItem('kg-photo-filter-mode',photoMode)}catch{}cleanCabinet();};
  toolbar.append(label,select);grid.before(toolbar);
 }
 const records=typeof allGuns!=='undefined'&&Array.isArray(allGuns)?allGuns:[];
 grid.querySelectorAll('.weapon-tile').forEach((tile,index)=>{
  const img=tile.querySelector('img[data-clean-cabinet]');if(!img)return;
  img.dataset.cleanStarted='1';
  const click=tile.getAttribute('onclick')||'';const id=click.match(/showWeapon\(['"]([^'"]+)['"]\)/)?.[1];const record=id?records.find(w=>String(w.id)===id):null;
  if(!img._kgOriginal)img._kgOriginal=(record&&record.photo)||img.getAttribute('src');
  const src=img._kgOriginal;if(!src||img.dataset.kgCleanV9===photoMode)return;
  const mode=photoMode;img.dataset.kgCleanV9=mode;
  function apply(result){if(!img.isConnected||img.dataset.kgCleanV9!==mode)return;img.src=result||src;img.classList.toggle('photo-cleaned',!!result||/^data:image\/png/i.test(src));img.dataset.kgPhotoResult=result?'cleaned':'original';}
  if(mode==='original'){apply(null);return;}
  const key=mode+'|'+src;if(cache.has(key)){apply(cache.get(key));return;}
  const source=new Image();
  source.onload=()=>{try{
   const c=document.createElement('canvas'),scale=Math.min(1,1100/Math.max(source.naturalWidth,source.naturalHeight));
   c.width=Math.max(1,Math.round(source.naturalWidth*scale));c.height=Math.max(1,Math.round(source.naturalHeight*scale));
   const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0,c.width,c.height);const frame=ctx.getImageData(0,0,c.width,c.height);
   let result=null;
   if(maskBackground(frame.data,c.width,c.height,mode)){ctx.putImageData(frame,0,0);result=c.toDataURL('image/png');}
   if(cache.size>=36)cache.clear();cache.set(key,result);apply(result);
  }catch{apply(null);}};
  source.onerror=()=>apply(null);source.src=src;
 });
}
async function loadPhoto(file){
 if(!file)return;
 if(!(file.type.startsWith('image/')||/\.(jpe?g|png|webp|gif|avif|heic|heif|bmp)$/i.test(file.name||''))){notify('Nieprawidłowy plik','Wybierz zdjęcie w formacie obsługiwanym przez urządzenie.');return;}
 if(file.size>25*1024*1024){notify('Za duże zdjęcie','Wybierz plik poniżej 25 MB.');return;}
 const initialForm=document.getElementById('gunForm'),url=URL.createObjectURL(file);
 try{
  const im=new Image();await new Promise((yes,no)=>{im.onload=yes;im.onerror=()=>no(new Error('Format nieobsługiwany przez przeglądarkę. Spróbuj JPG, PNG lub WebP.'));im.src=url;});
  const c=document.createElement('canvas'),scale=Math.min(1,1800/Math.max(im.naturalWidth,im.naturalHeight));c.width=Math.max(1,Math.round(im.naturalWidth*scale));c.height=Math.max(1,Math.round(im.naturalHeight*scale));const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0,c.width,c.height);
  const pixels=ctx.getImageData(0,0,c.width,c.height).data;let alpha=false;for(let i=3;i<pixels.length;i+=4)if(pixels[i]<255){alpha=true;break;}
  const value=alpha?c.toDataURL('image/png'):c.toDataURL('image/jpeg',.92);
  if(initialForm!==document.getElementById('gunForm'))return;
  if(typeof photoPending==='undefined')throw Error('Brak dostępu do formularza zdjęcia.');
  photoPending=value;
  const old=document.getElementById('photoPreview');if(old){const next=document.createElement('img');next.className='photo-preview';next.id='photoPreview';next.alt='Podgląd wybranego zdjęcia';next.src=value;old.replaceWith(next);}
  const info=document.getElementById('photoInfo');if(info)info.textContent='Gotowe do zapisu · '+(alpha?'PNG z przezroczystością':'JPEG')+' · '+Math.round(value.length*.75/1024)+' KB. Zdjęcie pozostaje na urządzeniu.';
 }catch(e){notify('Nie można wczytać zdjęcia',e.message||'Spróbuj innego pliku.');}finally{URL.revokeObjectURL(url);}
}
function startFix(){installBackup();window.enhanceCabinetImages=cleanCabinet;if(typeof window.chooseWeaponPhoto==='function')window.chooseWeaponPhoto=loadPhoto;const view=document.getElementById('view');if(view)new MutationObserver(cleanCabinet).observe(view,{childList:true,subtree:true});cleanCabinet();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startFix,{once:true});else startFix();
})();

;(()=>{'use strict';
let suspended=false, blurredAt=0, pickerUntil=0, reloading=false;
const isHome=()=>document.querySelector('#mobileNav .mobbtn.active')?.textContent?.includes('Pulpit')&&!!document.getElementById('homeGunCount');
function returnHome(){
 if(reloading)return;
 const alreadyHome=(location.hash===''||location.hash==='#home')&&isHome();
 if(alreadyHome){window.scrollTo(0,0);return;}
 // A full navigation discards the previous in-memory view and any pending render.
 // Only the URL fragment changes; IndexedDB and local storage are not touched.
 reloading=true;
 history.replaceState(history.state,'',location.pathname+location.search+'#home');
 location.reload();
}
function resume(){
 if(document.visibilityState==='hidden'||reloading)return;
 const wasAway=suspended||blurredAt>0&&Date.now()-blurredAt>=250;
 if(!wasAway)return;
 suspended=false;blurredAt=0;
 if(Date.now()<pickerUntil)return;
 returnHome();
}
function startHome(){
 // On a cold launch the existing main script already renders home for an empty hash.
 if(location.hash&&location.hash!=='#home')returnHome();
 document.addEventListener('click',e=>{if(e.target?.closest?.('input[type=file]'))pickerUntil=Date.now()+180000;},true);
 for(const event of ['change','cancel'])document.addEventListener(event,e=>{if(e.target?.matches?.('input[type=file]')){suspended=false;blurredAt=0;pickerUntil=0;}},true);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){suspended=true;}else resume();});
 window.addEventListener('blur',()=>{blurredAt=Date.now();});
 window.addEventListener('focus',resume);
 window.addEventListener('pagehide',()=>{suspended=true;});
 window.addEventListener('pageshow',e=>{if(e.persisted){suspended=true;resume();}});
 document.addEventListener('freeze',()=>{suspended=true;});
 document.addEventListener('resume',()=>{suspended=true;resume();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startHome,{once:true});else startHome();
})();
