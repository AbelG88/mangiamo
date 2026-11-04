/* ===== Mangiamo: almacenamiento cifrado en el dispositivo =====
   Todo lo que la app guarda (claves que empiezan con "morfi") se cifra con AES-GCM antes de ir a localStorage.
   Modos:
   - "device":   clave aleatoria no extraíble guardada en IndexedDB. No pide nada al abrir.
                 Protege de copias del almacenamiento, no de quien use el dispositivo desbloqueado.
   - "password": la clave sale de una contraseña (PBKDF2) y se pide al abrir. Si se olvida, no hay recuperación.
   - "plain":    el navegador no soporta cifrado (sin https o sin WebCrypto); se guarda sin cifrar, como antes.
   La app lee y escribe de forma síncrona contra una caché en memoria (Vault.get / set / del);
   las escrituras se cifran y se guardan enseguida. Antes de recargar la página hay que esperar Vault.flush(). */
var Vault=(function(){
'use strict';
var META='morfivault_meta',TAG='enc1:',ITER=600000,DB='morfi-vault',STORE='keys',CHECK='morfi-ok';
var supported=!!(window.crypto&&crypto.subtle&&window.indexedDB&&window.TextEncoder);
var te=supported?new TextEncoder():null,td=supported?new TextDecoder():null;
var mem={},dirty={},verify={},key=null,mode='plain',rekeying=false,sched=false,chain=Promise.resolve();
var api={mode:'plain',damaged:[],lastError:null,supported:supported,ready:null};

/* ---------- utilidades ---------- */
function b64e(buf){var b=new Uint8Array(buf),s='';for(var i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s);}
function b64d(s){var r=atob(s),b=new Uint8Array(r.length);for(var i=0;i<r.length;i++)b[i]=r.charCodeAt(i);return b;}
function enc(k,name,str){
  var iv=crypto.getRandomValues(new Uint8Array(12));
  return crypto.subtle.encrypt({name:'AES-GCM',iv:iv,additionalData:te.encode(name)},k,te.encode(str))
    .then(function(ct){return TAG+b64e(iv)+'.'+b64e(ct);});
}
function dec(k,name,blob){
  return Promise.resolve().then(function(){
    var p=blob.slice(TAG.length).split('.');
    return crypto.subtle.decrypt({name:'AES-GCM',iv:b64d(p[0]),additionalData:te.encode(name)},k,b64d(p[1]));
  }).then(function(pt){return td.decode(pt);});
}
function genKey(){return crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
function derive(pw,salt,iter){
  return crypto.subtle.importKey('raw',te.encode(String(pw).normalize('NFKC')),'PBKDF2',false,['deriveKey']).then(function(base){
    return crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:iter,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  });
}

/* ---------- IndexedDB (clave del dispositivo) ---------- */
function idb(fn){
  return new Promise(function(res,rej){
    var r=indexedDB.open(DB,1);
    r.onupgradeneeded=function(){r.result.createObjectStore(STORE);};
    r.onerror=function(){rej(r.error);};
    r.onsuccess=function(){
      var db=r.result,tx=db.transaction(STORE,'readwrite'),q=fn(tx.objectStore(STORE));
      tx.oncomplete=function(){db.close();res(q&&q.result);};
      tx.onerror=tx.onabort=function(){db.close();rej(tx.error);};
    };
  });
}
function idbGet(n){return idb(function(s){return s.get(n);});}
function idbPut(n,v){return idb(function(s){return s.put(v,n);});}
function idbDel(n){return idb(function(s){return s.delete(n);});}

/* ---------- localStorage ---------- */
function lsKeys(){var o=[];try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('morfi')===0&&k.indexOf('morfivault')!==0)o.push(k);}}catch(e){}return o;}
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true;}catch(e){api.lastError=e;return false;}}
function lsDel(k){try{localStorage.removeItem(k);}catch(e){}}
function readMeta(){try{return JSON.parse(localStorage.getItem(META));}catch(e){return null;}}
function writeMeta(m){return lsSet(META,JSON.stringify(m));}

/* ---------- escritura ---------- */
function writeOne(name){
  var s=mem[name];
  if(s===undefined){lsDel(name);return Promise.resolve();}
  if(mode==='plain'||!key){lsSet(name,s);return Promise.resolve();}
  var check=verify[name];delete verify[name];
  return enc(key,name,s).then(function(blob){
    if(mem[name]===undefined){lsDel(name);return;}
    if(!check){lsSet(name,blob);return;}
    /* migración: solo se pisa el dato en claro si se puede descifrar de vuelta igual */
    return dec(key,name,blob).then(function(back){
      if(back===s)lsSet(name,blob);else api.lastError=new Error('verify '+name);
    });
  });
}
function runFlush(){
  chain=chain.then(function(){
    if(rekeying)return;
    var ks=Object.keys(dirty);dirty={};
    return Promise.all(ks.map(writeOne));
  }).catch(function(e){api.lastError=e;});
  return chain;
}
function schedule(){
  if(sched)return;
  sched=true;
  Promise.resolve().then(function(){sched=false;runFlush();});
}

