(()=>{'use strict';
const CURRENT='2.0.12';
const LOCAL_HISTORY=[{"version":"2.0.12","date":"2026-11-25","changes":["Obróbka zdjęć przeniesiona z magazynu do edycji pojedynczej karty, z podglądem kafelka sejfu.","Osobne ustawienia czyszczenia, ostrości i kontrastu zapisane w rekordzie karty; wspólny mechanizm podglądu i magazynu."]},{"version":"2.0.11","date":"2026-11-25","changes":["Regulacja ostrości i kontrastu miniatur, niezależnie od filtra tła; ustawienia zapamiętywane lokalnie.","Wyostrzanie z ochroną przezroczystości i ograniczeniem obwódek; tryb Oryginał pomija wszystkie filtry."]},{"version":"2.0.10","date":"2026-11-25","changes":["Domyślny filtr hybrydowy: delikatna baza, mocniejsze czyszczenie wyłącznie rozpoznanych pozostałości tła.","Kontrola jasnych i teksturowanych obszarów; oryginały zdjęć pozostają bez zmian."]},{"version":"2.0.9","date":"2026-11-25","changes":["Domyślny filtr adaptacyjny z dodatkowym wykrywaniem dużych jasnych resztek papieru i tła.","Ponowne czyszczenie częściowo przezroczystych zdjęć; zachowany tryb delikatny i oryginał.","Odczyt zdjęcia z właściwej karty zamiast polegania wyłącznie na kolejności listy."]},{"version":"2.0.8","date":"2026-11-25","changes":["Powrót na Pulpit po wznowieniu aplikacji, także po przywróceniu procesu lub okna PWA; bez kasowania danych.","Zachowanie bieżącego widoku przy powrocie z systemowego wyboru pliku."]},{"version":"2.0.7","date":"2026-11-25","changes":["Przywrócono delikatne czyszczenie jako domyślne; dostępny mocniejszy filtr i podgląd oryginałów.","Wczytywanie PNG z zachowaniem przezroczystości, poprawiona jakość JPEG; bez zmian dotychczasowych danych."]},{"version":"2.0.6","date":"2026-11-25","changes":["Pulpit przy ponownym uruchomieniu i powrocie z tła, z wyjątkiem systemowego wyboru pliku i aktywnych okien dialogowych.","Bez zmian lokalnych danych i adresu instalacji PWA."]},{"version":"2.0.5","date":"2026-11-25","changes":["Adaptacyjne usuwanie jasnego tła z cieniami i gradientami oraz jasnych pozostałości na miniaturach.","Ponowne przetwarzanie oryginałów bez zmiany danych."]},{"version":"2.0.4","date":"2026-11-25","changes":["Poprawione usuwanie jasnych obwódek i zamkniętych obszarów tła na miniaturach.","Ponowne przetwarzanie zdjęć bez zmiany oryginałów; oznaczenie wersji mechanizmu w magazynie."]},{"version":"2.0.3","date":"2026-11-25","changes":["Eksport JSON z wyborem zapisu, pobrania lub udostępnienia oraz uczciwym statusem zapisu.","Poprawione niedestrukcyjne usuwanie jednolitego tła miniatur w magazynie."]},{"version":"2.0.2","date":"2026-11-24","changes":["Automatyczne sprawdzanie aktualizacji po uruchomieniu i powrocie do aplikacji.","Ręczne sprawdzanie i instalowanie aktualizacji z poziomu ustawień.","Powiadomienie o dostępnej wersji i historia zmian.","Wersjonowana pamięć offline; bez zmian w lokalnej bazie danych."]},{"version":"2.0.1","date":"2026-11-24","changes":["Pierwsza publikacja PWA pod stałym adresem.","Manifest instalacyjny i podstawowa obsługa offline."]}];
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
function hybridMask(d,w,h){
 if(w<8||h<8)return false;
 const n=w*h,base=new Uint8ClampedArray(d),proposal=new Uint8ClampedArray(d);
 const gentle=gentleMask(base,w,h)||whiteMask(base,w,h);
 const strong=strongMask(proposal,w,h);
 const paper=new Uint8ClampedArray(base),residue=paperResidue(paper,w,h,true);
 const candidate=new Uint8Array(n),seen=new Uint8Array(n),q=new Int32Array(n),lum=new Uint8Array(n),chroma=new Uint8Array(n);
 let opaque=0,baseOpaque=0,removed=0;
 for(let i=0;i<n;i++){
  const k=i*4,r=d[k],g=d[k+1],b=d[k+2],lo=Math.min(r,g,b),hi=Math.max(r,g,b);
  lum[i]=Math.round((r+g+b)/3);chroma[i]=hi-lo;
  if(d[k+3]>32)opaque++;if(base[k+3]>32)baseOpaque++;
  if(base[k+3]>32&&lo>=150&&hi-lo<=42&&((strong&&proposal[k+3]<32)||(residue&&paper[k+3]<32)))candidate[i]=1;
 }
 const keep=Math.max(25,n*.018,opaque*.025);
 for(let i=0;i<n;i++){
  if(seen[i]||!candidate[i])continue;
  let head=0,tail=0,minx=w,miny=h,maxx=0,maxy=0,bright=0,sum=0,sum2=0,contacts=0,borders=0,texture=0,neutral=0;
  function push(j){if(!seen[j]&&candidate[j]){seen[j]=1;q[tail++]=j}}
  push(i);
  while(head<tail){
   const j=q[head++],x=j%w,y=(j/w)|0,v=lum[j];
   minx=Math.min(x,minx);maxx=Math.max(x,maxx);miny=Math.min(y,miny);maxy=Math.max(y,maxy);
   sum+=v;sum2+=v*v;if(v>=210)bright++;if(chroma[j]<=27)neutral++;
   const border=x===0||y===0||x===w-1||y===h-1;let touches=border,rough=false;if(border)borders++;
   function neighbor(k){if(base[k*4+3]<32)touches=true;else if(candidate[k]&&Math.abs(lum[k]-v)>28)rough=true;push(k)}
   if(x>0)neighbor(j-1);if(x<w-1)neighbor(j+1);if(y>0)neighbor(j-w);if(y<h-1)neighbor(j+w);
   if(touches)contacts++;if(rough)texture++;
  }
  const ww=maxx-minx+1,hh=maxy-miny+1,mean=sum/tail,variance=Math.max(0,sum2/tail-mean*mean),density=tail/(ww*hh);
  const external=contacts>=Math.max(3,Math.sqrt(tail)*.12);
  const flat=variance<=750&&texture/tail<.20&&neutral/tail>=.65;
  const broad=tail>=Math.max(12,n*.00008)&&Math.min(ww,hh)>=3&&density>=.24;
  const palePaper=external&&flat&&broad&&(bright/tail>=.30||mean>=205);
  const edgeGradient=borders>=Math.max(8,Math.sqrt(tail)*.35)&&flat&&broad&&tail>=n*.015&&mean>=178;
  const enclosedPaper=!external&&flat&&tail>=Math.max(25,n*.0003)&&Math.min(ww,hh)>=5&&density>.45&&mean>=232&&bright/tail>.92;
  if((palePaper||edgeGradient||enclosedPaper)&&baseOpaque-removed-tail>=keep){for(let j=0;j<tail;j++)base[q[j]*4+3]=0;removed+=tail;}
 }
 const islands=new Uint8Array(n);
 for(let i=0;i<n;i++){
  if(islands[i]||base[i*4+3]<32)continue;
  let head=0,tail=0,light=0,sum=0;
  function add(j){if(!islands[j]&&base[j*4+3]>=32){islands[j]=1;q[tail++]=j}}
  add(i);while(head<tail){const j=q[head++],x=j%w,y=(j/w)|0;sum+=lum[j];if(lum[j]>=190&&chroma[j]<30)light++;if(x>0)add(j-1);if(x<w-1)add(j+1);if(y>0)add(j-w);if(y<h-1)add(j+w)}
  if(tail<=Math.max(8,n*.002)&&light/tail>=.96&&sum/tail>=205&&baseOpaque-removed-tail>keep){for(let k=0;k<tail;k++)base[q[k]*4+3]=0;removed+=tail;}
 }
 if(!gentle&&!removed)return false;
 d.set(base);return true;
}
function maskBackground(d,w,h,mode){
 if(mode==='original')return false;
 if(mode==='gentle')return gentleMask(d,w,h)||whiteMask(d,w,h);
 if(mode==='strong'){const changed=strongMask(d,w,h)||gentleMask(d,w,h)||whiteMask(d,w,h);return paperResidue(d,w,h,true)||changed;}
 return hybridMask(d,w,h);
}
const modeLabels={auto:'Automatyczne · hybrydowe',gentle:'Delikatne',strong:'Mocniejsze',original:'Oryginał'};
function getMode(){try{const m=localStorage.getItem('kg-photo-filter-mode');return Object.hasOwn(modeLabels,m)?m:'auto';}catch{return 'auto';}}
let photoMode=getMode();

// Display-only enhancement. Transparent pixels and silhouette edges are not sharpened.
function enhancePhoto(d,w,h,sharp,contrast){
 if(!sharp&&!contrast)return false;
 const src=new Uint8ClampedArray(d),amount=Math.max(0,Math.min(60,sharp))/100;
 const factor=1+Math.max(0,Math.min(25,contrast))/100;
 const gray=(k)=>(src[k]*.2126+src[k+1]*.7152+src[k+2]*.0722);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const k=(y*w+x)*4;if(src[k+3]<32)continue;
  const l=gray(k);let detail=0;
  if(amount&&x>0&&x<w-1&&y>0&&y<h-1&&src[k+3]>=248){
   const near=[k-4,k+4,k-w*4,k+w*4];
   if(near.every(j=>src[j+3]>=248)){
    const mean=near.reduce((sum,j)=>sum+gray(j),0)/4;
    const edge=l-mean;if(Math.abs(edge)>=3)detail=Math.max(-20,Math.min(20,edge*amount));
   }
  }
  const shift=(l-128)*(factor-1)+detail;
  for(let c=0;c<3;c++)d[k+c]=src[k+c]+shift;
 }
 return true;
}
const enhancementDefaults={sharp:20,contrast:8};
function readEnhancement(){
 try{const v=JSON.parse(localStorage.getItem('kg-photo-enhancement')||'null');if(v&&typeof v==='object')return {sharp:Number.isFinite(v.sharp)?Math.max(0,Math.min(60,v.sharp)):20,contrast:Number.isFinite(v.contrast)?Math.max(0,Math.min(25,v.contrast)):8};}catch{}
 return {...enhancementDefaults};
}
let photoEnhancement=readEnhancement();


const cache=new Map();
function photoConfig(value){
 const v=value&&typeof value==='object'?value:{};
 return {mode:Object.hasOwn(modeLabels,v.mode)?v.mode:photoMode,
 sharp:Number.isFinite(v.sharp)?Math.round(Math.max(0,Math.min(60,v.sharp))):photoEnhancement.sharp,
 contrast:Number.isFinite(v.contrast)?Math.round(Math.max(0,Math.min(25,v.contrast))):photoEnhancement.contrast};
}
const photoSignature=c=>[c.mode,c.sharp,c.contrast].join('|');
function renderPhoto(src,config){
 const c=photoConfig(config),key=photoSignature(c)+'|'+src;
 if(!src||c.mode==='original')return Promise.resolve({src,processed:false});
 if(cache.has(key))return cache.get(key);
 const task=new Promise(resolve=>{
  const source=new Image();
  source.onload=()=>{try{
   const canvas=document.createElement('canvas'),scale=Math.min(1,1100/Math.max(source.naturalWidth,source.naturalHeight));
   canvas.width=Math.max(1,Math.round(source.naturalWidth*scale));canvas.height=Math.max(1,Math.round(source.naturalHeight*scale));
   const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0,canvas.width,canvas.height);const frame=ctx.getImageData(0,0,canvas.width,canvas.height);
   const cleaned=maskBackground(frame.data,canvas.width,canvas.height,c.mode),enhanced=enhancePhoto(frame.data,canvas.width,canvas.height,c.sharp,c.contrast);
   if(cleaned||enhanced){ctx.putImageData(frame,0,0);resolve({src:canvas.toDataURL('image/png'),processed:true});}
   else resolve({src,processed:false});
  }catch{resolve({src,processed:false,error:true});}};
  source.onerror=()=>resolve({src,processed:false,error:true});source.src=src;
 });
 if(cache.size>=24)cache.clear();cache.set(key,task);return task;
}
function applyPhoto(img,result,original){
 img.src=result.src||original;
 img.classList.toggle('photo-cleaned',!!result.processed||/^data:image\/png/i.test(original));
}
function cleanCabinet(){
 const grid=document.querySelector('.armory-cabinet .cabinet-grid');if(!grid)return;
 const records=typeof allGuns!=='undefined'&&Array.isArray(allGuns)?allGuns:[];
 grid.querySelectorAll('.weapon-tile').forEach(tile=>{
  const img=tile.querySelector('img[data-clean-cabinet]');if(!img)return;
  img.dataset.cleanStarted='1';
  const click=tile.getAttribute('onclick')||'',id=click.match(/showWeapon\(['"]([^'"]+)['"]\)/)?.[1];
  const record=id?records.find(w=>String(w.id)===id):null;
  if(!img._kgOriginal)img._kgOriginal=(record&&record.photo)||img.getAttribute('src');
  const src=img._kgOriginal,config=photoConfig(record?.kgPhotoSettings),signature=photoSignature(config);
  if(!src||img.dataset.kgCleanV12===signature)return;
  img.dataset.kgCleanV12=signature;
  renderPhoto(src,config).then(result=>{if(img.isConnected&&img.dataset.kgCleanV12===signature)applyPhoto(img,result,src);});
 });
}
function currentRecord(){
 return typeof allGuns!=='undefined'&&typeof gunId!=='undefined'?allGuns.find(w=>w.id===gunId):null;
}
function currentPhoto(form){
 if(typeof photoPending!=='undefined'&&photoPending!==null)return photoPending;
 return currentRecord()?.photo||form.querySelector('img#photoPreview')?.getAttribute('src')||'';
}
function mountPhotoEditor(){
 const form=document.getElementById('gunForm');if(!form)return;
 if(form._kgPhotoEditor){form._kgPhotoEditor.refresh();return;}
 const upload=form.querySelector('.photo-upload');if(!upload)return;
 const record=currentRecord();
 let draft=photoConfig(record?.kgPhotoSettings),lastSrc=null,timer=0,revision=0;
 const editor=document.createElement('section');editor.className='kg-photo-editor';editor.style.cssText='margin-top:12px;padding:12px;border:1px solid #655d4c;border-radius:7px;background:#191b19;color:#e7decd;display:grid;gap:10px;';
 const title=document.createElement('strong');title.textContent='OBRÓBKA ZDJĘCIA W SEJFIE';
 const hint=document.createElement('small');hint.textContent='Ustawienia dotyczą tylko tej karty. Zapisz kartę, aby je zachować. Oryginał pozostaje bez zmian.';
 const previewTitle=document.createElement('small');previewTitle.textContent='PODGLĄD KAFELKA W SEJFIE';
 const grid=document.createElement('div');grid.className='cabinet-grid';grid.style.cssText='display:grid;grid-template-columns:minmax(0,1fr);width:min(100%,clamp(128px,calc((100vw - 78px)/2),280px));padding:0;gap:0;margin:0 auto;box-sizing:border-box;';
 const tile=document.createElement('div');tile.className='weapon-tile safe-slot';tile.style.cursor='default';
 const pic=document.createElement('span');pic.className='weapon-pic photo-only';
 const image=document.createElement('img');image.alt='Podgląd zdjęcia w sejfie';image.hidden=true;
 const placeholder=document.createElement('span');placeholder.className='weapon-placeholder';placeholder.textContent='♜';
 pic.append(image,placeholder);tile.append(pic);grid.append(tile);
 const status=document.createElement('small');status.setAttribute('role','status');status.style.cssText='text-align:center;color:#c4b79f;';
 const modeLabel=document.createElement('label');modeLabel.textContent='Czyszczenie tła';modeLabel.style.cssText='display:grid;gap:4px;';
 const select=document.createElement('select');select.setAttribute('aria-label','Czyszczenie tła');select.style.cssText='width:100%;min-width:0;background:#191b19;color:#e7decd;border:1px solid #655d4c;padding:7px;border-radius:5px;';
 for(const [key,label] of Object.entries(modeLabels)){const option=document.createElement('option');option.value=key;option.textContent=label;select.append(option);}select.value=draft.mode;modeLabel.append(select);
 const sliders=document.createElement('div');sliders.style.cssText='display:grid;gap:10px;';
 const controls={};
 for(const [key,caption,max] of [['sharp','Ostrość',60],['contrast','Kontrast',25]]){
  const holder=document.createElement('label');holder.style.cssText='display:grid;gap:4px;';
  const label=document.createElement('span'),input=document.createElement('input');input.type='range';input.min='0';input.max=String(max);input.step='1';input.setAttribute('aria-label',caption);input.style.cssText='width:100%;accent-color:#b28e4c;';
  controls[key]={label,input,caption};holder.append(label,input);sliders.append(holder);
  input.oninput=()=>{draft[key]=Number(input.value);syncControls();schedule();};
 }
 function syncControls(){
  select.value=draft.mode;
  for(const [key,c] of Object.entries(controls)){c.input.value=String(draft[key]);c.label.textContent=c.caption+' · '+draft[key]+'%';c.input.disabled=draft.mode==='original';}
 }
 select.onchange=()=>{draft.mode=select.value;syncControls();schedule();};
 const reset=document.createElement('button');reset.type='button';reset.className='gun-button ghost';reset.textContent='PRZYWRÓĆ DOMYŚLNE';
 reset.onclick=()=>{draft={mode:'auto',...enhancementDefaults};syncControls();schedule();};
 function update(){
  const src=currentPhoto(form),ticket=++revision,config={...draft};
  if(!src){image.hidden=true;image.style.display='none';image.removeAttribute('src');placeholder.hidden=false;status.textContent='Dodaj zdjęcie, aby zobaczyć podgląd.';return;}
  status.textContent='Przetwarzanie podglądu…';
  renderPhoto(src,config).then(result=>{
   if(ticket!==revision||!form.isConnected)return;
   applyPhoto(image,result,src);image.hidden=false;image.style.display='block';placeholder.hidden=true;
   status.textContent=result.error?'Nie udało się przetworzyć zdjęcia. Pokazano oryginał.':'Tak zdjęcie będzie wyświetlane w sejfie.';
  });
 }
 function schedule(){clearTimeout(timer);++revision;timer=setTimeout(update,120);}
 function refresh(){const src=currentPhoto(form);if(src!==lastSrc){lastSrc=src;schedule();}}
 form._kgPhotoEditor={refresh,getConfig:()=>photoConfig(draft)};
 editor.append(title,hint,previewTitle,grid,status,modeLabel,sliders,reset);upload.after(editor);syncControls();refresh();
}
// Keep settings in the same IndexedDB record as the photo; the existing form save
// performs the single write and existing full backup automatically carries the field.
function installPhotoSave(){
 if(typeof window.saveGun!=='function'||typeof window.dbPut!=='function')return;
 const oldSave=window.saveGun,oldPut=window.dbPut;let pending=null;
 window.dbPut=function(record){
  if(pending&&record&&typeof record==='object'){const config=pending;pending=null;return oldPut.call(this,{...record,kgPhotoSettings:config});}
  return oldPut.apply(this,arguments);
 };
 window.saveGun=function(event){
  const form=document.getElementById('gunForm');
  pending=form?._kgPhotoEditor?.getConfig()||null;
  try{return oldSave.apply(this,arguments);}finally{pending=null;}
 };
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
function startFix(){installBackup();installPhotoSave();window.enhanceCabinetImages=cleanCabinet;if(typeof window.chooseWeaponPhoto==='function')window.chooseWeaponPhoto=loadPhoto;const view=document.getElementById('view');const refresh=()=>{cleanCabinet();mountPhotoEditor();};if(view)new MutationObserver(refresh).observe(view,{childList:true,subtree:true});refresh();}
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
