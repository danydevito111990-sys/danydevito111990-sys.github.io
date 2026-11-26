(()=>{'use strict';
const CURRENT='2.0.18';
const LOCAL_HISTORY=[{"version":"2.0.18","date":"2026-11-26","changes":["Przycisk Aparat na głównym ekranie: niezależny moduł fotograficzny z kadrowaniem i zapisem JPEG."]},{"version":"2.0.17","date":"2026-11-26","changes":["Nowa zakładka Cena broni w raportach: czytelna tabela historycznych cen zakupu i podsumowanie kosztów na podstawie lokalnych kart sejfu.","Brakujące ceny są oznaczane osobno; dane sejfu pozostają bez zmian."]},{"version":"2.0.16","date":"2026-11-25","changes":["Po wskazaniu środka natychmiast pojawiają się proponowane okręgi pól 10, 9, 8 i 7.","Przesuwanie granic palcem i zatwierdzenie całego zestawu; propozycje nie wpływają na wynik przed zatwierdzeniem."]},{"version":"2.0.15","date":"2026-11-25","changes":["Odliczanie przed rozpoczęciem z krótkimi sygnałami i odliczanie pozostałego czasu PAR na ekranie.","Dłuższy sygnał końcowy (0,85 s); dźwięk nie jest już natychmiast zamykany przez timer."]},{"version":"2.0.14","date":"2026-11-25","changes":["Korekta zdjęcia tarczy: jasność i kontrast na podglądzie, z resetem i zachowaniem oryginału.","Czytelniejsze oznaczenia środka i pierścieni, podgląd zaznaczenia podczas przeciągania palcem, zatwierdzanie po puszczeniu.","Punktacja i automatyczne wykrywanie bez zmian."]},{"version":"2.0.13","date":"2026-11-25","changes":["Mocniejsze czyszczenie: dodatkowe usuwanie szarych resztek tła, jasnych obwódek i oderwanych plam.","Usunięcie ikony pustego kafelka z podglądu zdjęcia."]},{"version":"2.0.12","date":"2026-11-25","changes":["Obróbka zdjęć przeniesiona z magazynu do edycji pojedynczej karty, z podglądem kafelka sejfu.","Osobne ustawienia czyszczenia, ostrości i kontrastu zapisane w rekordzie karty; wspólny mechanizm podglądu i magazynu."]},{"version":"2.0.11","date":"2026-11-25","changes":["Regulacja ostrości i kontrastu miniatur, niezależnie od filtra tła; ustawienia zapamiętywane lokalnie.","Wyostrzanie z ochroną przezroczystości i ograniczeniem obwódek; tryb Oryginał pomija wszystkie filtry."]},{"version":"2.0.10","date":"2026-11-25","changes":["Domyślny filtr hybrydowy: delikatna baza, mocniejsze czyszczenie wyłącznie rozpoznanych pozostałości tła.","Kontrola jasnych i teksturowanych obszarów; oryginały zdjęć pozostają bez zmian."]},{"version":"2.0.9","date":"2026-11-25","changes":["Domyślny filtr adaptacyjny z dodatkowym wykrywaniem dużych jasnych resztek papieru i tła.","Ponowne czyszczenie częściowo przezroczystych zdjęć; zachowany tryb delikatny i oryginał.","Odczyt zdjęcia z właściwej karty zamiast polegania wyłącznie na kolejności listy."]},{"version":"2.0.8","date":"2026-11-25","changes":["Powrót na Pulpit po wznowieniu aplikacji, także po przywróceniu procesu lub okna PWA; bez kasowania danych.","Zachowanie bieżącego widoku przy powrocie z systemowego wyboru pliku."]},{"version":"2.0.7","date":"2026-11-25","changes":["Przywrócono delikatne czyszczenie jako domyślne; dostępny mocniejszy filtr i podgląd oryginałów.","Wczytywanie PNG z zachowaniem przezroczystości, poprawiona jakość JPEG; bez zmian dotychczasowych danych."]},{"version":"2.0.6","date":"2026-11-25","changes":["Pulpit przy ponownym uruchomieniu i powrocie z tła, z wyjątkiem systemowego wyboru pliku i aktywnych okien dialogowych.","Bez zmian lokalnych danych i adresu instalacji PWA."]},{"version":"2.0.5","date":"2026-11-25","changes":["Adaptacyjne usuwanie jasnego tła z cieniami i gradientami oraz jasnych pozostałości na miniaturach.","Ponowne przetwarzanie oryginałów bez zmiany danych."]},{"version":"2.0.4","date":"2026-11-25","changes":["Poprawione usuwanie jasnych obwódek i zamkniętych obszarów tła na miniaturach.","Ponowne przetwarzanie zdjęć bez zmiany oryginałów; oznaczenie wersji mechanizmu w magazynie."]},{"version":"2.0.3","date":"2026-11-25","changes":["Eksport JSON z wyborem zapisu, pobrania lub udostępnienia oraz uczciwym statusem zapisu.","Poprawione niedestrukcyjne usuwanie jednolitego tła miniatur w magazynie."]},{"version":"2.0.2","date":"2026-11-24","changes":["Automatyczne sprawdzanie aktualizacji po uruchomieniu i powrocie do aplikacji.","Ręczne sprawdzanie i instalowanie aktualizacji z poziomu ustawień.","Powiadomienie o dostępnej wersji i historia zmian.","Wersjonowana pamięć offline; bez zmian w lokalnej bazie danych."]},{"version":"2.0.1","date":"2026-11-24","changes":["Pierwsza publikacja PWA pod stałym adresem.","Manifest instalacyjny i podstawowa obsługa offline."]}];
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
function aggressiveResidue(d,w,h){
 const n=w*h;if(w<8||h<8)return false;
 const seen=new Uint8Array(n),q=new Int32Array(n),eligible=new Uint8Array(n),alpha=new Uint8Array(n),lum=new Float32Array(n);
 let opaque=0,removed=0;
 for(let i=0;i<n;i++){const k=i*4,lo=Math.min(d[k],d[k+1],d[k+2]),hi=Math.max(d[k],d[k+1],d[k+2]);alpha[i]=d[k+3];lum[i]=(d[k]+d[k+1]+d[k+2])/3;if(alpha[i]>=32)opaque++;eligible[i]=alpha[i]>=32&&lo>=135&&hi-lo<=40?1:0;}
 const keep=Math.max(24,n*.012,opaque*.20);
 for(let i=0;i<n;i++){
  if(seen[i]||!eligible[i])continue;
  let head=0,tail=0,contacts=0,rough=0,bright=0,sum=0,sum2=0,minx=w,miny=h,maxx=0,maxy=0;
  function push(j){if(!seen[j]&&eligible[j]){seen[j]=1;q[tail++]=j}}
  push(i);
  while(head<tail){
   const j=q[head++],x=j%w,y=(j/w)|0,v=lum[j];
   minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y);sum+=v;sum2+=v*v;if(v>=185)bright++;
   let contact=x===0||x===w-1||y===0||y===h-1,texture=false;
   function visit(k){if(alpha[k]<32)contact=true;if(eligible[k]&&Math.abs(lum[k]-v)>22)texture=true;push(k)}
   if(x>0)visit(j-1);if(x<w-1)visit(j+1);if(y>0)visit(j-w);if(y<h-1)visit(j+w);
   if(contact)contacts++;if(texture)rough++;
  }
  const ww=maxx-minx+1,hh=maxy-miny+1,mean=sum/tail,variance=Math.max(0,sum2/tail-mean*mean);
  const broad=tail>=Math.max(12,n*.00007)&&Math.min(ww,hh)>=3&&tail/(ww*hh)>=.18;
  const external=contacts>=Math.max(3,Math.sqrt(tail)*.18);
  const plain=rough/tail<=.24&&variance<=950;
  const paper=external&&broad&&plain&&(mean>=170||bright/tail>=.32);
  const fringe=external&&contacts/tail>=.45&&mean>=195&&plain;
  if((paper||fringe)&&opaque-removed-tail>=keep){for(let k=0;k<tail;k++)d[q[k]*4+3]=0;removed+=tail;}
 }
 const visited=new Uint8Array(n);
 for(let i=0;i<n;i++){
  if(visited[i]||d[i*4+3]<32)continue;
  let head=0,tail=0,pale=0;
  function add(j){if(!visited[j]&&d[j*4+3]>=32){visited[j]=1;q[tail++]=j}}
  add(i);while(head<tail){const j=q[head++],x=j%w,y=(j/w)|0,k=j*4,lo=Math.min(d[k],d[k+1],d[k+2]),hi=Math.max(d[k],d[k+1],d[k+2]);if(lo>=145&&hi-lo<=43)pale++;if(x>0)add(j-1);if(x<w-1)add(j+1);if(y>0)add(j-w);if(y<h-1)add(j+w)}
  if(tail<=Math.max(12,n*.004)&&pale/tail>=.9&&opaque-removed-tail>=keep){for(let k=0;k<tail;k++)d[q[k]*4+3]=0;removed+=tail;}
 }
 return removed>0;
}
function maskBackground(d,w,h,mode){
 if(mode==='original')return false;
 if(mode==='gentle')return gentleMask(d,w,h)||whiteMask(d,w,h);
 if(mode==='strong'){const changed=strongMask(d,w,h)||gentleMask(d,w,h)||whiteMask(d,w,h);const paper=paperResidue(d,w,h,true);const finish=aggressiveResidue(d,w,h);return changed||paper||finish;}
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
  if(!src||img.dataset.kgCleanV13===signature)return;
  img.dataset.kgCleanV13=signature;
  renderPhoto(src,config).then(result=>{if(img.isConnected&&img.dataset.kgCleanV13===signature)applyPhoto(img,result,src);});
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
 pic.append(placeholder);tile.append(pic);grid.append(tile);
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
  if(!src){image.hidden=true;image.style.display='none';image.removeAttribute('src');if(placeholder.parentElement!==pic)pic.replaceChildren(placeholder);placeholder.hidden=false;status.textContent='Dodaj zdjęcie, aby zobaczyć podgląd.';return;}
  status.textContent='Przetwarzanie podglądu…';
  renderPhoto(src,config).then(result=>{
   if(ticket!==revision||!form.isConnected)return;
   applyPhoto(image,result,src);if(image.parentElement!==pic||pic.childElementCount!==1)pic.replaceChildren(image);image.hidden=false;image.style.display='block';
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

;(()=>{'use strict';
const defaults={brightness:0,contrast:0};
function normalize(v){return {brightness:Math.max(-50,Math.min(50,Number(v?.brightness)||0)),contrast:Math.max(-40,Math.min(80,Number(v?.contrast)||0))};}
let lastState=null,settings={...defaults},showGuides=true,calibrationPreview=null;

// Suggested rings are only guides until the user confirms the calibration.
function seedRings(existing,width,height,radius){
 const known=Object.entries(existing||{}).map(([k,v])=>[Number(k),Number(v)]).filter(([k,v])=>Number.isInteger(k)&&k>=1&&k<=10&&Number.isFinite(v)&&v>0).sort((a,b)=>b[0]-a[0]);
 const outer=Number(radius)>0?Math.min(Number(radius),Math.min(width,height)*.49):Math.min(width,height)*.44;
 const map=Object.fromEntries(known);
 for(const score of [10,9,8,7]){
  if(map[score]>0)continue;
  const inner=known.filter(([k])=>k>score).at(-1)||[11,0],outerKnown=known.find(([k])=>k<score);
  let val=outerKnown?inner[1]+(outerKnown[1]-inner[1])*(inner[0]-score)/(inner[0]-outerKnown[0]):inner[1]+(outer/4)*(inner[0]-score);
  if(!outerKnown&&inner[0]===11)val=outer*(11-score)/4;
  map[score]=Math.max(.1,val);
 }
 return map;
}
function validRingRadius(map,score,r){
 if(!Number.isFinite(r)||r<5)return false;
 for(const [k,v] of Object.entries(map)){const n=Number(k),rr=Number(v);if(n===score||!Number.isFinite(rr)||rr<=0)continue;if((n>score&&r<=rr)||(n<score&&r>=rr))return false;}
 return true;
}
let draftRings=null,lastPhoto=null;
function visibleRings(){return draftRings||targetRingMap(targetState);}
function updateRingConfirm(){
 const b=document.getElementById('kgConfirmRings');
 if(b){b.hidden=!draftRings;b.style.display=draftRings?'':'none';}
 const guide=document.getElementById('kgRingDraftHelp');
 if(guide){guide.hidden=!draftRings;guide.style.display=draftRings?'':'none';}
}
function confirmRings(){
 if(!draftRings)return;
 const entries=Object.entries(draftRings).map(([k,v])=>[Number(k),Number(v)]);
 if(![10,9,8,7].every(n=>Number(draftRings[n])>=5)||entries.some(([n,v])=>!validRingRadius(draftRings,n,v))){targetFeedback('Popraw rozmiary okręgów przed zatwierdzeniem.');return;}
 targetState.ringBoundaries={...draftRings};targetState.requiresCalibration=true;
 targetState.radius=Math.max(...entries.map(([,v])=>v));
 draftRings=null;targetSetMode('add');targetUpdateHits();updateRingConfirm();targetFeedback('Zatwierdzono granice okręgów. Możesz oznaczać trafienia.');
}

function syncState(){
 if(typeof targetState==='undefined'||!targetState)return;
 if(lastState!==targetState||lastPhoto!==targetState.photo){lastState=targetState;lastPhoto=targetState.photo;settings=normalize(targetState.kgImageSettings);showGuides=true;calibrationPreview=null;draftRings=null;updateRingConfirm();}
}
function filterValue(v){const a=normalize(v);return 'brightness('+(100+a.brightness)+'%) contrast('+(100+a.contrast)+'%)';}
function drawTarget(){
 syncState();
 const canvas=document.getElementById('targetCanvas');if(!canvas||!targetImageReady())return;
 const available=canvas.parentElement.clientWidth||350,cw=Math.min(1150,available),ratio=targetImage.naturalHeight/targetImage.naturalWidth,ch=targetBetween(Math.round(cw*ratio),230,Math.max(420,window.innerHeight*.8));
 const dpr=Math.min(2,window.devicePixelRatio||1);
 canvas.width=Math.round(cw*dpr);canvas.height=Math.round(ch*dpr);canvas.style.width=cw+'px';canvas.style.height=ch+'px';
 const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#0a0b0d';ctx.fillRect(0,0,cw,ch);
 const scale=Math.min(cw/targetImage.naturalWidth,ch/targetImage.naturalHeight)*targetZoom,dx=(cw-targetImage.naturalWidth*scale)/2+targetPan.x,dy=(ch-targetImage.naturalHeight*scale)/2+targetPan.y;
 targetCanvasTransform={cw,ch,dx,dy,scale};
 ctx.save();ctx.filter=filterValue(settings);ctx.drawImage(targetImage,dx,dy,targetImage.naturalWidth*scale,targetImage.naturalHeight*scale);ctx.restore();
 function outlined(path,color,width,dash=[]){ctx.save();ctx.setLineDash(dash);ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();path();ctx.strokeStyle='rgba(0,0,0,.85)';ctx.lineWidth=width+3;ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();ctx.restore();}
 function label(str,x,y,color){ctx.save();ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';const tw=ctx.measureText(str).width+12;const xx=Math.max(tw/2,Math.min(cw-tw/2,x)),yy=Math.max(10,Math.min(ch-10,y));ctx.fillStyle='rgba(0,0,0,.85)';ctx.fillRect(xx-tw/2,yy-9,tw,18);ctx.fillStyle=color;ctx.fillText(str,xx,yy);ctx.restore();}
 const center=calibrationPreview?.mode==='center'?calibrationPreview.point:targetState.center;
 if(showGuides&&center){
  const x=dx+center.x*scale,y=dy+center.y*scale,rings=Object.entries(visibleRings()).filter(([_,r])=>Number(r)>0).sort((a,b)=>Number(b[1])-Number(a[1]));
  const active=String(targetCalibrateScore);
  for(const [score,r] of rings){
   const selected=score===active&&targetMode==='radius',color=selected?'#ffe34e':draftRings?'#e6ab63':'#54e7dd';
   if(selected&&calibrationPreview?.mode==='radius')continue;
   outlined(()=>ctx.arc(x,y,Number(r)*scale,0,Math.PI*2),color,selected?2.6:1.4,selected?[]:[6,4]);
   label(score+' pkt',x+Number(r)*scale*.707,y-Number(r)*scale*.707,color);
   if(targetMode==='radius'){const hx=x+Number(r)*scale,hy=y;outlined(()=>ctx.arc(hx,hy,selected?6:4,0,Math.PI*2),color,2);}
  }
  if(!rings.length&&!targetState.requiresCalibration&&targetState.radius>0)outlined(()=>ctx.arc(x,y,targetState.radius*scale,0,Math.PI*2),'#54e7dd',1.5,[6,4]);
  if(calibrationPreview?.mode==='radius'){
   const p=calibrationPreview.point,r=Math.hypot(p.x-center.x,p.y-center.y)*scale;
   outlined(()=>ctx.arc(x,y,r,0,Math.PI*2),'#ffe34e',2.5);
   label(active+' pkt · podgląd',x+r*.707,y-r*.707,'#ffe34e');
  }
  const color=targetMode==='center'?'#ffe34e':'#54e7dd';
  outlined(()=>{ctx.moveTo(x-16,y);ctx.lineTo(x-5,y);ctx.moveTo(x+5,y);ctx.lineTo(x+16,y);ctx.moveTo(x,y-16);ctx.lineTo(x,y-5);ctx.moveTo(x,y+5);ctx.lineTo(x,y+16);},color,2.5);
  outlined(()=>ctx.arc(x,y,3.5,0,Math.PI*2),color,1.5);label('ŚRODEK',x,y+27,color);
 }
 ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
 // Existing hit markers and score calculation are unchanged.
 for(let i=0;i<targetState.holes.length;i++){const h=targetState.holes[i],x=dx+h.x*scale,y=dy+h.y*scale,r=i===targetSelected?17:14;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=h.source==='auto'&&!h.verified?'rgba(168,70,24,.70)':'rgba(19,81,75,.70)';ctx.fill();ctx.lineWidth=i===targetSelected?3:2;ctx.strokeStyle=i===targetSelected?'#fff0ab':'#f4d194';ctx.stroke();ctx.fillStyle='#fff';ctx.fillText(String(targetComputedScore(h)),x,y);}
}
function mountControls(){
 syncState();const canvas=document.getElementById('targetCanvas');if(!canvas)return;
 const workspace=canvas.closest('.target-workspace')||canvas.parentElement;
 if(workspace.previousElementSibling?.dataset.kgTargetAdjust==='1'){updateRingConfirm();return;}
 const panel=document.createElement('section');panel.dataset.kgTargetAdjust='1';panel.style.cssText='background:#191711;border:1px solid #786344;border-radius:6px;padding:12px;margin:12px 0;display:grid;gap:10px;color:#eedfc6;';
 const title=document.createElement('strong');title.textContent='KOREKTA ZDJĘCIA TARCZY';
 const help=document.createElement('small');help.textContent='Dostosuj obraz przed ręcznym oznaczaniem. Oryginalne zdjęcie, automatyczne wykrywanie i sposób liczenia punktów nie zmieniają się.';
 const controls={};
 for(const [key,caption,min,max] of [['brightness','Jasność',-50,50],['contrast','Kontrast',-40,80]]){
  const holder=document.createElement('label');holder.style.cssText='display:grid;gap:5px;font-size:13px;color:#e6cfa3;';
  const label=document.createElement('span'),input=document.createElement('input');input.type='range';input.min=String(min);input.max=String(max);input.step='1';input.style.cssText='width:100%;accent-color:#b28e4c;';input.setAttribute('aria-label',caption);
  controls[key]={label,input,caption};holder.append(label,input);panel.append(holder);
  input.oninput=()=>{settings[key]=Number(input.value);targetState.kgImageSettings={...settings};label.textContent=caption+' · '+(settings[key]>0?'+':'')+settings[key]+'%';drawTarget();};
 }
 function sync(){for(const [key,c] of Object.entries(controls)){c.input.value=String(settings[key]);c.label.textContent=c.caption+' · '+(settings[key]>0?'+':'')+settings[key]+'%';}}
 const buttons=document.createElement('div');buttons.style.cssText='display:flex;gap:8px;flex-wrap:wrap;';
 function button(t,fn){const b=document.createElement('button');b.type='button';b.className='gun-button ghost';b.textContent=t;b.style.flex='1 1 auto';b.onclick=fn;buttons.append(b);return b;}
 button('RESET FILTRÓW',()=>{settings={...defaults};targetState.kgImageSettings={...settings};sync();drawTarget();});
 const guide=button('UKRYJ OKRĘGI',()=>{showGuides=!showGuides;guide.textContent=showGuides?'UKRYJ OKRĘGI':'POKAŻ OKRĘGI';drawTarget();});guide.textContent=showGuides?'UKRYJ OKRĘGI':'POKAŻ OKRĘGI';
 const instructions=document.createElement('small');instructions.textContent='Żółty: wybrany okrąg. Turkusowy: zatwierdzony. Dotknij uchwytu z prawej strony lub wybierz wartość pierścienia, następnie przeciągnij granicę.';
 const draftHelp=document.createElement('small');draftHelp.id='kgRingDraftHelp';draftHelp.textContent='Okręgi 10–7 są propozycją: dopasuj je do tarczy, następnie zatwierdź. Przed zatwierdzeniem propozycja nie jest używana do punktacji.';
 const confirmButton=button('ZATWIERDŹ OKRĘGI 10–7',confirmRings);confirmButton.id='kgConfirmRings';
 panel.prepend(title,help);panel.append(buttons,instructions,draftHelp);workspace.before(panel);sync();updateRingConfirm();
}
function boundedPoint(e){const p=targetToCanvasSpace(e),i=p&&targetToImage(p);if(!i||i.x<0||i.y<0||i.x>targetImage.naturalWidth||i.y>targetImage.naturalHeight)return null;return i;}
function install(){
 if(typeof window.targetDraw!=='function'||typeof window.targetOnPointerDown!=='function')return;
 window.targetDraw=drawTarget;
 const down=window.targetOnPointerDown,move=window.targetOnPointerMove,up=window.targetOnPointerUp;
 window.targetOnPointerDown=function(e){
  if(!targetImageReady()||!['center','radius'].includes(targetMode))return down.apply(this,arguments);
  if(calibrationPreview)return;
  const p=boundedPoint(e);if(!p)return;
  if(targetMode==='radius'&&targetState.center){const t=targetCanvasTransform,rad=Math.hypot(p.x-targetState.center.x,p.y-targetState.center.y);const dist=(v)=>Math.abs(Number(v)-rad)*(t?.scale||1);const near=Object.entries(visibleRings()).filter(([k,v])=>Number(v)>0&&dist(v)<=14).sort((a,b)=>dist(a[1])-dist(b[1]))[0];if(near){targetCalibrateScore=Number(near[0]);}}
  document.getElementById('targetCanvas').setPointerCapture(e.pointerId);
  calibrationPreview={mode:targetMode,point:p,id:e.pointerId};showGuides=true;drawTarget();
 };
 window.targetOnPointerMove=function(e){
  if(!calibrationPreview)return move.apply(this,arguments);
  if(calibrationPreview.id!==e.pointerId)return;const p=boundedPoint(e);if(p){calibrationPreview.point=p;drawTarget();}
 };
 window.targetOnPointerUp=function(e){
  if(!calibrationPreview)return up.apply(this,arguments);
  if(calibrationPreview.id!==e.pointerId)return;
  const p=boundedPoint(e)||calibrationPreview.point,mode=calibrationPreview.mode;calibrationPreview=null;
  if(mode==='center'){const old=targetRingMap(targetState);targetState.center={x:p.x,y:p.y};draftRings=seedRings(draftRings||old,targetImage.naturalWidth,targetImage.naturalHeight,targetState.radius);targetCalibrateScore=10;targetSetMode('radius');targetUpdateHits();updateRingConfirm();targetFeedback('Dopasuj okręgi 10, 9, 8 i 7, następnie zatwierdź.');return;}
  if(!targetState.center){drawTarget();return;}
  const r=Math.hypot(p.x-targetState.center.x,p.y-targetState.center.y),score=Number(targetCalibrateScore),map=visibleRings();
  if(r<5){targetFeedback('Granica zbyt blisko środka tarczy.');drawTarget();return;}
  for(const [s,val] of Object.entries(map)){const v=Number(s),r0=Number(val);if(v===score)continue;if((v>score&&r<=r0)||(v<score&&r>=r0)){targetFeedback('Granica '+score+' pkt nie pasuje do '+v+' pkt. Wskaż ponownie.');drawTarget();return;}}
  if(draftRings){draftRings={...map,[score]:r};targetUpdateHits();updateRingConfirm();targetFeedback('Dopasowano '+score+' pkt. Przeciągnij kolejny okrąg lub zatwierdź całość.');return;}
  targetState.ringBoundaries={...map,[score]:r};targetState.requiresCalibration=true;targetState.radius=Math.max(...Object.values(targetState.ringBoundaries).map(Number));targetSetMode('add');targetUpdateHits();targetFeedback('Zapisano granicę '+score+' pkt. Wybierz następny pierścień.');
 };
 const init=window.targetInitUI;
 if(typeof init==='function')window.targetInitUI=function(){syncState();const result=init.apply(this,arguments);const canvas=document.getElementById('targetCanvas');if(canvas)canvas.addEventListener('pointercancel',()=>{calibrationPreview=null;drawTarget();});mountControls();return result;};
 const originalSave=window.dbTargetSave;
 if(typeof originalSave==='function')window.dbTargetSave=function(rec){return originalSave.call(this,{...rec,kgImageSettings:normalize(targetState?.kgImageSettings)});};
 const view=document.getElementById('view');if(view)new MutationObserver(mountControls).observe(view,{childList:true,subtree:true});mountControls();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

;(()=>{'use strict';
let armingDeadline=0,lastNumber=null,endingContext=null;
function remaining(deadline,now){return Math.max(0,(deadline-now)/1000);}
function sound(ctx,duration,frequency,volume){
 if(!ctx)return;
 try{const t=ctx.currentTime+.01,o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.value=frequency;
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.006);
 g.gain.setValueAtTime(volume,t+Math.max(.008,duration-.025));g.gain.exponentialRampToValueAtTime(.0001,t+duration);
 o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+duration+.015);}catch{}
}
function installCountdown(){
 if(typeof window.timerRefreshUI!=='function'||typeof window.timerTone!=='function'||typeof window.timerReleaseAudio!=='function')return;
 const oldRefresh=window.timerRefreshUI,oldTone=window.timerTone,oldRelease=window.timerReleaseAudio;
 window.timerTone=function(type='start'){
  if(type==='stop'&&timerAudio){endingContext=timerAudio;sound(timerAudio,.85,740,.17);return;}
  return oldTone.apply(this,arguments);
 };
 window.timerReleaseAudio=function(){
  const ctx=timerAudio;
  if(ctx&&ctx===endingContext){timerAudio=null;endingContext=null;try{return oldRelease.apply(this,arguments);}finally{setTimeout(()=>{try{ctx.close().catch(()=>{});}catch{}},950);}}
  return oldRelease.apply(this,arguments);
 };
 window.timerRefreshUI=function(){
  const result=oldRefresh.apply(this,arguments);
  const digits=document.getElementById('timerDigits'),label=digits?.parentElement?.querySelector('.timer-display-label');
  if(!digits){armingDeadline=0;lastNumber=null;return result;}
  const now=performance.now();
  if(timerState==='arming'){
   if(!armingDeadline){const match=String(timerNotice).match(/BEEP za\s+([\d.,]+)/i);const sec=Number(match?.[1]?.replace(',','.'))||1;armingDeadline=now+sec*1000;lastNumber=null;}
   const left=remaining(armingDeadline,now),number=Math.ceil(left);
   if(number>0&&number!==lastNumber){lastNumber=number;if(left>.16)sound(timerAudio,.075,740,.12);}
   if(label)label.textContent='ODLICZANIE DO STARTU';
   digits.innerHTML=String(number)+'<span>s</span>';
  }else{
   armingDeadline=0;lastNumber=null;
   if(timerState==='running'&&Number(timerCfg.par)>0){
    const left=remaining(timerStartAt+Number(timerCfg.par)*1000,now);
    if(label)label.textContent='POZOSTAŁY CZAS';
    digits.innerHTML=timerTime(left)+'<span>s</span>';
   }else if(label)label.textContent='CZAS OD SYGNAŁU';
  }
  return result;
 };
 window.timerRefreshUI();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installCountdown,{once:true});else installCountdown();
})();

;(function installPurchaseReports(win,readRecords,redraw){
 const original=win.ammoReports;
 if(typeof original!=='function')return;
 let tab='ammo';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'});
 const amount=v=>{if(v==null||String(v).trim()==='')return null;const s=String(v).trim().replace(',','.');if(!/^\d+(?:\.\d+)?$/.test(s))return null;const n=Number(s);return Number.isFinite(n)&&Number.isSafeInteger(Math.round(n*100))?Math.round(n*100):null;};
 const date=v=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v??''));return m?m[3]+'.'+m[2]+'.'+m[1]:'—';};
 win.kgSelectPurchaseReport=function(next){tab=next==='price'?'price':'ammo';return redraw();};
 const tabs=()=>'<nav class="period-modes" aria-label="Rodzaj raportu" style="margin:14px 0;display:flex;gap:8px;flex-wrap:wrap">'+[['ammo','AMUNICJA'],['price','CENA BRONI']].map(([id,name])=>'<button type="button" class="settings-tab '+(tab===id?'on':'')+'" aria-pressed="'+(tab===id)+'" onclick="kgSelectPurchaseReport(\''+id+'\')">'+name+'</button>').join('')+'</nav>';
 function purchaseReport(){
  let records;
  try{records=readRecords();if(!Array.isArray(records))throw Error('Brak danych');}catch(e){return '<section class="settings-section"><h2>CENA BRONI</h2><p>Nie można odczytać danych sejfu.</p></section>';}
  const rows=records.map(w=>({name:[w.brand,w.name].filter(Boolean).filter((v,i,a)=>i===0||!String(v).toLowerCase().startsWith(String(a[0]).toLowerCase())).join(' ')||'Bez nazwy',date:date(w.purchaseDate),price:amount(w.price)}));
  const priced=rows.filter(r=>r.price!==null),sum=priced.reduce((n,r)=>n+r.price,0);
  const fmt=n=>money.format(n/100),missing=rows.length-priced.length;
  return '<section class="settings-section"><h2>RAPORTY / CENA BRONI</h2><p>Historyczne ceny zakupu zapisane w sejfie. Raport tylko do odczytu.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:9px;margin:16px 0">'+[['ŁĄCZNA CENA ZAKUPU',fmt(sum)],['WPISANE CENY',priced.length+' / '+rows.length],['BRAK CENY',String(missing)]].map(([label,value])=>'<div style="border:1px solid #796243;border-radius:8px;padding:12px;background:#1c1913;color:#e8d2a8"><small style="display:block;font-size:10px;letter-spacing:.06em;color:#bca98b">'+label+'</small><strong style="display:block;margin-top:6px;font-size:19px;overflow-wrap:anywhere">'+esc(value)+'</strong></div>').join('')+'</div><div style="overflow-x:auto;border:1px solid #66543a;border-radius:8px"><table style="border-collapse:collapse;width:100%;min-width:320px;text-align:left;font-size:13px;font-variant-numeric:tabular-nums"><thead style="background:#30271a;color:#e8d2a8"><tr><th scope="col" style="padding:11px 8px">MARKA / MODEL</th><th scope="col" style="padding:11px 8px;white-space:nowrap">DATA ZAKUPU</th><th scope="col" style="padding:11px 8px;text-align:right;white-space:nowrap">CENA ZAKUPU</th></tr></thead><tbody>'+ (rows.length?rows.map((r,i)=>'<tr style="background:'+(i%2?'#191813':'#12120f')+';border-top:1px solid #443a2a"><td style="padding:12px 8px;color:#ede3d2;font-weight:600;overflow-wrap:anywhere">'+esc(r.name)+'</td><td style="padding:12px 8px;color:#bca98b;white-space:nowrap">'+esc(r.date)+'</td><td style="padding:12px 8px;text-align:right;white-space:nowrap;color:'+(r.price===null?'#bca98b':'#e8d2a8')+'">'+(r.price===null?'Brak ceny':esc(fmt(r.price)))+'</td></tr>').join(''):'<tr><td colspan="3" style="padding:16px;text-align:center;color:#bca98b">Brak zapisanych pozycji w sejfie.</td></tr>')+'</tbody><tfoot style="background:#30271a;color:#f5ddb3"><tr><th colspan="2" scope="row" style="padding:13px 8px">RAZEM (WPISANE CENY)</th><td style="padding:13px 8px;text-align:right;font-weight:700;white-space:nowrap">'+esc(fmt(sum))+'</td></tr></tfoot></table></div><p class="settings-help">Brakujące ceny nie są doliczane do sumy. Dane uzupełnisz w kartach sejfu.</p></section>';
 }
 win.ammoReports=function(){return tabs()+(tab==='price'?purchaseReport():original.apply(this,arguments));};
})(window,()=>allGuns,()=>render());

;(()=>{function addPhotoButton(){const bar=document.querySelector('.topactions');if(!bar||document.getElementById('kgPhotoLink'))return;const a=document.createElement('a');a.id='kgPhotoLink';a.href='./aparat.html';a.className='iconbtn';a.textContent='📷';a.title='Aparat fotograficzny';a.setAttribute('aria-label','Aparat fotograficzny');a.style.textDecoration='none';a.style.display='inline-flex';a.style.alignItems='center';a.style.justifyContent='center';bar.appendChild(a);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addPhotoButton,{once:true});else addPhotoButton();})();
