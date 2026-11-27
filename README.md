# Mangiamo

**¿Qué mangiamo?** Planificador de comidas para tu casa: armá la semana, decidí qué comer hoy y generá la lista de compras.

- **Tus datos son tuyos:** se guardan solo en tu dispositivo, cifrados (AES-GCM). No hay cuentas, servidor ni publicidad.
- **Dietas por defecto:** omnívora, vegetariana, vegana, sin TACC, sin lácteos, baja en azúcar y simple para chicos, con más de 100 comidas cada una; se pueden combinar. O armá la tuya con una IA.
- **Compras realistas:** cantidades redondeadas a como se compra, con "ya tengo en casa".
- **Copias de seguridad:** archivo cifrado con contraseña, se comparte desde el menú del celular; recordatorio programable.
- **PWA:** se instala en el celular y funciona sin conexión.

> Mangiamo no reemplaza a un profesional: consultá cualquier dieta con un/a nutricionista.

## Estructura

| Archivo | Qué hace |
|---|---|
| `index.html` | Página, estilos y cargador |
| `store.js` | Almacenamiento cifrado local y contraseña opcional |
| `data.js` | Ingredientes y comidas base |
| `diets.js` | Dietas por defecto y combinaciones |
| `workspace.js` | Espacios, personas, importar/exportar, ajustes |
| `wizard.js` | Asistente paso a paso |
| `app.js` | Vistas: Hoy, Semana, Comidas, Compras |
| `backup.js` | Backup cifrado y restauración |
| `apoyo.js`, `legal.js` | Aportes, contacto y textos legales |
| `sw.js`, `manifest.webmanifest` | PWA sin conexión |

Sin build: es HTML y JavaScript estático. Para probar en local: `python3 -m http.server` y abrir `http://localhost:8000`.

## Licencia

Código público bajo licencia [PolyForm Noncommercial 1.0.0](LICENSE): podés usarlo, copiarlo y modificarlo gratis, sin fines comerciales.
