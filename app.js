/* ===================== DATOS (ver data.js) ===================== */
const CATS={C:'🥩 Carnes y pescados',V:'🥦 Verduras y frutas',L:'🥚 Lácteos y huevos',A:'🌾 Almacén y semillas'};
const DAYS=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const SLOTN={A:'Almuerzo',C:'Cena',M:'Merienda'};
const MEALS=wsMeals();

/* ===================== ESTADO ===================== */
const store={
  get:function(k,d){return Vault.get(WS.pfx+k,d);},
  set:function(k,v){Vault.set(WS.pfx+k,v);}
};
const S={
  sel:store.get('sel',[PROFILES.length?PROFILES[0].k:'a']),
  plans:store.get('plans',{}),
  checked:store.get('checked',{}),
  pantry:store.get('pantry',[]),
  excl:store.get('excl',{}),
  tab:wsTab(),off:0,ctype:'T',q:'',htype:'A',hq:'',ptype:'T'
};
S.sel=S.sel.filter(function(k){return PROFILES.some(function(p){return p.k===k;});});
if(!S.sel.length&&PROFILES.length)S.sel=[PROFILES[0].k];
function save(){store.set('sel',S.sel);store.set('plans',S.plans);store.set('checked',S.checked);store.set('pantry',S.pantry);store.set('excl',S.excl);}
const $=function(s){return document.querySelector(s);};

/* ===================== UTILIDADES ===================== */
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function shuffle(arr,r){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function fd(d){return d.getDate()+'/'+(d.getMonth()+1);}
function weekStart(o){var x=new Date();x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7)+(o===undefined?S.off:o)*7);return x;}
function isEx(id,k){return (S.excl[k]||[]).indexOf(id)>=0;}
function fitsSlot(m,slot){var o=m.ok[slot];return o!==undefined&&S.sel.every(function(t){return o.indexOf(t)>=0&&!isEx(m.id,t);});}
function fits(m,slot){if(slot&&slot!=='T')return fitsSlot(m,slot);return ['A','C','M'].some(function(s){return fitsSlot(m,s);});}
function pool(slot){return MEALS.filter(function(m){return fitsSlot(m,slot);});}
function okAll(m){var s='';['A','C','M'].forEach(function(x){(m.ok[x]||'').split('').forEach(function(c){if(s.indexOf(c)<0)s+=c;});});return s;}
function badges(m){var t=okAll(m);return PROFILES.filter(function(p){return t.indexOf(p.k)>=0;}).map(function(p){return '<span class="pb" style="background:'+p.c+'">'+p.n[0]+'</span>';}).join('');}
function fmtQ(q,u){
  if(u==='u')return Math.ceil(q-1e-9)+' u';
  if(u==='g'){var g=Math.ceil(q/10)*10;return g>=1000?(g/1000).toFixed(1).replace('.',',')+' kg':g+' g';}
  if(u==='ml'){var m=Math.ceil(q/10)*10;return m>=1000?(m/1000).toFixed(1).replace('.',',')+' l':m+' ml';}
  return Math.round(q)+' '+u;
}

/* ===================== PLAN SEMANAL ===================== */
function pkey(ws){return ws+'|'+S.sel.slice().sort().join('');}
function getPlan(ws){var k=pkey(ws);if(!S.plans[k]){S.plans[k]={seed:1,over:{}};save();}return S.plans[k];}
function weekMeals(ws){
  var p=getPlan(ws),out=[];
  ['A','C','M'].forEach(function(slot){
    var sh=shuffle(pool(slot),rng(hash(pkey(ws)+slot+p.seed)));
    for(var d=0;d<7;d++){
      var m=null,ov=p.over[d+slot];
      if(ov){m=MEALS.find(function(x){return x.id===ov;})||null;if(m&&!fitsSlot(m,slot))m=null;}
      if(!m&&sh.length)m=sh[d%sh.length];
      out.push({d:d,slot:slot,m:m});
    }
  });
  return out;
}
function regen(ws){var p=getPlan(ws);p.seed++;p.over={};save();render();}
function swap(ws,d,slot){
  var cur=weekMeals(ws).filter(function(x){return x.slot===slot;});
  var used={};cur.forEach(function(x){if(x.m)used[x.m.id]=1;});
  var me=cur.find(function(x){return x.d===d;}).m;
  var c=pool(slot).filter(function(m){return !used[m.id];});
  if(!c.length)c=pool(slot).filter(function(m){return !me||m.id!==me.id;});
  if(!c.length)return;
  getPlan(ws).over[d+slot]=c[Math.floor(Math.random()*c.length)].id;
  save();render();
}

