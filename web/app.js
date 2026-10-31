(function(){
'use strict';
/* ---------- utilidades ---------- */
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>p+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const pd=s=>{const[a,b,c]=String(s).split('-').map(Number);return new Date(a,(b||1)-1,c||1)};
const addDays=(s,n)=>{const d=pd(s);d.setDate(d.getDate()+n);return ymd(d)};
const today=()=>ymd(new Date());
const DIAS=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const DIAS_C=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const fLarga=s=>{if(!s)return'';const d=pd(s);return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`};
const fCorta=s=>{if(!s)return'';const d=pd(s);return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`};
const cap=s=>s?s[0].toUpperCase()+s.slice(1):s;
const ARS=new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0});
const money=n=>ARS.format(Number(n)||0);
const toMin=h=>{const[a,b]=String(h||'0:0').split(':').map(Number);return a*60+(b||0)};
const fromMin=m=>`${pad(Math.floor(m/60))}:${pad(m%60)}`;
const age=b=>{if(!b)return null;const d=pd(b),n=new Date();let a=n.getFullYear()-d.getFullYear();if(n.getMonth()<d.getMonth()||(n.getMonth()===d.getMonth()&&n.getDate()<d.getDate()))a--;return a};
const weekStart=s=>{const d=pd(s);const w=(d.getDay()+6)%7;d.setDate(d.getDate()-w);return ymd(d)};
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const ESTADOS=['pendiente','confirmado','atendido','ausente','cancelado'];
const ESTADO_TXT={pendiente:'Pendiente',confirmado:'Confirmado',atendido:'Atendido',ausente:'Ausente',cancelado:'Cancelado',pagado:'Pagado'};
const COLORS=['#8B5E3C','#B08A62','#6F4A2F','#C9A27E','#A0674B','#7D6450','#D2B48C','#5C4033'];

const I={ // iconos de trazo fino
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M17 14.3c2.4.2 4 1.8 4.5 4.7"/></svg>',
  pay:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="2.5" y="6" width="19" height="13" rx="2.5"/><path d="M2.5 10.5h19M6.5 15h4"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.5l2.1 1.2M17.7 15.3l2.1 1.2M4.2 16.5l2.1-1.2M17.7 8.7l2.1-1.2"/><circle cx="12" cy="12" r="7"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg>',
  right:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  wa:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2A9.7 9.7 0 0 0 3.6 16.8L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1c0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.3 3.8 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2l-.5-.4Z"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/></svg>',
  mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
};

/* ---------- datos ---------- */
const COLS=['professionals','locations','patients','appointments','sessions','payments','config','attachments'];
const S={mode:'loading',data:Object.fromEntries(COLS.map(c=>[c,{}])),ready:new Set(),
  view:'agenda',date:today(),calMode:'semana',fPro:'',fLoc:'',q:'',pacId:null,pacTab:'datos',
  payMonth:today().slice(0,7),payMet:'',payPro:'',cfgTab:'profesionales',screen:null,loading:true,users:null,audit:null};
try{const v=JSON.parse(localStorage.getItem('pl_ui')||'{}');if(v.calMode)S.calMode=v.calMode;if(v.view&&v.view!=='paciente')S.view=v.view}catch(e){}
if(window.innerWidth<700)S.calMode='dia';

const list=c=>Object.values(S.data[c]);
const get=(c,id)=>S.data[c][id];
const cfg=()=>Object.assign({metodos:['Efectivo','Transferencia','Mercado Pago','Tarjeta de débito','Tarjeta de crédito','Obra social'],horaInicio:'08:00',horaFin:'20:00',duracion:30,waTemplate:'¡Hola {nombre}! Te recordamos tu turno con {profesional} el {fecha} a las {hora} hs en {lugar} ({direccion}). Por favor confirmá tu asistencia. ¡Gracias!'},S.data.config.main||{});
const pros=()=>list('professionals').filter(p=>p.activo!==false).sort((a,b)=>a.nombre.localeCompare(b.nombre));
const locs=()=>list('locations').sort((a,b)=>a.nombre.localeCompare(b.nombre));
const pacName=p=>p?`${p.nombre||''} ${p.apellido||''}`.trim():'Paciente eliminado';
const pacSort=(a,b)=>norm(a.apellido+a.nombre).localeCompare(norm(b.apellido+b.nombre));
const proColor=id=>(get('professionals',id)||{}).color||'#A0674B';

