const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const H=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const money=n=>'$'+Math.round(n).toLocaleString('es-CL'),TODAY='2026-09-30';
const dv=n=>{let s=0,m=2;for(let x=n;x>0;x=Math.floor(x/10)){s+=x%10*m;m=m==7?2:m+1}const r=11-s%11;return r==11?'0':r==10?'K':''+r};
const fmt=n=>n.toLocaleString('es-CL')+'-'+dv(n),mask=n=>fmt(n).replace(/^[\d.]+(?=\d{3}-)/,m=>m.replace(/\d/g,'*'));
const D=s=>Date.UTC(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10)),okD=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(D(s));
const habiles=(a,b)=>{let n=0;for(let t=D(a);t<=D(b);t+=864e5){const w=new Date(t).getUTCDay();if(w&&w<6)n++}return n};
const mm=t=>+t.slice(0,2)*60+ +t.slice(3);
// ---- Datos demo ----
const EMP=[[12345678,'Ana Rojas','Analista','Operaciones',850000,'2021-03-01','Habitat','Fonasa','R-01'],[9876543,'Luis Pérez','Guardia','Seguridad',620000,'2019-08-15','Modelo','Isapre Colmena','R-02'],[15234567,'María Soto','Supervisora','Operaciones',1100000,'2018-01-10','Cuprum','Fonasa','R-01'],[11222333,'Jorge Díaz','Bodeguero','Bodega',700000,'2022-06-01','Provida','Fonasa','R-03'],[17890123,'Camila Vega','Ventas','Ventas',900000,'2023-02-20','Habitat','Isapre Banmédica','R-04']]
 .map((a,i)=>({id:i+1,r:a[0],n:a[1],cargo:a[2],cc:a[3],s:a[4],ini:a[5],afp:a[6],salud:a[7],reloj:a[8]}));
