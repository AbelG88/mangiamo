/* ===== Mangiamo: asistente (wizard) =====
   Pantalla completa, una pregunta por paso. Modos:
   - 'first':  primer inicio (bienvenida, aviso legal, nombre del espacio, personas con su dieta)
   - 'space':  espacio nuevo desde Ajustes (nombre, personas con su dieta)
   - 'person': agregar una persona al espacio actual (nombre y dieta) */
var WZ=null;
var WZ_MAX_PEOPLE=10;
var WZ_SPACE_SUGGEST=['Mi casa','Nuestra casa','Familia'];
var WZ_FINE='Consultá y aprobá cualquier dieta con un nutricionista antes de seguirla.';

function wzSteps(){
  var s=[],m=WZ.mode;
  if(m==='first')s.push({id:'welcome'},{id:'legal'});
  if(m==='first'||m==='space')s.push({id:'space'});
  WZ.people.forEach(function(p,i){
    s.push({id:'pname',i:i},{id:'pdiet',i:i});
    if(m!=='person')s.push({id:'more',i:i});
  });
  if(m!=='person')s.push({id:'done'});
  return s;
}
function wzCur(){return wzSteps()[WZ.pos];}
/* La barra va por etapas, no por paso: no cambia de tamaño cuando se suman personas. */
function wzPhases(){
  var m=WZ.mode;
  if(m==='person')return[['pname'],['pdiet']];
  var f=[['space'],['pname','pdiet','more'],['done']];
  return m==='first'?[['welcome'],['legal']].concat(f):f;
}
function wzPhaseIndex(id){
  var ph=wzPhases();
  for(var k=0;k<ph.length;k++)if(ph[k].indexOf(id)>=0)return k;
  return 0;
}
function wzName(i){return wsClean(WZ.people[i].name,20);}
function wzDup(i){
  var nn=wsNorm(wzName(i));
  if(!nn)return false;
  for(var k=0;k<WZ.people.length;k++){if(k!==i&&wsNorm(wzName(k))===nn)return true;}
  if(WZ.mode==='person'&&WS&&WS.data)return WS.data.profiles.some(function(p){return wsNorm(p.n)===nn;});
  return false;
}
function wzCanGo(){
  var st=wzCur(),i=st.i||0;
  if(st.id==='legal')return WZ.adult&&WZ.terms;
  if(st.id==='space')return !!wsClean(WZ.space,30);
  if(st.id==='pname')return !!wzName(i)&&!wzDup(i);
  if(st.id==='pdiet'){
    var d=WZ.people[i].diets;
    return d.length>0&&(d[0]==='propia'||dietCount(d)>0);
  }
  return true;
}
function wzSyncGo(){
  var b=document.getElementById('wzgo');
  if(b)b.disabled=!wzCanGo();
  var st=wzCur();
  if(st.id==='pname'){
    var e=document.getElementById('wzerr');
    if(e)e.textContent=wzDup(st.i)?'Ya hay alguien con ese nombre.':'';
  }
}
function wzDietInfo(i){
  var p=WZ.people[i],nm=wzName(i)||'esta persona';
  if(!p.diets.length)return 'Podés elegir más de una.';
  if(p.diets[0]==='propia')return '✨ Al terminar te muestro el prompt para que tu IA arme las comidas de '+wsEsc(nm)+'.';
  var n=dietCount(p.diets);
  if(!n)return '⚠️ Con esa combinación no hay comidas. Probá quitar alguna.';
  if(n<60)return '👉 Hay '+n+' comidas. Son pocas: después podés sumar las tuyas con una IA.';
  return '👉 Hay '+n+' comidas para '+wsEsc(nm)+'.';
}
function wzColor(i){
  var base=WZ.mode==='person'&&WS&&WS.data?WS.data.profiles.length:0;
  return WS_COLORS[(base+i)%WS_COLORS.length];
}
function wzRow(i){
  var p=WZ.people[i],n=dietCount(p.diets),propia=p.diets[0]==='propia';
  var sub=wsEsc(dietLabel(p.diets))+' · '+(propia?'falta cargar sus comidas':n+' comidas');
  return '<div class="wz-row"><span class="pb" style="background:'+wzColor(i)+'">'+wsEsc((wzName(i)||'?')[0])+'</span><span><b>'+wsEsc(wzName(i))+'</b><small>'+sub+'</small></span></div>';
}
function wzChip(emoji,title,sub,on,click,extra){
  return '<button type="button" class="wz-chip" aria-pressed="'+(on?'true':'false')+'" onclick="'+click+'"'+(extra||'')+'><span class="wz-em">'+emoji+'</span><span>'+title+(sub?'<small>'+sub+'</small>':'')+'</span><span class="wz-ck">✓</span></button>';
}