/* ---------- almacenamiento en el equipo (IndexedDB) + sincronización con el servidor ---------- */
const LS={get(k,d){try{const v=localStorage.getItem('pl_'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('pl_'+k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem('pl_'+k)}catch(e){}}};
const ST={mode:LS.get('mode',''),server:LS.get('server',''),token:LS.get('token',''),user:LS.get('user',null),since:LS.get('since',0),
  sync:'idle',lastSync:LS.get('lastSync',''),pending:0,syncing:false,timer:null,idb:null};
ST.gcal=LS.get('gcal',{ver:'',events:[]});S.showG=LS.get('showG',true);
const IS_DESKTOP=!!(window.agendaDesktop)||location.protocol==='file:';
function idbOpen(){return new Promise((res,rej)=>{if(!('indexedDB' in window))return rej(new Error('Sin IndexedDB'));const r=indexedDB.open('agenda-pl',2);r.onupgradeneeded=()=>{const d=r.result;for(const n of ['docs','outbox','blobs'])if(!d.objectStoreNames.contains(n))d.createObjectStore(n,{keyPath:'k'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function idbTx(store,mode,fn){return new Promise((res,rej)=>{const tx=ST.idb.transaction(store,mode);const s=tx.objectStore(store);const out=fn(s);tx.oncomplete=()=>res(out&&out.result!==undefined?out.result:undefined);tx.onerror=()=>rej(tx.error)})}
const idbAll=store=>new Promise((res,rej)=>{const r=ST.idb.transaction(store).objectStore(store).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const idbPutMany=(store,vals)=>idbTx(store,'readwrite',s=>{vals.forEach(v=>s.put(v))});
const idbDelMany=(store,keys)=>idbTx(store,'readwrite',s=>{keys.forEach(k=>s.delete(k))});
const idbClear=store=>idbTx(store,'readwrite',s=>{s.clear()});
async function loadFromDevice(){
  const rows=await idbAll('docs');COLS.forEach(c=>S.data[c]={});
  rows.forEach(r=>{if(S.data[r.col])S.data[r.col][r.doc.id]=r.doc});
  ST.pending=(await idbAll('outbox')).length;
}
async function persist(col,doc,deleted){
  const k=col+'/'+doc.id;
  try{
    if(deleted)await idbDelMany('docs',[k]);else await idbPutMany('docs',[{k,col,doc}]);
    if(ST.mode==='server'){await idbPutMany('outbox',[{k,col,doc:deleted?{id:doc.id,_deleted:true,updatedAt:new Date().toISOString()}:doc}]);ST.pending++;scheduleSync(250)}
  }catch(e){toast('No se pudo guardar en este equipo','err')}
}
async function save(col,obj,quiet){
  const now=new Date().toISOString();
  obj={...obj,updatedAt:now,createdAt:obj.createdAt||now};
  S.data[col][obj.id]=obj;if(quiet)renderStatus();else render();
  await persist(col,obj,false);
  return obj;
}
async function del(col,id){delete S.data[col][id];render();await persist(col,{id},true);if(col==='attachments')blobDel(id)}

const api=async(p,body,method)=>{
  const r=await fetch(ST.server.replace(/\/$/,'')+p,{method:method||(body?'POST':'GET'),headers:{'Content-Type':'application/json',...(ST.token?{Authorization:'Bearer '+ST.token}:{})},body:body?JSON.stringify(body):undefined});
  let j={};try{j=await r.json()}catch(e){}
  if(!r.ok)throw Object.assign(new Error(j.error||'Error del servidor ('+r.status+')'),{status:r.status});
  return j;
};
// Tiempo real: el servidor avisa cuando otro equipo guarda algo y se sincroniza al instante.
let ES=null;
function connectLive(){
  if(ES){ES.close();ES=null}
  if(ST.mode!=='server'||!ST.token||!('EventSource' in window))return;
  try{ES=new EventSource(ST.server.replace(/\/$/,'')+'/api/events?token='+encodeURIComponent(ST.token));
    ES.addEventListener('cambio',e=>{if(Number(e.data)>ST.since)scheduleSync(50)});
    ES.onopen=()=>scheduleSync(50);
  }catch(e){}
}
function scheduleSync(ms){clearTimeout(ST.timer);ST.timer=setTimeout(sync,ms)}
async function sync(){
  if(ST.mode!=='server'||!ST.token||ST.syncing)return;
  if(navigator.onLine===false){ST.sync='offline';renderSoft();return}
  ST.syncing=true;ST.sync='syncing';renderStatus();
  try{
    let more=true,guard=0,gv;
    while(more&&guard++<50){
      const box=await idbAll('outbox');
      const sent=new Map(box.map(b=>[b.k,b.doc.updatedAt]));
      const j=await api('/api/sync',{since:ST.since,changes:box.map(b=>({col:b.col,doc:b.doc}))});gv=j.gcalVer;
      // quitar de la cola lo que ya se envió (si no se volvió a editar mientras tanto)
      const now=await idbAll('outbox');const done=now.filter(b=>sent.get(b.k)===b.doc.updatedAt).map(b=>b.k);
      await idbDelMany('outbox',done);const pend=new Set(now.filter(b=>!done.includes(b.k)).map(b=>b.k));
      const puts=[],dels=[];
      for(const ch of j.changes){const k=ch.col+'/'+ch.doc.id;if(pend.has(k)||!S.data[ch.col])continue;
        if(ch.doc._deleted){delete S.data[ch.col][ch.doc.id];dels.push(k);if(ch.col==='attachments')blobDel(ch.doc.id)}else{S.data[ch.col][ch.doc.id]=ch.doc;puts.push({k,col:ch.col,doc:ch.doc})}}
      if(puts.length)await idbPutMany('docs',puts);if(dels.length)await idbDelMany('docs',dels);
      ST.since=j.since;LS.set('since',ST.since);
      if(j.rejected&&j.rejected.length){toast('Algunos cambios no se guardaron porque tu usuario no tiene permiso.','err');ST.since=0;LS.set('since',0)}
      ST.pending=pend.size;more=!!j.more||(j.rejected&&j.rejected.length&&guard<2);
    }
    await uploadBlobs();
    if(gv!==undefined&&gv!==ST.gcal.ver){try{const g=await api('/api/gcal');ST.gcal={ver:g.ver,events:g.events||[]};LS.set('gcal',ST.gcal)}catch(e){}}
    ST.sync='ok';ST.lastSync=new Date().toISOString();LS.set('lastSync',ST.lastSync);
    await seedBase();
  }catch(e){
    if(e.status===401){if(ES){ES.close();ES=null}ST.token='';LS.del('token');ST.sync='idle';S.screen='login';toast('Tu sesión venció. Volvé a ingresar.','err')}
    else ST.sync=e.status?'error':'offline';
  }finally{ST.syncing=false;renderSoft()}
}
function renderStatus(){const el=document.querySelectorAll('.js-status');el.forEach(x=>x.innerHTML=statusHtml())}
function statusHtml(){
  if(ST.mode==='local')return '<span class="dot local"></span>Solo en este equipo';
  if(ST.sync==='syncing')return '<span class="dot load"></span>Sincronizando…';
  if(ST.sync==='offline')return `<span class="dot local"></span>Sin conexión${ST.pending?` · ${ST.pending} cambios por subir`:''}`;
  if(ST.sync==='error')return '<span class="dot local" style="background:var(--bad)"></span>Error al sincronizar';
  return `<span class="dot"></span>${ST.pending?`${ST.pending} cambios por subir`:'Sincronizado'}`;
}
// Primer uso: crea el profesional, el lugar y la configuración base (sin pacientes de ejemplo)
async function seedBase(){
  if(list('professionals').length||list('locations').length||S.data.config.main)return;
  if(ST.mode==='server'&&!(ST.user&&ST.user.rol==='admin'))return;
  const d=demoData(today());
  for(const c of ['professionals','locations','config'])for(const o of d[c]){if(!o.ejemplo)await save(c,o)}
}
const role=()=>ST.mode==='local'?'admin':((ST.user&&ST.user.rol)||'secretaria');
const isSec=()=>role()==='secretaria';


/* ---------- toast ---------- */
let tt;function toast(msg,kind){let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t)}t.className='toast'+(kind?' '+kind:'');t.textContent=msg;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,3200)}

/* ---------- WhatsApp ---------- */
function waPhone(raw){
  const s=String(raw||'').trim();let d=s.replace(/\D/g,'');if(!d)return '';
  if(s.startsWith('+')&&!s.startsWith('+54'))return d;
  if(d.startsWith('00'))d=d.slice(2);
  if(d.startsWith('54')){d=d.slice(2);if(d.startsWith('9'))d=d.slice(1)}
  if(d.startsWith('0'))d=d.slice(1);
  if(d.length===12){for(const al of [2,3,4]){if(d.substr(al,2)==='15'){d=d.slice(0,al)+d.slice(al+2);break}}}
  return '549'+d;
}
function fillTpl(t,a){
  const p=get('patients',a.pacienteId)||{},pr=get('professionals',a.profesionalId)||{},l=get('locations',a.lugarId)||{};
  const map={nombre:p.nombre||'',apellido:p.apellido||'',profesional:pr.nombre||'',especialidad:pr.especialidad||'',fecha:fLarga(a.fecha),hora:a.hora||'',lugar:l.nombre||'',direccion:[l.direccion,l.ciudad].filter(Boolean).join(', '),motivo:a.motivo||'',calendario:gcalLink(a)};
  return t.replace(/\{(\w+)\}/g,(m,k)=>k in map?map[k]:m);
}
function msgTurno(a,cal){const t=cfg().waTemplate||'';return fillTpl(t,a)+(cal!==false&&!t.includes('{calendario}')?calLine(a):'')}
function msgProximos(pid){
  const p=get('patients',pid)||{};
  const ts=list('appointments').filter(a=>a.pacienteId===pid&&a.fecha>=today()&&a.estado!=='cancelado').sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora));
  if(!ts.length)return '';
  const lines=ts.map(a=>{const l=get('locations',a.lugarId)||{},pr=get('professionals',a.profesionalId)||{};return `• ${cap(fLarga(a.fecha))}, ${a.hora} hs — ${l.nombre||''}${pr.nombre?' con '+pr.nombre:''}`});
  return `¡Hola ${p.nombre||''}! 🌿 Te compartimos tus próximos turnos:\n\n${lines.join('\n')}\n\nAnte cualquier cambio, avisanos por este medio. ¡Te esperamos!`;
}

/* ---------- Google Calendar y mail ---------- */
// Link "agregar a Google Calendar": el paciente lo toca y el turno queda en su calendario.
function gcalLink(a){
  const pr=get('professionals',a.profesionalId)||{},l=get('locations',a.lugarId)||{};
  const st=toMin(a.hora),en=st+(+a.duracion||30),d=String(a.fecha||'').replace(/-/g,'');
  const t=m=>`${d}T${pad(Math.floor(m/60))}${pad(m%60)}00`;
  const q=new URLSearchParams({action:'TEMPLATE',text:`Turno con ${pr.nombre||'la doctora'}`,dates:`${t(st)}/${t(en)}`,ctz:'America/Argentina/Buenos_Aires',
    details:a.motivo?'Motivo: '+a.motivo:'',
    location:[l.nombre,l.direccion,l.ciudad].filter(Boolean).join(', ')});
  return 'https://calendar.google.com/calendar/render?'+q.toString();
}
const calLine=a=>'\n\n📅 Agendalo en tu Google Calendar: '+gcalLink(a);
function mailLink(to,subject,body){
  const coarse=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
  if(coarse)return `mailto:${encodeURIComponent(to||'')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return 'https://mail.google.com/mail/?'+new URLSearchParams({view:'cm',fs:'1',to:to||'',su:subject,body}).toString();
}

/* ---------- guardado automático (historia clínica y mensaje del turno) ---------- */
// Lo que se escribe queda en un borrador y se guarda solo al dejar de escribir.
// Aunque la pantalla se actualice (por la sincronización), el texto no se pierde.
const DRAFT={},AUTOST={};
const draftKey=f=>f.dataset.form+':'+(f.dataset.key||'');
function applyDrafts(){
  document.querySelectorAll('form[data-auto]').forEach(f=>{
    const d=DRAFT[draftKey(f)];if(!d){autoState(f,AUTOST[draftKey(f)]);return}
    for(const [id,v] of Object.entries(d.vals)){const el=document.getElementById(id);if(el&&el.value!==v)el.value=v}
    autoState(f,d.state);if(f.dataset.form==='wa')waPreview();
  });
}
function autoState(f,st){if(f)AUTOST[draftKey(f)]=st;const el=f&&f.querySelector('.autosave');if(!el)return;el.textContent={wait:'Escribiendo…',saving:'Guardando…',ok:'Guardado ✓',err:'No se pudo guardar'}[st]||'Se guarda solo';el.dataset.st=st||''}
function draftInput(f,t){
  const k=draftKey(f);const d=DRAFT[k]||(DRAFT[k]={vals:{},ver:0,form:f.dataset.form,key:f.dataset.key||''});
  d.vals[t.id]=t.value;d.ver++;d.state='wait';autoState(f,'wait');
  clearTimeout(d.timer);d.timer=setTimeout(()=>autoSave(k),1200);
}
async function autoSave(k){
  const d=DRAFT[k];if(!d)return;clearTimeout(d.timer);
  const ver=d.ver,vals={...d.vals};const f=()=>document.querySelector(`form[data-auto][data-form="${d.form}"]`);
  d.state='saving';autoState(f(),'saving');
  try{
    if(d.form==='hc'){
      const p=get('patients',d.key);if(!p)return;const hc={...(p.hc||{})};
      for(const [id,v] of Object.entries(vals))hc[id.replace(/^hc_/,'')]=v;
      await save('patients',{...p,hc,hcUpdated:new Date().toISOString()},true);
    }else if(d.form==='wa'){await save('config',{...cfg(),id:'main',waTemplate:vals.waTpl},true)}
    d.state='ok';AUTOST[k]='ok';if(DRAFT[k]&&DRAFT[k].ver===ver)delete DRAFT[k];autoState(f(),DRAFT[k]?DRAFT[k].state:'ok');
  }catch(e){d.state='err';AUTOST[k]='err';autoState(f(),'err')}
}
function flushDrafts(){for(const k of Object.keys(DRAFT))autoSave(k)}
function waPreview(){const t=$('#waTpl'),b=$('#waTplPrev');if(t&&b&&b.dataset.id){const a=get('appointments',b.dataset.id);if(a)b.textContent=fillTpl(t.value,a)}}

/* ---------- documentos adjuntos de cada sesión ---------- */
// La ficha (nombre, tipo, sesión) se sincroniza como cualquier dato; el archivo se guarda
// en el equipo y, en modo servidor, se sube al servidor.
const URLS=new Map();
const fmtSize=n=>n>1048576?(n/1048576).toFixed(1).replace('.',',')+' MB':Math.max(1,Math.round(n/1024))+' KB';
const isImg=t=>/^image\//.test(t||'');
async function blobGet(id){
  if(ST.idb){try{const r=await new Promise((res,rej)=>{const q=ST.idb.transaction('blobs').objectStore('blobs').get(id);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});if(r)return r.blob}catch(e){}}
  if(ST.mode==='server'&&ST.token){
    const r=await fetch(ST.server.replace(/\/$/,'')+'/api/files/'+encodeURIComponent(id),{headers:{Authorization:'Bearer '+ST.token}});
    if(!r.ok)throw Object.assign(new Error('No disponible'),{status:r.status});
    const b=await r.blob();if(ST.idb)await idbPutMany('blobs',[{k:id,blob:b,up:true}]).catch(()=>{});return b;
  }
  throw new Error('No disponible');
}
async function blobUrl(id){if(URLS.has(id))return URLS.get(id);const u=URL.createObjectURL(await blobGet(id));URLS.set(id,u);return u}
function blobDel(id){if(URLS.has(id)){URL.revokeObjectURL(URLS.get(id));URLS.delete(id)}if(ST.idb)idbDelMany('blobs',[id]).catch(()=>{})}
async function uploadBlobs(){
  if(ST.mode!=='server'||!ST.idb)return;
  const rows=(await idbAll('blobs')).filter(r=>!r.up);
  for(const r of rows){
    if(!get('attachments',r.k)){continue}
    const res=await fetch(ST.server.replace(/\/$/,'')+'/api/files/'+encodeURIComponent(r.k),{method:'PUT',headers:{Authorization:'Bearer '+ST.token,'Content-Type':r.blob.type||'application/octet-stream'},body:r.blob});
    if(!res.ok){if(res.status===401)throw Object.assign(new Error('auth'),{status:401});continue}
    await idbPutMany('blobs',[{...r,up:true}]);
  }
}
function hydrateThumbs(){
  document.querySelectorAll('img[data-att]:not([src])').forEach(img=>{blobUrl(img.dataset.att).then(u=>{img.src=u}).catch(()=>{img.closest('.att')&&img.closest('.att').classList.add('missing')})});
}
const FILE_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5"/></svg>';
function attTile(x,removable){
  return `<div class="att" title="${esc(x.nombre)}"><button type="button" class="att-open" data-a="openAtt" data-id="${esc(x.id)}">${isImg(x.tipo)?`<img data-att="${esc(x.id)}" alt="${esc(x.nombre)}">`:`<span class="att-ic">${FILE_ICON}<small>${esc((x.nombre.split('.').pop()||'').slice(0,5).toUpperCase())}</small></span>`}<span class="att-n">${esc(x.nombre)}</span></button>${removable?`<button type="button" class="att-x" data-a="rmAtt" data-id="${esc(x.id)}" aria-label="Quitar ${esc(x.nombre)}">×</button>`:''}</div>`;
}
const sesAtts=id=>list('attachments').filter(x=>x.sesionId===id).sort((a,b)=>(a.createdAt||'').localeCompare(b.createdAt||''));
// Adjuntos que se están cargando en la ventana de la sesión (se guardan al tocar "Guardar sesión")
let PEND={ses:null,add:[],rm:new Set()};
function renderPendAtts(){
  const box=$('#seAtts');if(!box)return;
  const cur=sesAtts(PEND.ses).filter(x=>!PEND.rm.has(x.id));
  const all=[...cur,...PEND.add.map(x=>x.meta)];
  box.innerHTML=all.length?all.map(x=>attTile(x,true)).join(''):'<p class="small muted" style="margin:0">Sin documentos. Podés adjuntar estudios, recetas, consentimientos o fotos.</p>';
  PEND.add.forEach(x=>{const img=box.querySelector(`img[data-att="${x.meta.id}"]`);if(img){if(!URLS.has(x.meta.id))URLS.set(x.meta.id,URL.createObjectURL(x.blob));img.src=URLS.get(x.meta.id)}});
  hydrateThumbs();
}
function loadImg(file){return new Promise((res,rej)=>{const u=URL.createObjectURL(file);const im=new Image();im.onload=()=>{URL.revokeObjectURL(u);res(im)};im.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('img'))};im.src=u})}
// Achica las fotos y, si es un documento escaneado, lo pasa a blanco y negro con más contraste.
async function prepImage(file,doc){
  const im=await loadImg(file);const max=2000,k=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight));
  const c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);
  const g=c.getContext('2d');g.drawImage(im,0,0,c.width,c.height);
  if(doc){
    const d=g.getImageData(0,0,c.width,c.height),px=d.data,h=new Array(256).fill(0);
    for(let i=0;i<px.length;i+=4){const y=(px[i]*.299+px[i+1]*.587+px[i+2]*.114)|0;px[i]=y;h[y]++}
    const tot=px.length/4;let lo=0,hi=255,acc=0;for(;lo<255;lo++){acc+=h[lo];if(acc>tot*.02)break}acc=0;for(;hi>0;hi--){acc+=h[hi];if(acc>tot*.25)break}
    if(hi-lo<40){lo=Math.max(0,lo-20);hi=Math.min(255,hi+20)}
    for(let i=0;i<px.length;i+=4){let v=(px[i]-lo)*255/(hi-lo);v=v<0?0:v>255?255:v;px[i]=px[i+1]=px[i+2]=v}
    g.putImageData(d,0,0);
  }
  return await new Promise(r=>c.toBlob(r,'image/jpeg',.85));
}
async function addFiles(files,scan){
  const MAX=15*1024*1024;
  for(const file of files){
    try{
      let blob=file,tipo=file.type||'application/octet-stream',nombre=file.name||'documento';
      if(isImg(tipo)&&!/gif|svg/.test(tipo)){
        try{const doc=scan&&!!($('#seDoc')&&$('#seDoc').checked);blob=await prepImage(file,doc);tipo='image/jpeg';
          if(scan)nombre=`Escaneo ${fCorta(today()).replace(/\//g,'-')} ${new Date().toTimeString().slice(0,5).replace(':','.')}.jpg`;else nombre=nombre.replace(/\.\w+$/,'')+'.jpg'}
        catch(e){blob=file}
      }
      if(blob.size>MAX){toast(`"${nombre}" pesa más de 15 MB`,'err');continue}
      const meta={id:uid('adj'),nombre,tipo,tam:blob.size,fecha:today()};
      PEND.add.push({meta,blob});
    }catch(e){toast('No se pudo agregar '+(file.name||'el archivo'),'err')}
  }
  renderPendAtts();
}
async function commitAtts(sesId,pacId){
  for(const id of PEND.rm){const x=get('attachments',id);if(x)await del('attachments',id)}
  for(const x of PEND.add){
    if(ST.idb)await idbPutMany('blobs',[{k:x.meta.id,blob:x.blob,up:false}]);
    await save('attachments',{...x.meta,pacienteId:pacId,sesionId:sesId},true);
  }
  const n=PEND.add.length;PEND={ses:null,add:[],rm:new Set()};if(n&&ST.mode==='server')scheduleSync(100);
}
async function openAtt(id){
  const x=get('attachments',id)||(PEND.add.find(p=>p.meta.id===id)||{}).meta;if(!x)return;
  let u;try{u=await blobUrl(id)}catch(e){toast(e.status===404?'El archivo todavía no se subió desde el otro equipo.':'No se pudo abrir el archivo (¿sin conexión?)','err');return}
  if(isImg(x.tipo)){
    const v=document.createElement('div');v.className='viewer';v.id='viewer';
    v.innerHTML=`<div class="viewer-bar"><span>${esc(x.nombre)}</span><span class="grow"></span><a class="btn sm" href="${u}" download="${esc(x.nombre)}">Descargar</a><button class="btn sm" data-a="closeViewer">${I.x}</button></div><img src="${u}" alt="${esc(x.nombre)}">`;
    document.body.appendChild(v);return;
  }
  const a=document.createElement('a');a.href=u;a.target='_blank';a.rel='noopener';if(!/pdf/.test(x.tipo))a.download=x.nombre;document.body.appendChild(a);a.click();a.remove();
}

/* ---------- apariencia: paleta de colores y modo claro/oscuro (se guarda en cada equipo) ---------- */
const PALETAS=[['beige','Beige y marrón',['#F5EEE4','#FFFFFF','#8B5E3C']],['rosa','Rosa empolvado',['#F7EEEC','#FFFFFF','#A86F6F']],['salvia','Verde salvia',['#EFF1EA','#FFFFFF','#5F7552']],['piedra','Gris piedra',['#F1EFEC','#FFFFFF','#6E655C']],['azul','Azul sereno',['#EEF2F5','#FFFFFF','#4F6D8A']]];
const MODOS=[['auto','Automático'],['claro','Claro'],['oscuro','Oscuro']];
function temaGet(){try{return JSON.parse(localStorage.getItem('pl_tema')||'{}')||{}}catch(e){return {}}}
function temaApply(){
  const t=temaGet(),r=document.documentElement,p=PALETAS.some(x=>x[0]===t.paleta)?t.paleta:'beige';
  if(p==='beige')r.removeAttribute('data-palette');else r.setAttribute('data-palette',p);
  if(t.modo==='claro')r.setAttribute('data-theme','light');else if(t.modo==='oscuro')r.setAttribute('data-theme','dark');else r.removeAttribute('data-theme');
  const bg=getComputedStyle(r).getPropertyValue('--bg').trim();
  if(bg)document.querySelectorAll('meta[name="theme-color"]').forEach(m=>{m.setAttribute('content',bg);m.removeAttribute('media')});
}
function temaSet(k,v){const t=temaGet();t[k]=v;try{localStorage.setItem('pl_tema',JSON.stringify(t))}catch(e){}temaApply();render()}
temaApply();
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',temaApply)}catch(e){}
function vApariencia(){
  const t=temaGet(),p=t.paleta||'beige',m=t.modo||'auto';
  return `<div class="panel"><h3>Paleta de colores</h3><div class="pal-grid">${PALETAS.map(([id,n,c])=>`<button class="pal ${p===id?'on':''}" data-a="paleta" data-p="${id}" aria-pressed="${p===id}"><span class="sw">${c.map(x=>`<i style="background:${x}"></i>`).join('')}</span>${esc(n)}</button>`).join('')}</div></div>
  <div class="panel"><h3>Modo</h3><div class="seg">${MODOS.map(([id,n])=>`<button class="${m===id?'on':''}" data-a="tmodo" data-m="${id}">${n}</button>`).join('')}</div>
  <p class="small muted" style="margin:10px 0 0">Automático sigue el modo claro u oscuro del equipo. La apariencia se guarda en cada computadora o celular, así cada uno puede tener la suya.</p></div>`;
}

/* ---------- render principal ---------- */
function navBtn(v,label,icon){const on=S.view===v||(v==='pacientes'&&S.view==='paciente');return `<button class="${on?'on':''}" data-a="nav" data-v="${v}">${icon}<span>${label}</span></button>`}
function shell(){
  if(S.screen)return authScreen();
  const st=`<span class="js-status">${statusHtml()}</span>`;
  const who=ST.mode==='server'&&ST.user?`<span>${esc(ST.user.nombre)} · ${esc({admin:'Administración',medico:'Profesional',secretaria:'Secretaría'}[ST.user.rol]||'')}</span>`:'';
  return `<div class="app">
  <aside class="side"><div class="brand"><img src="logo-full.png" alt="Dra Paulina Lopez"></div>
    <nav class="nav">${navBtn('agenda','Agenda',I.cal)}${navBtn('pacientes','Pacientes',I.users)}${navBtn('pagos','Pagos',I.pay)}${navBtn('config','Configuración',I.gear)}</nav>
    <div class="foot">${ST.mode==='server'?`<button class="btn sm" data-a="syncNow" style="align-self:flex-start">Sincronizar ahora</button>`:''}<span>${st}</span>${who}<span>${cap(fLarga(today()))}</span></div></aside>
  <div style="min-width:0">
    <header class="topbar"><img src="logo-mono.png" alt="Dra Paulina Lopez"><span class="small muted" data-a="syncNow">${st}</span><button class="btn primary sm" data-a="newAppt">${I.plus}Turno</button></header>
    <main id="main"><div class="wrap">${S.loading?`<div class="loading"><img src="logo-mono.png" alt=""><span>Abriendo la agenda…</span></div>`:view()}</div></main>
  </div>
  <nav class="tabs-bottom">${navBtn('agenda','Agenda',I.cal)}${navBtn('pacientes','Pacientes',I.users)}${navBtn('pagos','Pagos',I.pay)}${navBtn('config','Ajustes',I.gear)}</nav>
  </div>`;
}
function authScreen(){
  const box=inner=>`<div class="auth"><div class="auth-card"><img src="logo-full.png" alt="Dra Paulina Lopez" class="auth-logo">${inner}</div></div>`;
  if(S.screen==='mode')return box(`<h2>¿Cómo vas a usar la agenda?</h2>
    ${window.agendaDesktop?`<button class="choice" data-a="chooseLan"><b>En esta computadora y en el celular (por WiFi)</b><span>Recomendado. Esta computadora guarda los datos y el celular los usa cuando está conectado al mismo WiFi. No necesita internet.</span></button>`:''}
    <button class="choice" data-a="chooseLocal"><b>Solo en este equipo</b><span>Funciona sin internet. Los datos quedan guardados en esta computadora.</span></button>
    <form class="choice" data-form="chooseServer"><b>Conectada a un servidor</b><span>Los datos se comparten entre la computadora, el celular y la web, y también funciona sin conexión.</span>
      <label class="f">Dirección del servidor<input type="text" id="srvUrl" name="url" placeholder="https://agenda.midominio.com" value="${esc(ST.server)}" required></label>
      <button class="btn primary" type="submit">Conectar</button></form>`);
  if(S.screen==='setup')return box(`<h2>Crear la cuenta de administración</h2><p class="muted small">Es la primera vez que se usa este servidor. Esta cuenta puede crear usuarios para profesionales y secretaría.</p>
    <form data-form="setup" class="auth-form"><label class="f">Nombre<input type="text" id="suNom" name="nombre" required value="Dra. Paulina Lopez"></label><label class="f">Email<input type="email" id="suMail" name="email" required></label><label class="f">Contraseña (mínimo 8 caracteres)<input type="password" id="suPass" name="password" minlength="8" required></label><button class="btn primary" type="submit">Crear cuenta</button></form>`);
  return box(`<h2>Ingresar</h2>${ST.server&&IS_DESKTOP?`<p class="muted small">Servidor: ${esc(ST.server)}</p>`:''}
    <form data-form="login" class="auth-form"><label class="f">Email<input type="email" id="liMail" name="email" required autocomplete="username"></label><label class="f">Contraseña<input type="password" id="liPass" name="password" required autocomplete="current-password"></label><button class="btn primary" type="submit">Ingresar</button></form>
    ${IS_DESKTOP?`<button class="btn ghost sm" data-a="resetMode">Cambiar modo de uso</button>`:''}`);
}
function view(){
  switch(S.view){case 'pacientes':return vPacientes();case 'paciente':return vPaciente();case 'pagos':return vPagos();case 'config':return vConfig();default:return vAgenda()}
}
// No redibuja mientras alguien está escribiendo en un formulario de la página (se hace al salir del campo).
let softPending=false;
function renderSoft(){
  const ae=document.activeElement;
  if(ae&&ae.closest&&ae.closest('#main form[data-form]')&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)){softPending=true;renderStatus();return}
  render();
}
document.addEventListener('focusout',()=>{if(softPending)setTimeout(()=>{const ae=document.activeElement;if(!(ae&&ae.closest&&ae.closest('#main form[data-form]'))){softPending=false;render()}},0)});
let rendering=false;
/* ---------- barra de pestañas con flechitas: se corre con las flechas, la rueda del mouse o el dedo ---------- */
const CHEV='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 6l6 6-6 6"/></svg>';
const tabsBar=inner=>`<div class="tabs-wrap"><button type="button" class="tabs-arr l" data-a="tabsScroll" data-d="-1" aria-label="Ver pestañas anteriores" tabindex="-1"><i>${CHEV}</i></button><div class="tabs">${inner}</div><button type="button" class="tabs-arr r" data-a="tabsScroll" data-d="1" aria-label="Ver más pestañas" tabindex="-1"><i>${CHEV}</i></button></div>`;
function tabsUpd(w){const t=w.querySelector('.tabs');if(!t)return;w.classList.toggle('can-l',t.scrollLeft>2);w.classList.toggle('can-r',t.scrollLeft+t.clientWidth<t.scrollWidth-2)}
const TABS_ON=[];
function tabsInit(prev){
  document.querySelectorAll('.tabs-wrap').forEach((w,i)=>{
    const t=w.querySelector('.tabs');
    if(prev&&prev[i]!=null)t.scrollLeft=prev[i];
    const on=t.querySelector('.on'),k=on&&on.dataset.a+on.dataset.t;
    if(on&&(!prev||prev[i]==null||TABS_ON[i]!==k)){const l=on.offsetLeft-t.offsetLeft,r=l+on.offsetWidth;if(l<t.scrollLeft)t.scrollLeft=l-36;else if(r>t.scrollLeft+t.clientWidth)t.scrollLeft=r-t.clientWidth+36}
    t.addEventListener('scroll',()=>tabsUpd(w),{passive:true});
    t.addEventListener('wheel',e=>{if(t.scrollWidth<=t.clientWidth||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;e.preventDefault();t.scrollLeft+=e.deltaY},{passive:false});
    TABS_ON[i]=k;tabsUpd(w);
  });
}
window.addEventListener('resize',()=>document.querySelectorAll('.tabs-wrap').forEach(tabsUpd));

function render(){
  if(rendering)return;rendering=true;
  const ae=document.activeElement,fid=ae&&ae.id,ss=ae&&'selectionStart' in ae?ae.selectionStart:null;
  const sy=window.scrollY,calSc=$('.cal')?.scrollLeft,tabSc=[...document.querySelectorAll('.tabs-wrap .tabs')].map(x=>x.scrollLeft);
  $('#root').innerHTML=shell();
  applyDrafts();hydrateThumbs();
  if(fid){const el=document.getElementById(fid);if(el&&!el.closest('.modal')){el.focus();try{if(ss!=null)el.setSelectionRange(ss,ss)}catch(e){}}}
  window.scrollTo(0,sy);if(calSc&&$('.cal'))$('.cal').scrollLeft=calSc;tabsInit(tabSc);
  try{localStorage.setItem('pl_ui',JSON.stringify({view:S.view,calMode:S.calMode}))}catch(e){}
  rendering=false;
}

/* ---------- Agenda ---------- */
function apptsFiltered(){return list('appointments').filter(a=>(!S.fPro||a.profesionalId===S.fPro)&&(!S.fLoc||a.lugarId===S.fLoc))}
function vAgenda(){
  const c=cfg(),D=S.date,isDay=S.calMode==='dia';
  const all=apptsFiltered();
  let cols=[];
  if(isDay){
    const ps=S.fPro?pros().filter(p=>p.id===S.fPro):pros();
    cols=(ps.length>1?ps:[ps[0]||null]).map(p=>({date:D,pro:p?p.id:'',label:p?`<span class="swatch" style="--pc:${p.color}"></span> ${esc(p.nombre)}`:cap(fLarga(D)),single:ps.length<=1}));
    if(cols.length===1)cols[0].label=`${DIAS_C[pd(D).getDay()]} <b>${pd(D).getDate()}</b>`;
  }else{
    const ws=weekStart(D);let n=6;if(all.some(a=>a.fecha===addDays(ws,6)))n=7;
    for(let i=0;i<n;i++){const d=addDays(ws,i);cols.push({date:d,pro:'',label:`${DIAS_C[pd(d).getDay()]} <b>${pd(d).getDate()}</b>`})}
  }
  let h0=toMin(c.horaInicio),h1=toMin(c.horaFin);
  const gAll=gEvents().filter(g=>cols.some(cl=>cl.date===g.fecha));
  const visible=[...all,...gAll.filter(g=>!g.allDay)].filter(a=>cols.some(cl=>cl.date===a.fecha));
  visible.forEach(a=>{h0=Math.min(h0,Math.floor(toMin(a.hora)/60)*60);h1=Math.max(h1,Math.ceil((toMin(a.hora)+(+a.duracion||30))/60)*60)});
  h0=Math.floor(h0/60)*60;h1=Math.ceil(h1/60)*60;
  const PX=1.8,H=(h1-h0)*PX,tmpl=`54px repeat(${cols.length},minmax(${isDay?140:96}px,1fr))`;
  const hours=[];for(let m=h0;m<=h1;m+=60)hours.push(`<span style="top:${(m-h0)*PX}px">${fromMin(m)}</span>`);
  const nowM=new Date().getHours()*60+new Date().getMinutes();
  const colHtml=cols.map(cl=>{
    let evs=[...all.filter(a=>a.fecha===cl.date&&(!cl.pro||cl.single||a.profesionalId===cl.pro)),...gAll.filter(g=>!g.allDay&&g.fecha===cl.date&&(!cl.pro||cl.single||!g.profesionalId||g.profesionalId===cl.pro)).map(g=>({...g,_g:1}))].sort((a,b)=>toMin(a.hora)-toMin(b.hora));
    // carriles para turnos superpuestos
    const lanes=[];let groups=[],cur=[],curEnd=-1;
    evs.forEach(a=>{const s=toMin(a.hora),e=s+(+a.duracion||30);if(s>=curEnd&&cur.length){groups.push(cur);cur=[]}cur.push(a);curEnd=Math.max(curEnd,e)});if(cur.length)groups.push(cur);
    let out='';
    groups.forEach(g=>{const ends=[];g.forEach(a=>{const s=toMin(a.hora);let li=ends.findIndex(e=>e<=s);if(li<0){li=ends.length;ends.push(0)}ends[li]=s+(+a.duracion||30);a._l=li});const n=ends.length;
      g.forEach(a=>{const s=toMin(a.hora),dur=+a.duracion||30;
        if(a._g){out+=`<button class="ev gev" data-a="gev" data-id="${esc(a.id)}" style="top:${(s-h0)*PX+1}px;height:${Math.max(dur*PX-2,22)}px;left:calc(${a._l*100/n}% + 3px);width:calc(${100/n}% - 6px)" title="${esc(a.titulo)} · Google Calendar"><b>${esc(a.titulo)}</b><span class="t">${esc(a.hora)} hs · Google</span></button>`;return}
        const p=get('patients',a.pacienteId),l=get('locations',a.lugarId);
        out+=`<button class="ev st-${esc(a.estado)}" data-a="appt" data-id="${esc(a.id)}" style="--pc:${esc(proColor(a.profesionalId))};top:${(s-h0)*PX+1}px;height:${Math.max(dur*PX-2,22)}px;left:calc(${a._l*100/n}% + 3px);width:calc(${100/n}% - 6px)">
        <b>${esc(pacName(p))}</b><span class="t">${esc(a.hora)} hs${dur>=45?' · '+dur+' min':''}</span>${dur>=45?`<span class="x">${esc(a.motivo||'')}${l&&!S.fLoc?' · '+esc(l.nombre):''}</span>`:''}</button>`})});
    const isT=cl.date===today();
    return `<div class="col ${isT?'today':''}" data-a="slot" data-date="${cl.date}" data-pro="${esc(cl.pro)}" data-h0="${h0}" style="height:${H}px">${isT&&nowM>=h0&&nowM<=h1?`<div class="now" style="top:${(nowM-h0)*PX}px"></div>`:''}${out}</div>`;
  }).join('');
  const head=`<div class="cal-headrow" style="grid-template-columns:${tmpl}"><div></div>${cols.map(cl=>`<div class="${cl.date===today()&&!isDay?'today':''}">${cl.label}${gAll.filter(g=>g.allDay&&g.fecha===cl.date&&(!cl.pro||cl.single||!g.profesionalId||g.profesionalId===cl.pro)).map(g=>`<button class="gday" data-a="gev" data-id="${esc(g.id)}" title="${esc(g.titulo)} · Google Calendar">${esc(g.titulo)}</button>`).join('')}</div>`).join('')}</div>`;
  // resumen del día
  const dayA=all.filter(a=>a.fecha===D&&a.estado!=='cancelado');
  const cobr=list('payments').filter(p=>p.fecha===D&&p.estado!=='pendiente'&&(!S.fPro||p.profesionalId===S.fPro)).reduce((s,p)=>s+(+p.monto||0),0);
  const rangeTxt=isDay?cap(fLarga(D)):(()=>{const ws=weekStart(D),we=addDays(ws,cols.length-1);return `Semana del ${pd(ws).getDate()} de ${MESES[pd(ws).getMonth()]} al ${pd(we).getDate()} de ${MESES[pd(we).getMonth()]}`})();
  // recordatorios: turnos de mañana
  const man=addDays(today(),1);
  const rec=list('appointments').filter(a=>a.fecha===man&&a.estado!=='cancelado'&&(!S.fPro||a.profesionalId===S.fPro)).sort((a,b)=>toMin(a.hora)-toMin(b.hora));
  const prox=list('appointments').filter(a=>(a.fecha>today()||(a.fecha===today()&&toMin(a.hora)>=nowM))&&a.estado!=='cancelado'&&(!S.fPro||a.profesionalId===S.fPro)).sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora)).slice(0,6);
  const noPros=!pros().length;
  return `
  ${noPros?`<div class="banner info">Para empezar, cargá al menos un profesional y un lugar de atención. <button class="btn sm" data-a="nav" data-v="config">Ir a Configuración</button></div>`:''}
  <div class="head"><div class="t"><span class="eyebrow">Agenda de turnos</span><h1>${esc(rangeTxt)}</h1></div>
    <div class="row"><button class="btn primary" data-a="newAppt">${I.plus}Nuevo turno</button></div></div>
  <div class="row">
    <div class="row" style="gap:4px"><button class="btn icon" data-a="prev" aria-label="Anterior">${I.left}</button><button class="btn" data-a="hoy">Hoy</button><button class="btn icon" data-a="next" aria-label="Siguiente">${I.right}</button></div>
    <input type="date" id="agDate" value="${D}" class="sel-inline" style="width:auto" aria-label="Ir a fecha">
    <div class="seg"><button class="${isDay?'on':''}" data-a="mode" data-m="dia">Día</button><button class="${!isDay?'on':''}" data-a="mode" data-m="semana">Semana</button></div>
    <span class="grow"></span>
    ${ST.gcal.events.length?`<button class="btn sm gtoggle ${S.showG?'on':''}" data-a="toggleG" aria-pressed="${S.showG?'true':'false'}" title="Mostrar u ocultar los eventos de Google Calendar"><i></i>Google</button>`:''}
    <select id="fPro" class="sel-inline" aria-label="Profesional"><option value="">Todos los profesionales</option>${pros().map(p=>`<option value="${esc(p.id)}" ${S.fPro===p.id?'selected':''}>${esc(p.nombre)}</option>`).join('')}</select>
    <select id="fLoc" class="sel-inline" aria-label="Lugar"><option value="">Todos los lugares</option>${locs().map(l=>`<option value="${esc(l.id)}" ${S.fLoc===l.id?'selected':''}>${esc(l.nombre)}</option>`).join('')}</select>
  </div>
  <div class="stats">
    <div class="stat"><span class="eyebrow">Turnos ${D===today()?'hoy':'del día'}</span><b>${dayA.length}</b></div>
    <div class="stat"><span class="eyebrow">Por confirmar</span><b>${dayA.filter(a=>a.estado==='pendiente').length}</b></div>
    <div class="stat"><span class="eyebrow">Atendidos</span><b>${dayA.filter(a=>a.estado==='atendido').length}</b></div>
    <div class="stat"><span class="eyebrow">Cobrado</span><b>${money(cobr)}</b></div>
  </div>
  <div class="agenda-layout">
    <div class="panel cal"><div class="cal-inner" style="min-width:${54+cols.length*(isDay?140:96)}px">${head}
      <div class="cal-body" style="grid-template-columns:${tmpl};--hh:${30*PX}px"><div class="hours" style="height:${H}px">${hours.join('')}</div>${colHtml}</div></div></div>
    <div style="display:flex;flex-direction:column;gap:18px;min-width:0">
      <div class="panel"><h3>Recordatorios para mañana</h3><p class="small muted" style="margin:-6px 0 8px">${cap(fLarga(man))}. Enviá el turno por WhatsApp con un toque.</p>
        <div class="list">${rec.length?rec.map(a=>{const p=get('patients',a.pacienteId);return `<div class="li"><div class="main"><b>${esc(pacName(p))}</b><span class="small muted num">${esc(a.hora)} hs · ${esc((get('locations',a.lugarId)||{}).nombre||'')}</span></div>${a.notificado?'<span class="pill atendido" title="Enviado">Enviado</span>':''}<button class="btn wa sm" data-a="waAppt" data-id="${esc(a.id)}">${I.wa}Enviar</button></div>`}).join(''):'<div class="empty">No hay turnos para mañana.</div>'}</div></div>
      <div class="panel"><h3>Próximos turnos</h3><div class="list">${prox.length?prox.map(a=>`<div class="li" style="cursor:pointer" data-a="appt" data-id="${esc(a.id)}"><span class="swatch" style="--pc:${esc(proColor(a.profesionalId))}"></span><div class="main"><b>${esc(pacName(get('patients',a.pacienteId)))}</b><span class="small muted num">${cap(fLarga(a.fecha))} · ${esc(a.hora)}</span></div><span class="pill ${esc(a.estado)}">${ESTADO_TXT[a.estado]||''}</span></div>`).join(''):'<div class="empty">Sin turnos próximos.</div>'}</div></div>
    </div>
  </div>`;
}

/* ---------- Pacientes ---------- */
function nextAppt(pid){return list('appointments').filter(a=>a.pacienteId===pid&&a.fecha>=today()&&a.estado!=='cancelado').sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora))[0]}
function lastSess(pid){return list('sessions').filter(s=>s.pacienteId===pid).sort((a,b)=>b.fecha.localeCompare(a.fecha))[0]}
function vPacientes(){
  const q=norm(S.q);
  const ps=list('patients').filter(p=>!q||norm([p.nombre,p.apellido,p.dni,p.telefono,p.obraSocial].join(' ')).includes(q)).sort(pacSort);
  return `<div class="head"><div class="t"><span class="eyebrow">Fichas</span><h1>Pacientes</h1></div><button class="btn primary" data-a="newPac">${I.plus}Nuevo paciente</button></div>
  <input type="search" id="pacQ" placeholder="Buscar por nombre, DNI, teléfono u obra social…" value="${esc(S.q)}">
  <div class="panel" style="padding:6px 8px"><div class="table-wrap"><table><thead><tr><th>Paciente</th><th class="hide-sm">DNI</th><th class="hide-sm">Edad</th><th>Teléfono</th><th class="hide-sm">Obra social</th><th>Próximo turno</th></tr></thead><tbody>
  ${ps.map(p=>{const n=nextAppt(p.id);return `<tr class="click" data-a="openPac" data-id="${esc(p.id)}"><td><b>${esc(p.apellido)}, ${esc(p.nombre)}</b></td><td class="hide-sm num">${esc(p.dni)}</td><td class="hide-sm num">${age(p.nacimiento)??'—'}</td><td class="num">${esc(p.telefono)}</td><td class="hide-sm">${esc(p.obraSocial)}</td><td class="num">${n?`${fCorta(n.fecha)} ${esc(n.hora)}`:'<span class="muted">—</span>'}</td></tr>`}).join('')}
  </tbody></table>${ps.length?'':`<div class="empty">${S.q?'Ningún paciente coincide con la búsqueda.':'Todavía no cargaste pacientes. Tocá “Nuevo paciente” para crear la primera ficha.'}</div>`}</div></div>
  <p class="small muted">${list('patients').length===1?'1 paciente':list('patients').length+' pacientes'} en total.</p>`;
}
function kv(label,v){return `<div><dt>${label}</dt><dd>${v?esc(v):'<span class="muted">—</span>'}</dd></div>`}
function vPaciente(){
  const p=get('patients',S.pacId);
  if(!p)return `<div class="empty">Este paciente ya no existe. <button class="btn sm" data-a="nav" data-v="pacientes">Volver a pacientes</button></div>`;
  const a=age(p.nacimiento),ini=((p.nombre||' ')[0]+(p.apellido||' ')[0]).toUpperCase();
  let tabs=[['datos','Datos personales'],['hc','Historia clínica'],['sesiones','Sesiones'],['turnos','Turnos'],['pagos','Pagos']];
  if(isSec()){tabs=tabs.filter(x=>x[0]!=='hc'&&x[0]!=='sesiones');if(S.pacTab==='hc'||S.pacTab==='sesiones')S.pacTab='datos'}
  const ses=list('sessions').filter(s=>s.pacienteId===p.id).sort((x,y)=>(y.fecha+String(y.numero).padStart(4,'0')).localeCompare(x.fecha+String(x.numero).padStart(4,'0')));
  const tur=list('appointments').filter(t=>t.pacienteId===p.id).sort((x,y)=>(y.fecha+y.hora).localeCompare(x.fecha+x.hora));
  const pag=list('payments').filter(t=>t.pacienteId===p.id).sort((x,y)=>y.fecha.localeCompare(x.fecha));
  let body='';
  if(S.pacTab==='datos'){
    body=`<div class="panel"><div class="row" style="justify-content:space-between;margin-bottom:14px"><h3>Datos personales</h3><button class="btn sm" data-a="editPac" data-id="${esc(p.id)}">${I.edit}Editar</button></div><dl class="kv">
    ${kv('Nombre',p.nombre)}${kv('Apellido',p.apellido)}${kv('DNI',p.dni)}${kv('Fecha de nacimiento',p.nacimiento?fCorta(p.nacimiento)+(a!=null?` (${a} años)`:''):'')}${kv('Sexo',p.sexo)}${kv('Teléfono',p.telefono)}${kv('Email',p.email)}${kv('Dirección',p.direccion)}${kv('Ciudad',p.ciudad)}${kv('Obra social / prepaga',p.obraSocial)}${kv('N° de afiliado',p.afiliado)}${kv('Ocupación',p.ocupacion)}${kv('Contacto de emergencia',[p.emergenciaNombre,p.emergenciaTel].filter(Boolean).join(' · '))}</dl></div>`;
  }else if(S.pacTab==='hc'){
    const h=p.hc||{};
    const F=(k,l)=>`<label class="f ${['motivo','observaciones','diagnostico'].includes(k)?'full':''}">${l}<textarea id="hc_${k}" name="${k}" rows="3">${esc(h[k])}</textarea></label>`;
    body=`<form class="panel" data-form="hc" data-auto data-key="${esc(p.id)}"><div class="row" style="justify-content:space-between;margin-bottom:14px"><h3>Historia clínica</h3><span class="small muted">${p.hcUpdated?'Última edición '+fCorta(p.hcUpdated.slice(0,10)):''}</span></div>
    <div class="fgrid">${F('motivo','Motivo de consulta')}${F('personales','Antecedentes personales')}${F('familiares','Antecedentes familiares')}${F('alergias','Alergias')}${F('medicacion','Medicación habitual')}${F('cirugias','Cirugías / internaciones')}${F('habitos','Hábitos (tabaco, alcohol, actividad física)')}${F('diagnostico','Diagnóstico')}${F('observaciones','Observaciones')}</div>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><span class="autosave small muted">Se guarda solo</span><button class="btn primary" type="submit">Guardar historia clínica</button></div></form>`;
  }else if(S.pacTab==='sesiones'){
    body=`<div class="row" style="justify-content:space-between"><p class="muted small" style="margin:0">${ses.length===1?'1 sesión registrada':ses.length+' sesiones registradas'}. Cada sesión guarda la evaluación, el tratamiento realizado y la evolución.</p><button class="btn primary" data-a="newSes" data-pac="${esc(p.id)}">${I.plus}Nueva sesión</button></div>
    <div class="timeline">${ses.length?ses.map(s=>{const pr=get('professionals',s.profesionalId);const B=(l,v)=>v?`<div><span class="eyebrow">${l}</span><p>${esc(v)}</p></div>`:'';return `<article class="sess"><div class="sess-h"><span class="n">Sesión ${esc(s.numero)}</span><span class="muted num">${cap(fLarga(s.fecha))} · ${fCorta(s.fecha)}</span>${pr?`<span class="pill"><span class="swatch" style="--pc:${esc(pr.color)}"></span>${esc(pr.nombre)}</span>`:''}<span class="grow"></span><button class="btn sm ghost" data-a="editSes" data-id="${esc(s.id)}">${I.edit}Editar</button></div>
      <div class="sess-b">${B('Evaluación',s.evaluacion)}${B('Tratamiento realizado',s.tratamiento)}${B('Indicaciones',s.indicaciones)}${B('Evolución',s.evolucion)}${B('Próximo paso',s.proximo)}</div>${(()=>{const at=sesAtts(s.id);return at.length?`<div><span class="eyebrow">Documentos (${at.length})</span><div class="atts">${at.map(x=>attTile(x,false)).join('')}</div></div>`:''})()}</article>`}).join(''):'<div class="panel empty">Todavía no hay sesiones. Registrá la primera con “Nueva sesión”.</div>'}</div>`;
  }else if(S.pacTab==='turnos'){
    const fut=tur.filter(t=>t.fecha>=today()&&t.estado!=='cancelado');
    body=`<div class="row" style="justify-content:space-between"><p class="muted small" style="margin:0">${fut.length===1?'1 turno próximo':fut.length+' turnos próximos'}.</p><div class="row">${fut.length?`<button class="btn wa" data-a="waAll" data-pac="${esc(p.id)}">${I.wa}Enviar próximos turnos</button>`:''}<button class="btn primary" data-a="newAppt" data-pac="${esc(p.id)}">${I.plus}Nuevo turno</button></div></div>
    <div class="panel" style="padding:6px 8px"><div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Hora</th><th class="hide-sm">Profesional</th><th class="hide-sm">Lugar</th><th>Estado</th><th></th></tr></thead><tbody>
    ${tur.map(t=>`<tr class="click" data-a="appt" data-id="${esc(t.id)}"><td class="num">${fCorta(t.fecha)}</td><td class="num">${esc(t.hora)}</td><td class="hide-sm">${esc((get('professionals',t.profesionalId)||{}).nombre||'')}</td><td class="hide-sm">${esc((get('locations',t.lugarId)||{}).nombre||'')}</td><td><span class="pill ${esc(t.estado)}">${ESTADO_TXT[t.estado]||''}</span></td><td class="r">${t.fecha>=today()&&t.estado!=='cancelado'?`<button class="btn wa sm" data-a="waAppt" data-id="${esc(t.id)}" aria-label="Enviar por WhatsApp">${I.wa}</button>`:''}</td></tr>`).join('')}
    </tbody></table>${tur.length?'':'<div class="empty">Sin turnos todavía.</div>'}</div></div>`;
  }else{
    const tot=pag.filter(x=>x.estado!=='pendiente').reduce((s,x)=>s+(+x.monto||0),0),pen=pag.filter(x=>x.estado==='pendiente').reduce((s,x)=>s+(+x.monto||0),0);
    body=`<div class="row" style="justify-content:space-between"><p class="small" style="margin:0">Total abonado <b class="num">${money(tot)}</b>${pen?` · Pendiente <b class="num" style="color:var(--warn)">${money(pen)}</b>`:''}</p><button class="btn primary" data-a="newPay" data-pac="${esc(p.id)}">${I.plus}Registrar pago</button></div>
    ${payTable(pag,false)}`;
  }
  return `<div><button class="btn ghost sm" data-a="nav" data-v="pacientes">${I.back}Pacientes</button></div>
  <div class="ficha-head"><div class="avatar">${esc(ini)}</div><div class="grow" style="min-width:0"><span class="eyebrow">Ficha del paciente</span><h1>${esc(pacName(p))}</h1><div class="small muted num">${[p.dni&&'DNI '+p.dni,a!=null&&a+' años',p.obraSocial,p.telefono].filter(Boolean).map(esc).join(' · ')}</div></div>
    <div class="row">${p.telefono?`<a class="btn wa" href="https://wa.me/${waPhone(p.telefono)}" target="_blank" rel="noopener">${I.wa}WhatsApp</a>`:''}<button class="btn primary" data-a="newAppt" data-pac="${esc(p.id)}">${I.plus}Turno</button></div></div>
  ${!isSec()&&p.hc&&p.hc.alergias&&!/^(ninguna|no|-)/i.test(p.hc.alergias.trim())?`<div class="banner" style="background:var(--bad-soft)"><b>Alergias:</b> ${esc(p.hc.alergias)}</div>`:''}
  ${tabsBar(tabs.map(([k,l])=>`<button class="${S.pacTab===k?'on':''}" data-a="pacTab" data-t="${k}">${l}</button>`).join(''))}
  ${body}`;
}

