/* ===== Mangiamo: copias de seguridad (etapa b) =====
   - Un archivo con TODO lo que hay en este dispositivo (todos los espacios, semanas, compras),
     cifrado con una contraseña propia del backup (AES-GCM + PBKDF2).
   - Se comparte con el menú del celu (Gmail, Drive, WhatsApp...) o se descarga.
   - Recordatorio cada X días. Restaurar desde Ajustes o desde la bienvenida. */

var BK_ITER=600000,BK_APP='morfi-backup',BK_CFG='morfiws_bk',BK_MINPW=6;
var BK_SKIP=/^(morfivault|morfiws_bk$|morfi_|morfiws_hasfam$|morfiws_migrated$)/;

/* ---------- utilidades ---------- */
function bkB64(u8){var s='',i,n=0x8000;for(i=0;i<u8.length;i+=n)s+=String.fromCharCode.apply(null,u8.subarray(i,i+n));return btoa(s);}
function bkUnB64(b){var s=atob(b),u=new Uint8Array(s.length),i;for(i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u;}
function bkOk(){return !!(window.crypto&&crypto.subtle&&window.TextEncoder);}
function bkKey(pw,salt,iter){
  var te=new TextEncoder();
  return crypto.subtle.importKey('raw',te.encode(pw),'PBKDF2',false,['deriveKey']).then(function(m){
    return crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:iter,hash:'SHA-256'},m,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  });
}
function bkCfg(){var c=Vault.get(BK_CFG,null)||{};if(typeof c.days!=='number')c.days=7;return c;}
function bkSave(c){Vault.set(BK_CFG,c);}
function bkDate(t){var d=new Date(t||Date.now()),p=function(n){return (n<10?'0':'')+n;};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());}
function bkAgo(t){
  if(!t)return 'nunca';
  var d=Math.floor((Date.now()-t)/864e5);
  return d<=0?'hoy':d===1?'ayer':'hace '+d+' días';
}

/* ---------- armar y abrir el archivo ---------- */
function bkCollect(){
  var keys={};
  Vault.keys('morfi').forEach(function(k){if(!BK_SKIP.test(k))keys[k]=Vault.get(k,null);});
  return{app:BK_APP,v:1,at:Date.now(),keys:keys};
}
function bkEncrypt(payload,pw){
  var salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  return bkKey(pw,salt,BK_ITER).then(function(k){
    return crypto.subtle.encrypt({name:'AES-GCM',iv:iv,additionalData:new TextEncoder().encode(BK_APP)},k,new TextEncoder().encode(JSON.stringify(payload)));
  }).then(function(ct){
    return{app:BK_APP,v:1,cifrado:'aes-gcm',kdf:'pbkdf2-sha256',iter:BK_ITER,salt:bkB64(salt),iv:bkB64(iv),datos:bkB64(new Uint8Array(ct)),
      nota:'Copia de seguridad de Mangiamo. Está cifrada: sólo se abre con la contraseña que le pusiste.'};
  });
}
function bkDecrypt(env,pw){
  if(!env||env.app!==BK_APP||!env.datos||!env.salt||!env.iv)return Promise.reject(new Error('formato'));
  var iter=env.iter;
  if(typeof iter!=='number'||iter<100000||iter>5000000)return Promise.reject(new Error('formato'));
  return bkKey(pw,bkUnB64(env.salt),iter).then(function(k){
    return crypto.subtle.decrypt({name:'AES-GCM',iv:bkUnB64(env.iv),additionalData:new TextEncoder().encode(BK_APP)},k,bkUnB64(env.datos));
  }).then(function(pt){
    var p=JSON.parse(new TextDecoder().decode(pt));
    if(!p||p.app!==BK_APP||!p.keys||typeof p.keys!=='object')throw new Error('formato');
    return p;
  },function(){throw new Error('clave');});
}