const LIC=[{f:'LM-1001',e:2,t:'Enfermedad común',d:'2026-09-23',h:'2026-09-25',est:'Aprobada'},{f:'LM-1002',e:4,t:'Accidente laboral',d:'2026-08-10',h:'2026-08-14',est:'Aprobada'},{f:'LM-1003',e:5,t:'Enfermedad común',d:'2026-07-01',h:'2026-07-03',est:'Rechazada'}];
const VAC=[{id:1,e:1,d:'2026-08-03',h:'2026-08-07',dias:5,mot:'Descanso',est:'Aprobada',by:'admin'},{id:2,e:3,d:'2026-10-12',h:'2026-10-16',dias:5,mot:'Viaje familiar',est:'Pendiente',by:'admin'}];
const WK=['2026-09-21','2026-09-22','2026-09-23','2026-09-24','2026-09-25'],MARC=[];
EMP.forEach(e=>WK.forEach((f,d)=>{if(e.id==2&&d>=2)return;const o=(e.id*7+d*3)%20-5,out=1080+((e.id+d)%3)*5,i=540+o,p=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');MARC.push({e:e.id,f,i:p(i),o:p(out)})}));
const PAR={tope_grat:209396,col_fija:45000};
const FORM=[{k:'grat',n:'Gratificación legal',t:'h',f:'min(0.25*base,tope_grat)'},{k:'col',n:'Colación',t:'h',f:'col_fija'},{k:'afp',n:'AFP',t:'d',f:'0.11*(base+grat)'},{k:'sal',n:'Salud 7%',t:'d',f:'0.07*(base+grat)'}];
let PEND=[],CLOSED=false,pid=1;
const U={admin:{r:'Administrador',p:'Admin#2026'},remu:{r:'Remuneraciones',p:'Remu#2026'},jefe:{r:'Jefe de Área',p:'Jefe#2026',cc:'Operaciones'},audit:{r:'Auditor',p:'Audit#2026'}};
const ready=(async()=>{for(const k in U){U[k].h=await H(k+U[k].p);delete U[k].p}})();
const PERM={Administrador:['ficha:w','sueldo','liq:w','doc','lic:r','lic:w','asi','asi:w','vac:w','vac:a','inf'],Remuneraciones:['sueldo','liq:w','doc','lic:r','asi','vac:a','inf'],'Jefe de Área':['asi','vac:a','inf'],Auditor:['aud','inf']};
const can=p=>!!me&&PERM[me.r].includes(p),need=p=>{if(!can(p))throw Error('Acceso denegado: su rol no tiene permiso')};
// ---- Bitácora append-only con hash encadenado ----
const LOG=[];let chain=Promise.resolve();
const log=(a,u)=>chain=chain.then(async()=>{u=u||(me&&me.u)||'-';const t=new Date().toISOString(),p=LOG.length?LOG[LOG.length-1].h:'0';LOG.push(Object.freeze({t,u,a,h:await H(p+t+u+a)}))});
// ---- Intérprete de fórmulas seguro (lista blanca, sin eval) ----
const FN={min:Math.min,max:Math.max,round:Math.round};
function ev(src,sc){if(src.length>120)throw Error('Fórmula demasiado larga');const T=[],re=/\s*(\d+\.?\d*|[a-z_]\w*|[-+*\/(),])/y;let p=0;
 while(p<src.trimEnd().length){re.lastIndex=p;const m=re.exec(src);if(!m||T.length>200)throw Error('Carácter no permitido en la fórmula');T.push(m[1]);p=re.lastIndex}
 let i=0;const pk=()=>T[i],nx=()=>T[i++];
 const E=()=>{let v=M();while(pk()=='+'||pk()=='-'){const o=nx(),r=M();v=o=='+'?v+r:v-r}return v},
 M=()=>{let v=F();while(pk()=='*'||pk()=='/'){const o=nx(),r=F();v=o=='*'?v*r:v/r}return v},
 F=()=>{const k=nx();if(k=='-')return -F();if(k=='('){const v=E();if(nx()!=')')throw Error('Falta )');return v}
  if(/^\d/.test(k))return +k;if(Object.hasOwn(FN,k)){if(nx()!='(')throw Error('Falta (');const a=[E()];while(pk()==','){nx();a.push(E())}if(nx()!=')')throw Error('Falta )');return FN[k](...a)}
  if(k&&Object.hasOwn(sc,k))return sc[k];throw Error('Identificador no permitido: '+k)};
 const v=E();if(i<T.length)throw Error('Fórmula inválida');return v}
function calc(e){const sc={base:e.s,...PAR},it=[];let net=e.s;for(const f of FORM){const v=Math.round(ev(f.f,sc));sc[f.k]=v;it.push([f.n,f.t,v]);net+=f.t=='h'?v:-v}return{it,net}}
// ---- Utilidades ----
const vis=()=>me.cc?EMP.filter(e=>e.cc==me.cc):EMP,E_=id=>vis().find(e=>e.id==id);
const T=(c,r)=>`<div class="w"><table><tr>${c.map(x=>`<th>${esc(x)}</th>`).join('')}</tr>${r.map(x=>`<tr>${x.map(y=>`<td>${y&&y.h!==undefined?y.h:esc(y)}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${c.length}" class="m">Sin datos</td></tr>`}</table></div>`;
const eo=l=>l.map(e=>`<option value="${e.id}">${esc(e.n)}</option>`).join(''),v=id=>$('#'+id).value.trim();
const S={tab:'ficha',liq:1,doc:1,rep:'cc'};
const lic=(e,f)=>LIC.some(l=>l.e==e&&l.est=='Aprobada'&&l.d<=f&&f<=l.h);
function libro(){const r=[];vis().forEach(e=>WK.forEach(f=>{const m=MARC.find(x=>x.e==e.id&&x.f==f);
 if(m){const i=mm(m.i),a=i>550?i-540:0;r.push([e.n,f,m.i,m.o,((mm(m.o)-i-60)/60).toFixed(1),a,a?'Atraso':'OK'])}else r.push([e.n,f,'-','-','0',0,lic(e.id,f)?'Justificado (licencia)':'Ausente'])}));return r}
const saldo=id=>15-VAC.filter(x=>x.e==id&&x.est=='Aprobada').reduce((a,x)=>a+x.dias,0);
// ---- Vistas ----
const V={
ficha(){const w=can('ficha:w'),s=can('sueldo');return`<div class="card"><h2>Ficha del personal</h2>`+T(['RUT','Nombre','Cargo','Centro de costo','Ingreso','AFP / Salud','Reloj control',...(s?['Sueldo base']:[])],vis().map(e=>[w?fmt(e.r):mask(e.r),e.n,e.cargo,e.cc,e.ini,e.afp+' / '+e.salud,e.reloj,...(s?[money(e.s)]:[])]))+
 `<p class="m">RUT enmascarado y sueldo visible solo según permisos del rol.</p></div>`+(w?`<div class="card"><h3>Nuevo empleado</h3><div class="f"><label>RUT (sin puntos)<input id="f1" placeholder="12345678-5"></label><label>Nombre<input id="f2"></label><label>Cargo<input id="f3"></label><label>Centro de costo<input id="f4"></label><label>Sueldo base<input id="f5" type="number"></label><label>Ingreso<input id="f6" type="date"></label><button class="b" data-a="addEmp">Agregar</button></div></div>`:'')},
liq(){const e=E_(S.liq)||vis()[0];let r='';try{const c=calc(e);r=T(['Concepto','Tipo','Monto'],[['Sueldo base','Haber',money(e.s)],...c.it.map(x=>[x[0],x[1]=='h'?'Haber':'Descuento',money(x[2])]),[{h:'<b>Líquido a pagar</b>'},'',{h:'<b>'+money(c.net)+'</b>'}]])}catch(x){r='<p>Error: '+esc(x.message)+'</p>'}
 const dl=LIC.filter(l=>l.e==e.id&&l.est=='Aprobada'&&l.d.startsWith('2026-09')).reduce((a,l)=>a+habiles(l.d,l.h),0);
 return`<div class="card"><h2>Liquidaciones · modelo de cálculo paramétrico</h2><div class="f"><label>Empleado<select data-s="liq">${eo(vis())}</select></label><span class="tag">Período sep-2026: ${CLOSED?'CERRADO':'abierto'}</span></div>${r}<p class="m">Días hábiles de licencia aprobada en el período: ${dl}.</p>
 <button class="b" data-a="close">Cerrar período</button></div><div class="card"><h3>Fórmulas (cambios con doble aprobación)</h3>${T(['Concepto','Tipo','Fórmula',''],FORM.map((f,i)=>[f.n,f.t=='h'?'Haber':'Descuento',f.f,{h:`<input id="fm${i}" value="${esc(f.f)}" size="26"> <button class="b" data-a="prop" data-i="${i}">Proponer</button>`}]))}
 <p class="m">Parámetros: ${Object.entries(PAR).map(([k,x])=>esc(k)+'='+x).join(', ')}. Funciones: min, max, round. No se admite código arbitrario.</p><h3>Pendientes de aprobación</h3>${T(['Concepto','Nueva fórmula','Propuso',''],PEND.map(p=>[FORM[p.i].n,p.f,p.by,{h:`<button class="b" data-a="apr" data-id="${p.id}">Aprobar</button> <button class="b r" data-a="rej" data-id="${p.id}">Rechazar</button>`}]))}</div>`},
doc(){const es=vis(),e=E_(S.doc)||es[0],tp=S.dt||'c';return`<div class="card"><h2>Contratos y finiquitos</h2><div class="f"><label>Empleado<select data-s="doc">${eo(es)}</select></label><label>Documento<select data-s="dt"><option value="c">Contrato de trabajo</option><option value="f">Finiquito</option></select></label>
 <label>Causal (finiquito)<select id="cz"><option value="r">Renuncia</option><option value="n">Necesidades de la empresa</option></select></label><button class="b" data-a="gen">Generar</button><button class="b" data-a="genAll">Generar para todos (grupo)</button></div><div id="docout"></div></div>`},
lic(){const es=vis(),w=can('lic:w');return`<div class="card"><h2>Licencias médicas</h2>`+T(['Folio','Empleado','Tipo','Desde','Hasta','Días hábiles','Estado'],LIC.filter(l=>E_(l.e)).map(l=>[l.f,E_(l.e).n,l.t,l.d,l.h,habiles(l.d,l.h),l.est]))+`<p class="m">Por ser datos de salud, no se almacena ni muestra el diagnóstico.</p>`+
 (w?`<div class="f"><label>Empleado<select id="l1">${eo(es)}</select></label><label>Folio<input id="l2"></label><label>Tipo<select id="l3"><option>Enfermedad común</option><option>Maternal</option><option>Accidente laboral</option></select></label><label>Desde<input id="l4" type="date"></label><label>Hasta<input id="l5" type="date"></label><button class="b" data-a="addLic">Registrar</button></div>`:'')+`</div>`},
asi(){const w=can('asi:w');return`<div class="card"><h2>Control de asistencia</h2><p class="m">Turno base: 09:00-18:00 (1 h colación, tolerancia 10 min). Semana 21-25 sep 2026. Las ausencias con licencia aprobada se justifican automáticamente.</p>`+T(['Empleado','Fecha','Entrada','Salida','Horas','Atraso (min)','Estado'],libro())+
 (w?`<h3>Importar marcación del reloj control</h3><div class="f"><label>Empleado<select id="a1">${eo(vis())}</select></label><label>Fecha<input id="a2" type="date"></label><label>Entrada<input id="a3" type="time"></label><label>Salida<input id="a4" type="time"></label><button class="b" data-a="addMarc">Importar</button></div>`:'')+`</div>`},
vac(){const w=can('vac:w');return`<div class="card"><h2>Planificación y control de vacaciones</h2>`+T(['Empleado','Asignados/año','Tomados','Saldo pendiente'],vis().map(e=>[e.n,15,15-saldo(e.id),saldo(e.id)]))+`</div><div class="card"><h3>Solicitudes</h3>`+
 T(['Empleado','Desde','Hasta','Días hábiles','Motivo','Estado','Registró',''],VAC.filter(x=>E_(x.e)).map(x=>[E_(x.e).n,x.d,x.h,x.dias,x.mot,x.est,x.by,{h:x.est=='Pendiente'&&can('vac:a')?`<button class="b" data-a="vap" data-id="${x.id}">Aprobar</button> <button class="b r" data-a="vrj" data-id="${x.id}">Rechazar</button>`:''}]))+
 (w?`<div class="f"><label>Empleado<select id="v1">${eo(vis())}</select></label><label>Desde<input id="v2" type="date"></label><label>Hasta<input id="v3" type="date"></label><label>Motivo<input id="v4"></label><button class="b" data-a="addVac">Registrar solicitud</button></div>`:'')+`<p class="m">Quien registra una solicitud no puede aprobarla.</p></div>`},
inf(){const R={cc:'Distribución por centro de costo',lib:'Libro de asistencia',atr:'Atrasos y ausencias',lic:'Licencias por trabajador',lte:'Licencias por tipo y centro de costo',vac:'Planilla de vacaciones',prev:'Planilla previsional (AFP / Salud)',ant:'Certificado de antigüedad',cus:'Reporte personalizado'};
 const es=vis(),s=can('sueldo');let t='';const r=S.rep;
 if(r=='cc'){const g={};es.forEach(e=>{g[e.cc]=g[e.cc]||[0,0];g[e.cc][0]++;g[e.cc][1]+=e.s});t=T(['Centro de costo','N° empleados',...(s?['Masa salarial']:[])],Object.entries(g).map(([k,x])=>[k,x[0],...(s?[money(x[1])]:[])]))}
 if(r=='lib')t=T(['Empleado','Fecha','Entrada','Salida','Horas','Atraso','Estado'],libro());
 if(r=='atr'){const g={};libro().forEach(x=>{g[x[0]]=g[x[0]]||[0,0];g[x[0]][0]+=x[5];if(x[6]=='Ausente')g[x[0]][1]++});t=T(['Empleado','Minutos de atraso','Días ausente (sin justificar)'],Object.entries(g).map(([k,x])=>[k,...x]))}
 if(r=='lic')t=T(['Empleado','N° licencias','Días hábiles aprobados'],es.map(e=>{const l=LIC.filter(x=>x.e==e.id&&x.est=='Aprobada');return[e.n,l.length,l.reduce((a,x)=>a+habiles(x.d,x.h),0)]}));
 if(r=='lte'){const g={};LIC.filter(l=>E_(l.e)&&l.est=='Aprobada').forEach(l=>{const k=E_(l.e).cc+'|'+l.t;g[k]=(g[k]||0)+habiles(l.d,l.h)});t=T(['Centro de costo','Tipo','Días'],Object.entries(g).map(([k,x])=>[...k.split('|'),x]))+'<p class="m">Datos agregados, sin nombres ni diagnósticos.</p>'}
 if(r=='vac')t=T(['Empleado','Tomados','Saldo'],es.map(e=>[e.n,15-saldo(e.id),saldo(e.id)]));
 if(r=='prev')t=s?T(['Empleado','AFP','Salud','Imponible'],es.map(e=>{const c=calc(e),g=c.it[0][2];return[e.n,e.afp,e.salud,money(e.s+g)]})):'<p>Sin permiso para ver remuneraciones.</p>';
 if(r=='ant')t=T(['Empleado','Ingreso','Años de servicio','Código de verificación'],es.map(e=>[e.n,e.ini,((D(TODAY)-D(e.ini))/315576e5).toFixed(1),{h:'<span class="tag" data-cv="'+e.id+'">calculando…</span>'}]));
 if(r=='cus'){const cols={RUT:e=>mask(e.r),Nombre:e=>e.n,Cargo:e=>e.cargo,'Centro de costo':e=>e.cc,Ingreso:e=>e.ini,...(s?{Sueldo:e=>money(e.s)}:{})};const sel=Object.keys(cols).filter(k=>S['c_'+k]!==false);
  t=`<div class="f">${Object.keys(cols).map(k=>`<label><span><input type="checkbox" data-s="c_${esc(k)}" ${S['c_'+k]===false?'':'checked'}> ${esc(k)}</span></label>`).join('')}</div>`+T(sel,es.map(e=>sel.map(k=>cols[k](e))))+'<p class="m">Solo campos de una lista blanca; sin SQL libre.</p>'}
 return`<div class="card"><h2>Consultas / Informes</h2><div class="f"><label>Informe<select data-s="rep">${Object.entries(R).map(([k,n])=>`<option value="${k}" ${k==r?'selected':''}>${n}</option>`).join('')}</select></label></div>${t}</div>`},
aud(){return`<div class="card"><h2>Bitácora de auditoría</h2><p class="m">Append-only con hash SHA-256 encadenado (cada registro incluye el hash del anterior).</p><button class="b" data-a="ver">Verificar integridad</button> <span id="vr"></span>`+T(['Fecha (UTC)','Usuario','Acción','Hash'],[...LOG].reverse().map(l=>[l.t,l.u,l.a,l.h.slice(0,16)+'…']))+`</div>`},
seg(){const R=[['I','RBAC deny-by-default y alcance por centro de costo en cada acción','Simulado en cliente (prod: servidor)','ERP-2'],['I','RUT enmascarado; sueldo solo con permiso; licencias sin diagnóstico','Sí','ERP-3 / HU-09'],['I','Escape de toda salida (anti-XSS); sin eval ni innerHTML con datos crudos','Sí','ERP-25'],['S','Hash SHA-256 de contraseñas (prod: Argon2id), bloqueo a 5 intentos, cierre a 15 min','Simulado','ERP-2'],['T','Intérprete de fórmulas con lista blanca, longitud y tokens limitados','Sí','HU-06'],['T','Doble aprobación (maker-checker) de fórmulas; aprobador distinto del proponente','Sí','HU-05 / HU-06'],['T','Período cerrado inmutable; validación de RUT, fechas, solapes y saldo','Sí','HU-06 / 09 / 15'],['R','Bitácora encadenada por hash y verificable','Sí','ERP-24'],['T','Documentos emitidos con hash de integridad','Sí','HU-07'],['I','TLS 1.3, AES-256 en reposo, consultas parametrizadas, WAF, respaldos cifrados','Pendiente (backend)','ERP-27']];
 return`<div class="card"><h2>Seguridad y trazabilidad DevSecOps</h2><p>Controles derivados del modelo STRIDE (amenazas I: divulgación y T: manipulación) y su ticket de Jira. Esta interfaz es un prototipo: los controles marcados como simulados deben reimplementarse en el servidor.</p>`+T(['STRIDE','Control','Estado','Ticket'],R)+
 `<p class="m">Flujo: Jira (Sprint 1) → rama feature/ERP-xx → Smart Commit → Pull Request con 1 aprobación sobre main protegida → ticket a Terminado.</p></div>`}};
const TABS=[['ficha','Ficha del personal'],['liq','Liquidaciones',],['doc','Contratos y finiquitos','doc'],['lic','Licencias','lic:r'],['asi','Asistencia','asi'],['vac','Vacaciones','vac:a'],['inf','Informes','inf'],['aud','Auditoría','aud'],['seg','Seguridad']];
const tabOk=t=>t[0]=='ficha'?!can('aud'):t[0]=='liq'?can('sueldo'):!t[2]||can(t[2])||(t[0]=='vac'&&can('vac:w'));
function go(t){if(t)S.tab=t;const tb=TABS.filter(tabOk);if(!tb.some(x=>x[0]==S.tab))S.tab=tb[0][0];
 $('#nav').innerHTML=tb.map(x=>`<button class="${x[0]==S.tab?'on':''}" data-a="tab" data-t="${x[0]}">${esc(x[1])}</button>`).join('');$('#main').innerHTML=V[S.tab]();document.querySelectorAll('select[data-s]').forEach(x=>{if(S[x.dataset.s]!==undefined)x.value=S[x.dataset.s]});
 if(S.tab=='aud')log('Consulta de bitácora');if(S.tab=='inf'&&S.rep=='ant')document.querySelectorAll('[data-cv]').forEach(async n=>{n.textContent=(await H('ANT'+n.dataset.cv+TODAY)).slice(0,10).toUpperCase()})}
function msg(t,e){const m=$('#msg');m.textContent=t;m.className=e?'e':'';m.hidden=false;clearTimeout(m._t);m._t=setTimeout(()=>m.hidden=true,3500)}
// ---- Sesión ----
let me=null,fails={},tm;
const rt=()=>{clearTimeout(tm);if(me)tm=setTimeout(()=>A.out(0,'Sesión cerrada por inactividad (15 min)'),9e5)};
function start(u){me={u,...U[u]};fails[u]=0;$('#login').hidden=true;$('#app').hidden=false;$('#who').textContent=u+' · '+me.r;log('Inicio de sesión');rt();S.tab='ficha';go()}
const A={
async login(){await ready;const u=v('lu').toLowerCase();if((fails[u]||0)>=5)return msg('Cuenta bloqueada por 5 intentos fallidos',1);
 const x=Object.hasOwn(U,u)?U[u]:null;if(!x||await H(u+$('#lp').value)!==x.h){fails[u]=(fails[u]||0)+1;log('Login fallido: '+u.slice(0,20),'-');return msg('Credenciales inválidas',1)}
 start(u)},
out(_,m){log('Cierre de sesión');me=null;$('#app').hidden=true;$('#login').hidden=false;$('#lp').value='';if(m)msg(m,1)},
tab(d){go(d.t)},
addEmp(){need('ficha:w');const m=v('f1').replace(/\./g,'').match(/^(\d{7,8})-([\dkK])$/),s=+v('f5');
 if(!m||dv(+m[1])!=m[2].toUpperCase())throw Error('RUT inválido');if(EMP.some(e=>e.r==+m[1]))throw Error('El RUT ya existe');
 if(!v('f2')||v('f2').length>60||!v('f3')||!v('f4')||!(s>=300000&&s<=20000000)||!okD(v('f6')))throw Error('Datos inválidos (sueldo 300.000 a 20.000.000)');
 EMP.push({id:EMP.length+1,r:+m[1],n:v('f2'),cargo:v('f3'),cc:v('f4'),s,ini:v('f6'),afp:'-',salud:'-',reloj:'-'});log('Alta de empleado id '+EMP.length);go();msg('Empleado agregado')},
prop(d){need('liq:w');if(CLOSED)throw Error('Período cerrado: no se pueden modificar fórmulas');const f=v('fm'+d.i);ev(f,{base:1e6,grat:1,col:1,afp:1,sal:1,...PAR});
 PEND.push({id:pid++,i:+d.i,f,by:me.u});log('Propuesta de fórmula en '+FORM[d.i].n);go();msg('Propuesta enviada: requiere aprobación de otro usuario')},
apr(d){need('liq:w');const p=PEND.find(x=>x.id==d.id);if(p.by==me.u)throw Error('El aprobador debe ser distinto de quien propone');if(CLOSED)throw Error('Período cerrado');
 FORM[p.i].f=p.f;PEND=PEND.filter(x=>x!=p);log('Fórmula aprobada en '+FORM[p.i].n);go();msg('Fórmula aprobada')},
rej(d){need('liq:w');PEND=PEND.filter(x=>x.id!=d.id);log('Propuesta rechazada');go()},
close(){need('liq:w');CLOSED=true;log('Cierre de período sep-2026');go();msg('Período cerrado (inmutable)')},
async gen(){need('doc');const e=E_(S.doc)||vis()[0];$('#docout').innerHTML=await docOf(e)},
async genAll(){need('doc');let h='';for(const e of vis())h+=await docOf(e);$('#docout').innerHTML=h},
addLic(){need('lic:w');const e=+v('l1'),d=v('l4'),h=v('l5');if(!E_(e)||!okD(d)||!okD(h)||h<d)throw Error('Fechas inválidas');if(!/^[A-Z]{2}-\d{3,8}$/.test(v('l2')))throw Error('Folio inválido (ej. LM-1004)');
 if(LIC.some(l=>l.e==e&&l.est!='Rechazada'&&l.d<=h&&d<=l.h))throw Error('La licencia se traslapa con otra existente');if(LIC.some(l=>l.f==v('l2')))throw Error('Folio duplicado');
 LIC.push({f:v('l2'),e,t:v('l3'),d,h,est:'Aprobada'});log('Registro de licencia '+v('l2'));go();msg('Licencia registrada; se justifica en asistencia')},
addMarc(){need('asi:w');const e=+v('a1'),f=v('a2');if(!E_(e)||!okD(f)||!/^\d{2}:\d{2}$/.test(v('a3'))||!/^\d{2}:\d{2}$/.test(v('a4'))||mm(v('a4'))<=mm(v('a3')))throw Error('Marcación inválida');
 if(MARC.some(m=>m.e==e&&m.f==f))throw Error('Marcación duplicada');MARC.push({e,f,i:v('a3'),o:v('a4')});log('Importación de marcación');go();msg('Marcación importada')},
addVac(){need('vac:w');const e=+v('v1'),d=v('v2'),h=v('v3');if(!E_(e)||!okD(d)||!okD(h)||h<d)throw Error('Fechas inválidas');const n=habiles(d,h);
 if(n<1)throw Error('El rango no contiene días hábiles');if(n>saldo(e))throw Error('Saldo insuficiente ('+saldo(e)+' días)');
 if(VAC.some(x=>x.e==e&&x.est!='Rechazada'&&x.d<=h&&d<=x.h))throw Error('Traslape con otra solicitud');VAC.push({id:VAC.length+1,e,d,h,dias:n,mot:v('v4').slice(0,80),est:'Pendiente',by:me.u});log('Solicitud de vacaciones');go();msg('Solicitud registrada')},
vap(d){need('vac:a');const x=VAC.find(r=>r.id==d.id);if(!E_(x.e))throw Error('Fuera de su alcance');if(x.by==me.u)throw Error('No puede aprobar una solicitud que usted registró');if(x.dias>saldo(x.e))throw Error('Saldo insuficiente');x.est='Aprobada';log('Vacaciones aprobadas #'+x.id);go()},
vrj(d){need('vac:a');const x=VAC.find(r=>r.id==d.id);if(!E_(x.e))throw Error('Fuera de su alcance');x.est='Rechazada';log('Vacaciones rechazadas #'+x.id);go()},
async ver(){need('aud');let p='0',ok=true;for(const l of LOG){if(l.h!==await H(p+l.t+l.u+l.a)){ok=false;break}p=l.h}$('#vr').textContent=ok?'Cadena íntegra ('+LOG.length+' registros)':'Cadena alterada';}};
async function docOf(e){let t;if((S.dt||'c')=='c')t=`CONTRATO DE TRABAJO\n\nEn Santiago, a ${TODAY}, entre Seguridad LTDA y ${e.n}, RUT ${mask(e.r)}, se acuerda:\n- Cargo: ${e.cargo}\n- Centro de costo: ${e.cc}\n- Remuneración base: ${money(e.s)}\n- Inicio: ${e.ini}. Jornada: lunes a viernes, 09:00 a 18:00.`;
 else{const a=Math.floor((D(TODAY)-D(e.ini))/315576e5),n=$('#cz').value=='n',vc=saldo(e.id)*e.s/30,ind=n?Math.min(a,11)*e.s:0;t=`FINIQUITO DE CONTRATO DE TRABAJO\n\nTrabajador: ${e.n} (RUT ${mask(e.r)}). Causal: ${n?'Necesidades de la empresa':'Renuncia'}.\n- Años de servicio: ${a}\n- Feriado pendiente (${saldo(e.id)} días): ${money(vc)}\n- Indemnización por años de servicio: ${money(ind)}\n- Total a pagar: ${money(vc+ind)}`}
 log('Documento generado para id '+e.id);return`<pre>${esc(t)}</pre><p class="m">Hash de integridad SHA-256: ${(await H(t)).slice(0,32)}…</p>`}
document.addEventListener('click',async ev=>{const b=ev.target.closest('[data-a]');rt();if(!b)return;try{await A[b.dataset.a](b.dataset)}catch(x){msg(x.message,1)}});
document.addEventListener('change',ev=>{const s=ev.target.closest('[data-s]');if(!s)return;const k=s.dataset.s;S[k]=k.startsWith('c_')?s.checked:s.value;go()});
document.addEventListener('keydown',rt);