/* ---------- Pagos ---------- */
function payTable(rows,showPac){
  return `<div class="panel" style="padding:6px 8px"><div class="table-wrap"><table><thead><tr><th>Fecha</th>${showPac?'<th>Paciente</th>':''}<th class="hide-sm">Concepto</th><th class="hide-sm">Profesional</th><th>Método</th><th class="r">Monto</th><th>Estado</th></tr></thead><tbody>
  ${rows.map(x=>`<tr class="click" data-a="editPay" data-id="${esc(x.id)}"><td class="num">${fCorta(x.fecha)}</td>${showPac?`<td>${esc(pacName(get('patients',x.pacienteId)))}</td>`:''}<td class="hide-sm">${esc(x.concepto)}</td><td class="hide-sm">${esc((get('professionals',x.profesionalId)||{}).nombre||'')}</td><td>${esc(x.metodo)}</td><td class="r num">${money(x.monto)}</td><td><span class="pill ${x.estado==='pendiente'?'pendiente':'pagado'}">${x.estado==='pendiente'?'Pendiente':'Pagado'}</span></td></tr>`).join('')}
  </tbody></table>${rows.length?'':'<div class="empty">No hay pagos registrados.</div>'}</div></div>`;
}
function vPagos(){
  const m=S.payMonth;
  const rows=list('payments').filter(x=>x.fecha.slice(0,7)===m&&(!S.payMet||x.metodo===S.payMet)&&(!S.payPro||x.profesionalId===S.payPro)).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  const paid=rows.filter(x=>x.estado!=='pendiente'),tot=paid.reduce((s,x)=>s+(+x.monto||0),0),pen=rows.filter(x=>x.estado==='pendiente').reduce((s,x)=>s+(+x.monto||0),0);
  const by={};paid.forEach(x=>by[x.metodo]=(by[x.metodo]||0)+(+x.monto||0));
  const max=Math.max(1,...Object.values(by));
  const [yy,mm]=m.split('-').map(Number);
  const atendSinPago=list('appointments').filter(a=>a.estado==='atendido'&&a.fecha.slice(0,7)===m&&+a.monto>0&&!list('payments').some(p=>p.turnoId===a.id)&&(!S.payPro||a.profesionalId===S.payPro));
  return `<div class="head"><div class="t"><span class="eyebrow">Caja</span><h1>Pagos de ${MESES[mm-1]} ${yy}</h1></div><div class="row"><button class="btn" data-a="csv">Exportar CSV</button><button class="btn primary" data-a="newPay">${I.plus}Registrar pago</button></div></div>
  <div class="row"><div class="row" style="gap:4px"><button class="btn icon" data-a="mPrev" aria-label="Mes anterior">${I.left}</button><input type="month" id="payMonth" value="${m}" class="sel-inline" style="width:auto"><button class="btn icon" data-a="mNext" aria-label="Mes siguiente">${I.right}</button></div><span class="grow"></span>
    <select id="payMet" class="sel-inline"><option value="">Todos los métodos</option>${cfg().metodos.map(x=>`<option ${S.payMet===x?'selected':''}>${esc(x)}</option>`).join('')}</select>
    <select id="payPro" class="sel-inline"><option value="">Todos los profesionales</option>${pros().map(p=>`<option value="${esc(p.id)}" ${S.payPro===p.id?'selected':''}>${esc(p.nombre)}</option>`).join('')}</select></div>
  <div class="stats"><div class="stat"><span class="eyebrow">Cobrado</span><b>${money(tot)}</b></div><div class="stat"><span class="eyebrow">Pendiente</span><b>${money(pen)}</b></div><div class="stat"><span class="eyebrow">Pagos</span><b>${paid.length}</b></div><div class="stat"><span class="eyebrow">Ticket promedio</span><b>${money(paid.length?tot/paid.length:0)}</b></div></div>
  <div class="agenda-layout"><div style="min-width:0">${payTable(rows,true)}</div>
  <div style="display:flex;flex-direction:column;gap:18px;min-width:0">
  <div class="panel"><h3>Por método de pago</h3><div style="display:flex;flex-direction:column;gap:12px">${Object.keys(by).length?Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div><div class="row" style="justify-content:space-between"><span>${esc(k)}</span><b class="num">${money(v)}</b></div><div class="bar"><i style="width:${v/max*100}%"></i></div></div>`).join(''):'<div class="empty">Sin cobros este mes.</div>'}</div></div>
  <div class="panel"><h3>Atendidos sin cobrar</h3><div class="list">${atendSinPago.length?atendSinPago.map(a=>`<div class="li"><div class="main"><b>${esc(pacName(get('patients',a.pacienteId)))}</b><span class="small muted num">${fCorta(a.fecha)} · ${money(a.monto)}</span></div><button class="btn sm" data-a="payAppt" data-id="${esc(a.id)}">Cobrar</button></div>`).join(''):'<div class="empty">Todo al día.</div>'}</div></div>
  </div></div>`;
}

/* ---------- Configuración ---------- */
function vConfig(){
  const c=cfg();
  let tabs=[['profesionales','Profesionales'],['lugares','Lugares de atención'],['pagos','Métodos de pago'],['whatsapp','Mensaje de WhatsApp'],['agenda','Agenda'],['apariencia','Apariencia'],['gcal','Google Calendar'],['datos','Datos y copias'],['conexion','Conexión']];
  if(ST.mode==='server'&&role()==='admin')tabs.push(['usuarios','Usuarios'],['registro','Registro de cambios']);
  if(isSec())tabs=[['conexion','Conexión'],['apariencia','Apariencia']];
  const tk=tabs.map(x=>x[0]);const t=tk.includes(S.cfgTab)?S.cfgTab:tk[0];
  let body='';
  if(t==='profesionales'){
    const all=list('professionals').sort((a,b)=>a.nombre.localeCompare(b.nombre));
    body=`<div class="row" style="justify-content:flex-end"><button class="btn primary" data-a="newPro">${I.plus}Agregar profesional</button></div><div class="panel"><div class="list">${all.map(p=>`<div class="li"><span class="swatch" style="--pc:${esc(p.color)};width:14px;height:14px"></span><div class="main"><b>${esc(p.nombre)}${p.activo===false?' <span class="pill">Inactivo</span>':''}</b><span class="small muted">${esc([p.especialidad,p.matricula,p.telefono].filter(Boolean).join(' · '))}</span></div><button class="btn sm" data-a="editPro" data-id="${esc(p.id)}">${I.edit}Editar</button></div>`).join('')||'<div class="empty">Agregá el primer profesional.</div>'}</div></div>`;
  }else if(t==='lugares'){
    body=`<div class="row" style="justify-content:flex-end"><button class="btn primary" data-a="newLoc">${I.plus}Agregar lugar</button></div><div class="panel"><div class="list">${locs().map(l=>`<div class="li"><div class="main"><b>${esc(l.nombre)}</b><span class="small muted">${esc([l.direccion,l.ciudad,l.telefono].filter(Boolean).join(' · '))}</span></div><button class="btn sm" data-a="editLoc" data-id="${esc(l.id)}">${I.edit}Editar</button></div>`).join('')||'<div class="empty">Agregá el primer lugar de atención.</div>'}</div></div>`;
  }else if(t==='pagos'){
    body=`<div class="panel"><h3>Métodos de pago</h3><p class="small muted" style="margin-top:-6px">Aparecen al registrar cada cobro.</p><div class="chips">${c.metodos.map((m,i)=>`<span class="chip">${esc(m)}<button data-a="delMet" data-i="${i}" aria-label="Quitar ${esc(m)}">×</button></span>`).join('')}</div>
    <form class="row" data-form="addMet" style="margin-top:14px"><input type="text" id="newMet" name="m" placeholder="Ej: Cuenta DNI, Modo, cheque…" style="max-width:320px" required><button class="btn" type="submit">${I.plus}Agregar</button></form></div>`;
  }else if(t==='whatsapp'){
    const sample=list('appointments').sort((a,b)=>(b.fecha).localeCompare(a.fecha))[0];
    body=`<form class="panel" data-form="wa" data-auto data-key="main"><h3>Mensaje del turno</h3><p class="small muted" style="margin-top:-6px">Podés usar: {nombre} {apellido} {profesional} {especialidad} {fecha} {hora} {lugar} {direccion} {motivo} {calendario}</p>
    <p class="small muted">{calendario} es el link para que el paciente agregue el turno a su Google Calendar. Si no lo ponés, igual podés sumarlo al enviar cada turno.</p>
    <textarea id="waTpl" name="t" rows="8">${esc(c.waTemplate)}</textarea>
    ${sample?`<span class="eyebrow" style="margin-top:12px;display:block">Vista previa</span><div class="wa-preview" style="margin-top:6px"><div class="wa-bubble" id="waTplPrev" data-id="${esc(sample.id)}">${esc(fillTpl(c.waTemplate,sample))}</div></div>`:''}
    <div class="row" style="justify-content:flex-end;margin-top:14px"><span class="autosave small muted">Se guarda solo</span><button class="btn primary" type="submit">Guardar mensaje</button></div></form>`;
  }else if(t==='apariencia'){body=vApariencia()
  }else if(t==='agenda'){
    body=`<form class="panel" data-form="agcfg"><h3>Horario de la agenda</h3><div class="fgrid three" style="margin-top:8px"><label class="f">Desde<input type="time" id="cfgIni" name="horaInicio" value="${esc(c.horaInicio)}"></label><label class="f">Hasta<input type="time" id="cfgFin" name="horaFin" value="${esc(c.horaFin)}"></label><label class="f">Duración por defecto (min)<input type="number" id="cfgDur" name="duracion" min="5" step="5" value="${esc(c.duracion)}"></label></div>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" type="submit">Guardar</button></div></form>`;
  }else if(t==='conexion'){body=vConexion()
  }else if(t==='gcal'){body=vGcal()}
  else if(t==='usuarios'){body=vUsers()}
  else if(t==='registro'){body=vAudit()}
  else{
    const ej=COLS.reduce((n,col)=>n+list(col).filter(x=>x.ejemplo).length,0);
    body=`<div class="panel"><h3>Dónde se guardan los datos</h3><p>${ST.mode==='server'?'Los datos están en el servidor y además se guarda una copia en cada equipo para poder trabajar sin internet.':'Los datos se guardan solo en este equipo. Si se rompe o se borran los datos del navegador se pierden: hacé copias seguido.'}</p></div>
    <div class="panel"><h3>Copia de seguridad</h3><p class="small muted" style="margin-top:-6px">Descargá un archivo con todos los datos o restaurá uno anterior.</p><div class="row"><button class="btn" data-a="backup">Descargar copia</button><label class="btn" for="restoreFile">Restaurar copia…</label><input type="file" id="restoreFile" accept=".json,application/json" hidden></div></div>
    ${ej?`<div class="panel"><h3>Datos de ejemplo</h3><p class="small muted" style="margin-top:-6px">Hay ${ej} registros de ejemplo (pacientes, turnos y sesiones de muestra). Borralos cuando empieces a cargar pacientes reales.</p><button class="btn danger" data-a="clearDemo">Borrar datos de ejemplo</button></div>`:''}`;
  }
  return `<div class="head"><div class="t"><span class="eyebrow">Ajustes</span><h1>Configuración</h1></div></div>
  ${tabsBar(tabs.map(([k,l])=>`<button class="${t===k?'on':''}" data-a="cfgTab" data-t="${k}">${l}</button>`).join(''))}${body}`;
}

