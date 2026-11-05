/* ===== Mangiamo: aportes, contacto y legales (etapa e) ===== */
var AP_VERSION='1.0';
/* Contacto: si CONTACT_EMAIL y CONTACT_WA están vacíos, la sección se oculta. */
var CONTACT_EMAIL='abel.edgardo.garcia.88@gmail.com';
var CONTACT_WA='';   /* solo dígitos con código de país, ej: 5491112345678 */
var AP_LINKS=[
  {id:'mp',label:'Mercado Pago',url:'https://link.mercadopago.com.ar/abelg88',g:'ar'},
  {id:'caf',label:'Cafecito',url:'https://cafecito.app/abelg88',g:'ar'},
  {id:'pp',label:'PayPal',url:'https://paypal.me/AbelG88',g:'intl'},
  {id:'bmc',label:'Buy Me a Coffee',url:'https://buymeacoffee.com/abelg88',g:'intl'}
];
var AP_CFG='morfiws_ap',AP_EVERY_OPENS=15,AP_COOLDOWN_DAYS=7,AP_QUIET_DAYS=90;
var AP_KINDS=[
  {v:'idea',t:'Sugerencia o mejora',s:'Sugerencia',h:'Contame qué te gustaría que Mangiamo haga o haga mejor.'},
  {v:'custom',t:'App a medida o con funciones a elección',s:'App a medida',h:'Contame qué necesitás: para quién es, qué funciones querés y para cuándo.'},
  {v:'problem',t:'Algo no funciona',s:'Problema',h:'Qué estabas haciendo, qué pasó y qué esperabas que pasara.'},
  {v:'other',t:'Otro tema',s:'Consulta',h:'Escribí lo que quieras.'}
];
var AP_KIND='idea';

function apCfg(){var c=Vault.get(AP_CFG,null)||{};if(!c.last)c.last=Date.now();if(typeof c.opens!=='number')c.opens=0;return c;}
function apSave(c){Vault.set(AP_CFG,c);}
function apEsc(s){return wsEsc(s);}

/* ---------- ventana genérica (por encima del asistente) ---------- */
function apOverlay(title,body,foot){
  apClose();
  var o=document.createElement('div');o.id='apov';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label',title);
  o.innerHTML='<div class="ap-box"><div class="bar"><b>'+title+'</b><button onclick="apClose()" aria-label="Cerrar">✕</button></div><div class="ap-body">'+body+'</div>'+(foot||'')+'</div>';
  document.body.appendChild(o);
}
function apClose(){var o=document.getElementById('apov');if(o)o.remove();}

/* ---------- legales ---------- */
function lgOpen(kind){
  var note=LG_DRAFT?'<div class="warn">Texto pendiente de revisión legal.</div>':'';
  apOverlay(LG_TITLES[kind],note+'<div class="mut" style="margin-bottom:8px">Versión del '+LG_VERSION+'</div><div class="ap-text">'+LG[kind]+'</div>');
}

/* ---------- aportes ---------- */
function apLinksHTML(row){
  var G=[['ar','Desde Argentina'],['intl','Desde el exterior']];
  return G.map(function(g){
    var l=AP_LINKS.filter(function(x){return x.g===g[0];}).map(function(x){
      return '<a class="ap-link ap-'+x.id+'" href="'+x.url+'" target="_blank" rel="noopener noreferrer">'+x.label+'</a>';}).join('');
    return '<div class="cat" style="margin-top:10px">'+g[1]+'</div>'+(row?'<div class="ap-row">'+l+'</div>':l);
  }).join('');
}
function apPrompt(){
  var c=apCfg();c.last=Date.now();c.opens=0;apSave(c);
  apOverlay('',
    '<div style="text-align:center"><div class="ap-heart">💚</div><h2 style="margin:8px 0 6px">¿Te sirve Mangiamo?</h2>'+
    '<p class="mut" style="font-size:15px">Mangiamo es gratis y sin publicidad. Si te ayuda a organizar la semana, un aporte me permite seguir mejorándola. Es totalmente opcional.</p></div>'+
    apLinksHTML()+
    '<button class="btn" style="width:100%;margin:14px 0 0" onclick="apDonated()">Ya doné, ¡gracias! 💚</button><button class="btn" style="width:100%;margin:8px 0 0;background:transparent;color:var(--mut)" onclick="apClose()">Quizás más tarde</button>');
}
function apDonated(){var c=apCfg();c.quiet=Date.now()+AP_QUIET_DAYS*864e5;apSave(c);apClose();wsToast('¡Gracias! 💚');}
/* cuenta un ingreso por sesión y decide si toca pedir apoyo */
function apBoot(){
  if(WS.welcome)return;
  var c=apCfg(),counted=false;
  try{counted=sessionStorage.getItem('mw_apc')==='1';sessionStorage.setItem('mw_apc','1');}catch(e){}
  if(!counted)c.opens++;
  apSave(c);
  var now=Date.now();
  if(c.quiet&&now<c.quiet)return;
  if(now-c.last<AP_COOLDOWN_DAYS*864e5||c.opens<AP_EVERY_OPENS)return;
  setTimeout(function(){
    var busy=document.getElementById('wz')||document.getElementById('vlock')||document.getElementById('bkr')||document.getElementById('apov')||document.getElementById('bkbar')||(document.getElementById('modal')&&document.getElementById('modal').classList.contains('show'));
    if(!busy)apPrompt();
  },2500);
}

