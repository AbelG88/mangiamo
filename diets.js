/* ===== Mangiamo: dietas por defecto =====
   Se arman filtrando el banco de comidas (data.js + las recetas de DIET_MEAL_EXTRA) con reglas sobre los ingredientes.
   Son orientativas: toda dieta debe ser consultada y aprobada por un nutricionista.
   Formato de comidas igual que data.js: Nombre|tipo(A almuerzo, C cena, AC ambas, M merienda)|k|Ingred:cantidad por persona|tip
   Ingredientes: Nombre|unidad|categoría(C carnes, V verduras y frutas, L lácteos y huevos, A almacén)|flags */

var DIET_ING_EXTRA=`
Tofu|g|A|L
Leche vegetal|ml|A|
Leche de coco|ml|A|
Soja texturizada|g|A|L
Arvejas|g|V|L
Choclo|g|V|P
Tomate triturado|g|A|
Aceitunas|g|A|
Pasta de maní|g|A|
Tahini|g|A|
Avena (copos)|g|A|GW
Maní|g|A|
Tortilla de trigo (wrap)|u|A|GW
`;

var DIET_MEAL_EXTRA=`
Guiso de lentejas con verduras|A|-|Lentejas:80,Zanahoria:50,Cebolla:40,Zapallo/Calabaza:80,Tomate:60
Lentejas con arroz integral y espinaca|AC|-|Lentejas:60,Arroz integral:50,Espinaca:60,Cebolla:30
Ensalada tibia de lentejas y remolacha|AC|-|Lentejas:60,Remolacha:80,Rúcula:30,Nueces:10
Sopa crema de lentejas y zanahoria|C|-|Lentejas:60,Zanahoria:80,Cebolla:30,Leche vegetal:100
Curry de garbanzos y espinaca con arroz|AC|-|Garbanzos:70,Espinaca:80,Tomate triturado:100,Arroz integral:60,Leche de coco:50
Garbanzos salteados con calabaza y quinoa|AC|-|Garbanzos:60,Zapallo/Calabaza:100,Quinoa:50
Ensalada de garbanzos, pepino y tomate|AC|-|Garbanzos:70,Pepino:60,Tomate:60,Cebolla:20,Aceitunas:15
Hamburguesas de garbanzos y avena|AC|k|Garbanzos:70,Avena (copos):20,Zanahoria:40,Lechuga:40
Falafel al horno con tahini y ensalada|AC|-|Garbanzos:70,Tahini:15,Pepino:60,Tomate:60
Porotos con arroz y choclo|AC|-|Porotos:70,Arroz integral:60,Choclo:60,Morrón:40
Chili de porotos y soja texturizada|AC|-|Porotos:60,Soja texturizada:30,Tomate triturado:120,Morrón:50,Cebolla:40|Hidratá la soja texturizada 10 minutos en agua caliente y escurrila.
Guiso de porotos y zapallo|A|-|Porotos:80,Zapallo/Calabaza:100,Cebolla:40,Morrón:30
Estofado de lentejas y papa|A|-|Lentejas:70,Papa:100,Zanahoria:50,Cebolla:40
Bowl de quinoa, palta y garbanzos|AC|-|Quinoa:60,Palta:0.5,Garbanzos:50,Tomate:60,Pepino:50
Bowl de arroz yamaní, tofu y brócoli|AC|-|Arroz yamaní:60,Tofu:100,Brócoli:100
Bowl de mijo, vegetales asados y hummus|AC|-|Mijo:60,Zapallito/Zucchini:80,Morrón:50,Hummus:30
Quinoa con vegetales salteados|AC|k|Quinoa:60,Zanahoria:60,Zapallito/Zucchini:80,Cebolla:30
Risotto de arroz integral y hongos|AC|-|Arroz integral:70,Hongos:120,Cebolla:30,Levadura nutricional:5
Arroz integral con vegetales salteados|AC|k|Arroz integral:70,Zanahoria:50,Chauchas:60,Cebolla:30
Arroz yamaní con lentejas y calabaza|AC|-|Arroz yamaní:50,Lentejas:50,Zapallo/Calabaza:100
Polenta cremosa con hongos|AC|-|Polenta:60,Hongos:120,Cebolla:30,Levadura nutricional:5
Polenta con salsa de tomate y berenjena|AC|k|Polenta:70,Tomate triturado:120,Berenjena:100
Trigo sarraceno con espinaca y nueces|AC|-|Trigo sarraceno:60,Espinaca:80,Nueces:10,Cebolla:30
Amaranto con vegetales y semillas|AC|-|Amaranto:50,Zanahoria:50,Brócoli:80,Semillas (mix):10
Sopa de verduras con fideos|C|k|Fideos comunes:40,Zanahoria:50,Zapallo/Calabaza:60,Puerro:40,Acelga:40
Fideos con salsa de tomate casera|AC|k|Fideos comunes:90,Tomate triturado:120,Cebolla:30
Fideos con verduras salteadas|AC|-|Fideos comunes:80,Zapallito/Zucchini:100,Morrón:50,Cebolla:30
Fideos con pesto de rúcula y nueces|AC|-|Fideos comunes:80,Rúcula:40,Nueces:15,Levadura nutricional:5
Fideos de legumbres con salsa de tomate|AC|-|Fideos de legumbres:80,Tomate triturado:120,Cebolla:30
Fideos sin gluten con brócoli salteado|AC|-|Fideos sin gluten:80,Brócoli:100,Frutos secos:10
Wrap de hummus y vegetales|AC|-|Tortilla de trigo (wrap):1,Hummus:40,Zanahoria:40,Lechuga:30,Pepino:40
Wrap de tofu revuelto y espinaca|AC|-|Tortilla de trigo (wrap):1,Tofu:100,Espinaca:40,Tomate:40
Burrito de porotos y arroz|AC|-|Tortilla de trigo (wrap):1,Porotos:50,Arroz integral:40,Tomate:40,Palta:0.5
Tofu revuelto con vegetales|AC|-|Tofu:120,Morrón:50,Cebolla:30,Espinaca:40
Tofu a la plancha con ensalada|AC|-|Tofu:120,Lechuga:40,Tomate:60,Zanahoria:40|Prensá el tofu 15 minutos entre papeles de cocina para que quede firme.
Tofu al horno con batata y brócoli|AC|-|Tofu:120,Batata:120,Brócoli:80
Tofu salteado con verduras y arroz|AC|-|Tofu:100,Arroz integral:60,Chauchas:60,Zanahoria:50
Tofu rebozado con puré de calabaza|AC|k|Tofu:100,Pan rallado:20,Harina de garbanzos:15,Zapallo/Calabaza:150
Tofu con salsa de maní y brócoli|AC|-|Tofu:100,Pasta de maní:15,Brócoli:100,Arroz integral:50
Brochetas de tofu y vegetales|AC|-|Tofu:100,Morrón:60,Zapallito/Zucchini:80,Cebolla:30
Milanesas de tofu con ensalada|AC|k|Tofu:120,Pan rallado:25,Harina de garbanzos:15,Lechuga:40,Tomate:50
Pastel de tofu y espinaca|AC|-|Tofu:100,Espinaca:100,Harina de garbanzos:30,Cebolla:30
Boloñesa de soja con fideos|AC|k|Soja texturizada:40,Fideos comunes:80,Tomate triturado:120,Cebolla:30,Zanahoria:30|Hidratá la soja texturizada 10 minutos en agua caliente y escurrila.
Albóndigas de soja y avena en salsa de tomate|AC|k|Soja texturizada:40,Avena (copos):20,Tomate triturado:120,Cebolla:20|Hidratá la soja texturizada 10 minutos en agua caliente y escurrila.
Pastel de papa con soja texturizada|A|-|Soja texturizada:40,Papa:200,Cebolla:40,Zanahoria:40|Hidratá la soja texturizada 10 minutos en agua caliente y escurrila.
Tacos de soja texturizada y palta|AC|-|Tortilla de trigo (wrap):2,Soja texturizada:30,Palta:0.5,Tomate:50,Lechuga:30
Sopa de tofu y verduras|C|-|Tofu:80,Hongos:60,Acelga:50,Zanahoria:40,Puerro:30
Berenjenas rellenas de lentejas|AC|-|Berenjena:200,Lentejas:50,Tomate:60,Cebolla:30
Zucchini rellenos de quinoa|AC|-|Zapallito/Zucchini:200,Quinoa:40,Morrón:40,Cebolla:30
Morrones rellenos de arroz y porotos|AC|-|Morrón:200,Arroz integral:40,Porotos:40,Tomate:60
Zapallo relleno de quinoa y espinaca|AC|-|Zapallo/Calabaza:200,Quinoa:40,Espinaca:60
Tomates rellenos de mijo y hongos|AC|-|Tomate:200,Mijo:40,Hongos:60
Tortilla de papa sin huevo|AC|-|Papa:150,Harina de garbanzos:40,Cebolla:40
Tortilla de garbanzos y verduras|AC|k|Harina de garbanzos:50,Zapallito/Zucchini:80,Cebolla:30,Espinaca:40
Fainá con ensalada|AC|k|Harina de garbanzos:60,Rúcula:30,Tomate:60
Buñuelos de acelga y garbanzos|AC|k|Harina de garbanzos:40,Acelga:100,Cebolla:20
Medallones de coliflor y avena|AC|k|Coliflor:150,Avena (copos):25,Cebolla:20
Hamburguesas de remolacha y quinoa|AC|-|Remolacha:100,Quinoa:50,Avena (copos):15,Lechuga:30
Hamburguesas de hongos y lentejas|AC|-|Hongos:100,Lentejas:50,Avena (copos):20,Tomate:50
Hamburguesas de calabaza y porotos|AC|k|Zapallo/Calabaza:100,Porotos:60,Avena (copos):20,Lechuga:30
Croquetas de espinaca y papa al horno|AC|k|Espinaca:80,Papa:150,Pan rallado:20
Croquetas de calabaza y quinoa|AC|k|Zapallo/Calabaza:120,Quinoa:40,Pan rallado:15
Puré de papa con vegetales salteados|AC|k|Papa:200,Zanahoria:50,Chauchas:60
Puré de calabaza con lentejas|AC|-|Zapallo/Calabaza:150,Lentejas:60,Cebolla:30
Puré de coliflor con hongos|C|-|Coliflor:200,Hongos:100,Cebolla:30
Papas al horno con ensalada de garbanzos|AC|-|Papa:200,Garbanzos:50,Rúcula:30,Tomate:50
Batatas rellenas de porotos|AC|-|Batata:200,Porotos:60,Palta:0.5
Batata al horno con hummus y rúcula|AC|-|Batata:200,Hummus:40,Rúcula:30
Vegetales asados con hummus|AC|-|Zanahoria:80,Zapallito/Zucchini:100,Berenjena:100,Hummus:40
Wok de vegetales y arroz|AC|-|Arroz integral:60,Repollo:80,Zanahoria:60,Morrón:40,Chauchas:40
Salteado de brócoli, coliflor y maní|AC|-|Brócoli:100,Coliflor:100,Maní:15,Arroz integral:50
Ratatouille con polenta|AC|-|Berenjena:100,Zapallito/Zucchini:100,Tomate:120,Morrón:50,Polenta:50
Pisto de verduras con garbanzos|AC|-|Zapallito/Zucchini:100,Tomate:120,Morrón:50,Garbanzos:50
Ensalada de repollo, zanahoria y manzana|C|-|Repollo:100,Zanahoria:60,Manzana:1,Nueces:10
Ensalada de espinaca, remolacha y nueces|C|-|Espinaca:60,Remolacha:80,Nueces:15,Semillas (mix):10
Ensalada de quinoa con palta y tomate|AC|-|Quinoa:60,Palta:0.5,Tomate:80,Pepino:50
Ensalada de papa, chauchas y aceitunas|AC|-|Papa:150,Chauchas:80,Aceitunas:15,Cebolla:20
Ensalada de arroz con choclo y arvejas|AC|k|Arroz integral:60,Choclo:60,Arvejas:50,Zanahoria:40
Ensalada tibia de mijo y vegetales asados|AC|-|Mijo:60,Berenjena:80,Morrón:60,Rúcula:30
Ensalada de trigo sarraceno y espárragos|AC|-|Trigo sarraceno:60,Espárragos:80,Tomate:60,Almendras:10
Ensalada de lentejas, zanahoria y verdeo|AC|-|Lentejas:60,Zanahoria:60,Verdeo:20,Tomate:50
Sopa crema de zapallo y coco|C|-|Zapallo/Calabaza:200,Leche de coco:80,Cebolla:30
Sopa crema de brócoli y papa|C|k|Brócoli:120,Papa:100,Cebolla:30,Leche vegetal:100
Sopa de arvejas|C|-|Arvejas:150,Papa:80,Cebolla:30,Zanahoria:40
Sopa de tomate asado con tostadas|C|-|Tomate:250,Cebolla:30,Pan de masa madre:1
Minestrone de verduras y porotos|C|-|Porotos:40,Zanahoria:50,Zapallito/Zucchini:60,Repollo:50,Fideos comunes:30
Guiso de quinoa y verduras|A|-|Quinoa:60,Zapallo/Calabaza:100,Zanahoria:50,Cebolla:40,Tomate:60
Guiso de arroz integral y lentejas|A|-|Arroz integral:50,Lentejas:50,Zanahoria:50,Cebolla:40
Pastel de berenjena y lentejas|A|-|Berenjena:150,Lentejas:60,Tomate triturado:100,Cebolla:30
Lasaña de verduras y tofu|A|-|Fideos comunes:60,Tofu:80,Espinaca:60,Tomate triturado:100
Canelones de espinaca y tofu|A|-|Fideos comunes:60,Espinaca:80,Tofu:80,Tomate triturado:100
Empanadas de verduras al horno|A|k|Harina de trigo:60,Zapallo/Calabaza:80,Cebolla:40,Acelga:50
Pizza de garbanzos con vegetales|AC|k|Harina de garbanzos:70,Tomate:80,Morrón:40,Aceitunas:10,Cebolla:20
Tarta de zapallitos y puerro sin huevo|AC|-|Harina de trigo:50,Zapallito/Zucchini:100,Puerro:50,Harina de garbanzos:20
Sándwich de palta y tomate|AC|-|Pan de masa madre:2,Palta:0.5,Tomate:60,Rúcula:20
Sándwich de hummus y vegetales asados|AC|-|Pan de masa madre:2,Hummus:40,Berenjena:60,Morrón:40
Tostada de palta y tomate|M|-|Pan de masa madre:1,Palta:0.5,Tomate:40
Tostada con hummus y pepino|M|-|Pan de masa madre:1,Hummus:30,Pepino:30
Tostada con pasta de maní y banana|M|k|Pan de masa madre:1,Pasta de maní:15,Banana:1
Tostada con tahini y banana|M|-|Pan de masa madre:1,Tahini:10,Banana:1
Licuado de banana y leche vegetal|M|k|Banana:1,Leche vegetal:200,Semillas (mix):5
Licuado de frutos rojos y avena|M|-|Frutos rojos:80,Leche vegetal:200,Avena (copos):15
Smoothie verde de espinaca y banana|M|-|Espinaca:30,Banana:1,Leche vegetal:200,Semillas (mix):5
Avena cocida con leche vegetal y manzana|M|k|Avena (copos):40,Leche vegetal:200,Manzana:1
Avena con frutos rojos y nueces|M|-|Avena (copos):40,Leche vegetal:200,Frutos rojos:60,Nueces:10
Panqueques de avena y banana|M|k|Avena (copos):40,Banana:1,Leche vegetal:100
Galletas de arroz con pasta de maní|M|k|Galleta de arroz:2,Pasta de maní:15
Galletas de arroz con palta|M|-|Galleta de arroz:2,Palta:0.5
Palitos de zanahoria y pepino con hummus|M|-|Zanahoria:80,Pepino:50,Hummus:40
Manzana con pasta de maní|M|k|Manzana:1,Pasta de maní:15
Fruta de estación con frutos secos|M|k|Fruta de estación:1,Frutos secos:20
Mix de frutos secos y ciruelas pasas|M|-|Frutos secos:20,Ciruelas pasas:20
Budín de banana y avena|M|k|Banana:1,Avena (copos):40,Nueces:10
Muffins de avena y manzana|M|k|Avena (copos):40,Manzana:1,Leche vegetal:60
Bolitas de coco y almendras|M|-|Coco rallado:20,Almendras:20,Cacao amargo:5
Mousse de palta y cacao|M|-|Palta:1,Cacao amargo:10,Banana:1
Chips de batata al horno|M|k|Batata:150
Garbanzos crocantes al horno|M|-|Garbanzos:50,Semillas (mix):5
Ensalada de frutas con coco|M|k|Fruta de estación:2,Coco rallado:10
Pan de semillas con palta|M|-|Semillas (mix):20,Harina de almendras:20,Palta:0.5
`;