/* ---------- modales ---------- */
function openModal(html,wide){closeModal();const bg=document.createElement('div');bg.className='modal-bg';bg.id='modal';bg.innerHTML=`<div class="modal ${wide?'wide':''}" role="dialog" aria-modal="true">${html}</div>`;document.body.appendChild(bg);const f=bg.querySelector('input:not([type=hidden]),select,textarea');if(f&&window.innerWidth>820)f.focus()}
function closeModal(){const m=$('#modal');if(m)m.remove();PEND.add.forEach(x=>{if(URLS.has(x.meta.id)){URL.revokeObjectURL(URLS.get(x.meta.id));URLS.delete(x.meta.id)}});PEND={ses:null,add:[],rm:new Set()}}
const mHead=t=>`<div class="mh"><h2>${t}</h2><button class="btn icon ghost" data-a="close" aria-label="Cerrar">${I.x}</button></div>`;
const opt=(v,l,sel)=>`<option value="${esc(v)}" ${sel?'selected':''}>${esc(l)}</option>`;
function formData(f){const o={};new FormData(f).forEach((v,k)=>o[k]=typeof v==='string'?v.trim():v);return o}

function mAppt(a,prefill){
  const c=cfg(),isNew=!a;a=a||Object.assign({id:uid('tur'),fecha:S.date,hora:'09:00',duracion:c.duracion,estado:'pendiente',profesionalId:S.fPro||(pros()[0]||{}).id||'',lugarId:S.fLoc||(locs()[0]||{}).id||'',monto:''},prefill||{});
  const ps=list('patients').sort(pacSort);
  openModal(`${mHead(isNew?'Nuevo turno':'Editar turno')}<form data-form="appt" data-id="${esc(a.id)}" data-new="${isNew?1:''}"><div class="mb">
  <fieldset><legend>Paciente</legend>
  <input type="search" id="apPacQ" placeholder="Buscar paciente…" aria-label="Buscar paciente">
  <select id="apPac" name="pacienteId" size="5" style="padding:4px">${opt('__new','+ Paciente nuevo',!a.pacienteId&&!ps.length)}${ps.map(p=>opt(p.id,`${p.apellido}, ${p.nombre}${p.dni?' · DNI '+p.dni:''}`,a.pacienteId===p.id)).join('')}</select>
  <div id="apNewPac" class="fgrid three" ${!a.pacienteId&&!ps.length?'':'hidden'}><label class="f">Nombre<input type="text" id="np_nombre" name="np_nombre"></label><label class="f">Apellido<input type="text" id="np_apellido" name="np_apellido"></label><label class="f">Teléfono (WhatsApp)<input type="tel" id="np_tel" name="np_tel" placeholder="342 155 123456"></label></div>
  </fieldset>
  <fieldset><legend>Turno</legend><div class="fgrid three">
  <label class="f">Fecha<input type="date" id="apFecha" name="fecha" value="${esc(a.fecha)}" required></label>
  <label class="f">Hora<input type="time" id="apHora" name="hora" value="${esc(a.hora)}" step="300" required></label>
  <label class="f">Duración (min)<input type="number" id="apDur" name="duracion" min="5" step="5" value="${esc(a.duracion)}"></label>
  <label class="f">Profesional<select id="apPro" name="profesionalId">${list('professionals').map(p=>opt(p.id,p.nombre,a.profesionalId===p.id)).join('')}</select></label>
  <label class="f">Lugar<select id="apLoc" name="lugarId">${locs().map(l=>opt(l.id,l.nombre,a.lugarId===l.id)).join('')}</select></label>
  <label class="f">Estado<select id="apEst" name="estado">${ESTADOS.map(e=>opt(e,ESTADO_TXT[e],a.estado===e)).join('')}</select></label>
  <label class="f full">Motivo / práctica<input type="text" id="apMot" name="motivo" value="${esc(a.motivo)}" placeholder="Ej: Control, sesión 2, primera consulta…"></label>
  <label class="f">Valor de la consulta ($)<input type="number" id="apMonto" name="monto" min="0" step="100" value="${esc(a.monto)}"></label>
  <label class="f full">Notas internas<input type="text" id="apNotas" name="notas" value="${esc(a.notas)}"></label>
  </div></fieldset>
  <p id="apWarn" class="small" style="color:var(--bad);margin:0" hidden></p>
  </div><div class="mf">${!isNew?`<button type="button" class="btn danger" data-a="askDel" data-col="appointments" data-id="${esc(a.id)}">Eliminar</button><span class="grow"></span>`:''}<button type="button" class="btn ghost" data-a="close">Cancelar</button>${isNew?`<button type="submit" class="btn" name="go" value="save">Guardar</button><button type="submit" class="btn wa" name="go" value="wa">${I.wa}Guardar y enviar</button>`:`<button type="submit" class="btn primary">Guardar cambios</button>`}</div></form>`,true);
  checkOverlap();
}
/* eventos que vienen de Google Calendar (solo lectura) */
function gEvents(){if(S.showG===false)return [];return (ST.gcal.events||[]).filter(g=>!S.fPro||!g.profesionalId||g.profesionalId===S.fPro)}
function mGev(g){
  const fin=g.allDay?'':fromMin(toMin(g.hora)+(+g.duracion||0)),pr=get('professionals',g.profesionalId);
  openModal(`${mHead(esc(g.titulo))}<div class="mb"><dl class="kv">${kv('Fecha',cap(fLarga(g.fecha)))}${kv('Horario',g.allDay?'Todo el día':`${g.hora} a ${fin} hs`)}${g.lugar?kv('Lugar',g.lugar):''}${pr?kv('Profesional',pr.nombre):''}</dl>
  <p class="small muted" style="margin:12px 0 0">Este evento viene de Google Calendar. Para cambiarlo o borrarlo, hacelo en Google Calendar: la agenda se actualiza sola en unos minutos.</p></div>
  <div class="mf">${!g.allDay&&!isSec()?`<button class="btn" data-a="gevNew" data-id="${esc(g.id)}">${I.plus}Turno en este horario</button>`:''}<span class="grow"></span><button class="btn primary" data-a="close">Listo</button></div>`)}
