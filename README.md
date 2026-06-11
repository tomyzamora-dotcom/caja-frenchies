# Sistema Caja Frenchies - Guía para Administrador

## Usuario administrador
- Usuario por defecto: `admin`
- Contraseña por defecto: `admin123`

> El usuario administrador puede crear, editar y eliminar cuentas de vendedores.

## Funciones principales del administrador

1. **Inicio de sesión**
   - Ingresar con el usuario administrador para acceder al panel de administración.

2. **Administrar usuarios**
   - Ir a `Administrar usuarios` en el menú.
   - Crear nuevos usuarios de tipo `vendedor` con usuario y contraseña.
   - Editar el rol de un usuario o su contraseña.
   - Eliminar sólo cuentas de vendedores (no se puede eliminar el administrador).

3. **Apertura de turno**
   - Si estás autenticado como administrador y no hay un turno activo, el sistema muestra un reporte de ventas y reparaciones por vendedor.
   - El administrador no abre turno como vendedor; el administrador supervisa el estado del sistema y los turnos.

4. **Reporte detallado por vendedor**
   - Acceder a `Reporte vendedor` en el menú.
   - Ver detalles de ventas, reparaciones e ingresos por cada vendedor.
   - El reporte incluye la fecha y hora de apertura y cierre de turno cuando corresponda.

5. **Cerrar sesión**
   - Al cerrar sesión de un vendedor, el turno activo se cierra automáticamente.
   - Al cerrar sesión como administrador, simplemente se retorna a la pantalla de login.

## Consejos de uso
- Primero crea los usuarios vendedores antes de intentar iniciar turno desde la cuenta de administrador.
- Los vendedores deben iniciar sesión con su usuario y contraseña para abrir su turno.
- Utiliza la opción `Exportar datos` para guardar una copia de seguridad del estado actual.
- Si `LocalStorage` no está disponible, usa `Exportar datos` / `Importar datos` para recuperar la información.

## Requisitos básicos
- Navegador moderno con soporte para `localStorage`.
- Sin conexión, el sistema sigue funcionando en el navegador con los datos guardados localmente.
- Con conexión, el indicador en el encabezado muestra el estado de internet y realiza un guardado automático del estado.
- El indicador de conexión está en la parte superior derecha del encabezado, con un punto verde y el texto `Con Internet` cuando está online, y un punto rojo y el texto `Sin Internet` cuando está offline.

## Archivos clave
- `index.html` - Interfaz de usuario.
- `style.css` - Estilos de la aplicación.
- `script.js` - Lógica principal de inicio de sesión, turnos, ventas y reportes.