/* ---------- dietas ---------- */
var DIETS=[
  {id:'omni',name:'Omnívora',emoji:'🍽️',desc:'Come de todo.'},
  {id:'veg',name:'Ovolactovegetariana',emoji:'🥗',desc:'Sin carnes ni pescados. Con huevos y lácteos.'},
  {id:'lacto',name:'Lactovegetariana',emoji:'🧀',desc:'Sin carnes, pescados ni huevos. Con lácteos.'},
  {id:'ovo',name:'Ovovegetariana',emoji:'🥚',desc:'Sin carnes, pescados ni lácteos. Con huevos.'},
  {id:'pesco',name:'Pescetariana',emoji:'🐟',desc:'Sin carnes ni aves. Con pescados, mariscos, huevos y lácteos.'},
  {id:'vegan',name:'Vegana',emoji:'🌱',desc:'Sin productos de origen animal. Requiere suplementar vitamina B12 con indicación profesional.'},
  {id:'sintacc',name:'Sin TACC (celíaca)',emoji:'🌾',desc:'Sin trigo, avena, cebada ni centeno. Usá siempre productos con el sello Sin TACC.'},
  {id:'sinlacteos',name:'Sin lácteos / sin lactosa',emoji:'🥛',desc:'Sin leche, quesos, yogur, crema ni manteca.'},
  {id:'sinhuevo',name:'Sin huevo',emoji:'🍳',desc:'Sin huevo ni preparaciones con huevo.'},
  {id:'sinfrutossecos',name:'Sin frutos secos ni maní',emoji:'🥜',desc:'Sin nueces, almendras, maní ni sus pastas y harinas. Para alergias: revisá siempre las etiquetas.'},
  {id:'bajoazucar',name:'Sin azúcar agregada',emoji:'🍬',desc:'Sin azúcar, miel ni dulces agregados.'},
  {id:'lowcarb',name:'Baja en carbohidratos',emoji:'🥩',desc:'Sin cereales, pastas, pan, papa, batata, legumbres ni frutas dulces.'},
  {id:'bajagrasa',name:'Baja en grasas',emoji:'🫒',desc:'Evita frutos secos, palta, quesos grasos, crema, manteca y pescados grasos.'},
  {id:'altaproteina',name:'Alta en proteínas',emoji:'💪',desc:'Cada comida incluye una fuente clara de proteína.'},
  {id:'hiposodica',name:'Baja en sodio',emoji:'🧂',desc:'Evita fiambres, quesos curados y aceitunas. Cocinar sin agregar sal.'},
  {id:'chicos',name:'Simple para chicos',emoji:'🧒',desc:'Platos sencillos y conocidos, para chicos selectivos.'}
];
var DIET_CUSTOM={id:'propia',name:'Armar la mía',emoji:'✨',desc:'Cargás tus propias comidas con una IA: te doy el prompt.'};
var DIET_SUGAR=[];   /* ingredientes con azúcar agregada (hoy el banco no tiene ninguno) */
function dietHas(m,list){return m.ings.some(function(i){return list.indexOf(i.n)>=0;});}
var DIET_TERRESTRE=['Pollo','Pavita','Carne vacuna','Carne picada','Cerdo','Jamón cocido'];
var DIET_NUTS=['Frutos secos','Nueces','Almendras','Harina de almendras','Maní','Pasta de maní'];
var DIET_CARBFRUIT=['Banana','Fruta de estación','Manzana','Ciruelas pasas','Choclo','Arvejas'];
var DIET_GRASAS=['Frutos secos','Nueces','Almendras','Harina de almendras','Maní','Pasta de maní','Tahini','Palta','Crema','Manteca','Queso semiduro','Muzzarella','Queso rallado','Leche de coco','Coco rallado','Salmón','Cerdo','Carne picada','Aceitunas','Semillas (mix)','Sésamo molido'];
var DIET_PROT=['Pollo','Pavita','Carne vacuna','Carne picada','Cerdo','Pescado blanco','Salmón','Atún','Camarones','Mejillones','Huevo','Tofu','Soja texturizada','Lentejas','Garbanzos','Porotos','Ricota','Queso fresco','Queso semiduro','Yogur natural'];
var DIET_SODIO=['Jamón cocido','Queso rallado','Queso semiduro','Aceitunas'];
function dietHuevos(m){var q=0;m.ings.forEach(function(i){if(i.n==='Huevo')q+=i.q;});return q;}
var DIET_TESTS={
  omni:function(m){return !m.f.O;},
  veg:function(m){return !m.f.M&&!m.f.O;},
  lacto:function(m){return !m.f.M&&!m.f.O&&!m.egg;},
  ovo:function(m){return !m.f.M&&!m.f.O&&!m.dairy;},
  pesco:function(m){return !m.f.O&&!m.f.R&&!dietHas(m,DIET_TERRESTRE);},
  vegan:function(m){return !m.f.M&&!m.f.O&&!m.dairy&&!m.egg;},
  sintacc:function(m){return !m.f.G&&!m.f.O;},
  sinlacteos:function(m){return !m.dairy&&!m.f.O;},
  sinhuevo:function(m){return !m.egg&&!m.f.O;},
  sinfrutossecos:function(m){return !dietHas(m,DIET_NUTS)&&!m.f.O;},
  bajoazucar:function(m){return !m.sugar&&!m.f.O;},
  lowcarb:function(m){return !m.f.P&&!m.f.W&&!m.f.G&&!m.f.Z&&!m.f.L&&!dietHas(m,DIET_CARBFRUIT)&&!m.f.O;},
  bajagrasa:function(m){return !dietHas(m,DIET_GRASAS)&&dietHuevos(m)<=2&&!m.f.O;},
  altaproteina:function(m){return dietHas(m,DIET_PROT)&&!m.f.O;},
  hiposodica:function(m){return !dietHas(m,DIET_SODIO)&&!m.f.O;},
  chicos:function(m){return m.k&&!m.f.S&&!m.f.O;}
};