function checkOverlap(){
  const f=$('form[data-form=appt]');if(!f)return;const w=$('#apWarn');
  const d=$('#apFecha').value,h=toMin($('#apHora').value),e=h+(+$('#apDur').value||30),pr=$('#apPro').value,id=f.dataset.id;
  const clash=list('appointments').find(a=>a.id!==id&&a.fecha===d&&a.profesionalId===pr&&a.estado!=='cancelado'&&toMin(a.hora)<e&&toMin(a.hora)+(+a.duracion||30)>h);
  const gd=(ST.gcal.events||[]).filter(g=>g.fecha===d&&(!g.profesionalId||g.profesionalId===pr));
  const gc=!clash&&(gd.find(g=>!g.allDay&&toMin(g.hora)<e&&toMin(g.hora)+(+g.duracion||0)>h)||gd.find(g=>g.allDay));
  w.hidden=!clash&&!gc;if(clash)w.textContent=`Atención: se superpone con el turno de ${pacName(get('patients',clash.pacienteId))} a las ${clash.hora}.`;
  else if(gc)w.textContent=gc.allDay?`Atención: ese día tenés «${gc.titulo}» en Google Calendar.`:`Atención: se superpone con «${gc.titulo}» de Google Calendar (${gc.hora} hs).`;
}
function mApptView(a){
  const p=get('patients',a.pacienteId),pr=get('professionals',a.profesionalId)||{},l=get('locations',a.lugarId)||{};
  const pays=list('payments').filter(x=>x.turnoId===a.id),paid=pays.filter(x=>x.estado!=='pendiente').reduce((s,x)=>s+(+x.monto||0),0);
  const ses=list('sessions').find(s=>s.turnoId===a.id);
  openModal(`${mHead(esc(pacName(p)))}<div class="mb">
  <div class="row"><span class="pill ${esc(a.estado)}">${ESTADO_TXT[a.estado]}</span>${a.notificado?`<span class="pill">WhatsApp enviado ${fCorta(a.notificado.slice(0,10))}</span>`:''}${paid?`<span class="pill pagado">Pagado ${money(paid)}</span>`:''}</div>
  <dl class="kv">${kv('Fecha',cap(fLarga(a.fecha)))}${kv('Hora',a.hora+' hs · '+(a.duracion||30)+' min')}${kv('Profesional',pr.nombre)}${kv('Lugar',[l.nombre,l.direccion].filter(Boolean).join(' — '))}${kv('Motivo',a.motivo)}${kv('Valor',a.monto?money(a.monto):'')}${kv('Teléfono',p&&p.telefono)}${a.notas?kv('Notas',a.notas):''}</dl>
  <div><span class="eyebrow">Cambiar estado</span><div class="row" style="margin-top:6px">${ESTADOS.map(e=>`<button class="btn sm ${a.estado===e?'primary':''}" data-a="setEst" data-id="${esc(a.id)}" data-e="${e}">${ESTADO_TXT[e]}</button>`).join('')}</div></div>
  </div><div class="mf"><button class="btn ghost" data-a="editAppt" data-id="${esc(a.id)}">${I.edit}Editar</button>${p?`<button class="btn" data-a="openPac" data-id="${esc(p.id)}">Ver ficha</button>`:''}<span class="grow"></span>
  ${p&&!isSec()?`<button class="btn" data-a="${ses?'editSes':'newSes'}" data-id="${ses?esc(ses.id):''}" data-pac="${esc(p.id)}" data-tur="${esc(a.id)}">${ses?'Ver sesión':'Registrar sesión'}</button>`:''}
  ${!paid?`<button class="btn" data-a="payAppt" data-id="${esc(a.id)}">Cobrar</button>`:''}
  <button class="btn" data-a="mailAppt" data-id="${esc(a.id)}">${I.mail}Mail</button><button class="btn wa" data-a="waAppt" data-id="${esc(a.id)}">${I.wa}WhatsApp</button></div>
  <div class="mb" style="padding-top:0"><a class="small" href="${esc(gcalLink(a))}" target="_blank" rel="noopener">${I.cal} Agregar este turno a mi Google Calendar</a></div>`,true);
}
function mPac(p){
  const isNew=!p;p=p||{id:uid('pac')};
  const T=(n,l,v,type='text',ex='')=>`<label class="f">${l}<input type="${type}" id="pc_${n}" name="${n}" value="${esc(v)}" ${ex}></label>`;
  openModal(`${mHead(isNew?'Nuevo paciente':'Editar datos personales')}<form data-form="pac" data-id="${esc(p.id)}" data-new="${isNew?1:''}"><div class="mb">
  <fieldset><legend>Identificación</legend><div class="fgrid three">${T('nombre','Nombre *',p.nombre,'text','required')}${T('apellido','Apellido *',p.apellido,'text','required')}${T('dni','DNI',p.dni,'text','inputmode="numeric"')}${T('nacimiento','Fecha de nacimiento',p.nacimiento,'date')}
  <label class="f">Sexo<select id="pc_sexo" name="sexo">${['','Femenino','Masculino','Otro'].map(x=>opt(x,x||'—',p.sexo===x)).join('')}</select></label>${T('ocupacion','Ocupación',p.ocupacion)}</div></fieldset>
  <fieldset><legend>Contacto</legend><div class="fgrid three">${T('telefono','Celular (WhatsApp)',p.telefono,'tel','placeholder="342 155 123456"')}${T('email','Email',p.email,'email')}${T('ciudad','Ciudad',p.ciudad)}</div><div class="fgrid">${T('direccion','Dirección',p.direccion)}<div class="fgrid">${T('emergenciaNombre','Contacto de emergencia',p.emergenciaNombre)}${T('emergenciaTel','Tel. emergencia',p.emergenciaTel,'tel')}</div></div></fieldset>
  <fieldset><legend>Cobertura</legend><div class="fgrid">${T('obraSocial','Obra social / prepaga',p.obraSocial,'text','list="osList" placeholder="Particular, OSDE, IAPOS…"')}${T('afiliado','N° de afiliado',p.afiliado)}</div>
  <datalist id="osList">${[...new Set(['Particular','IAPOS','OSDE','Swiss Medical','PAMI','Galeno','Medifé','OSECAC','Sancor Salud','Jerárquicos Salud',...list('patients').map(x=>x.obraSocial).filter(Boolean)])].map(x=>`<option value="${esc(x)}">`).join('')}</datalist></fieldset>
  </div><div class="mf">${!isNew?`<button type="button" class="btn danger" data-a="askDel" data-col="patients" data-id="${esc(p.id)}">Eliminar paciente</button><span class="grow"></span>`:''}<button type="button" class="btn ghost" data-a="close">Cancelar</button><button type="submit" class="btn primary">${isNew?'Crear ficha':'Guardar'}</button></div></form>`,true);
}
function mSes(s,pac,tur){
  const isNew=!s;
  if(!s){const t=tur&&get('appointments',tur);const n=list('sessions').filter(x=>x.pacienteId===pac).reduce((m,x)=>Math.max(m,+x.numero||0),0)+1;
    s={id:uid('ses'),pacienteId:pac,turnoId:tur||'',fecha:t?t.fecha:today(),profesionalId:t?t.profesionalId:(S.fPro||(pros()[0]||{}).id||''),numero:n}}
  const X=(n,l,ph)=>`<label class="f full">${l}<textarea id="se_${n}" name="${n}" rows="3" placeholder="${ph||''}">${esc(s[n])}</textarea></label>`;
  openModal(`${mHead((isNew?'Nueva sesión · ':'Sesión · ')+esc(pacName(get('patients',s.pacienteId))))}<form data-form="ses" data-id="${esc(s.id)}" data-pac="${esc(s.pacienteId)}" data-tur="${esc(s.turnoId||'')}"><div class="mb">
  <div class="fgrid three"><label class="f">N° de sesión<input type="number" id="se_num" name="numero" min="1" value="${esc(s.numero)}"></label><label class="f">Fecha<input type="date" id="se_fecha" name="fecha" value="${esc(s.fecha)}" required></label><label class="f">Profesional<select id="se_pro" name="profesionalId">${list('professionals').map(p=>opt(p.id,p.nombre,s.profesionalId===p.id)).join('')}</select></label></div>
  <div class="fgrid">${X('evaluacion','Evaluación / motivo de la sesión','Qué se observó, signos, mediciones…')}${X('tratamiento','Tratamiento realizado','Procedimiento, productos, dosis, zonas…')}${X('indicaciones','Indicaciones','Cuidados, medicación, recomendaciones…')}${X('evolucion','Evolución','Cómo respondió el paciente…')}${X('proximo','Próximo paso','Ej: control en 15 días')}</div>
  <fieldset><legend>Documentos adjuntos</legend><div class="atts" id="seAtts"></div>
  <div class="row" style="margin-top:10px"><label class="btn sm">${FILE_ICON}Adjuntar archivo<input type="file" id="seFile" multiple accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt" hidden></label>
  <label class="btn sm primary scan-btn" ${(window.matchMedia&&matchMedia('(pointer:coarse)').matches)?'':'hidden'}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3.2"/></svg>Escanear con la cámara<input type="file" id="seScan" accept="image/*" capture="environment" hidden></label>
  <label class="row small" style="gap:6px"><input type="checkbox" id="seDoc" checked> Mejorar como documento (blanco y negro)</label></div></fieldset>
  ${isNew&&s.turnoId?`<label class="row small" style="gap:8px"><input type="checkbox" id="se_att" name="marcar" checked> Marcar el turno como atendido</label>`:''}
  </div><div class="mf">${!isNew?`<button type="button" class="btn danger" data-a="askDel" data-col="sessions" data-id="${esc(s.id)}">Eliminar</button><span class="grow"></span>`:''}<button type="button" class="btn ghost" data-a="close">Cancelar</button><button type="submit" class="btn primary">Guardar sesión</button></div></form>`,true);
  PEND={ses:s.id,add:[],rm:new Set()};renderPendAtts();
}
function mPay(x,prefill){
  const isNew=!x;x=x||Object.assign({id:uid('pag'),fecha:today(),estado:'pagado',metodo:cfg().metodos[0],profesionalId:S.fPro||(pros()[0]||{}).id||''},prefill||{});
  const ps=list('patients').sort(pacSort);
  openModal(`${mHead(isNew?'Registrar pago':'Editar pago')}<form data-form="pay" data-id="${esc(x.id)}" data-tur="${esc(x.turnoId||'')}"><div class="mb"><div class="fgrid">
  <label class="f full">Paciente<select id="py_pac" name="pacienteId" required>${opt('','Elegí un paciente',!x.pacienteId)}${ps.map(p=>opt(p.id,`${p.apellido}, ${p.nombre}`,x.pacienteId===p.id)).join('')}</select></label>
  <label class="f">Fecha<input type="date" id="py_fecha" name="fecha" value="${esc(x.fecha)}" required></label>
  <label class="f">Monto ($)<input type="number" id="py_monto" name="monto" min="0" step="100" value="${esc(x.monto)}" required></label>
  <label class="f">Método de pago<select id="py_met" name="metodo">${[...new Set([...cfg().metodos,x.metodo].filter(Boolean))].map(m=>opt(m,m,x.metodo===m)).join('')}</select></label>
  <label class="f">Estado<select id="py_est" name="estado">${opt('pagado','Pagado',x.estado!=='pendiente')}${opt('pendiente','Pendiente / a cuenta',x.estado==='pendiente')}</select></label>
  <label class="f">Profesional<select id="py_pro" name="profesionalId">${list('professionals').map(p=>opt(p.id,p.nombre,x.profesionalId===p.id)).join('')}</select></label>
  <label class="f">Concepto<input type="text" id="py_con" name="concepto" value="${esc(x.concepto)}" placeholder="Consulta, sesión, producto…"></label>
  <label class="f full">Comprobante / nota<input type="text" id="py_nota" name="nota" value="${esc(x.nota)}" placeholder="N° de operación, factura…"></label>
  </div></div><div class="mf">${!isNew?`<button type="button" class="btn danger" data-a="askDel" data-col="payments" data-id="${esc(x.id)}">Eliminar</button><span class="grow"></span>`:''}<button type="button" class="btn ghost" data-a="close">Cancelar</button><button type="submit" class="btn primary">Guardar pago</button></div></form>`);
}
function mPro(p){
  const isNew=!p;p=p||{id:uid('pro'),color:COLORS[list('professionals').length%COLORS.length],activo:true};
  openModal(`${mHead(isNew?'Nuevo profesional':'Editar profesional')}<form data-form="pro" data-id="${esc(p.id)}"><div class="mb"><div class="fgrid">
  <label class="f full">Nombre y título<input type="text" id="pr_nom" name="nombre" value="${esc(p.nombre)}" placeholder="Dra. Nombre Apellido" required></label>
  <label class="f">Especialidad<input type="text" id="pr_esp" name="especialidad" value="${esc(p.especialidad)}"></label><label class="f">Matrícula<input type="text" id="pr_mat" name="matricula" value="${esc(p.matricula)}"></label>
  <label class="f">Teléfono<input type="tel" id="pr_tel" name="telefono" value="${esc(p.telefono)}"></label>
  <label class="f">Color en la agenda<div class="row">${COLORS.map(c=>`<label style="cursor:pointer"><input type="radio" name="color" value="${c}" ${p.color===c?'checked':''} hidden><span class="swatch" style="--pc:${c};width:26px;height:26px;outline:${p.color===c?'2px solid var(--ink)':'none'};outline-offset:2px" data-a="pickColor"></span></label>`).join('')}</div></label>
  <label class="row small full" style="gap:8px"><input type="checkbox" id="pr_act" name="activo" ${p.activo!==false?'checked':''}> Activo (aparece en la agenda)</label>
  </div></div><div class="mf">${!isNew?`<button type="button" class="btn danger" data-a="askDel" data-col="professionals" data-id="${esc(p.id)}">Eliminar</button><span class="grow"></span>`:''}<button type="button" class="btn ghost" data-a="close">Cancelar</button><button type="submit" class="btn primary">Guardar</button></div></form>`);
}
function mLoc(l){
  const isNew=!l;l=l||{id:uid('loc')};
  openModal(`${mHead(isNew?'Nuevo lugar de atención':'Editar lugar')}<form data-form="loc" data-id="${esc(l.id)}"><div class="mb"><div class="fgrid">
  <label class="f full">Nombre<input type="text" id="lo_nom" name="nombre" value="${esc(l.nombre)}" placeholder="Consultorio Centro, Clínica…" required></label>
  <label class="f">Dirección<input type="text" id="lo_dir" name="direccion" value="${esc(l.direccion)}"></label><label class="f">Ciudad<input type="text" id="lo_ciu" name="ciudad" value="${esc(l.ciudad)}"></label>
  <label class="f">Teléfono<input type="tel" id="lo_tel" name="telefono" value="${esc(l.telefono)}"></label><label class="f">Notas (piso, cómo llegar)<input type="text" id="lo_not" name="notas" value="${esc(l.notas)}"></label>
  </div></div><div class="mf">${!isNew?`<button type="button" class="btn danger" data-a="askDel" data-col="locations" data-id="${esc(l.id)}">Eliminar</button><span class="grow"></span>`:''}<button type="button" class="btn ghost" data-a="close">Cancelar</button><button type="submit" class="btn primary">Guardar</button></div></form>`);
}
function mWa(phone,msg,apptId,pacName_){
  const tel=waPhone(phone);
  openModal(`${mHead('Enviar por WhatsApp')}<div class="mb">
  <label class="f">Para ${esc(pacName_||'')}<input type="tel" id="waTel" value="${esc(phone||'')}" placeholder="342 155 123456"></label>
  <label class="f">Mensaje<textarea id="waMsg" rows="7">${esc(msg)}</textarea></label>
  ${apptId&&!(cfg().waTemplate||'').includes('{calendario}')?`<label class="row small" style="gap:8px"><input type="checkbox" id="waCal" data-id="${esc(apptId)}" checked> Incluir link para agendar en Google Calendar</label>`:''}
  <div class="wa-preview"><div class="wa-bubble" id="waBub">${esc(msg)}</div></div>
  <p class="small muted" style="margin:0" id="waHint">${tel?'Se abre WhatsApp con el mensaje listo; solo tenés que tocar enviar.':'Cargá un número de celular para poder enviar.'}</p>
  </div><div class="mf"><button class="btn ghost" data-a="copyWa">Copiar mensaje</button><span class="grow"></span>${apptId?`<button class="btn" data-a="mailAppt" data-id="${esc(apptId)}" data-fromwa="1">${I.mail}Mail</button>`:''}<a class="btn wa" id="waGo" data-appt="${esc(apptId||'')}" target="_blank" rel="noopener" href="${tel?`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`:'#'}">${I.wa}Abrir WhatsApp</a></div>`);
}
function mConfirm(col,id){
  const what={appointments:'este turno',patients:'este paciente y su ficha',sessions:'esta sesión',payments:'este pago',professionals:'este profesional',locations:'este lugar'}[col];
  const extra=col==='patients'?' También se borran sus turnos, sesiones y pagos.':'';
  openModal(`${mHead('¿Eliminar?')}<div class="mb"><p style="margin:0">Vas a eliminar ${what}.${extra} Esta acción no se puede deshacer.</p></div><div class="mf"><button class="btn ghost" data-a="close">Cancelar</button><button class="btn primary" style="background:var(--bad);border-color:var(--bad)" data-a="doDel" data-col="${col}" data-id="${esc(id)}">Eliminar</button></div>`);
}

