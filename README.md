# Mangiamo

**¿Qué mangiamo?** Planificador de comidas para tu casa: armá la semana, decidí qué comer hoy y generá la lista de compras.

- **Tus datos son tuyos:** se guardan solo en tu dispositivo, cifrados (AES-GCM). No hay cuentas, servidor ni publicidad.
- **Dietas por defecto:** omnívora, vegetariana, vegana, sin TACC, sin lácteos, baja en azúcar y simple para chicos, con más de 100 comidas cada una; se pueden combinar. O armá la tuya con una IA.
- **Compras realistas:** cantidades redondeadas a como se compra (paquetes, latas, media docena), con "ya tengo en casa".
- **Copias de seguridad:** archivo cifrado con contraseña, se comparte desde el menú del celular; recordatorio programable.
- **PWA:** se instala en el celular y funciona sin conexión.

> Mangiamo no reemplaza a un profesional: consultá cualquier dieta con un/a nutricionista.

## Pantallas

| Pestaña | Qué hace |
|---|---|
| 🎲 Hoy | Las comidas de hoy y una ruleta para decidir cuando no sabés qué comer |
| 🗓️ Semana | Plan de lunes a domingo (almuerzo, cena, merienda). Se puede rearmar entera o cambiar una comida |
| 🍽️ Comidas | Banco de comidas filtrable, con búsqueda por nombre o ingrediente y exclusión por persona |
| 🧺 En casa | Marcás lo que tenés y te muestra qué podés cocinar ya o con 1–2 ingredientes más |
| 🛒 Compras | Lista de la semana por categoría, con tildes, copiar al portapapeles y sumar lo comprado a "En casa" |

Arriba se eligen las personas (perfiles): el plan y la lista se calculan para quienes estén seleccionados, y solo entran comidas que sirvan a todos juntos.

## Estructura

| Archivo | Qué hace |
|---|---|
| `index.html` | Página, estilos y cargador de scripts |
| `store.js` | `Vault`: almacenamiento cifrado local y contraseña opcional |
| `data.js` | Ingredientes y comidas base |
| `diets.js` | Dietas por defecto, combinaciones y comidas extra |
| `workspace.js` | Espacios, personas, importar/exportar JSON, ajustes |
| `wizard.js` | Asistente paso a paso de la primera vez |
| `app.js` | Vistas (Hoy, Semana, Comidas, En casa, Compras), plan semanal y lista de compras |
| `backup.js` | Backup cifrado y restauración |
| `apoyo.js`, `legal.js` | Aportes, contacto y textos legales |
| `sw.js`, `manifest.webmanifest` | PWA sin conexión |

### Orden de carga

`index.html` carga primero `store.js` y espera a `Vault.ready` (que puede pedir la contraseña). Recién después carga, en este orden y de a uno: `data.js` → `diets.js` → `workspace.js` → `wizard.js` → `backup.js` → `legal.js` → `apoyo.js` → `app.js`. Todo vive en el scope global, así que el orden importa. Si se agrega un archivo, hay que sumarlo en ese cargador y en `sw.js`.

### Datos y almacenamiento

- Todo lo que guarda la app usa claves que empiezan con `morfi` y pasa por `Vault.get / set / del`. Nunca se toca `localStorage` directamente.
- Modos de cifrado: **device** (clave aleatoria no extraíble en IndexedDB, no pide nada), **password** (clave derivada con PBKDF2, 600.000 iteraciones, se pide al abrir) y **plain** (solo si el navegador no soporta WebCrypto/IndexedDB, por ejemplo en ventana privada o sin https; ahí no hay cifrado).
- Si el navegador pierde la clave del dispositivo (borrar datos del sitio), los datos no se pueden recuperar: de ahí la importancia del backup.
- Un **espacio** (casa, familia, etc.) tiene sus personas y sus comidas. El plan, lo tildado, lo que hay en casa y las exclusiones se guardan por espacio.
- El plan semanal es determinístico: se genera a partir de una semilla (`seed`) por semana y combinación de personas, y solo se guardan la semilla y los cambios manuales.

### Formato para cargar comidas (JSON)

Es el mismo que usan el importador, el exportador y el prompt para IA de Ajustes:

```json
{
  "personas": ["Ana", "Leo"],
  "comidas": [
    {
      "nombre": "Omelette de espinaca y queso",
      "momento": "AC",
      "para": ["Ana", "Leo"],
      "ingredientes": [
        { "nombre": "Huevo", "cantidad": 3, "unidad": "u", "categoria": "L" },
        { "nombre": "Espinaca", "cantidad": 80, "unidad": "g", "categoria": "V" }
      ],
      "tip": ""
    }
  ]
}
```

- `momento`: `A` almuerzo, `C` cena, `AC` almuerzo o cena, `M` merienda.
- `unidad`: `g`, `ml` o `u` (también acepta kg, l, cucharadas, tazas, etc., que se convierten).
- `categoria`: `C` carnes y pescados, `V` verduras y frutas, `L` lácteos y huevos, `A` almacén.
- Cantidades **por persona** (una porción). Máximo 600 comidas por espacio.

### Backup

Archivo `mangiamo-respaldo-AAAA-MM-DD.json` con todo lo guardado, cifrado con AES-GCM y una contraseña propia (PBKDF2-SHA256, 600.000 iteraciones). Si se olvida la contraseña no hay forma de abrirlo. Restaurar **reemplaza** todo lo que hay en el dispositivo.

## Cómo correrlo

No hay build ni dependencias: es HTML y JavaScript estático.

```
python3 -m http.server
```

y abrir `http://localhost:8000`. El cifrado y el service worker necesitan `https` o `localhost`.

## Publicar

Se sirve como sitio estático (el repo incluye `.nojekyll`, pensado para GitHub Pages). Las rutas son relativas, así que funciona en una subcarpeta.

## Al hacer cambios

- **Caché offline:** `sw.js` guarda los archivos bajo el nombre `mangiamo-vN`. Si agregás o renombrás archivos, actualizá la lista `F` y subí el número de versión, para que los dispositivos ya instalados tomen la actualización.
- **Seguridad del HTML:** las vistas arman HTML con strings. Todo texto que viene del usuario o de un JSON importado tiene que pasar por `wsClean` (al guardarlo) o `wsEsc` (al mostrarlo).
- **Textos legales:** `legal.js` tiene `LG_DRAFT=true` hasta que se revisen; mientras tanto la app muestra "Texto pendiente de revisión legal".

## Estado

Versión inicial funcional. Sin tests automáticos ni CI. Las dietas son orientativas y no están validadas por profesionales de la nutrición.