function wzOpen(mode){
  WZ={mode:mode,pos:0,adult:false,terms:false,space:'',people:[{name:'',diets:[]}],busy:false};
  var ov=document.getElementById('wz');
  if(!ov){
    ov=document.createElement('div');
    ov.id='wz';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Asistente de Mangiamo');
    document.body.appendChild(ov);
  }
  wzRender(false);
}
function wzClose(){
  var ov=document.getElementById('wz');
  if(ov)ov.parentNode.removeChild(ov);
  WZ=null;
}
function wzNext(){if(WZ.pos<wzSteps().length-1&&wzCanGo()){WZ.pos++;wzRender(false);}}
function wzBack(){if(WZ.pos>0){WZ.pos--;wzRender(false);}}
function wzEnter(e){if(e.key==='Enter'&&wzCanGo()){e.preventDefault();wzNext();}}

function wzRender(same){
  var ov=document.getElementById('wz');
  if(!ov||!WZ)return;
  var steps=wzSteps(),st=steps[WZ.pos],i=st.i||0,first=WZ.mode==='first';
  var body='',foot=null,keep=0;
  if(same){var cb=document.getElementById('wzb');if(cb)keep=cb.scrollTop;}

  if(st.id==='welcome'){
    body='<div class="wz-in"><div class="wz-logo">🥑</div><h1>¡Hola! Soy Mangiamo</h1>'+
      '<p class="wz-p">¿Qué mangiamo hoy? Te ayudo a planificar la semana, armar la lista de compras y decidir qué comer. Son unas pocas preguntas, casi todo con un toque.</p>'+(first?'<button type="button" class="wz-link" onclick="bkRestoreUI()">Ya tengo un respaldo</button>':'')+'</div>';
    foot={t:'¡Dale!',a:'wzNext()'};
  }else if(st.id==='legal'){
    body='<div class="wz-in"><h2>Antes de empezar</h2>'+
      '<div class="wz-note">🔒 Tus datos se guardan <b>solo en este dispositivo</b>, cifrados. No hay cuentas ni servidor.<br>Después podés ponerle contraseña desde Ajustes y hacer backups para no perder nada.</div>'+
      wzChip('🙋','Soy mayor de 18 años','Si cargo datos de menores, lo hago yo como adulto responsable.',WZ.adult,'wzToggleAdult()')+
      wzChip('📄','Acepto los Términos y la Privacidad','Mangiamo no reemplaza a un profesional: consultá tu dieta con un/a nutricionista.',WZ.terms,'wzToggleTerms()')+
      '<div class="wz-fine"><button type="button" class="wz-link" onclick="lgOpen(\'terms\')">Leer términos</button> · <button type="button" class="wz-link" onclick="lgOpen(\'privacy\')">Leer privacidad</button></div>'+
      '</div>';
    foot={t:'Siguiente',a:'wzNext()'};
  }else if(st.id==='space'){
    body='<div class="wz-in"><h2>¿Cómo le ponemos a tu espacio?</h2><p class="wz-p">Es el nombre de tu casa o de tu grupo.</p>'+
      '<input class="wz-input" id="wzi" type="text" maxlength="30" value="'+wsEsc(WZ.space)+'" placeholder="Ej: Casa de Ana" oninput="wzSetSpace(this.value)" onkeydown="wzEnter(event)" autocomplete="off" aria-label="Nombre del espacio">'+
      '<div class="wz-sug">'+WZ_SPACE_SUGGEST.map(function(s){return '<button type="button" class="wz-pill" onclick="wzSuggest(this.textContent)">'+wsEsc(s)+'</button>';}).join('')+'</div></div>';
    foot={t:'Siguiente',a:'wzNext()'};
  }else if(st.id==='pname'){
    var title=WZ.mode==='person'?'¿Quién es la nueva persona?':(i===0?'¿Quién es la primera persona?':'¿Quién más come?');
    body='<div class="wz-in"><h2>'+title+'</h2><p class="wz-p">Escribí el nombre.</p>'+
      '<input class="wz-input" id="wzi" type="text" maxlength="20" value="'+wsEsc(WZ.people[i].name)+'" placeholder="Ej: Ana" oninput="wzSetName(this.value)" onkeydown="wzEnter(event)" autocomplete="off" aria-label="Nombre">'+
      '<div class="wz-err" id="wzerr" role="alert"></div></div>';
    foot={t:'Siguiente',a:'wzNext()'};
  }else if(st.id==='pdiet'){
    var ids=WZ.people[i].diets;
    body='<div class="wz-in"><h2>¿Qué dieta sigue '+wsEsc(wzName(i))+'?</h2><p class="wz-p wz-info" id="wzinfo">'+wzDietInfo(i)+'</p><div class="wz-list">'+
      DIETS.concat([DIET_CUSTOM]).map(function(d){return wzChip(d.emoji,wsEsc(d.name),wsEsc(d.desc),ids.indexOf(d.id)>=0,'wzToggleDiet(\''+d.id+'\')');}).join('')+
      '</div></div>';
    foot=WZ.mode==='person'?{t:'Agregar',a:'wzFinish()',n:WZ_FINE}:{t:'Siguiente',a:'wzNext()',n:WZ_FINE};
  }else if(st.id==='more'){
    body='<div class="wz-in"><h2>¿Alguien más come?</h2><p class="wz-p">Cada persona tiene su propia dieta.</p><div class="wz-list">'+
      WZ.people.map(function(_,k){return wzRow(k);}).join('')+'</div>'+
      wzChip('➕','Sumar otra persona','',false,'wzMore()',WZ.people.length>=WZ_MAX_PEOPLE?' disabled':'')+
      wzChip('✅','Listo, no hay nadie más','',false,'wzDone()')+'</div>';
  }else if(st.id==='done'){
    var pend=WZ.people.filter(function(p){return p.diets[0]==='propia';}).map(function(p){return wsEsc(wsClean(p.name,20));});
    body='<div class="wz-in"><div class="wz-logo">🎉</div><h2>¡Todo listo!</h2><p class="wz-p">Armé <b>'+wsEsc(wsClean(WZ.space,30))+'</b> para:</p><div class="wz-list">'+
      WZ.people.map(function(_,k){return wzRow(k);}).join('')+'</div>'+
      (pend.length?'<div class="wz-note">✨ Las comidas de '+pend.join(', ')+' las cargás con una IA: al empezar te muestro el prompt.</div>':'')+
      '</div>';
    foot={t:first?'¡Empezar ahora!':'Crear espacio',a:'wzFinish()',n:WZ_FINE};
  }

  var h='<div class="wz-top">'+
    (WZ.pos>0?'<button type="button" onclick="wzBack()" aria-label="Atrás">←</button>':'<span class="wz-sp"></span>')+
    '<div class="wz-prog" aria-hidden="true">'+wzPhases().map(function(_,k){return '<i'+(k<=wzPhaseIndex(st.id)?' class="on"':'')+'></i>';}).join('')+'</div>'+
    (first?'<span class="wz-sp"></span>':'<button type="button" onclick="wzClose()" aria-label="Cancelar">✕</button>')+
    '</div><div class="wz-body'+(same?' wz-same':'')+'" id="wzb">'+body+'</div>'+
    '<div class="wz-foot">'+(foot&&foot.n?'<p class="wz-fine">'+foot.n+'</p>':'')+(foot?'<button type="button" class="wz-go" id="wzgo" onclick="'+foot.a+'">'+foot.t+'</button>':'')+'</div>';
  ov.innerHTML=h;
  var b=document.getElementById('wzb');
  if(same&&b)b.scrollTop=keep;
  wzSyncGo();
  var inp=document.getElementById('wzi');
  if(inp&&!same){try{inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length);}catch(e){}}
}