/* ---------- eventos ---------- */
document.addEventListener('click',async e=>{
  const t=e.target.closest('[data-a]');
  if(!t){if(e.target.id==='modal')closeModal();return}
  const a=t.dataset.a,id=t.dataset.id;
  switch(a){
    case 'tabsScroll':{const tb=t.parentElement.querySelector('.tabs');tb.scrollBy({left:(+t.dataset.d)*Math.max(120,tb.clientWidth*0.6),behavior:'smooth'});break}
    case 'nav':closeModal();S.view=t.dataset.v;window.scrollTo(0,0);render();break;
    case 'prev':case 'next':{const n=S.calMode==='dia'?1:7;S.date=addDays(S.date,a==='prev'?-n:n);render();break}
    case 'hoy':S.date=today();render();break;
    case 'mode':S.calMode=t.dataset.m;render();break;
    case 'slot':{if(e.target!==t)return;const r=t.getBoundingClientRect();const m=Math.round(((e.clientY-r.top)/1.8+(+t.dataset.h0))/15)*15;mAppt(null,{fecha:t.dataset.date,hora:fromMin(m),profesionalId:t.dataset.pro||S.fPro||(pros()[0]||{}).id||''});break}
    case 'newAppt':mAppt(null,t.dataset.pac?{pacienteId:t.dataset.pac}:null);break;
    case 'appt':{const x=get('appointments',id);if(x)mApptView(x);break}
    case 'editAppt':mAppt(get('appointments',id));break;
    case 'setEst':{const x=get('appointments',id);if(x){await save('appointments',{...x,estado:t.dataset.e});mApptView(get('appointments',id));toast('Estado actualizado')}break}
    case 'waAppt':{const x=get('appointments',id),p=x&&get('patients',x.pacienteId);if(x)mWa(p&&p.telefono,msgTurno(x),x.id,pacName(p));break}
    case 'waAll':{const p=get('patients',t.dataset.pac);mWa(p.telefono,msgProximos(p.id),'',pacName(p));break}
    case 'gev':{const g=(ST.gcal.events||[]).find(x=>x.id===id);if(g)mGev(g);break}
    case 'gevNew':{const g=(ST.gcal.events||[]).find(x=>x.id===id);closeModal();if(g)mAppt(null,{fecha:g.fecha,hora:g.hora,duracion:+g.duracion||cfg().duracion,...(g.profesionalId?{profesionalId:g.profesionalId}:{})});break}
    case 'toggleG':{S.showG=!S.showG;LS.set('showG',S.showG);render();break}
    case 'gcfgDel':{if(S.gcfgSure!==id){S.gcfgSure=id;render();break}S.gcfgSure='';await gcfgCall({remove:id});break}
    case 'gcfgRefresh':{S.gcfgBusy=true;render();await gcfgCall(null,true);break}
    case 'gcalCopy':{try{await navigator.clipboard.writeText(S.gcal);toast('Enlace copiado')}catch(err){const i=$('#gcalUrl');i.focus();i.select();toast('Seleccioné el enlace: copialo con Ctrl+C')}break}
    case 'gcalNew':{if(!S.gcalSure){S.gcalSure=true;render();break}await gcalLoad(true);break}
    case 'gcalRetry':{S.gcal=undefined;S.gcalErr='';render();break}
    case 'copyWa':{const txt=$('#waMsg').value;try{await navigator.clipboard.writeText(txt);toast('Mensaje copiado')}catch(err){$('#waMsg').select();toast('Seleccioné el texto: copialo con Ctrl+C')}break}
    case 'close':closeModal();break;
    case 'paleta':temaSet('paleta',t.dataset.p);break;
    case 'tmodo':temaSet('modo',t.dataset.m);break;
    case 'mailAppt':{const x=get('appointments',id),p=x&&get('patients',x.pacienteId);if(!x)break;
      const body=t.dataset.fromwa&&$('#waMsg')?$('#waMsg').value:msgTurno(x);
      if(!(p&&p.email))toast('El paciente no tiene email cargado: escribilo en el mail que se abre.');
      const u=mailLink(p&&p.email,`Turno ${cap(fLarga(x.fecha))} ${x.hora} hs`,body);
      if(u.startsWith('mailto:'))location.href=u;else{const l=document.createElement('a');l.href=u;l.target='_blank';l.rel='noopener';document.body.appendChild(l);l.click();l.remove()}break}
    case 'openAtt':openAtt(id);break;
    case 'rmAtt':{const i=PEND.add.findIndex(x=>x.meta.id===id);if(i>=0)PEND.add.splice(i,1);else PEND.rm.add(id);renderPendAtts();break}
    case 'closeViewer':{const v=$('#viewer');if(v)v.remove();break}
    case 'openPac':closeModal();S.pacId=id;S.pacTab='datos';S.view='paciente';window.scrollTo(0,0);render();break;
    case 'newPac':mPac();break;
    case 'editPac':mPac(get('patients',id));break;
    case 'pacTab':S.pacTab=t.dataset.t;render();break;
    case 'newSes':mSes(null,t.dataset.pac,t.dataset.tur);break;
    case 'editSes':{const s=get('sessions',id);if(s)mSes(s);break}
    case 'newPay':mPay(null,t.dataset.pac?{pacienteId:t.dataset.pac}:null);break;
    case 'editPay':mPay(get('payments',id));break;
    case 'payAppt':{const x=get('appointments',id);if(x)mPay(null,{pacienteId:x.pacienteId,turnoId:x.id,profesionalId:x.profesionalId,monto:x.monto,concepto:x.motivo||'Consulta',fecha:today()});break}
    case 'mPrev':case 'mNext':{let[y,m]=S.payMonth.split('-').map(Number);m+=a==='mPrev'?-1:1;if(m<1){m=12;y--}if(m>12){m=1;y++}S.payMonth=`${y}-${pad(m)}`;render();break}
    case 'cfgTab':S.cfgTab=t.dataset.t;if(S.cfgTab==='usuarios')loadUsers();if(S.cfgTab==='registro')loadAudit();render();break;
    case 'newPro':mPro();break; case 'editPro':mPro(get('professionals',id));break;
    case 'newLoc':mLoc();break; case 'editLoc':mLoc(get('locations',id));break;
    case 'pickColor':{const f=t.closest('form');f.querySelectorAll('[data-a=pickColor]').forEach(s=>s.style.outline='none');t.style.outline='2px solid var(--ink)';break}
    case 'delMet':{const c=cfg();const m=[...c.metodos];m.splice(+t.dataset.i,1);await save('config',{...c,id:'main',metodos:m});break}
    case 'askDel':mConfirm(t.dataset.col,id);break;
    case 'doDel':{const col=t.dataset.col;closeModal();
      if(col==='sessions')for(const x of sesAtts(id))await del('attachments',x.id);
      if(col==='patients'){for(const c of ['appointments','sessions','payments','attachments'])for(const x of list(c).filter(x=>x.pacienteId===id))await del(c,x.id);S.view='pacientes'}
      await del(col,id);toast('Eliminado');break}
    case 'backup':backup();break;
    case 'syncNow':if(ST.mode==='server'){scheduleSync(0);toast('Sincronizando…')}break;
    case 'chooseLan':case 'localToLan':{
      try{const info=await window.agendaDesktop.startLan();S.lan=info;
        if(a==='localToLan'&&ST.idb){const rows=await idbAll('docs');await idbPutMany('outbox',rows.map(r=>({k:r.k,col:r.col,doc:r.doc})));ST.pending=rows.length}
        ST.mode='server';ST.server=info.local;ST.token='';ST.since=0;LS.set('mode','server');LS.set('server',ST.server);LS.del('token');LS.set('since',0);
        const j=await api('/api/status');S.screen=j.needsSetup?'setup':'login';S.cfgTab='conexion';render()}
      catch(err){toast('No se pudo activar el modo compartido: '+(err.message||err),'err')}
      break}
    case 'chooseLocal':ST.mode='local';LS.set('mode','local');S.screen=null;await loadFromDevice();await seedBase();render();break;
    case 'resetMode':ST.mode='';LS.del('mode');S.screen='mode';render();break;
    case 'logout':openModal(`${mHead('¿Cerrar sesión?')}<div class="mb"><p style="margin:0">${ST.pending?`<b>Hay ${ST.pending} cambios que todavía no se subieron al servidor y se van a perder.</b> Conectate a internet y sincronizá antes de salir. `:''}Al cerrar sesión se borra la copia de los datos guardada en este equipo.</p></div><div class="mf"><button class="btn ghost" data-a="close">Cancelar</button><button class="btn primary" data-a="doLogout">Cerrar sesión</button></div>`);break;
    case 'doLogout':{closeModal();if(ES){ES.close();ES=null}try{await api('/api/logout',{})}catch(e){}ST.token='';ST.user=null;ST.since=0;ST.pending=0;['token','user','since','lastSync'].forEach(k=>LS.del(k));if(ST.idb){await idbClear('docs');await idbClear('outbox')}COLS.forEach(c=>S.data[c]={});S.gcal=undefined;S.gcalErr='';S.gcfg=undefined;ST.gcal={ver:'',events:[]};LS.del('gcal');S.screen='login';S.view='agenda';render();break}
    case 'chgPass':openModal(`${mHead('Cambiar mi contraseña')}<form data-form="chgPass"><div class="mb"><label class="f">Contraseña actual<input type="password" id="cp_a" name="actual" required autocomplete="current-password"></label><label class="f">Nueva contraseña (mínimo 8)<input type="password" id="cp_n" name="nueva" minlength="8" required autocomplete="new-password"></label></div><div class="mf"><button type="button" class="btn ghost" data-a="close">Cancelar</button><button class="btn primary" type="submit">Guardar</button></div></form>`);break;
    case 'newUser':mUser();break;
    case 'editUser':mUser((S.users||[]).find(u=>u.id===id));break;
    case 'csv':csv();break;
    case 'clearDemo':{const n=COLS.reduce((n,col)=>n+list(col).filter(x=>x.ejemplo).length,0);toast(`Borrando ${n} registros de ejemplo…`);for(const col of COLS)for(const x of list(col).filter(x=>x.ejemplo))await del(col,x.id);toast('Datos de ejemplo borrados');break}
  }
});
document.addEventListener('click',e=>{const g=e.target.closest('#waGo');if(!g)return;if(g.getAttribute('href')==='#'){e.preventDefault();toast('Falta el número de celular','err');return}
  const id=g.dataset.appt;if(id){const x=get('appointments',id);if(x)save('appointments',{...x,notificado:new Date().toISOString()})}setTimeout(closeModal,300)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const v=$('#viewer');if(v)v.remove();else closeModal()}});