/* ---------- banco de comidas ---------- */
var _dietBank=null;
function dietBank(){
  if(_dietBank)return _dietBank;
  var ING={};
  (ING_RAW+'\n'+DIET_ING_EXTRA).trim().split('\n').forEach(function(l){
    if(!l.trim())return;
    var p=l.split('|');
    ING[p[0]]={u:p[1],c:p[2],f:p[3]||''};
  });
  var meals=[],seen={};
  (MEAL_RAW+'\n'+DIET_MEAL_EXTRA).trim().split('\n').forEach(function(l){
    if(!l.trim())return;
    var p=l.split('|'),name=p[0];
    if(seen[name])throw new Error('Comida repetida: '+name);
    seen[name]=1;
    var f={},dairy=false,egg=false,sugar=false;
    var ings=p[3].split(',').map(function(s){
      var q=s.lastIndexOf(':'),n=s.slice(0,q).trim();
      if(!ING[n])throw new Error('Ingrediente desconocido: '+n+' en '+name);
      var g=ING[n];
      for(var x=0;x<g.f.length;x++)f[g.f[x]]=1;
      if(g.c==='L'&&n!=='Huevo')dairy=true;
      if(n==='Huevo')egg=true;
      if(DIET_SUGAR.indexOf(n)>=0)sugar=true;
      return{n:n,q:parseFloat(s.slice(q+1)),u:g.u,c:g.c};
    });
    meals.push({name:name,type:p[1],k:p[2]==='k',tip:p[4]||'',ings:ings,f:f,dairy:dairy,egg:egg,sugar:sugar});
  });
  _dietBank=meals;
  return meals;
}
function dietOk(m,ids){
  if(!ids||!ids.length)return false;
  for(var i=0;i<ids.length;i++){var t=DIET_TESTS[ids[i]];if(!t||!t(m))return false;}
  return true;
}
function dietCount(ids){return dietBank().filter(function(m){return dietOk(m,ids);}).length;}
function dietById(id){
  if(id===DIET_CUSTOM.id)return DIET_CUSTOM;
  for(var i=0;i<DIETS.length;i++)if(DIETS[i].id===id)return DIETS[i];
  return null;
}
function dietLabel(ids){
  return (ids||[]).map(function(id){var d=dietById(id);return d?d.name:'';}).filter(Boolean).join(' + ');
}

/* Agrega a la persona `pk` las comidas del banco que cumplen sus dietas. Devuelve cuántas comidas nuevas sumó al espacio. */
function dietsApply(d,pk,ids){
  if(!ids||!ids.length||ids[0]===DIET_CUSTOM.id)return 0;
  var byName={},added=0;
  d.meals.forEach(function(m){byName[wsNorm(m.name)]=m;});
  dietBank().forEach(function(b){
    if(!dietOk(b,ids))return;
    var key=wsNorm(b.name),m=byName[key];
    if(!m){
      if(d.meals.length>=WS_MAX_MEALS)return;
      var ok={};
      b.type.split('').forEach(function(s){ok[s]='';});
      m={id:d.nextId++,name:b.name,type:b.type,ok:ok,tip:b.tip,ings:b.ings.map(function(i){return{n:i.n,q:i.q,u:i.u,c:i.c};})};
      d.meals.push(m);byName[key]=m;added++;
    }
    Object.keys(m.ok).forEach(function(s){if(m.ok[s].indexOf(pk)<0)m.ok[s]+=pk;});
  });
  return added;
}