/* ---------- carga ---------- */
function loadAll(k){
  var ks=lsKeys(),encCount=0,bad=[];
  return Promise.all(ks.map(function(name){
    var v=lsGet(name);
    if(v===null)return;
    if(v.indexOf(TAG)!==0){mem[name]=v;dirty[name]=1;verify[name]=1;return;}
    encCount++;
    if(!k){bad.push(name);return;}
    return dec(k,name,v).then(function(s){mem[name]=s;},function(){bad.push(name);});
  })).then(function(){return{encCount:encCount,bad:bad};});
}
function finishLoad(k){
  return loadAll(k).then(function(r){
    if(r.encCount>0&&r.bad.length===r.encCount)return Promise.reject('lost');
    api.damaged=r.bad;
    return runFlush();
  });
}

/* ---------- pantallas (bloqueo / error) ---------- */
function overlay(html){
  var o=document.getElementById('vlock');
  if(!o){
    o=document.createElement('div');o.id='vlock';
    o.style.cssText='position:fixed;left:0;top:0;right:0;bottom:0;z-index:100;background:var(--bg);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto';
    document.body.appendChild(o);
  }
  o.innerHTML='<div class="card" style="max-width:420px;width:100%">'+html+'</div>';
  return o;
}
function hideOverlay(){var o=document.getElementById('vlock');if(o)o.parentNode.removeChild(o);}
function eraseAndReload(msg){
  if(!confirm(msg))return;
  wipe().then(function(){location.reload();});
}
function lostScreen(){
  overlay('<h1 style="font-size:20px;margin-bottom:6px">⚠️ No se pueden leer los datos</h1>'+
    '<p class="mut" style="font-size:14px">Los datos de este dispositivo están cifrados y el navegador ya no tiene la clave (suele pasar al borrar los datos del sitio). No hay forma de recuperarlos desde acá.</p>'+
    '<p class="mut" style="font-size:14px">Si tenés un backup, empezá de nuevo y restauralo.</p>'+
    '<button class="btn pri" id="vwipe">Empezar de nuevo</button>');
  document.getElementById('vwipe').onclick=function(){eraseAndReload('Se borran los datos cifrados de este dispositivo. No se puede deshacer. ¿Continuar?');};
}
function askPassword(meta){
  return new Promise(function(resolve,reject){
    var fails=0,busy=false;
    overlay('<h1 style="font-size:22px;margin-bottom:6px">🔒 Mangiamo</h1>'+
      '<p class="mut" style="font-size:14px">Ingresá tu contraseña para abrir la app.</p>'+
      '<input type="password" id="vpw" autocomplete="current-password" style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--bd);background:var(--card);color:var(--tx);font-size:15px;margin-bottom:10px">'+
      '<div id="verr"></div>'+
      '<button class="btn pri" id="vgo">Abrir</button>'+
      '<details style="margin-top:10px"><summary>Olvidé mi contraseña</summary>'+
      '<p>No hay forma de recuperarla: los datos están cifrados con ella. Si tenés un backup, podés borrar los datos de este dispositivo y restaurarlo.</p>'+
      '<button class="btn" id="vwipe2" style="color:#dc2626">Borrar los datos de este dispositivo</button></details>');
    var inp=document.getElementById('vpw'),go=document.getElementById('vgo'),err=document.getElementById('verr');
    function say(t){err.className='warn';err.textContent=t;}
    function attempt(){
      if(busy||!inp.value)return;
      busy=true;go.disabled=true;go.textContent='Abriendo…';
      derive(inp.value,b64d(meta.salt),meta.iter).then(function(k){
        return dec(k,'check',meta.check).then(function(s){
          if(s!==CHECK)throw 0;
          key=k;mode='password';api.mode=mode;
          hideOverlay();
          resolve();
        });
      }).catch(function(){
        fails++;busy=false;
        say('Contraseña incorrecta.');
        var wait=fails>2?Math.min(30,(fails-2)*5):0;
        go.textContent='Abrir';inp.select();
        if(wait){
          go.disabled=true;
          var t=setInterval(function(){wait--;if(wait<=0){clearInterval(t);go.disabled=false;go.textContent='Abrir';}else go.textContent='Esperá '+wait+' s';},1000);
          go.textContent='Esperá '+wait+' s';
        }else go.disabled=false;
      });
    }
    go.onclick=attempt;
    inp.onkeydown=function(e){if(e.key==='Enter')attempt();};
    document.getElementById('vwipe2').onclick=function(){eraseAndReload('Se borran todos los datos de este dispositivo. No se puede deshacer. ¿Continuar?');};
    setTimeout(function(){try{inp.focus();}catch(e){}},50);
  });
}