/* ===================== COMPRAS ===================== */
/* Cómo se compra de verdad: [paso, nombre del envase]. Lo que no figura usa el paso de su categoría. */
const PACK_CAT={C:[100,''],V:[50,''],L:[100,''],A:[100,'']};
const PACK={
  'Pollo':[250,''],'Carne vacuna':[250,''],'Carne picada':[250,''],'Cerdo':[250,''],'Pavita':[250,''],'Pescado blanco':[250,''],'Salmón':[250,''],
  'Camarones':[250,''],'Mejillones':[250,''],'Atún':[170,'lata'],'Jamón cocido':[100,''],
  'Huevo':[6,'media docena'],'Leche':[1000,'sachet'],'Leche vegetal':[1000,'envase'],'Leche de coco':[400,'lata'],'Crema':[200,'pote'],
  'Manteca':[200,'paquete'],'Yogur natural':[200,'pote'],'Ricota':[250,'pote'],'Queso fresco':[300,'pieza'],
  'Arroz integral':[500,'paquete'],'Arroz yamaní':[500,'paquete'],'Avena (copos)':[500,'paquete'],'Fideos comunes':[500,'paquete'],
  'Fideos de legumbres':[250,'paquete'],'Fideos sin gluten':[500,'paquete'],'Garbanzos':[500,'paquete'],'Lentejas':[500,'paquete'],
  'Porotos':[500,'paquete'],'Polenta':[500,'paquete'],'Quinoa':[500,'paquete'],'Mijo':[500,'paquete'],'Trigo sarraceno':[500,'paquete'],
  'Amaranto':[500,'paquete'],'Harina de trigo':[1000,'paquete'],'Harina de garbanzos':[500,'paquete'],'Harina de almendras':[250,'paquete'],
  'Fécula de mandioca':[500,'paquete'],'Pan rallado':[500,'paquete'],'Tomate triturado':[520,'caja'],'Tofu':[300,'pieza'],
  'Soja texturizada':[250,'paquete'],'Hummus':[200,'pote'],'Aceitunas':[200,'frasco'],'Frutos rojos':[300,'bolsa'],
  'Pasta de maní':[250,'frasco'],'Tahini':[250,'frasco'],'Pan de masa madre':[1,''],'Galleta de arroz':[1,'']
};
function packOf(n,c,u){return PACK[n]||(u==='u'?[1,'']:PACK_CAT[c])||[1,''];}
/* cantidad realmente a comprar: múltiplo entero del envase */
function buyQty(i){
  var p=packOf(i.n,i.c,i.u),st=p[0],k=Math.max(1,Math.ceil(i.q/st-1e-9));
  return{q:k*st,packs:k,size:st,label:p[1]};
}
function fmtBuy(i){
  var b=buyQty(i);
  if(b.label&&i.u!=='u'&&b.size>=170)return b.packs+' × '+b.label+' de '+fmtQ(b.size,i.u);
  if(b.label==='media docena')return b.packs===1?'½ docena':(b.packs/2)+' docena'+(b.packs===2?'':'s');
  return fmtQ(b.q,i.u);
}
function inPantry(n){return S.pantry.indexOf(gOf(n))>=0;}
function shopping(ws){
  var n=S.sel.length,map={};
  weekMeals(ws).forEach(function(x){
    if(!x.m)return;
    x.m.ings.forEach(function(i){
      var k=i.n+'|'+i.u;
      if(!map[k])map[k]={n:i.n,u:i.u,c:i.c,q:0};
      map[k].q+=i.q*n;
    });
  });
  return Object.keys(map).map(function(k){return map[k];});
}
function tick(key,v){if(v)S.checked[key]=1;else delete S.checked[key];save();viewCompras();}