document.addEventListener('input',e=>{
  const t=e.target;const af=t.closest&&t.closest('form[data-auto]');
  if(af&&t.id){draftInput(af,t);if(t.id==='waTpl')waPreview();return}
  if(t.id==='pacQ'){S.q=t.value;render()}
  else if(t.id==='apPacQ'){const q=norm(t.value);const sel=$('#apPac');[...sel.options].forEach(o=>{o.hidden=o.value!=='__new'&&!!q&&!norm(o.text).includes(q)});const vis=[...sel.options].filter(o=>!o.hidden&&o.value!=='__new');if(vis.length===1)sel.value=vis[0].value;$('#apNewPac').hidden=sel.value!=='__new'}
  else if(t.id==='waMsg'||t.id==='waTel'){const msg=$('#waMsg').value,tel=waPhone($('#waTel').value);$('#waBub').textContent=msg;$('#waGo').href=tel?`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`:'#';$('#waHint').textContent=tel?'Se abre WhatsApp con el mensaje listo; solo tenés que tocar enviar.':'Cargá un número de celular para poder enviar.'}
  else if(['apFecha','apHora','apDur'].includes(t.id))checkOverlap();
});
document.addEventListener('change',async e=>{
  const t=e.target;
  if(t.id==='agDate'&&t.value){S.date=t.value;render()}
  else if(t.id==='fPro'){S.fPro=t.value;render()}
  else if(t.dataset&&t.dataset.gfeed){await gcfgCall({id:t.dataset.gfeed,profesionalId:t.value});toast('Guardado')}
  else if(t.id==='fLoc'){S.fLoc=t.value;render()}
  else if(t.id==='payMonth'&&t.value){S.payMonth=t.value;render()}
  else if(t.id==='payMet'){S.payMet=t.value;render()}
  else if(t.id==='payPro'){S.payPro=t.value;render()}
  else if(t.id==='apPac'){$('#apNewPac').hidden=t.value!=='__new'}
  else if(t.id==='apPro')checkOverlap();
  else if(t.id==='restoreFile'&&t.files[0])restore(t.files[0]);
  else if((t.id==='seFile'||t.id==='seScan')&&t.files.length){await addFiles([...t.files],t.id==='seScan');t.value=''}
  else if(t.id==='waCal'){const x=get('appointments',t.dataset.id);const m=$('#waMsg');if(x&&m){const line=calLine(x);m.value=t.checked?(m.value.includes(line)?m.value:m.value+line):m.value.replace(line,'');m.dispatchEvent(new Event('input',{bubbles:true}))}}
});
document.addEventListener('submit',async e=>{
  const f=e.target,k=f.dataset.form;if(!k)return;e.preventDefault();
  const d=formData(f),id=f.dataset.id;
  if(k==='chooseServer'||k==='toServer'){
    let url=d.url.replace(/\/+$/,'');if(!/^https?:\/\//.test(url))url='https://'+url;
    try{const r=await fetch(url+'/api/status');const j=await r.json();if(j.app!=='agenda-dra-paulina-lopez')throw 0;
      if(k==='toServer'&&ST.idb){const rows=await idbAll('docs');await idbPutMany('outbox',rows.map(r=>({k:r.k,col:r.col,doc:r.doc})));ST.pending=rows.length}
      ST.mode='server';ST.server=url;LS.set('mode','server');LS.set('server',url);S.screen=j.needsSetup?'setup':'login';closeModal();render()}
    catch(err){toast('No se encontró la agenda en esa dirección. Revisala e intentá de nuevo.','err')}
    return;
  }
  if(k==='setup'||k==='login'){
    try{const j=await api(k==='setup'?'/api/setup':'/api/login',d);ST.token=j.token;ST.user=j.user;LS.set('token',j.token);LS.set('user',j.user);
      if(ST.user.rol==='secretaria'||(window.agendaDesktop&&k==='setup')){S.cfgTab='conexion';if(window.agendaDesktop&&k==='setup')S.view='config'}
      S.screen=null;if(ST.idb)await loadFromDevice();render();await sync();connectLive();toast(`¡Hola ${ST.user.nombre}!`)}
    catch(err){toast(err.status?err.message:'No hay conexión con el servidor.','err')}
    return;
  }
  if(k==='chgPass'){try{await api('/api/me/password',d);closeModal();toast('Contraseña actualizada')}catch(err){toast(err.status?err.message:'Necesitás conexión para cambiar la contraseña.','err')}return}
  if(k==='user'){
    const body={nombre:d.nombre,rol:d.rol};if(d.password)body.password=d.password;
    try{if(id){body.activo=!!d.activo;await api('/api/users/'+id,body,'PATCH')}else{body.email=d.email;await api('/api/users',body)}closeModal();toast('Usuario guardado');loadUsers()}
    catch(err){toast(err.status?err.message:'Necesitás conexión para administrar usuarios.','err')}
    return;
  }
  if(k==='gcfg'){
    if(!d.url){toast('Pegá la dirección secreta en formato iCal','err');return}
    const btn=f.querySelector('[type=submit]');if(btn){btn.disabled=true;btn.textContent='Conectando…'}
    const ok=await gcfgCall({url:d.url,profesionalId:d.profesionalId||''});
    if(ok){toast('Calendario de Google conectado');scheduleSync(0)}else if(btn){btn.disabled=false;btn.textContent='Conectar'}
    return;
  }
  if(k==='appt'){
    let pid=d.pacienteId;
    if(!pid){toast('Elegí un paciente o cargá uno nuevo','err');return}
    if(pid==='__new'){if(!d.np_nombre||!d.np_apellido){toast('Completá nombre y apellido del paciente nuevo','err');return}
      const np=await save('patients',{id:uid('pac'),nombre:d.np_nombre,apellido:d.np_apellido,telefono:d.np_tel,hc:{}});pid=np.id}
    const old=get('appointments',id)||{};
    const x=await save('appointments',{...old,id,pacienteId:pid,fecha:d.fecha,hora:d.hora,duracion:+d.duracion||30,profesionalId:d.profesionalId,lugarId:d.lugarId,estado:d.estado,motivo:d.motivo,monto:d.monto===''?'':+d.monto,notas:d.notas});
    S.date=d.fecha;closeModal();render();toast('Turno guardado');
    if(e.submitter&&e.submitter.value==='wa'){const p=get('patients',pid);mWa(p&&p.telefono,msgTurno(x),x.id,pacName(p))}
  }else if(k==='pac'){
    const old=get('patients',id)||{hc:{}};
    await save('patients',{...old,...d,id});closeModal();
    if(f.dataset.new){S.pacId=id;S.pacTab='datos';S.view='paciente';render()}toast('Ficha guardada');
  }else if(k==='hc'){
    const dk=draftKey(f);if(DRAFT[dk]){clearTimeout(DRAFT[dk].timer);delete DRAFT[dk]}
    const p=get('patients',f.dataset.key||S.pacId);await save('patients',{...p,hc:{...(p.hc||{}),...d},hcUpdated:new Date().toISOString()});toast('Historia clínica guardada');
  }else if(k==='ses'){
    const old=get('sessions',id)||{};const tur=f.dataset.tur;
    await save('sessions',{...old,id,pacienteId:f.dataset.pac,turnoId:tur,numero:+d.numero||1,fecha:d.fecha,profesionalId:d.profesionalId,evaluacion:d.evaluacion,tratamiento:d.tratamiento,indicaciones:d.indicaciones,evolucion:d.evolucion,proximo:d.proximo});
    if(d.marcar&&tur){const t=get('appointments',tur);if(t&&t.estado!=='atendido')await save('appointments',{...t,estado:'atendido'})}
    if(PEND.ses===id)await commitAtts(id,f.dataset.pac);
    closeModal();render();toast('Sesión guardada');
  }else if(k==='pay'){
    const old=get('payments',id)||{};
    await save('payments',{...old,id,turnoId:f.dataset.tur||old.turnoId||'',pacienteId:d.pacienteId,fecha:d.fecha,monto:+d.monto||0,metodo:d.metodo,estado:d.estado,profesionalId:d.profesionalId,concepto:d.concepto,nota:d.nota});
    closeModal();toast('Pago registrado');
  }else if(k==='pro'){
    const old=get('professionals',id)||{};
    await save('professionals',{...old,id,nombre:d.nombre,especialidad:d.especialidad,matricula:d.matricula,telefono:d.telefono,color:d.color||old.color||COLORS[0],activo:!!d.activo});closeModal();toast('Profesional guardado');
  }else if(k==='loc'){
    const old=get('locations',id)||{};await save('locations',{...old,id,...d});closeModal();toast('Lugar guardado');
  }else if(k==='addMet'){
    const c=cfg();if(d.m&&!c.metodos.includes(d.m)){await save('config',{...c,id:'main',metodos:[...c.metodos,d.m]})}
  }else if(k==='wa'){
    const dk=draftKey(f);if(DRAFT[dk]){clearTimeout(DRAFT[dk].timer);delete DRAFT[dk]}
    await save('config',{...cfg(),id:'main',waTemplate:d.t});toast('Mensaje guardado');
  }else if(k==='agcfg'){
    await save('config',{...cfg(),id:'main',horaInicio:d.horaInicio,horaFin:d.horaFin,duracion:+d.duracion||30});toast('Horario guardado');
  }
});

/* ---------- copias ---------- */
function offerFile(filename,text,type){
  try{const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);toast('Archivo descargado')}
  catch(e){toast('No se pudo descargar el archivo','err')}
}
function backup(){const out={app:'agenda-dra-paulina-lopez',version:1,exportado:new Date().toISOString(),data:{}};COLS.forEach(c=>out.data[c]=list(c));offerFile(`agenda-copia-${today()}.json`,JSON.stringify(out,null,1),'application/json')}
function csv(){
  const rows=list('payments').filter(x=>x.fecha.slice(0,7)===S.payMonth).sort((a,b)=>a.fecha.localeCompare(b.fecha));
  const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  const lines=[['Fecha','Paciente','DNI','Concepto','Profesional','Método','Monto','Estado','Nota'].join(';'),...rows.map(x=>{const p=get('patients',x.pacienteId)||{};return [fCorta(x.fecha),pacName(p),p.dni,x.concepto,(get('professionals',x.profesionalId)||{}).nombre,x.metodo,x.monto,x.estado,x.nota].map(q).join(';')})];
  offerFile(`pagos-${S.payMonth}.csv`,'﻿'+lines.join('\n'),'text/csv');
}
async function restore(file){
  try{const j=JSON.parse(await file.text());if(!j.data)throw 0;let n=0;
    toast('Restaurando…');for(const c of COLS)for(const o of (j.data[c]||[])){if(o&&o.id){await save(c,o);n++}}toast(`Se restauraron ${n} registros`)}
  catch(e){toast('El archivo no es una copia válida de la agenda','err')}
}