/* ---------- acciones ---------- */
function wzToggleAdult(){WZ.adult=!WZ.adult;wzRender(true);}
function wzToggleTerms(){WZ.terms=!WZ.terms;wzRender(true);}
function wzSetSpace(v){WZ.space=v;wzSyncGo();}
function wzSuggest(t){
  WZ.space=t;
  var inp=document.getElementById('wzi');
  if(inp){inp.value=t;inp.focus();}
  wzSyncGo();
}
function wzSetName(v){WZ.people[wzCur().i].name=v;wzSyncGo();}
function wzToggleDiet(id){
  var i=wzCur().i,ids=WZ.people[i].diets,at=ids.indexOf(id);
  if(id==='propia'||id==='omni')WZ.people[i].diets=at>=0?[]:[id];
  else{
    ids=ids.filter(function(x){return x!=='omni'&&x!=='propia';});
    if(at>=0)ids=ids.filter(function(x){return x!==id;});else ids.push(id);
    WZ.people[i].diets=ids;
  }
  wzRender(true);
}
function wzMore(){
  var cur=wzCur().i;
  if(cur>=WZ.people.length-1){
    if(WZ.people.length>=WZ_MAX_PEOPLE)return;
    WZ.people.push({name:'',diets:[]});
  }
  WZ.pos++;wzRender(false);
}
function wzDone(){
  WZ.people.length=wzCur().i+1;
  WZ.pos++;wzRender(false);
}
function wzFinish(){
  if(!WZ||WZ.busy)return;
  WZ.busy=true;
  var btn=document.getElementById('wzgo');
  if(btn){btn.disabled=true;btn.textContent='Un momento…';}
  if(WZ.mode==='person'){
    var p=WZ.people[0],d=wsClone(),had=d.profiles.length,pr=wsAddProfile(d,p.name);
    if(!pr||d.profiles.length===had){
      WZ.busy=false;wzRender(true);
      wsToast(pr?'Ya hay alguien con ese nombre':'Se alcanzó el máximo de personas');
      return;
    }
    dietsApply(d,pr.k,p.diets);
    wsSave(d);
    if(p.diets[0]==='propia'){try{sessionStorage.setItem('mw_open','import');sessionStorage.setItem('mw_person',pr.k);}catch(e){}}
    wsReload(true);
    return;
  }
  var people=WZ.people.map(function(x){return{name:wzNameOf(x),diets:x.diets};});
  if(WZ.mode==='first')wsPut('morfiws_consent',{adult:true,terms:(typeof LG_VERSION!=='undefined'?LG_VERSION:''),at:new Date().toISOString()});
  var r=wsCreate(wsClean(WZ.space,30),people);
  if(r.custom){try{sessionStorage.setItem('mw_open','import');if(r.key)sessionStorage.setItem('mw_person',r.key);}catch(e){}}
  wsReload(false);
}
function wzNameOf(x){return wsClean(x.name,20);}

document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&WZ&&WZ.mode!=='first'&&document.getElementById('wz'))wzClose();
});