/* ===================== MODAL ===================== */
function showMeal(id){
  var m=MEALS.find(function(x){return x.id===id;});if(!m)return;
  var n=S.sel.length;
  var h='<div class="bar"><b style="font-size:17px">'+m.name+'</b><button onclick="closeModal()">✕</button></div>';
  h+='<div style="margin-bottom:8px">'+badges(m)+' <span class="mut">'+(m.type==='AC'?'Almuerzo o cena':SLOTN[m.type])+'</span></div>';
  h+='<div class="mut" style="margin-bottom:6px">Ingredientes para '+n+' '+(n===1?'persona':'personas')+':</div>';
  m.ings.forEach(function(i){h+='<div class="it"><span>'+i.n+'</span><span class="q">'+fmtQ(i.q*n,i.u)+'</span></div>';});
  var tp=m.tip;
  if(tp)h+='<div class="card" style="margin-top:10px;background:var(--soft)">💡 '+tp+'</div>';
  $('#mbox').innerHTML=h;$('#modal').classList.add('show');
}
function closeModal(){$('#modal').classList.remove('show');}

/* ===================== VISTAS ===================== */
function viewSemana(){
  var ws=weekStart(),wsI=iso(ws),end=new Date(ws);end.setDate(end.getDate()+6);
  var wm=weekMeals(wsI),today=iso(new Date());
  var h='<div class="bar"><button onclick="S.off--;render()">‹</button><div style="text-align:center"><b>Semana del '+fd(ws)+' al '+fd(end)+'</b>'+(S.off===0?'<div class="mut">semana actual</div>':'')+'</div><button onclick="S.off++;render()">›</button></div>';
  var na=pool('A').length,nc=pool('C').length;
  if(na<7||nc<7)h+='<div class="warn">⚠️ Para esta combinación hay '+na+' almuerzos y '+nc+' cenas posibles, así que algunas comidas se repiten.</div>';
  h+='<button class="btn pri" onclick="regen(\''+wsI+'\')">🔄 Armar otra semana</button>';
  for(var d=0;d<7;d++){
    var dt=new Date(ws);dt.setDate(ws.getDate()+d);
    h+='<div class="card day'+(iso(dt)===today?' today':'')+'"><div class="dn">'+DAYS[d]+' '+fd(dt)+'</div>';
    ['A','C','M'].forEach(function(slot){
      var x=wm.find(function(y){return y.d===d&&y.slot===slot;});
      if(x&&x.m)h+='<div class="slot"><div class="sl">'+SLOTN[slot]+'</div><div class="sn" onclick="showMeal('+x.m.id+')">'+x.m.name+'</div><button class="ic" onclick="swap(\''+wsI+'\','+d+',\''+slot+'\')">🔄</button></div>';
      else h+='<div class="slot"><div class="sl">'+SLOTN[slot]+'</div><div class="sn mut">Sin opciones para esta combinación</div></div>';
    });
    h+='</div>';
  }
  $('#main').innerHTML=h;
}