/* ---------- usuarios y registro (solo administración, modo servidor) ---------- */
async function loadUsers(){try{S.users=(await api('/api/users')).users;render()}catch(e){S.users=null;toast(e.status?e.message:'Necesitás conexión para ver los usuarios','err')}}
async function loadAudit(){try{S.audit=(await api('/api/audit')).audit;render()}catch(e){S.audit=null;toast(e.status?e.message:'Necesitás conexión para ver el registro','err')}}
function vUsers(){
  if(!S.users)return `<div class="panel empty">Cargando usuarios…</div>`;
  const R={admin:'Administración',medico:'Profesional',secretaria:'Secretaría'};
  return `<div class="row" style="justify-content:space-between"><p class="small muted" style="margin:0;max-width:60ch">Profesional ve y edita todo menos los usuarios. Secretaría maneja agenda, pacientes y pagos, pero no ve la historia clínica ni las sesiones.</p><button class="btn primary" data-a="newUser">${I.plus}Nuevo usuario</button></div>
  <div class="panel"><div class="list">${S.users.map(u=>`<div class="li"><div class="main"><b>${esc(u.nombre)}${u.activo?'':' <span class="pill cancelado">Desactivado</span>'}</b><span class="small muted">${esc(u.email)} · ${R[u.rol]||u.rol}</span></div><button class="btn sm" data-a="editUser" data-id="${esc(u.id)}">${I.edit}Editar</button></div>`).join('')}</div></div>`;
}
function vAudit(){
  if(!S.audit)return `<div class="panel empty">Cargando registro…</div>`;
  const C={patients:'paciente',appointments:'turno',sessions:'sesión',payments:'pago',professionals:'profesional',locations:'lugar',config:'configuración',users:'usuario'};
  const name=(col,id)=>{if(col==='patients')return pacName(get('patients',id));if(col==='appointments'||col==='sessions'||col==='payments'){const x=get(col,id);return x?pacName(get('patients',x.pacienteId)):''}return ''};
  return `<p class="small muted" style="margin:0">Últimos 300 movimientos: quién creó, modificó o eliminó cada registro, e ingresos al sistema.</p><div class="panel" style="padding:6px 8px"><div class="table-wrap"><table><thead><tr><th>Fecha y hora</th><th>Usuario</th><th>Acción</th><th>Registro</th></tr></thead><tbody>
  ${S.audit.map(a=>{const d=new Date(a.ts);return `<tr><td class="num">${fCorta(ymd(d))} ${pad(d.getHours())}:${pad(d.getMinutes())}</td><td>${esc(a.nombre||'')}</td><td>${esc({login:'ingresó',setup:'creó la cuenta de administración'}[a.accion]||a.accion)}${a.col&&a.col!=='users'?' '+esc(C[a.col]||a.col):''}</td><td>${esc(name(a.col,a.docId)||a.detalle||'')}</td></tr>`}).join('')}
  </tbody></table></div></div>`;
}
function mUser(u){
  const isNew=!u;u=u||{rol:'secretaria',activo:true};
  openModal(`${mHead(isNew?'Nuevo usuario':'Editar usuario')}<form data-form="user" data-id="${esc(u.id||'')}"><div class="mb"><div class="fgrid">
  <label class="f full">Nombre<input type="text" id="us_nom" name="nombre" value="${esc(u.nombre)}" required></label>
  <label class="f">Email<input type="email" id="us_mail" name="email" value="${esc(u.email)}" ${isNew?'required':'disabled'}></label>
  <label class="f">Rol<select id="us_rol" name="rol">${opt('admin','Administración',u.rol==='admin')}${opt('medico','Profesional',u.rol==='medico')}${opt('secretaria','Secretaría',u.rol==='secretaria')}</select></label>
  <label class="f">${isNew?'Contraseña (mínimo 8)':'Nueva contraseña (dejar vacío para no cambiarla)'}<input type="password" id="us_pass" name="password" ${isNew?'required minlength="8"':''} autocomplete="new-password"></label>
  ${!isNew?`<label class="row small" style="gap:8px"><input type="checkbox" id="us_act" name="activo" ${u.activo?'checked':''}> Usuario activo</label>`:''}
  </div></div><div class="mf"><button type="button" class="btn ghost" data-a="close">Cancelar</button><button type="submit" class="btn primary">Guardar</button></div></form>`);
}
function lanPanel(){
  if(!window.agendaDesktop)return '';
  const L=S.lan;
  if(L===undefined){window.agendaDesktop.lanInfo().then(x=>{S.lan=x;render()}).catch(()=>{S.lan=null});return ''}
  if(!L)return '';
  return `<div class="panel"><h3>Usar en el celular</h3><div class="row" style="align-items:flex-start;gap:20px">${L.qr?`<img src="${L.qr}" alt="Código QR con la dirección de la agenda" width="180" height="180" style="border-radius:12px">`:''}
    <div style="flex:1;min-width:220px;display:flex;flex-direction:column;gap:8px"><ol style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px">
    <li>Conectá el celular al <b>mismo WiFi</b> que esta computadora.</li>
    <li>Escaneá el código con la cámara o escribí en el navegador:<br><b class="num" style="font-size:1.1rem;user-select:all">${esc(L.urls[0]?L.urls[0].url:'(sin red WiFi)')}</b></li>
    <li>Ingresá con tu usuario. En Android: menú ⋮ › <i>Agregar a pantalla de inicio</i>. En iPhone: Compartir › <i>Agregar a inicio</i>.</li></ol>
    ${L.urls.length>1?`<p class="small muted" style="margin:0">Otras direcciones de esta compu: ${L.urls.slice(1).map(u=>esc(u.url)).join(' · ')}</p>`:''}
    <p class="small muted" style="margin:0">Esta computadora tiene que estar prendida con la agenda abierta para que el celular funcione. Si Windows pregunta por el firewall, tocá <i>Permitir</i> en redes privadas.</p></div></div></div>`;
}
function vConexion(){
  if(ST.mode==='local')return `<div class="panel"><h3>Modo: solo en este equipo</h3><p>Los datos se guardan en esta computadora o navegador y funcionan sin internet. Hacé copias de seguridad seguido.</p>
    ${window.agendaDesktop?`<p><button class="btn primary" data-a="localToLan">Compartir con el celular por WiFi</button></p><p class="small muted">Lo que ya cargaste se pasa al modo compartido y vas a crear un usuario y contraseña.</p>`:''}
    <p class="small muted">Si más adelante tienen un servidor, podés conectar este equipo: todo lo que cargaste se sube automáticamente.</p>
    <form class="row" data-form="toServer"><input type="text" id="tsUrl" name="url" placeholder="https://agenda.midominio.com" style="max-width:360px" required><button class="btn primary" type="submit">Conectar y subir datos</button></form></div>`;
  return `<div class="panel"><h3>Conectada al servidor</h3><dl class="kv">${kv('Servidor',ST.server)}${kv('Usuario',ST.user&&`${ST.user.nombre} (${ST.user.email})`)}${kv('Última sincronización',ST.lastSync?new Date(ST.lastSync).toLocaleString('es-AR'):'')}${kv('Cambios por subir',String(ST.pending))}</dl>
    <p class="small muted">La agenda funciona aunque no haya internet: los cambios quedan guardados en este equipo y se suben solos cuando vuelve la conexión.</p>
    <div class="row"><button class="btn" data-a="syncNow">Sincronizar ahora</button>${window.agendaDesktop?`<button class="btn" data-a="resetMode">Cambiar modo de uso</button>`:''}<button class="btn" data-a="chgPass">Cambiar mi contraseña</button><button class="btn danger" data-a="logout">Cerrar sesión</button></div></div>${/localhost|127\.0\.0\.1/.test(ST.server)?lanPanel():''}`;
}

/* ---------- ver la agenda en Google Calendar: enlace de calendario de solo lectura (va de la plataforma a Google, nunca al revés) ---------- */
const privHost=u=>{try{const h=new URL(u).hostname;return /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)|\.local$/.test(h)}catch(e){return true}};
async function gcalLoad(nuevo){
  try{const j=await api(nuevo?'/api/calendario/nuevo':'/api/calendario',nuevo?{}:null);S.gcal=ST.server.replace(/\/$/,'')+j.path;if(nuevo)toast('Enlace nuevo listo. El anterior dejó de funcionar.')}
  catch(e){S.gcal='';S.gcalErr=e.message||'No se pudo obtener el enlace.'}
  S.gcalSure=false;render();
}
function vGcal(){return `<p class="muted" style="margin:0 0 14px">La agenda y Google Calendar se pueden ver juntas en los dos lugares. Son dos conexiones: activá las dos para que todo aparezca en ambos.</p>`+vGcalIn()+vGcalOut()}
async function gcfgCall(body,refresh){
  try{S.gcfg=await api(refresh?'/api/gcal-refresh':'/api/gcal-config',body||(refresh?{}:null));S.gcfgErr='';if(body||refresh)scheduleSync(0);S.gcfgBusy=false;render();return true}
  catch(e){S.gcfgBusy=false;if(body){toast(e.message||'No se pudo conectar','err')}else{S.gcfgErr=e.message||'No se pudo cargar'}render();return false}
}
const hace=iso=>{if(!iso)return '';const m=Math.round((Date.now()-Date.parse(iso))/60000);return m<1?'recién':m<60?`hace ${m} min`:m<1440?`hace ${Math.round(m/60)} h`:new Date(iso).toLocaleString('es-AR')};
function vGcalIn(){
  const h3=`<h3>1. De Google Calendar a la agenda</h3><p class="small muted" style="margin-top:-6px">Tus eventos de Google Calendar aparecen en la agenda en gris, para que no des turnos encima. Se actualizan solos cada 10 minutos y se modifican desde Google.</p>`;
  if(ST.mode!=='server')return `<div class="panel">${h3}<p>Para esto la agenda tiene que estar conectada a un servidor (la versión web o el modo compartido por WiFi).</p></div>`;
  if(S.gcfg===undefined){S.gcfg=null;gcfgCall()}
  if(!S.gcfg)return `<div class="panel">${h3}<p class="${S.gcfgErr?'':'muted'}">${esc(S.gcfgErr||'Cargando…')}</p></div>`;
  const proSel=(sel,attrs)=>`<select ${attrs}>${opt('','De todos (se ve en todas las columnas)',!sel)}${pros().map(p=>opt(p.id,'De '+p.nombre,sel===p.id)).join('')}</select>`;
  const feeds=S.gcfg.feeds.map(f=>`<div class="li gfeed"><span class="gdot ${f.ok===false?'bad':''}"></span><div class="main"><b>${f.ok===false?'No se pudo actualizar':'Conectado'}</b><span class="small muted">${f.ok===false?esc(f.error||'')+(f.lastOk?' · Última vez bien: '+hace(f.lastOk):''):`${f.count||0} eventos · actualizado ${hace(f.at)}`}</span><span class="small muted gurl">${esc(f.url)}</span></div>
    ${pros().length>1?proSel(f.profesionalId,`class="sel-inline" data-gfeed="${esc(f.id)}" aria-label="Profesional del calendario"`):''}
    <button class="btn sm ${S.gcfgSure===f.id?'danger':''}" data-a="gcfgDel" data-id="${esc(f.id)}">${S.gcfgSure===f.id?'¿Seguro? Tocá de nuevo':'Quitar'}</button></div>`).join('');
  return `<div class="panel">${h3}
    ${feeds?`<div class="list">${feeds}</div><div class="row" style="margin-top:10px"><button class="btn sm" data-a="gcfgRefresh" ${S.gcfgBusy?'disabled':''}>${S.gcfgBusy?'Actualizando…':'Actualizar ahora'}</button></div>`:''}
    <details class="gsteps" ${feeds?'':'open'}><summary>${feeds?'Conectar otro calendario':'Cómo conectarlo'}</summary>
    <ol class="steps"><li>Abrí <b>Google Calendar</b> en la computadora.</li><li>Arriba a la derecha tocá el engranaje <b>⚙ › Configuración</b>.</li><li>A la izquierda, en <b>Configuración de mis calendarios</b>, tocá tu calendario (el que tiene tu nombre).</li><li>Bajá hasta <b>Integrar el calendario</b> y copiá la <b>Dirección secreta en formato iCal</b>.</li><li>Pegala acá abajo y tocá <b>Conectar</b>.</li></ol>
    <form class="gform" data-form="gcfg"><label class="f">Dirección secreta en formato iCal<input type="url" name="url" id="gcfgUrl" placeholder="https://calendar.google.com/calendar/ical/…/basic.ics" autocomplete="off" required></label>
    ${pros().length>1?`<label class="f">¿De quién es este calendario?${proSel('','name="profesionalId" id="gcfgPro"')}</label>`:''}
    <div class="row" style="justify-content:flex-end"><button class="btn primary" type="submit">Conectar</button></div></form>
    <p class="small muted">Esa dirección es privada: no la compartas. La secretaría ve estos eventos como "Ocupado", sin el título.</p></details></div>`;
}
function vGcalOut(){
  const intro=`<p class="small muted" style="margin-top:-6px">Los turnos de la plataforma aparecen en tu Google Calendar como un calendario aparte. Los eventos que vinieron de Google no se duplican.</p>`;
  if(ST.mode!=='server')return `<div class="panel"><h3>2. De la agenda a Google Calendar</h3>${intro}<p>Para esto la agenda tiene que estar en el servidor de internet (la versión web). En el modo "solo en este equipo" Google no puede leer los turnos.</p></div>`;
  if(privHost(ST.server))return `<div class="panel"><h3>2. De la agenda a Google Calendar</h3>${intro}<p>Este equipo está conectado a un servidor de la red de tu casa o consultorio (${esc(ST.server)}), y Google no puede entrar ahí. Activalo desde la versión web publicada en internet.</p></div>`;
  if(S.gcal===undefined){S.gcal=null;gcalLoad(false)}
  if(!S.gcal)return `<div class="panel"><h3>2. De la agenda a Google Calendar</h3>${intro}<p class="${S.gcalErr?'':'muted'}">${esc(S.gcalErr||'Preparando tu enlace…')}</p>${S.gcalErr?'<button class="btn" data-a="gcalRetry">Reintentar</button>':''}</div>`;
  const add='https://calendar.google.com/calendar/render?cid='+encodeURIComponent(S.gcal.replace(/^https?:/,'webcal:'));
  return `<div class="panel"><h3>2. De la agenda a Google Calendar</h3>${intro}
    <ol class="steps"><li>Desde la computadora, con la cuenta de Gmail donde querés ver los turnos, tocá <b>Agregar a Google Calendar</b>.</li><li>En Google Calendar confirmá con <b>Agregar</b>.</li><li>Listo: aparece el calendario <b>Agenda Dra Paulina Lopez</b>, también en la app de Google Calendar del celular.</li></ol>
    <div class="row" style="margin-top:12px"><a class="btn primary" href="${esc(add)}" target="_blank" rel="noopener">${I.cal||''}Agregar a Google Calendar</a><button class="btn" data-a="gcalCopy">Copiar enlace</button></div>
    <label class="f" style="margin-top:14px">Enlace del calendario<input type="text" id="gcalUrl" value="${esc(S.gcal)}" readonly></label>
    <p class="small muted">Si el botón no funciona: en Google Calendar andá a <b>Otros calendarios › + › Desde URL</b>, pegá el enlace y tocá <b>Agregar calendario</b>.</p>
    <p class="small muted">Google actualiza este calendario solo, cada algunas horas (no es al instante). Se ven los turnos de los últimos 3 meses en adelante, sin los cancelados.</p></div>
  <div class="panel"><h3>Privacidad</h3><p class="small muted" style="margin-top:-6px">El enlace es privado: quien lo tenga puede ver los turnos. Si lo compartiste por error, generá uno nuevo; el anterior deja de funcionar y vas a tener que agregar el nuevo en Google Calendar.</p>
    <button class="btn ${S.gcalSure?'danger':''}" data-a="gcalNew">${S.gcalSure?'¿Seguro? Tocá de nuevo para generar':'Generar enlace nuevo'}</button></div>`;
}

/* ---------- inicio ---------- */
async function boot(){
  S.loading=true;render();
  try{ST.idb=await idbOpen()}catch(e){toast('Este navegador no permite guardar datos. Probá con otro.','err')}
  if(!ST.mode){
    // Si la app la sirve nuestro servidor, se conecta sola.
    if(location.protocol.startsWith('http')){
      try{const r=await fetch(location.origin+'/api/status');const j=await r.json();if(j.app==='agenda-dra-paulina-lopez'){ST.mode='server';ST.server=location.origin;LS.set('mode','server');LS.set('server',ST.server)}}catch(e){}
    }
    if(!ST.mode){S.loading=false;S.screen='mode';render();return}
  }
  if(ST.idb)await loadFromDevice();
  S.loading=false;
  if(ST.mode==='local'){await seedBase();render();return}
  if(!ST.token){
    try{const j=await api('/api/status');S.screen=j.needsSetup?'setup':'login'}catch(e){S.screen='login'}
    render();return;
  }
  render();sync();connectLive();
}
window.addEventListener('online',()=>scheduleSync(300));
window.addEventListener('offline',()=>{ST.sync='offline';renderStatus()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')scheduleSync(300);else flushDrafts()});
window.addEventListener('pagehide',flushDrafts);
setInterval(()=>scheduleSync(0),15000);
setInterval(()=>{if(S.view==='agenda'&&!$('#modal')&&!S.screen)render()},60000);
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
boot();
})();
