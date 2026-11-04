/* ===== Mangiamo: textos legales (BORRADOR para revisión de un/a abogado/a) =====
   Se muestran desde el asistente inicial y desde Ajustes. Mientras LG_DRAFT sea true
   se avisa que el texto está pendiente de revisión legal. */
var LG_VERSION='2026-11-04';
var LG_DRAFT=true;
var LG_TITLES={terms:'Términos y condiciones',privacy:'Política de privacidad'};
var LG={
terms:
'<h3>1. Qué es Mangiamo</h3><p>Mangiamo es una aplicación gratuita para organizar comidas, armar la semana y preparar la lista de compras. Funciona en tu dispositivo y no requiere cuenta.</p>'+
'<h3>2. No reemplaza a un profesional de la salud</h3><p>Mangiamo es una herramienta de organización. <b>No brinda diagnóstico, tratamiento ni asesoramiento médico o nutricional.</b> Todas las dietas, menús y cantidades deben ser <b>consultados y aprobados por un/a nutricionista o profesional de la salud</b> antes de seguirlos, especialmente si tenés una condición de salud, alergia o intolerancia, estás embarazada o en lactancia, o si se trata de niñas, niños o adolescentes.</p>'+
'<p>Las dietas veganas pueden requerir suplementar vitamina B12 y otros nutrientes con indicación profesional. En las opciones “Sin TACC” los ingredientes se indican de forma general: verificá siempre que cada producto que compres esté certificado como Sin TACC.</p>'+
'<h3>3. Quiénes pueden usarla</h3><p>Mangiamo es para personas <b>mayores de 18 años</b>. Si cargás datos de menores a tu cargo, lo hacés como adulto responsable y sos quien decide qué se les ofrece, con su profesional de referencia.</p>'+
'<h3>4. Tus datos y tu responsabilidad</h3><p>Todo lo que cargás se guarda <b>solo en tu dispositivo</b>, cifrado. El desarrollador no tiene copia ni acceso. Por eso sos responsable de hacer copias de seguridad (Ajustes → Copia de seguridad). Si borrás los datos del navegador, cambiás de dispositivo o el sistema limpia el almacenamiento (algunos navegadores lo hacen tras un tiempo sin uso), podés perder tu información si no tenés un backup.</p>'+
'<p>Si ponés una contraseña a la app o a un backup, <b>no hay forma de recuperarla</b>: si la olvidás, perdés el acceso a esos datos.</p>'+
'<h3>5. Comidas importadas o generadas con IA</h3><p>Podés importar comidas creadas con herramientas de inteligencia artificial. Esos contenidos pueden tener errores: revisalos y consultalos con un profesional. Mangiamo no verifica su exactitud nutricional.</p>'+
'<h3>6. Uso gratuito y aportes voluntarios</h3><p>Mangiamo es gratuita y sin publicidad. Los aportes (Mercado Pago, Cafecito, PayPal, Buy Me a Coffee) son <b>voluntarios</b>, no son el pago de un servicio y no otorgan ventajas ni derechos adicionales. Esos servicios son de terceros y se rigen por sus propias condiciones.</p>'+
'<h3>7. Sin garantías y limitación de responsabilidad</h3><p>Mangiamo se ofrece “tal cual”, sin garantía de disponibilidad ni de resultados. En la máxima medida que permita la ley, el desarrollador no responde por decisiones alimentarias, reacciones adversas, errores en las recetas o cantidades, ni por la pérdida de datos. Esto no limita los derechos que la ley te reconoce como consumidor/a y que no pueden renunciarse.</p>'+
'<h3>8. Propiedad intelectual</h3><p>La aplicación y sus contenidos pertenecen a su desarrollador. Los datos que cargás son tuyos.</p>'+
'<h3>9. Cambios</h3><p>Estos términos pueden actualizarse. La versión vigente figura en la app con su fecha. Si hay cambios importantes, te lo vamos a avisar.</p>'+
'<h3>10. Ley aplicable y contacto</h3><p>Se rigen por las leyes de la República Argentina. Para consultas o ideas, usá la sección Contacto de Ajustes.</p>',
privacy:
'<h3>Resumen</h3><p><b>Tus datos viven en tu dispositivo, cifrados. No hay cuentas, servidor ni base de datos del desarrollador.</b> No recibimos ni vemos lo que cargás.</p>'+
'<h3>1. Qué datos usa Mangiamo</h3><p>Nombres o apodos de las personas que agregues, las dietas que elijas, las comidas, las semanas armadas, lo que tengas en casa y la lista de compras. Según lo que cargues, esa información puede permitir deducir datos de salud (por ejemplo, una dieta sin gluten). La ley argentina los considera <b>datos sensibles</b>, por eso se guardan cifrados y solo en tu dispositivo.</p>'+
'<h3>2. Dónde se guardan</h3><p>En el almacenamiento de tu navegador, cifrados con AES-GCM. Con la contraseña opcional, la clave se deriva de ella; sin contraseña, la clave queda en tu dispositivo. Nada de esto se envía a ningún servidor.</p>'+
'<h3>3. Qué no hacemos</h3><p>No usamos publicidad, analítica ni rastreo de comportamiento, no vendemos ni cedemos datos y no pedimos registro.</p>'+
'<h3>4. Copias de seguridad</h3><p>El backup es un archivo cifrado con la contraseña que elegís. Lo guardás o compartís vos (correo, Drive, WhatsApp, etc.). El desarrollador no lo recibe.</p>'+
'<h3>5. Alojamiento y terceros</h3><p>La aplicación se descarga desde GitHub Pages, que puede registrar datos técnicos de la visita (como la dirección IP) según su propia política. Los enlaces de aportes llevan a servicios de terceros (Mercado Pago, Cafecito, PayPal, Buy Me a Coffee), con sus propias políticas.</p>'+
'<h3>6. Contacto</h3><p>El formulario de contacto abre tu aplicación de correo con el mensaje armado. Solo llega si vos lo enviás, y Mangiamo no adjunta tus datos.</p>'+
'<h3>7. Tus derechos</h3><p>Como los datos están solo en tu dispositivo, los controlás vos: podés verlos, corregirlos y borrarlos desde la app (eliminar un espacio) o borrando los datos del sitio en tu navegador. La Ley 25.326 de Protección de Datos Personales te reconoce derechos de acceso, rectificación y supresión; su órgano de control es la Agencia de Acceso a la Información Pública.</p>'+
'<h3>8. Menores</h3><p>Mangiamo es para mayores de 18 años. Quien cargue datos de menores a su cargo lo hace como adulto responsable.</p>'+
'<h3>9. Cambios</h3><p>Si esta política cambia, se actualiza la fecha y, si corresponde, te avisamos en la app.</p>'
};