/* ---------- arranque ---------- */
function loadPlain(){
  mode='plain';api.mode=mode;
  lsKeys().forEach(function(n){var v=lsGet(n);if(v!==null&&v.indexOf(TAG)!==0)mem[n]=v;});
  return Promise.resolve();
}
function deviceKey(allowCreate){
  return idbGet('device').then(function(k){
    if(k)return k;
    if(!allowCreate)return null;
    return genKey().then(function(nk){return idbPut('device',nk).then(function(){return nk;});});
  });
}
function init(){
  if(!supported)return loadPlain();
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();}catch(e){}
  var meta=readMeta();
  if(meta&&meta.mode==='password'){
    return askPassword(meta).then(function(){return finishLoad(key);});
  }
  var hasEnc=lsKeys().some(function(n){var v=lsGet(n);return v&&v.indexOf(TAG)===0;});
  return deviceKey(!hasEnc||!meta).then(function(k){
    if(!k)return Promise.reject('lost');
    key=k;mode='device';api.mode=mode;
    if(!meta||meta.mode!=='device')writeMeta({v:1,mode:'device'});
    return finishLoad(k);
  });
}

/* ---------- cambio de clave ---------- */
function rekey(newKey,newMeta){
  var names=Object.keys(mem);
  return Promise.all(names.map(function(n){return enc(newKey,n,mem[n]).then(function(b){return[n,b];});})).then(function(pairs){
    pairs.forEach(function(p){if(mem[p[0]]!==undefined)lsSet(p[0],p[1]);});
    writeMeta(newMeta);
    key=newKey;mode=newMeta.mode;api.mode=mode;
  });
}
function checkPassword(pw){
  var m=readMeta();
  if(!m||m.mode!=='password')return Promise.resolve(false);
  return derive(pw,b64d(m.salt),m.iter).then(function(k){return dec(k,'check',m.check);}).then(function(s){return s===CHECK;},function(){return false;});
}
function done(){rekeying=false;runFlush();}
function setPassword(pw,oldPw){
  pw=String(pw||'');
  if(!supported||mode==='plain')return Promise.reject(new Error('unsupported'));
  if(pw.length<6)return Promise.reject(new Error('short'));
  var pre=mode==='password'?checkPassword(oldPw).then(function(ok){if(!ok)throw new Error('badpw');}):Promise.resolve();
  var salt=crypto.getRandomValues(new Uint8Array(16));
  return pre.then(runFlush).then(function(){
    rekeying=true;
    return derive(pw,salt,ITER);
  }).then(function(nk){
    return enc(nk,'check',CHECK).then(function(chk){
      return rekey(nk,{v:1,mode:'password',salt:b64e(salt),iter:ITER,check:chk});
    });
  }).then(function(){return idbDel('device').catch(function(){});}).then(done,function(e){done();throw e;});
}
function removePassword(pw){
  if(mode!=='password')return Promise.reject(new Error('mode'));
  return checkPassword(pw).then(function(ok){
    if(!ok)throw new Error('badpw');
    return runFlush();
  }).then(function(){
    rekeying=true;
    return genKey();
  }).then(function(nk){
    return idbPut('device',nk).then(function(){return rekey(nk,{v:1,mode:'device'});});
  }).then(done,function(e){done();throw e;});
}
function wipe(){
  lsKeys().forEach(lsDel);lsDel(META);
  return(supported?idbDel('device'):Promise.resolve()).catch(function(){});
}

/* ---------- API pública ---------- */
api.get=function(k,d){
  var s=mem[k];
  if(s===undefined||s===null)return d;
  try{return JSON.parse(s);}catch(e){return d;}
};
api.set=function(k,v){
  var s=JSON.stringify(v);
  mem[k]=s;
  if(mode==='plain'){lsSet(k,s);return;}
  dirty[k]=1;schedule();
};
api.del=function(k){delete mem[k];delete dirty[k];lsDel(k);};
api.keys=function(prefix){return Object.keys(mem).filter(function(k){return k.indexOf(prefix||'')===0;});};
api.flush=function(){return runFlush();};
api.setPassword=setPassword;
api.removePassword=removePassword;
api.checkPassword=checkPassword;
api.wipe=wipe;

api.ready=init().catch(function(e){
  var hasEnc=lsKeys().some(function(n){var v=lsGet(n);return v&&v.indexOf(TAG)===0;});
  if(e!=='lost'&&!hasEnc&&!readMeta()){
    /* el navegador no deja usar IndexedDB (p. ej. ventana privada): se sigue sin cifrar */
    mem={};dirty={};verify={};key=null;
    return loadPlain();
  }
  lostScreen();
  return new Promise(function(){});
});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')runFlush();});
window.addEventListener('pagehide',function(){runFlush();});
return api;
})();