/* ---------- hacer el backup ---------- */
function bkSecHTML(){
  var c=bkCfg(),h='<div class="cat">💾 Copia de seguridad</div>'+
  '<div class="mut" style="margin-bottom:8px">Último backup: <b>'+bkAgo(c.last)+'</b>. Guarda todo lo que hay en este dispositivo en un archivo cifrado con una contraseña. Si cambiás de celu o se borran los datos del navegador, lo recuperás desde ahí.</div>'+
  '<button class="btn pri" onclick="bkUI()">💾 Hacer backup</button><button class="btn" onclick="bkRestoreUI()">📂 Restaurar un backup</button>'+
  '<div style="margin-top:8px"><label class="mut" for="bkdays">Recordarme hacer un backup: </label>'+
  '<select id="bkdays" onchange="bkSetDays(this.value)">'+[[7,'cada 7 días'],[15,'cada 15 días'],[30,'cada 30 días'],[0,'nunca']].map(function(o){
    return '<option value="'+o[0]+'"'+(c.days===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select></div>';
  return h;
}
function bkSetDays(v){var c=bkCfg();c.days=parseInt(v,10)||0;delete c.snooze;bkSave(c);wsToast(c.days?'Te voy a avisar cada '+c.days+' días':'Sin recordatorios');}
function bkUI(){
  if(!bkOk()){wsModal('<div class="bar"><b>💾 Hacer backup</b><button onclick="closeModal()">✕</button></div><div class="warn">Este navegador no permite cifrar. Abrí la app por https desde un navegador actualizado.</div>');return;}
  var bar=document.getElementById('bkbar');if(bar)bar.remove();
  wsModal('<div class="bar"><b>💾 Hacer backup</b><button onclick="closeModal()">✕</button></div>'+
  '<div class="mut" style="margin-bottom:8px">Elegí una contraseña para este archivo. Se la vas a pedir al restaurarlo (puede ser distinta a la de la app).</div>'+
  '<input type="password" id="bkp1" placeholder="Contraseña del backup" autocomplete="new-password" aria-label="Contraseña del backup">'+
  '<input type="password" id="bkp2" placeholder="Repetila" autocomplete="new-password" aria-label="Repetir contraseña" style="margin-top:8px">'+
  '<div class="warn" style="margin-top:10px">⚠️ Si la olvidás, <b>no hay forma de abrir el backup</b>. Anotala en un lugar seguro.</div>'+
  '<div id="bkmsg"></div><button class="btn pri" id="bkgo" onclick="bkMake()">Crear y compartir</button><button class="btn" onclick="closeModal()">Cancelar</button>');
}
function bkMake(){
  var a=document.getElementById('bkp1').value,b=document.getElementById('bkp2').value;
  if(a.length<BK_MINPW){wsErr('bkmsg','La contraseña necesita al menos '+BK_MINPW+' caracteres.');return;}
  if(a!==b){wsErr('bkmsg','Las contraseñas no coinciden.');return;}
  var go=document.getElementById('bkgo');go.disabled=true;go.textContent='Cifrando…';
  Vault.flush().then(function(){return bkEncrypt(bkCollect(),a);}).then(function(env){
    var name='mangiamo-respaldo-'+bkDate()+'.json',text=JSON.stringify(env),file=null;
    try{file=new File([text],name,{type:'application/json'});}catch(e){}
    var done=function(how){var c=bkCfg();c.last=Date.now();delete c.snooze;bkSave(c);closeModal();wsToast(how);};
    if(file&&navigator.canShare&&navigator.canShare({files:[file]})){
      return navigator.share({files:[file],title:'Backup de Mangiamo',text:'Backup de Mangiamo del '+bkDate()}).then(function(){done('Backup compartido');},function(e){
        if(e&&e.name==='AbortError'){go.disabled=false;go.textContent='Crear y compartir';return;}
        bkDownload(name,text);done('Backup descargado');
      });
    }
    bkDownload(name,text);done('Backup descargado');
  }).catch(function(){go.disabled=false;go.textContent='Crear y compartir';wsErr('bkmsg','No se pudo crear el backup. Probá de nuevo.');});
}
function bkDownload(name,text){
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));
  a.download=name;document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1000);
}

/* ---------- recordatorio ---------- */
function bkRemind(){
  if(WS.welcome||!bkOk())return;
  var c=bkCfg(),now=Date.now();
  if(!c.since){c.since=now;bkSave(c);return;}
  if(!c.days)return;
  var ref=c.last||c.since;
  if(now-ref<c.days*864e5||(c.snooze&&now<c.snooze))return;
  if(document.getElementById('bkbar'))return;
  var el=document.createElement('div');el.id='bkbar';el.setAttribute('role','status');
  el.innerHTML='<span>💾 '+(c.last?'Hace '+Math.floor((now-c.last)/864e5)+' días que no hacés un backup.':'Todavía no hiciste ningún backup.')+'</span>'+
    '<button onclick="bkUI()">Hacer ahora</button><button class="x" aria-label="Más tarde" onclick="bkLater()">✕</button>';
  document.body.appendChild(el);
}
function bkLater(){var c=bkCfg();c.snooze=Date.now()+864e5;bkSave(c);var b=document.getElementById('bkbar');if(b)b.remove();}