function viewComidas(){
  var h='<div class="tf" id="tf"></div><input type="text" id="cq" placeholder="Buscar comida o ingrediente…" oninput="S.q=this.value;renderCList()" value="'+S.q.replace(/"/g,'')+'"><div class="mut" id="ccount" style="margin-bottom:8px"></div><div id="clist"></div>';
  if(!WS.family)h='<label class="it"><input type="checkbox" '+(S.showAll?'checked':'')+' onchange="S.showAll=this.checked;renderCList()"><span>Mostrar todas las comidas del espacio (para editar quién las come)</span></label>'+h;
  h+=exclHTML()+critHTML();
  $('#main').innerHTML=h;renderTF('tf','ctype','renderCList',true);renderCList();
}
function askExcl(id){
  var m=MEALS.find(function(x){return x.id===id;});
  var h='<div class="bar"><b>🚫 Excluir: '+m.name+'</b><button onclick="closeModal()">✕</button></div><div class="mut" style="margin-bottom:8px">¿Para quién?</div>';
  PROFILES.forEach(function(p){h+='<label class="it"><input type="checkbox" class="exc" value="'+p.k+'" '+(S.sel.indexOf(p.k)>=0?'checked':'')+'><span>'+p.n+'</span></label>';});
  h+='<div style="margin-top:12px"><button class="btn pri" onclick="doExcl('+id+')">Excluir</button><button class="btn" onclick="closeModal()">Cancelar</button></div>';
  $('#mbox').innerHTML=h;$('#modal').classList.add('show');
}
function doExcl(id){
  var bs=document.querySelectorAll('.exc');
  for(var i=0;i<bs.length;i++){if(bs[i].checked){var k=bs[i].value;S.excl[k]=S.excl[k]||[];if(S.excl[k].indexOf(id)<0)S.excl[k].push(id);}}
  save();closeModal();newWheel();render();
}
function unExcl(id,k){S.excl[k]=(S.excl[k]||[]).filter(function(x){return x!==id;});save();newWheel();render();}
function exclHTML(){
  var h='',tot=0;
  PROFILES.forEach(function(p){
    var l=(S.excl[p.k]||[]).map(function(id){return MEALS.find(function(m){return m.id===id;});}).filter(Boolean);
    if(!l.length)return;tot+=l.length;
    h+='<div class="cat">'+p.n+' ('+l.length+')</div>'+l.map(function(m){return '<div class="it"><span>'+m.name+'</span><button class="ic" style="margin-left:auto" onclick="unExcl('+m.id+',\''+p.k+'\')">Restaurar</button></div>';}).join('');
  });
  return '<details><summary>🚫 Comidas excluidas ('+tot+')</summary>'+(h||'<p>Todavía no excluiste ninguna.</p>')+'</details>';
}
function critHTML(){return '';}
function renderTF(id,key,fn,all){
  var opts=(all?[['T','Todas']]:[]).concat([['A','Almuerzo'],['C','Cena'],['M','Merienda']]);
  $('#'+id).innerHTML=opts.map(function(o){return '<button class="'+(S[key]===o[0]?'on':'')+'" onclick="S.'+key+'=\''+o[0]+'\';'+(id==='tf'?'viewComidas()':id==='ptf'?'viewHoy()':'viewHoy()')+'">'+o[1]+'</button>';}).join('');
}
function renderCList(){
  var q=S.q.toLowerCase().trim();
  var l=MEALS.filter(function(m){
    if(!WS.family&&S.showAll){if(S.ctype!=='T'&&m.type.indexOf(S.ctype)<0)return false;}
    else if(!fits(m,S.ctype))return false;
    if(q&&(m.name.toLowerCase().indexOf(q)<0&&!m.ings.some(function(i){return i.n.toLowerCase().indexOf(q)>=0;})))return false;
    return true;
  });
  $('#ccount').textContent=(!WS.family&&S.showAll)?l.length+' comidas en total':l.length+' comidas para '+S.sel.map(function(k){return PROFILES.find(function(p){return p.k===k;}).n;}).join(' + ');
  $('#clist').innerHTML=l.map(function(m){return '<div class="card meal" onclick="showMeal('+m.id+')"><button class="ic" style="float:right;margin-left:8px" aria-label="Excluir esta comida" title="Excluir" onclick="event.stopPropagation();askExcl('+m.id+')">🚫</button>'+(WS.family?'':'<button class="ic" style="float:right;margin-left:6px" onclick="event.stopPropagation();wsEditMeal('+m.id+')">👥</button>')+'<b>'+m.name+'</b>'+badges(m)+' <span class="mut">'+(m.type==='AC'?'Almuerzo o cena':SLOTN[m.type])+'</span></div>';}).join('')||'<div class="mut">No hay comidas que sirvan a todos los seleccionados con ese filtro.</div>';
}

function viewCompras(){
  var ws=iso(weekStart()),all=shopping(ws);
  var items=all.filter(function(i){return !inPantry(i.n);}),have=all.filter(function(i){return inPantry(i.n);}),total=items.length;
  var done=items.filter(function(i){return S.checked[ws+'|'+i.n+'|'+i.u];}).length;
  var h='<div class="bar"><b>🛒 Compras de la semana del '+fd(weekStart())+'</b><span class="mut">'+done+' / '+total+'</span></div>';
  h+='<button class="btn" onclick="copyList()">📋 Copiar lista</button><button class="btn" onclick="resetChecks()">Desmarcar todo</button>';
  if(done)h+='<button class="btn pri" onclick="finishShop()">✅ Ya compré: sumar a “Tengo en casa”</button>';
  h+='<div class="mut" style="margin:6px 0">Para '+S.sel.length+' '+(S.sel.length===1?'persona':'personas')+', según la semana armada. Las cantidades ya están redondeadas a como se compra. Tocá 🏠 en lo que ya tenés. Reponer básicos: aceite de oliva, sal, especias.</div>';
  Object.keys(CATS).forEach(function(c){
    var l=items.filter(function(i){return i.c===c;}).sort(function(a,b){return a.n.localeCompare(b.n);});
    if(!l.length)return;
    h+='<div class="cat">'+CATS[c]+'</div>';
    l.forEach(function(i){
      var k=ws+'|'+i.n+'|'+i.u,ch=S.checked[k],b=buyQty(i),use=fmtQ(i.q,i.u),buy=fmtBuy(i);
      h+='<div class="it'+(ch?' done':'')+'"><input type="checkbox" aria-label="'+i.n+'" data-k="'+k+'" '+(ch?'checked':'')+' onchange="tick(this.dataset.k,this.checked)"><span style="flex:1">'+i.n+(Math.abs(b.q-i.q)>1e-9&&use!==buy?'<div class="mut">usás '+use+'</div>':'')+'</span><span class="q">'+buy+'</span><button class="ic" aria-label="Ya tengo '+i.n+'" title="Ya tengo" data-n="'+i.n.replace(/"/g,'')+'" onclick="haveIt(this.dataset.n)">🏠</button></div>';
    });
  });
  if(!total)h+='<div class="card" style="text-align:center">🎉 No hay nada para comprar esta semana.</div>';
  if(have.length){
    h+='<details style="margin-top:16px"><summary>🏠 Ya tenés en casa ('+have.length+')</summary>'+have.sort(function(a,b){return a.n.localeCompare(b.n);}).map(function(i){
      return '<div class="it"><span style="flex:1">'+i.n+'</span><span class="q">'+fmtQ(i.q,i.u)+'</span><button class="ic" data-n="'+i.n.replace(/"/g,'')+'" onclick="buyAnyway(this.dataset.n)">Comprar</button></div>';}).join('')+'</details>';
  }
  $('#main').innerHTML=h;
}
function haveIt(n){var g=gOf(n);if(S.pantry.indexOf(g)<0)S.pantry.push(g);save();viewCompras();wsToast('Anotado en “Tengo en casa”');}
function buyAnyway(n){var g=gOf(n);S.pantry=S.pantry.filter(function(x){return x!==g;});save();viewCompras();}
function finishShop(){
  var ws=iso(weekStart()),c=0;
  shopping(ws).forEach(function(i){
    var k=ws+'|'+i.n+'|'+i.u;
    if(S.checked[k]){var g=gOf(i.n);if(S.pantry.indexOf(g)<0){S.pantry.push(g);c++;}delete S.checked[k];}
  });
  save();viewCompras();wsToast(c+' '+(c===1?'producto sumado':'productos sumados')+' a “Tengo en casa”');
}
function resetChecks(){var ws=iso(weekStart());Object.keys(S.checked).forEach(function(k){if(k.indexOf(ws+'|')===0)delete S.checked[k];});save();viewCompras();}
function copyList(){
  var ws=iso(weekStart()),items=shopping(ws).filter(function(i){return !inPantry(i.n);}),t='Compras semana del '+fd(weekStart())+'\n';
  Object.keys(CATS).forEach(function(c){
    var l=items.filter(function(i){return i.c===c;}).sort(function(a,b){return a.n.localeCompare(b.n);});
    if(!l.length)return;
    t+='\n'+CATS[c]+'\n'+l.map(function(i){return '- '+i.n+': '+fmtBuy(i);}).join('\n')+'\n';
  });
  try{navigator.clipboard.writeText(t);if(typeof wsToast==='function')wsToast('Lista copiada');}catch(e){}
}

/* ---------- HOY (ruleta) y EN CASA ---------- */
const wheel={items:[],rot:0,result:null,spinning:false};
function newWheel(){
  var p=pool(S.htype);
  wheel.items=shuffle(p,Math.random).slice(0,8);wheel.result=null;
}
function todayCard(){
  var ws=iso(weekStart(0)),wm=weekMeals(ws),d=(new Date().getDay()+6)%7,dt=new Date();
  var h='<div class="card day today"><div class="dn">📅 Hoy · '+DAYS[d]+' '+fd(dt)+'</div>';
  ['A','M','C'].forEach(function(slot){
    var x=wm.find(function(y){return y.d===d&&y.slot===slot;});
    if(x&&x.m)h+='<div class="slot"><div class="sl">'+SLOTN[slot]+'</div><div class="sn" onclick="showMeal('+x.m.id+')">'+x.m.name+'</div><button class="ic" onclick="swap(\''+ws+'\','+d+',\''+slot+'\')">🔄</button></div>';
    else h+='<div class="slot"><div class="sl">'+SLOTN[slot]+'</div><div class="sn mut">Sin opciones para esta combinación</div></div>';
  });
  return h+'<div class="mut" style="margin-top:6px">Tocá una comida para ver ingredientes · 🔄 para cambiarla</div></div>';
}
function viewHoy(){
  var h=todayCard()+'<div class="cat" style="margin-top:8px">🎡 ¿No sabés qué comer?</div>'+
    '<div class="mut" style="margin-bottom:10px">Elegí para cuándo es y girá la ruleta: te propone una comida al azar.</div>'+
    '<div class="tf" id="ptf"></div>'+
    '<div class="wheelwrap"><div class="ptr"></div><canvas id="wheel" width="600" height="600" onclick="spin()" aria-label="Ruleta de comidas: tocá para girar"></canvas></div>'+
    '<div style="text-align:center;margin-bottom:12px"><button class="btn pri" onclick="spin()">🎲 Girar la ruleta</button></div><div class="res" id="wres" style="margin-bottom:90px"></div>';
  $('#main').innerHTML=h;
  renderTF2();drawWheel();showResult();
}
function viewCasa(){
  var h='<div class="bar"><b>🧺 Tengo en casa</b></div>'+
    '<div class="mut" style="margin-bottom:10px">Marcá lo que tenés y te muestro las comidas que podés hacer ya, o casi.</div>'+
    '<div class="tf" id="ptf"></div>'+
    '<input type="text" id="hq" placeholder="Buscar ingrediente…" oninput="S.hq=this.value;renderChips()" value="'+S.hq.replace(/"/g,'')+'"><div id="pchips"></div>'+
    '<div style="margin:10px 0"><button class="btn" onclick="S.pantry=[];save();viewCasa()">Limpiar lo marcado</button></div><div id="pres"></div>';
  $('#main').innerHTML=h;
  renderTF2();renderChips();renderRes();
}
function renderTF2(){
  var casa=S.tab==='casa',opts=[['A','Almuerzo'],['C','Cena'],['M','Merienda']];
  if(casa)opts.unshift(['T','Todas']);
  var key=casa?'ptype':'htype';
  $('#ptf').innerHTML=opts.map(function(o){return '<button class="'+(S[key]===o[0]?'on':'')+'" onclick="setHType(\''+o[0]+'\')">'+o[1]+'</button>';}).join('');
}
function setHType(t){if(S.tab==='casa'){S.ptype=t;viewCasa();}else{S.htype=t;newWheel();viewHoy();}}
function useToday(id){
  var m=MEALS.find(function(x){return x.id===id;});if(!m)return;
  var ws=iso(weekStart(0)),d=(new Date().getDay()+6)%7;
  getPlan(ws).over[d+S.htype]=id;save();render();wsToast('Listo: quedó para hoy');
}
function drawWheel(){
  var cv=$('#wheel');if(!cv)return;
  var ctx=cv.getContext('2d'),W=cv.width,R=W/2-6,n=wheel.items.length;
  ctx.clearRect(0,0,W,W);
  if(!n){ctx.fillStyle='#94a3b8';ctx.font='bold 34px sans-serif';ctx.textAlign='center';ctx.fillText('Sin opciones',W/2,W/2);return;}
  var seg=2*Math.PI/n,pal=['#3b82f6','#f59e0b','#ef4444','#6366f1','#10b981','#ec4899','#0ea5e9','#84cc16'];
  for(var i=0;i<n;i++){
    var a=wheel.rot+i*seg;
    ctx.beginPath();ctx.moveTo(W/2,W/2);ctx.arc(W/2,W/2,R,a,a+seg);ctx.closePath();
    ctx.fillStyle=pal[i%pal.length];ctx.fill();
    ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.stroke();
  }
  ctx.beginPath();ctx.arc(W/2,W/2,78,0,2*Math.PI);ctx.fillStyle='#fff';ctx.fill();
  ctx.fillStyle='#0f766e';ctx.font='bold 38px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(wheel.spinning?'…':'GIRAR',W/2,W/2+2);ctx.textBaseline='alphabetic';
}
function spin(){
  if(wheel.spinning||!wheel.items.length)return;
  wheel.spinning=true;wheel.result=null;showResult();
  var start=wheel.rot,extra=(5+Math.random()*3)*2*Math.PI,dur=4200,t0=performance.now();
  function f(t){
    var p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);
    wheel.rot=start+extra*e;drawWheel();
    if(p<1)requestAnimationFrame(f);
    else{
      wheel.spinning=false;
      var n=wheel.items.length,seg=2*Math.PI/n,TWO=2*Math.PI;
      var ang=((-Math.PI/2-wheel.rot)%TWO+TWO)%TWO;
      wheel.result=wheel.items[Math.floor(ang/seg)%n];drawWheel();showResult();var r=$('#wres');if(r&&r.scrollIntoView)r.scrollIntoView({behavior:'smooth',block:'center'});
    }
  }
  requestAnimationFrame(f);
}
function showResult(){
  var el=$('#wres');if(!el)return;
  var m=wheel.result,sl={A:'el almuerzo',C:'la cena',M:'la merienda'}[S.htype];
  if(wheel.spinning){el.innerHTML='<div class="mut" style="padding:8px">Girando…</div>';return;}
  el.innerHTML=m?'<div class="card" style="text-align:left"><div class="mut">🎉 Para '+sl+' te tocó:</div><b style="font-size:19px;display:block;margin:4px 0 8px">'+m.name+'</b>'+badges(m)+
    '<div style="margin-top:12px"><button class="btn pri" onclick="useToday('+m.id+')">✅ Usar para hoy</button><button class="btn" onclick="showMeal('+m.id+')">Ver ingredientes</button><button class="btn" onclick="spin()">🎲 Girar de nuevo</button></div></div>':'';
}
function togglePantry(n){var i=S.pantry.indexOf(n);if(i>=0)S.pantry.splice(i,1);else S.pantry.push(n);save();renderChips();renderRes();}
/* Grupos: lo que marcás en "Tengo en casa" cubre a todos los de su grupo */
const GROUPS={
  'Pollo / pavita':['Pollo','Pavita'],
  'Carne vacuna':['Carne vacuna','Carne picada'],
  'Pescado':['Pescado blanco','Salmón'],
  'Mariscos':['Camarones','Mejillones'],
  'Queso':['Queso semiduro','Queso fresco','Muzzarella','Ricota','Queso rallado'],
  'Harinas y rebozadores':['Harina de almendras','Harina de trigo','Harina de garbanzos','Fécula de mandioca','Pan rallado','Salvado de avena'],
  'Arroz':['Arroz integral','Arroz yamaní'],
  'Fideos':['Fideos sin gluten','Fideos comunes','Fideos de legumbres'],
  'Quinoa, mijo y otros cereales':['Quinoa','Mijo','Trigo sarraceno','Amaranto'],
  'Legumbres':['Lentejas','Garbanzos','Porotos','Hummus'],
  'Frutos secos':['Frutos secos','Nueces','Almendras'],
  'Fruta':['Fruta de estación','Manzana','Banana','Frutos rojos'],
  'Espinaca / acelga':['Espinaca','Acelga'],
  'Lechuga / rúcula':['Lechuga','Rúcula'],
  'Brócoli / coliflor':['Brócoli','Coliflor'],
  'Cebolla / puerro / verdeo':['Cebolla','Puerro','Verdeo'],
  'Papa / batata':['Papa','Batata']
};
const OPCIONAL=['Semillas (mix)','Sésamo molido','Levadura nutricional','Coco rallado','Cacao amargo','Manteca','Queso rallado'];
const G2={};Object.keys(GROUPS).forEach(function(g){GROUPS[g].forEach(function(n){G2[n]=g;});});
function gOf(n){return G2[n]||n;}
S.pantry=S.pantry.map(gOf).filter(function(v,i,a){return a.indexOf(v)===i;});
function renderChips(){
  var q=S.hq.toLowerCase().trim(),map={};
  MEALS.filter(function(m){return fits(m,S.ptype);}).forEach(function(m){m.ings.forEach(function(i){if(OPCIONAL.indexOf(i.n)<0||G2[i.n])map[gOf(i.n)]=i.c;});});
  var h='';
  Object.keys(CATS).forEach(function(c){
    var l=Object.keys(map).filter(function(n){return map[n]===c&&(!q||n.toLowerCase().indexOf(q)>=0);}).sort();
    if(!l.length)return;
    h+='<div class="cat">'+CATS[c]+'</div><div class="chips">'+l.map(function(n){return '<button class="chip'+(S.pantry.indexOf(n)>=0?' on':'')+'" data-n="'+n.replace(/"/g,'')+'" onclick="togglePantry(this.dataset.n)">'+n+'</button>';}).join('')+'</div>';
  });
  $('#pchips').innerHTML=h;
}
function renderRes(){
  var el=$('#pres');if(!el)return;
  if(!S.pantry.length){el.innerHTML='<div class="mut">Marcá lo que tenés y te armo opciones de menú. Sal, aceite y especias se dan por sabidos.</div>';return;}
  var need=Math.min(2,S.pantry.length);
  var who=S.sel.map(function(k){return PROFILES.find(function(p){return p.k===k;}).n;}).join(' + ');
  var all=MEALS.filter(function(m){return fits(m,S.ptype);}).map(function(m){
    var req=m.ings.filter(function(i){return OPCIONAL.indexOf(i.n)<0;});
    var gs=[];req.forEach(function(i){var g=gOf(i.n);if(gs.indexOf(g)<0)gs.push(g);});
    var have=gs.filter(function(g){return S.pantry.indexOf(g)>=0;});
    var miss=gs.filter(function(g){return S.pantry.indexOf(g)<0;});
    return{m:m,have:have.length,miss:miss,tot:gs.length};
  }).filter(function(x){return x.have>=need;});
  var ya=all.filter(function(x){return !x.miss.length;}).sort(function(a,b){return b.have-a.have;});
  var casi=all.filter(function(x){return x.miss.length&&x.miss.length<=2;}).sort(function(a,b){return a.miss.length-b.miss.length||b.have-a.have;});
  function card(x){return '<div class="card meal" onclick="showMeal('+x.m.id+')"><b>'+x.m.name+'</b>'+badges(x.m)+(x.miss.length?'<div class="mut">Te falta: '+x.miss.join(', ')+'</div>':'')+'</div>';}
  var h='';
  if(ya.length)h+='<div class="cat ok">✅ Podés hacerlas ya ('+ya.length+')</div>'+ya.slice(0,25).map(card).join('');
  if(casi.length)h+='<div class="cat">🛒 Casi: te falta 1 o 2 cosas ('+casi.length+')</div>'+casi.slice(0,25).map(card).join('');
  el.innerHTML='<div class="mut" style="margin-bottom:6px">Solo comidas que sirven para '+who+'. Un plato aparece si usa al menos '+need+' de lo que marcaste.</div>'+(h||'<div class="mut">Con eso no encuentro comidas para este perfil. Probá sumar más ingredientes o cambiar de perfil arriba.</div>');
}

/* ===================== NAV / PERFILES ===================== */
function toggleProf(k){
  var i=S.sel.indexOf(k);
  if(i>=0){if(S.sel.length>1)S.sel.splice(i,1);}else S.sel.push(k);
  save();newWheel();render();
}
function renderHeader(){
  wsHeader();
  $('#profs').innerHTML=PROFILES.map(function(p){
    var on=S.sel.indexOf(p.k)>=0;
    return '<button class="pf'+(on?' on':'')+'" style="'+(on?'background:'+p.c+';border-color:'+p.c:'border-color:'+p.c)+'" onclick="toggleProf(\''+p.k+'\')">'+p.n+'</button>';
  }).join('');
}
const TABS=[['hoy','🎲','Hoy'],['semana','🗓️','Semana'],['comidas','🍽️','Comidas'],['casa','🧺','En casa'],['compras','🛒','Compras']];
function renderNav(){
  $('#nav').innerHTML=TABS.map(function(t){return '<button class="'+(S.tab===t[0]?'on':'')+'" onclick="S.tab=\''+t[0]+'\';render()"><span>'+t[1]+'</span>'+t[2]+'</button>';}).join('');
}
function render(){
  renderHeader();renderNav();
  if(S.tab==='semana')viewSemana();
  else if(S.tab==='comidas')viewComidas();
  else if(S.tab==='compras')viewCompras();
  else if(S.tab==='casa')viewCasa();
  else viewHoy();
  wsAfterRender();
  window.scrollTo(0,0);
}
if(WS.welcome){wsWelcome();}else{newWheel();render();wsAfterBoot();}
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').catch(function(){});}