/* ---------- contacto ---------- */
function apContactOn(){return !!(CONTACT_EMAIL||CONTACT_WA);}
function apContactUI(){
  var k=AP_KINDS.filter(function(x){return x.v===AP_KIND;})[0];
  apOverlay('✉️ Contacto',
    '<p class="mut" style="font-size:14px">¿Una idea, un problema, o querés una app propia o con funciones a elección? Escribime. Se abre tu correo o WhatsApp con el mensaje armado; Mangiamo no envía nada por su cuenta ni adjunta tus datos.</p>'+
    '<div class="chips" style="margin:10px 0">'+AP_KINDS.map(function(x){return '<button class="chip'+(x.v===AP_KIND?' on':'')+'" onclick="AP_KIND=\''+x.v+'\';apContactKeep()">'+x.t+'</button>';}).join('')+'</div>'+
    '<textarea id="apmsg" rows="5" maxlength="1500" placeholder="'+apEsc(k.h)+'" oninput="apContactSync()"></textarea>'+
    '<div id="apout"></div>'+
    (CONTACT_EMAIL?'<button class="btn pri" id="apmail" onclick="apSendMail()" disabled>Abrir en mi correo</button>':'')+
    (CONTACT_WA?'<button class="btn" id="apwa" onclick="apSendWA()" disabled>Abrir en WhatsApp</button>':''));
}
function apContactKeep(){var m=document.getElementById('apmsg'),v=m?m.value:'';apContactUI();var n=document.getElementById('apmsg');if(n){n.value=v;apContactSync();}}
function apContactSync(){
  var ok=document.getElementById('apmsg').value.trim().length>=10;
  ['apmail','apwa'].forEach(function(id){var b=document.getElementById(id);if(b)b.disabled=!ok;});
}
function apMsg(){
  var k=AP_KINDS.filter(function(x){return x.v===AP_KIND;})[0];
  return{subject:'Mangiamo - '+k.s,body:document.getElementById('apmsg').value.trim().slice(0,1500)+'\n\n—\nMangiamo '+AP_VERSION};
}
function apSendMail(){
  var m=apMsg(),a=document.createElement('a');
  a.href='mailto:'+CONTACT_EMAIL+'?subject='+encodeURIComponent(m.subject)+'&body='+encodeURIComponent(m.body.replace(/\n/g,'\r\n'));
  document.body.appendChild(a);a.click();a.remove();
  document.getElementById('apout').innerHTML='<div class="mut" style="margin:8px 0">Se abrió tu correo: tocá <b>Enviar</b> ahí para que me llegue. Si no se abrió, escribime a <b>'+apEsc(CONTACT_EMAIL)+'</b>.</div>';
}
function apSendWA(){var m=apMsg();window.open('https://wa.me/'+CONTACT_WA+'?text='+encodeURIComponent(m.subject+'\n\n'+m.body),'_blank','noopener');}

/* ---------- sección de Ajustes ---------- */
/* aportes: arriba de todo en Ajustes */
function apTopHTML(){
  return '<div class="card ap-top"><b style="font-size:16px">💚 Apoyar Mangiamo</b><div class="mut" style="margin:4px 0 2px">Es gratis y sin publicidad. Si te ayuda, un aporte (opcional) permite seguir mejorándola.</div>'+apLinksHTML(true)+'</div>';
}
/* contacto y legales: al final */
function apSecHTML(){
  var h='';
  if(apContactOn())h+='<div class="cat">✉️ Contacto</div><div class="mut" style="margin-bottom:8px">Ideas, problemas, o una app propia o con funciones a elección.</div><button class="btn" onclick="apContactUI()">Escribirme</button>';
  h+='<div class="cat">📄 Legal</div><button class="btn" onclick="lgOpen(\'terms\')">Términos y condiciones</button><button class="btn" onclick="lgOpen(\'privacy\')">Política de privacidad</button>'+
     '<div class="mut" style="margin:6px 0 4px">Mangiamo '+AP_VERSION+' · Las dietas orientativas deben ser consultadas y aprobadas por un nutricionista.</div>';
  return h;
}

/* ---------- estilos ---------- */
(function(){
  var s=document.createElement('style');
  s.textContent='#apov{position:fixed;inset:0;z-index:210;background:rgba(15,23,42,.5);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);display:flex;align-items:flex-end;justify-content:center}'+
  '.ap-box{background:var(--card);color:var(--tx);width:100%;max-width:560px;border-radius:26px 26px 0 0;padding:20px 18px calc(20px + env(safe-area-inset-bottom));max-height:90vh;overflow:auto}'+
  '.ap-text h3{font-size:15px;margin:16px 0 4px}.ap-text p{font-size:14px;line-height:1.5;margin:0 0 8px;color:var(--tx)}'+
  '.ap-link{display:block;text-align:center;text-decoration:none;font-weight:700;border-radius:16px;padding:13px;margin:8px 0;color:#fff}'+
  '.ap-mp{background:#009ee3}.ap-caf{background:#0f766e}.ap-pp{background:#0070ba}.ap-bmc{background:#ffdd00;color:#0f172a}'+
  '.ap-top{background:var(--tint);box-shadow:none;margin-bottom:6px}.ap-row{display:flex;gap:8px}.ap-row .ap-link{flex:1;margin:6px 0;padding:11px 6px;font-size:14px}'+
  '.ap-heart{width:72px;height:72px;border-radius:24px;background:#fb7185;display:inline-flex;align-items:center;justify-content:center;font-size:36px}';
  document.head.appendChild(s);
})();