/* ---------- restaurar ---------- */
var BK_ENV=null;
function bkRestoreUI(){
  closeModalSafe();
  var ov=document.getElementById('bkr');if(ov)ov.remove();
  ov=document.createElement('div');ov.id='bkr';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
  ov.innerHTML='<div class="bkr-box"><div class="bar"><b>📂 Restaurar un backup</b><button onclick="bkRestoreClose()" aria-label="Cerrar">✕</button></div>'+
  '<div class="mut" style="margin-bottom:8px">Elegí el archivo <b>mangiamo-respaldo-….json</b> y escribí su contraseña.</div>'+
  '<input type="file" id="bkf" accept=".json,application/json" onchange="bkPick(this)" aria-label="Archivo de backup">'+
  '<div id="bkfn" class="mut" style="margin:6px 0"></div>'+
  '<input type="password" id="bkrp" placeholder="Contraseña del backup" autocomplete="off" aria-label="Contraseña del backup">'+
  '<div id="bkrmsg" style="margin-top:8px"></div>'+
  '<button class="btn pri" id="bkrgo" onclick="bkRestoreCheck()">Abrir backup</button><button class="btn" onclick="bkRestoreClose()">Cancelar</button></div>';
  document.body.appendChild(ov);
}
function closeModalSafe(){try{closeModal();}catch(e){}}
function bkRestoreClose(){var o=document.getElementById('bkr');if(o)o.remove();BK_ENV=null;}
function bkPick(inp){
  BK_ENV=null;var f=inp.files&&inp.files[0],n=document.getElementById('bkfn');
  if(!f)return;
  if(f.size>20*1024*1024){n.textContent='El archivo es demasiado grande.';return;}
  var r=new FileReader();
  r.onload=function(){
    try{var e=JSON.parse(String(r.result));if(!e||e.app!==BK_APP)throw 0;BK_ENV=e;n.textContent='📄 '+f.name;}
    catch(x){n.textContent='';wsErr('bkrmsg','Ese archivo no es un backup de Mangiamo.');}
  };
  r.readAsText(f);
}
function bkRestoreCheck(){
  var pw=document.getElementById('bkrp').value;
  if(!BK_ENV){wsErr('bkrmsg','Elegí primero el archivo de backup.');return;}
  if(!pw){wsErr('bkrmsg','Escribí la contraseña del backup.');return;}
  var go=document.getElementById('bkrgo');go.disabled=true;go.textContent='Abriendo…';
  bkDecrypt(BK_ENV,pw).then(function(p){
    var spaces=[],ks=Object.keys(p.keys);
    (p.keys.morfiws_list||[]).forEach(function(s){if(s&&s.name)spaces.push(wsEsc(s.name));});
    window.BK_PAYLOAD=p;
    var box=document.querySelector('#bkr .bkr-box');
    box.innerHTML='<div class="bar"><b>📂 Backup abierto</b><button onclick="bkRestoreClose()" aria-label="Cerrar">✕</button></div>'+
    '<div class="mut">Del '+bkDate(p.at)+' · '+ks.length+' datos'+(spaces.length?' · '+spaces.join(', '):'')+'</div>'+
    '<div class="warn" style="margin-top:10px">⚠️ Esto <b>reemplaza todo</b> lo que hay hoy en este dispositivo por el contenido del backup.</div>'+
    '<button class="btn pri" id="bkrgo2" onclick="bkRestoreApply()">Restaurar</button><button class="btn" onclick="bkRestoreClose()">Cancelar</button>';
  },function(e){
    go.disabled=false;go.textContent='Abrir backup';
    wsErr('bkrmsg',e&&e.message==='clave'?'Contraseña incorrecta, o el archivo está dañado.':'Ese archivo no es un backup válido.');
  });
}
function bkRestoreApply(){
  var p=window.BK_PAYLOAD;if(!p)return;
  var b=document.getElementById('bkrgo2');if(b){b.disabled=true;b.textContent='Restaurando…';}
  var cfg=bkCfg();
  Vault.keys('morfi').forEach(function(k){if(!BK_SKIP.test(k))Vault.del(k);});
  Object.keys(p.keys).forEach(function(k){
    if(k.indexOf('morfi')===0&&!BK_SKIP.test(k)&&p.keys[k]!==null)Vault.set(k,p.keys[k]);
  });
  cfg.last=Date.now();cfg.since=cfg.since||cfg.last;delete cfg.snooze;bkSave(cfg);
  window.BK_PAYLOAD=null;
  try{sessionStorage.removeItem('mw_open');}catch(e){}
  Vault.flush().then(function(){location.reload();},function(){location.reload();});
}

/* ---------- estilos ---------- */
(function(){
  var s=document.createElement('style');
  s.textContent='#bkbar{position:fixed;left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:40;background:#0f172a;color:#fff;border-radius:14px;padding:10px 12px;display:flex;align-items:center;gap:8px;font-size:14px;box-shadow:0 4px 16px rgba(0,0,0,.25)}'+
  '#bkbar span{flex:1}#bkbar button{background:#3b82f6;color:#fff;border:0;border-radius:10px;padding:8px 12px;font-weight:700;font-size:14px}#bkbar button.x{background:transparent;padding:8px;color:#cbd5e1}'+
  '#bkr{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center}'+
  '.bkr-box{background:var(--card);color:var(--fg,inherit);width:100%;max-width:560px;border-radius:18px 18px 0 0;padding:14px 16px calc(16px + env(safe-area-inset-bottom));max-height:90vh;overflow:auto}'+
  '.wz-link{background:none;border:0;color:var(--mut);text-decoration:underline;font-size:15px;padding:14px 8px;margin-top:6px}';
  document.head.appendChild(s);
})();
