const productos = [];
const reparaciones = [];
const ventas = [];
const turnos = [];
const usuarios = [];
let usuarioActual = null;
let turnoActual = null;
let siguienteProductoId = 1;
let siguienteReparacionId = 1;
let siguienteVentaId = 1;
let siguienteTurnoId = 1;
let siguienteUsuarioId = 1;
const lowStockThreshold = 3;

function saveState() {
  try {
    const state = {
      productos,
      reparaciones,
      ventas,
      turnos,
      usuarios,
      usuarioActual,
      turnoActual,
      siguienteProductoId,
      siguienteReparacionId,
      siguienteVentaId,
      siguienteTurnoId,
      siguienteUsuarioId
    };
    localStorage.setItem('caja_frenchies_state', JSON.stringify(state));
    console.log('Estado guardado en localStorage.');
    showStorageStatus('Estado guardado en localStorage.', 'info');
  } catch (e) {
    console.warn('No se pudo guardar el estado:', e);
    showStorageStatus('No se pudo guardar en localStorage: ' + (e && e.message ? e.message : ''), 'error');
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem('caja_frenchies_state');
    if (!raw) return false;
    const state = JSON.parse(raw);
    if (state && Array.isArray(state.productos)) {
      productos.length = 0;
      state.productos.forEach(p => productos.push(p));
      reparaciones.length = 0;
      if (Array.isArray(state.reparaciones)) state.reparaciones.forEach(r => reparaciones.push(r));
      ventas.length = 0;
      if (Array.isArray(state.ventas)) state.ventas.forEach(v => ventas.push(v));
      turnos.length = 0;
      if (Array.isArray(state.turnos)) state.turnos.forEach(t => turnos.push(t));
      usuarios.length = 0;
      if (Array.isArray(state.usuarios)) state.usuarios.forEach(u => usuarios.push(u));
      usuarioActual = state.usuarioActual || null;
      turnoActual = state.turnoActual || null;
      siguienteProductoId = state.siguienteProductoId || siguienteProductoId;
      siguienteReparacionId = state.siguienteReparacionId || siguienteReparacionId;
      siguienteVentaId = state.siguienteVentaId || siguienteVentaId;
      siguienteTurnoId = state.siguienteTurnoId || siguienteTurnoId;
      siguienteUsuarioId = state.siguienteUsuarioId || siguienteUsuarioId;
      console.log('Estado cargado desde localStorage.');
      showStorageStatus('Estado cargado desde localStorage.', 'info');
      return true;
    }
  } catch (e) {
    console.warn('No se pudo leer el estado:', e);
    showStorageStatus('No se pudo leer estado desde localStorage: ' + (e && e.message ? e.message : ''), 'error');
  }
  return false;
}

function updateConnectionStatus() {
  const dot = document.getElementById('connectionDot');
  const text = document.getElementById('connectionText');
  const note = document.getElementById('connectionNote');
  if (!dot || !text || !note) return;

  const online = navigator.onLine;
  dot.classList.toggle('online', online);
  dot.classList.toggle('offline', !online);
  text.textContent = online ? 'Con Internet' : 'Sin Internet';

  if (online) {
    note.textContent = 'Conexión detectada: guardado automático habilitado.';
    saveState();
    showStorageStatus('Conexión detectada: guardado automático habilitado.', 'info');
  } else {
    note.textContent = 'Sin conexión: trabajando en modo local.';
  }
}

function registrarEventosConexion() {
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
  updateConnectionStatus();
}

function ensureDefaultAdmin() {
  if (usuarios.length === 0) {
    usuarios.push({ id: siguienteUsuarioId++, usuario: 'admin', password: 'admin123', rol: 'admin' });
    saveState();
  }
}

function updateUserHeader() {
  const status = document.getElementById('loginStatus');
  const logout = document.getElementById('logoutButton');
  const menu = document.querySelector('.menu');
  if (!status || !logout || !menu) return;

  if (usuarioActual) {
    status.textContent = `Usuario: ${usuarioActual.usuario} (${usuarioActual.rol})`;
    logout.style.display = 'inline-flex';
    menu.style.display = 'grid';
    updateMenuButtons(usuarioActual.rol);
  } else {
    status.textContent = 'No conectado';
    logout.style.display = 'none';
    menu.style.display = 'none';
  }
}

function updateMenuButtons(role) {
  const vendedorActions = new Set([
    'start-shift',
    'search',
    'show-products',
    'sell-product',
    'register-repair',
    'completed-history'
  ]);

  botones.forEach(button => {
    const action = button.dataset.action;
    if (role === 'vendedor') {
      button.style.display = vendedorActions.has(action) ? 'block' : 'none';
    } else {
      button.style.display = action === 'start-shift' ? 'none' : 'block';
    }
  });
}

function getCurrentVendedor() {
  if (usuarioActual && usuarioActual.rol === 'vendedor') {
    return usuarioActual.usuario;
  }
  if (turnoActual) {
    return turnoActual.vendedor;
  }
  return 'Sin vendedor';
}

function getVendedoresRegistrados() {
  return usuarios.filter(u => u.rol === 'vendedor');
}

function showLogin(message = '') {
  renderPanel(`
    <h2>Inicio de sesión</h2>
    ${message ? `<div class="note">${message}</div>` : ''}
    <div class="field">
      <label for="loginUsuario">Usuario</label>
      <input id="loginUsuario" type="text" placeholder="Ingresa tu usuario">
    </div>
    <div class="field">
      <label for="loginPassword">Contraseña</label>
      <input id="loginPassword" type="password" placeholder="Ingresa tu contraseña">
    </div>
    <div class="actions">
      <button id="loginButton">Iniciar sesión</button>
    </div>
  `);

  document.getElementById('loginButton').addEventListener('click', () => {
    const usuario = document.getElementById('loginUsuario').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if (!usuario || !password) {
      showLogin('Completa usuario y contraseña.');
      return;
    }

    const cuenta = usuarios.find(u => u.usuario === usuario && u.password === password);
    if (!cuenta) {
      showLogin('Usuario o contraseña incorrectos.');
      return;
    }

    usuarioActual = cuenta;
    saveState();
    updateUserHeader();
    if (cuenta.rol === 'vendedor') {
      showCloseShift();
    } else {
      showProducts();
    }
  });
}

function logout() {
  if (usuarioActual && usuarioActual.rol === 'vendedor' && turnoActual && turnoActual.vendedor === usuarioActual.usuario) {
    const totalVentas = turnoActual.ventas ? turnoActual.ventas.reduce((sum, v) => sum + v.precio, 0) : 0;
    const totalReparaciones = turnoActual.reparaciones ? turnoActual.reparaciones.reduce((sum, r) => sum + r.costo, 0) : 0;
    const ingresosTotales = totalVentas + totalReparaciones;
    const turnoCerrado = {
      ...turnoActual,
      fin: new Date().toISOString(),
      totalVentas,
      totalReparaciones,
      ingresosTotales
    };
    turnos.push(turnoCerrado);
    turnoActual = null;
    alert('Turno cerrado automáticamente al cerrar sesión.');
  }

  usuarioActual = null;
  saveState();
  updateUserHeader();
  showLogin('Has cerrado sesión.');
}

const panel = document.getElementById('panel');
const botones = document.querySelectorAll('.menu button');

function inicializar() {
  productos.push(
    { id: siguienteProductoId++, nombre: 'Protector de pantalla vidrio templado', precio: 150, stock: 20, categoria: 'Accesorio' },
    { id: siguienteProductoId++, nombre: 'Funda de silicona', precio: 250, stock: 15, categoria: 'Accesorio' },
    { id: siguienteProductoId++, nombre: 'Cargador USB-C', precio: 450, stock: 12, categoria: 'Accesorio' },
    { id: siguienteProductoId++, nombre: 'Auriculares Bluetooth', precio: 850, stock: 8, categoria: 'Accesorio' }
  );
}


function renderPanel(html) {
  stopPhotoCamera();
  stopBarcodeScanner();
  panel.innerHTML = html;
}

function crearTablaProductos(lista) {
  if (lista.length === 0) return '<p class="note">No hay productos disponibles.</p>';

  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Foto</th>
            <th>Código de barra</th>
            <th>Precio</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          ${lista.map(p => `
            <tr class="${p.categoria === 'Accesorio' && p.stock <= lowStockThreshold ? 'low-stock' : ''}">
              <td>${p.id}</td>
              <td>${p.nombre}</td>
              <td>${p.categoria}</td>
              <td>${p.categoria === 'Accesorio' ? (p.fotoUrl ? `<img class="thumb" src="${p.fotoUrl}" alt="${p.nombre}">` : 'Sin foto') : 'N/A'}</td>
              <td>${p.categoria === 'Accesorio' ? (p.codigoBarra || 'N/A') : 'N/A'}</td>
              <td>$${p.precio.toFixed(2)}</td>
              <td>${p.categoria === 'Accesorio' ? `${p.stock}${p.stock <= lowStockThreshold ? ' (Bajo)' : ''}` : 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function crearTablaReparaciones(lista) {
  if (lista.length === 0) return '<p class="note">No hay reparaciones registradas.</p>';

  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Domicilio</th>
            <th>Equipo</th>
            <th>N.º Serie</th>
            <th>Problema</th>
            <th>Contraseña</th>
            <th>Patrón</th>
            <th>Vendedor</th>
            <th>Costo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${lista.map(r => `
            <tr>
              <td>${r.id}</td>
              <td>${r.cliente}</td>
              <td>${r.telefono}</td>
              <td>${r.domicilio}</td>
              <td>${r.equipo}</td>
              <td>${r.numeroSerie}</td>
              <td>${r.problema}</td>
              <td>${r.contrasena || 'N/A'}</td>
              <td>${r.patron || 'N/A'}</td>
              <td>${r.vendedor || 'N/A'}</td>
              <td>$${r.costo.toFixed(2)}</td>
              <td>${r.estado}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function showAddProduct() {
  renderPanel(`
    <h2>Agregar producto</h2>
    <div class="field">
      <label for="categoria">Categoría</label>
      <select id="categoria">
        <option value="Accesorio">Accesorio</option>
        <option value="Reparacion">Servicio de reparación</option>
      </select>
    </div>
    <div class="field">
      <label for="nombre">Nombre</label>
      <input id="nombre" type="text" placeholder="Ej. Funda de silicona">
    </div>
    <div class="field">
      <label for="precio">Precio</label>
      <input id="precio" type="number" min="0" step="0.01" placeholder="Ej. 249.99">
    </div>
    <div class="field" id="stockField">
      <label for="stock">Stock</label>
      <input id="stock" type="number" min="0" placeholder="Ej. 10">
    </div>
    <div class="field" id="imagenField">
      <label for="fotoAccesorio">Foto del accesorio</label>
      <input id="fotoAccesorio" type="file" accept="image/*" capture="environment">
      <div class="photo-actions">
        <button id="useCamera" type="button">Usar cámara</button>
        <button id="capturePhoto" type="button" style="display:none;">Capturar</button>
        <button id="clearPhoto" type="button">Eliminar foto</button>
      </div>
      <video id="photoVideo" autoplay playsinline></video>
      <img id="photoPreview" class="photo-preview" alt="Vista previa de accesorio" style="display:none;">
      <div id="cameraHint" class="note" style="display:none; margin-top:0.75rem;"></div>
    </div>
    <div class="field" id="barcodeField">
      <label for="codigoBarra">Código de barra</label>
      <div class="barcode-input-row">
        <input id="codigoBarra" type="text" placeholder="Ej. 1234567890123">
        <button id="scanBarcode" type="button">Escanear</button>
      </div>
      <video id="barcodeVideo" autoplay playsinline></video>
      <div id="barcodeStatus" class="note">Usa el escáner para capturar el código de barras del accesorio.</div>
    </div>
    <div class="actions">
      <button id="guardarProducto">Guardar</button>
    </div>
  `);

  const categoria = document.getElementById('categoria');
  const stockField = document.getElementById('stockField');
  const imagenField = document.getElementById('imagenField');
  const barcodeField = document.getElementById('barcodeField');
  const guardar = document.getElementById('guardarProducto');
  const fotoInput = document.getElementById('fotoAccesorio');
  const barcodeInput = document.getElementById('codigoBarra');
  const scanBarcodeButton = document.getElementById('scanBarcode');
  const barcodeStatus = document.getElementById('barcodeStatus');
  const useCameraButton = document.getElementById('useCamera');
  const capturePhotoButton = document.getElementById('capturePhoto');
  const clearPhotoButton = document.getElementById('clearPhoto');
  const photoVideo = document.getElementById('photoVideo');
  const photoPreview = document.getElementById('photoPreview');
  const cameraHint = document.getElementById('cameraHint');
  let fotoUrl = '';

  function updateAccessoryFields() {
    const mostrar = categoria.value === 'Accesorio';
    stockField.style.display = mostrar ? 'block' : 'none';
    imagenField.style.display = mostrar ? 'block' : 'none';
    barcodeField.style.display = mostrar ? 'block' : 'none';
    if (!mostrar) {
      stopBarcodeScanner();
      stopPhotoCamera();
    }
  }

  categoria.addEventListener('change', updateAccessoryFields);
  updateAccessoryFields();

  useCameraButton.addEventListener('click', async () => {
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    if (!supported) {
      cameraHint.textContent = 'Tu navegador no soporta cámara. Usa el selector de archivo.';
      cameraHint.style.display = 'block';
      return;
    }

    try {
      photoVideo.style.display = 'block';
      capturePhotoButton.style.display = 'inline-flex';
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      photoStream = stream;
      photoVideo.srcObject = stream;
    } catch (error) {
      console.warn('No se pudo activar la cámara:', error);
      alert('No se pudo activar la cámara. Usa el selector de archivo.');
    }
  });

  capturePhotoButton.addEventListener('click', () => {
    if (!photoVideo.videoWidth || !photoVideo.videoHeight) {
      alert('Espera a que la cámara esté lista.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = photoVideo.videoWidth;
    canvas.height = photoVideo.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(photoVideo, 0, 0, canvas.width, canvas.height);
    fotoUrl = canvas.toDataURL('image/png');
    photoPreview.src = fotoUrl;
    photoPreview.style.display = 'block';
    stopPhotoCamera();
  });

  scanBarcodeButton.addEventListener('click', async () => {
    barcodeStatus.textContent = 'Iniciando escáner...';
    const result = await startBarcodeScanner(barcodeStatus);
    if (result) {
      barcodeInput.value = result;
      barcodeStatus.textContent = `Código detectado: ${result}`;
    }
  });

  fotoInput.addEventListener('change', async () => {
    const file = fotoInput.files[0];
    if (!file) return;
    try {
      fotoUrl = await readFileAsDataURL(file);
      photoPreview.src = fotoUrl;
      photoPreview.style.display = 'block';
    } catch (error) {
      console.warn(error);
    }
  });

  // Mostrar nota si la página no está en un contexto seguro (HTTPS) o si no hay APIs de cámara
  try {
    const secure = location.protocol === 'https:' || location.hostname === 'localhost';
    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    if (!secure || !hasMedia) {
      cameraHint.textContent = !hasMedia ? 'La cámara no está disponible en este navegador.' : 'Para usar la cámara en móviles, abre esta página por HTTPS o en localhost.';
      cameraHint.style.display = 'block';
    }
  } catch (e) {
    // ignore
  }

  clearPhotoButton.addEventListener('click', () => {
    fotoUrl = '';
    fotoInput.value = '';
    photoPreview.src = '';
    photoPreview.style.display = 'none';
    stopPhotoCamera();
  });

  guardar.addEventListener('click', async () => {
    const nombre = document.getElementById('nombre').value.trim();
    const precio = parseFloat(document.getElementById('precio').value);
    const categoriaValor = categoria.value;
    const stock = parseInt(document.getElementById('stock').value, 10) || 0;
    const codigoBarra = barcodeInput.value.trim();
    const fotoArchivo = fotoInput.files[0];

    if (!nombre || Number.isNaN(precio) || precio <= 0) {
      alert('Completa nombre y precio válidos.');
      return;
    }

    if (categoriaValor === 'Accesorio' && (Number.isNaN(stock) || stock < 0)) {
      alert('Ingresa un stock válido.');
      return;
    }

    if (categoriaValor === 'Accesorio' && fotoArchivo) {
      fotoUrl = await readFileAsDataURL(fotoArchivo);
    }

    const nuevoProducto = {
      id: siguienteProductoId++,
      nombre,
      precio,
      stock,
      categoria: categoriaValor,
      fotoUrl: categoriaValor === 'Accesorio' ? fotoUrl : '',
      codigoBarra: categoriaValor === 'Accesorio' ? codigoBarra : ''
    };

    productos.push(nuevoProducto);
    saveState();
    stopBarcodeScanner();
    alert('Producto agregado correctamente.');
    showProducts();
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}

let photoStream = null;
let barcodeStream = null;
let barcodeDetector = null;
let barcodeScanInProgress = false;

async function startBarcodeScanner(statusElement) {
  try {
    if (!('BarcodeDetector' in window)) {
      statusElement.textContent = 'Tu navegador no soporta BarcodeDetector. Ingresa el código manualmente.';
      return null;
    }

    const video = document.getElementById('barcodeVideo');
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    barcodeStream = stream;
    video.srcObject = stream;
    video.style.display = 'block';

    if (!barcodeDetector) {
      barcodeDetector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'upc_a', 'upc_e'] });
    }

    barcodeScanInProgress = true;

    return await new Promise((resolve) => {
      async function scanFrame() {
        if (!barcodeScanInProgress) {
          resolve(null);
          return;
        }

        try {
          const results = await barcodeDetector.detect(video);
          if (results.length > 0) {
            const code = results[0].rawValue;
            barcodeScanInProgress = false;
            stopBarcodeScanner();
            resolve(code);
            return;
          }
        } catch (error) {
          console.warn('Error al escanear:', error);
        }

        requestAnimationFrame(scanFrame);
      }

      scanFrame();
    });
  } catch (error) {
    console.warn('No se pudo iniciar la cámara:', error);
    statusElement.textContent = 'No se pudo iniciar la cámara. Usa el código manualmente.';
    stopBarcodeScanner();
    return null;
  }
}

function stopPhotoCamera() {
  const video = document.getElementById('photoVideo');
  if (video) {
    video.srcObject = null;
    video.style.display = 'none';
  }

  if (photoStream) {
    photoStream.getTracks().forEach(track => track.stop());
    photoStream = null;
  }

  const captureButton = document.getElementById('capturePhoto');
  if (captureButton) captureButton.style.display = 'none';
}

function stopBarcodeScanner() {
  const video = document.getElementById('barcodeVideo');
  if (video) {
    video.srcObject = null;
    video.style.display = 'none';
  }

  if (barcodeStream) {
    barcodeStream.getTracks().forEach(track => track.stop());
    barcodeStream = null;
  }

  barcodeScanInProgress = false;
}

function showProducts() {
  renderPanel(`
    <h2>Productos disponibles</h2>
    ${crearTablaProductos(productos)}
  `);
}

function showSellProduct() {
  if (usuarioActual && usuarioActual.rol === 'vendedor' && (!turnoActual || turnoActual.vendedor !== usuarioActual.usuario)) {
    renderPanel('<h2>Vender producto</h2><p class="note">Debes iniciar tu turno antes de registrar ventas.</p>');
    return;
  }

  if (productos.length === 0) {
    renderPanel('<h2>Vender producto</h2><p class="note">No hay productos disponibles para vender.</p>');
    return;
  }

  renderPanel(`
    <h2>Vender producto</h2>
    <div class="field">
      <label for="productoVenta">Producto</label>
      <select id="productoVenta">
        ${productos.map(p => `<option value="${p.id}">${p.nombre} (${p.categoria}) - $${p.precio.toFixed(2)}</option>`).join('')}
      </select>
    </div>
    <div class="field">
      <label>Vendedor</label>
      <p class="note">${getCurrentVendedor()}</p>
    </div>
    <div class="field">
      <label>Turno activo</label>
      <p class="note">${turnoActual ? `Turno #${turnoActual.id} - ${turnoActual.vendedor}` : 'No hay turno activo. Inicia turno primero.'}</p>
    </div>
    <div class="actions">
      <button id="vender">Vender</button>
    </div>
  `);

  document.getElementById('vender').addEventListener('click', () => {
    const id = parseInt(document.getElementById('productoVenta').value, 10);
    const producto = productos.find(p => p.id === id);
    const vendedor = getCurrentVendedor();

    if (!producto) return;

    if (producto.categoria === 'Accesorio') {
      if (producto.stock <= 0) {
        alert('No hay stock disponible.');
        return;
      }
      producto.stock -= 1;
      if (producto.stock <= lowStockThreshold) {
        alert(`Stock bajo para ${producto.nombre}: quedan ${producto.stock} unidades.`);
      }
    }

    ventas.push({
      id: siguienteVentaId++,
      productoId: producto.id,
      productoNombre: producto.nombre,
      precio: producto.precio,
      vendedor,
      fecha: new Date().toISOString(),
      turnoId: turnoActual ? turnoActual.id : null
    });

    if (turnoActual) {
      turnoActual.ventas = turnoActual.ventas || [];
      turnoActual.ventas.push(ventas[ventas.length - 1]);
    }

    alert(`Venta realizada: ${producto.nombre} \nVendedor: ${vendedor} \nTotal: $${producto.precio.toFixed(2)}`);
    saveState();
    showProducts();
  });
}

function showStockControl() {
  const accesorios = productos.filter(p => p.categoria === 'Accesorio');
  if (accesorios.length === 0) {
    renderPanel('<h2>Control de stock</h2><p class="note">No hay accesorios registrados.</p>');
    return;
  }

  renderPanel(`
    <h2>Control de stock de accesorios</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${accesorios.map(p => `
            <tr class="${p.stock <= lowStockThreshold ? 'low-stock' : ''}">
              <td>${p.id}</td>
              <td>${p.nombre}</td>
              <td>$${p.precio.toFixed(2)}</td>
              <td id="stock-${p.id}">${p.stock}${p.stock <= lowStockThreshold ? ' (Bajo)' : ''}</td>
              <td>
                <button class="stock-btn" data-id="${p.id}" data-delta="1">+1</button>
                <button class="stock-btn" data-id="${p.id}" data-delta="-1">-1</button>
                <button class="stock-btn" data-id="${p.id}" data-delta="5">+5</button>
                <button class="stock-btn" data-id="${p.id}" data-delta="-5">-5</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="field">
      <label for="stockAdjustProduct">Selecciona accesorio</label>
      <select id="stockAdjustProduct">
        ${accesorios.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
      </select>
    </div>
    <div class="field">
      <label for="stockAdjustAmount">Cantidad para ajustar</label>
      <input id="stockAdjustAmount" type="number" min="1" value="1">
    </div>
    <div class="actions">
      <button id="applyStockChange">Aplicar ajuste</button>
    </div>
  `);

  document.querySelectorAll('.stock-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const delta = parseInt(btn.dataset.delta, 10);
      updateStock(id, delta);
    });
  });

  document.getElementById('applyStockChange').addEventListener('click', () => {
    const id = parseInt(document.getElementById('stockAdjustProduct').value, 10);
    const amount = parseInt(document.getElementById('stockAdjustAmount').value, 10);
    if (Number.isNaN(amount) || amount <= 0) {
      alert('Ingresa una cantidad válida.');
      return;
    }
    updateStock(id, amount);
  });
}

function updateStock(id, delta) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;
  producto.stock = Math.max(0, producto.stock + delta);
  if (producto.stock <= lowStockThreshold) {
    alert(`Stock bajo para ${producto.nombre}: quedan ${producto.stock} unidades.`);
  }
  saveState();
  showStockControl();
}

function showRegisterRepair() {
  if (usuarioActual && usuarioActual.rol === 'vendedor' && (!turnoActual || turnoActual.vendedor !== usuarioActual.usuario)) {
    renderPanel('<h2>Registrar reparación</h2><p class="note">Debes iniciar tu turno antes de registrar reparaciones.</p>');
    return;
  }

  renderPanel(`
    <h2>Registrar reparación</h2>
    <div class="field">
      <label>Vendedor</label>
      <p class="note">${getCurrentVendedor()}</p>
    </div>
    <div class="field">
      <label for="cliente">Nombre del cliente</label>
      <input id="cliente" type="text" placeholder="Ej. Juan Pérez">
    </div>
    <div class="field">
      <label for="telefono">Teléfono de contacto</label>
      <input id="telefono" type="text" placeholder="Ej. 099123456">
    </div>
    <div class="field">
      <label for="domicilio">Domicilio</label>
      <input id="domicilio" type="text" placeholder="Ej. Av. Principal 123">
    </div>
    <div class="field">
      <label for="equipo">Equipo (modelo/marca)</label>
      <input id="equipo" type="text" placeholder="Ej. Samsung A52">
    </div>
    <div class="field">
      <label for="numeroSerie">Número de serie</label>
      <input id="numeroSerie" type="text" placeholder="Ej. SN1234567890">
    </div>
    <div class="field">
      <label for="contrasena">Contraseña del celular (opcional)</label>
      <input id="contrasena" type="text" placeholder="Ej. 1234">
    </div>
    <div class="field">
      <label>Patrón del celular (opcional)</label>
      <div class="pattern-grid" id="patternGrid">
        ${Array.from({ length: 9 }, (_, i) => `<div class="pattern-dot" data-index="${i + 1}"></div>`).join('')}
      </div>
      <div class="pattern-display" id="patternDisplay">Patrón: ninguno</div>
      <div class="pattern-controls">
        <button id="clearPattern">Borrar patrón</button>
      </div>
    </div>
    <div class="field">
      <label for="problema">Descripción del problema</label>
      <textarea id="problema" placeholder="Ej. Pantalla rota"></textarea>
    </div>
    <div class="field">
      <label for="costo">Costo estimado</label>
      <input id="costo" type="number" min="0" step="0.01" placeholder="Ej. 1200.00">
    </div>
    <div class="actions">
      <button id="guardarReparacion">Registrar</button>
    </div>
  `);

  const patternGrid = document.getElementById('patternGrid');
  const patternDisplay = document.getElementById('patternDisplay');
  const clearPattern = document.getElementById('clearPattern');
  let patternSequence = [];

  function updatePatternDisplay() {
    patternDisplay.textContent = patternSequence.length > 0 ? `Patrón: ${patternSequence.join(' - ')}` : 'Patrón: ninguno';
  }

  function clearPatternSelection() {
    patternSequence = [];
    document.querySelectorAll('.pattern-dot').forEach(dot => dot.classList.remove('active'));
    updatePatternDisplay();
  }

  patternGrid.addEventListener('click', (event) => {
    const dot = event.target.closest('.pattern-dot');
    if (!dot) return;
    const index = dot.dataset.index;
    if (!patternSequence.includes(index)) {
      patternSequence.push(index);
      dot.classList.add('active');
    }
    updatePatternDisplay();
  });

  clearPattern.addEventListener('click', () => {
    clearPatternSelection();
  });

  document.getElementById('guardarReparacion').addEventListener('click', () => {
    const vendedor = getCurrentVendedor();
    const cliente = document.getElementById('cliente').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const domicilio = document.getElementById('domicilio').value.trim();
    const equipo = document.getElementById('equipo').value.trim();
    const numeroSerie = document.getElementById('numeroSerie').value.trim();
    const contrasena = document.getElementById('contrasena').value.trim();
    const patron = patternSequence.join('-');
    const problema = document.getElementById('problema').value.trim();
    const costo = parseFloat(document.getElementById('costo').value);

    if (!cliente || !telefono || !domicilio || !equipo || !numeroSerie || !problema || Number.isNaN(costo) || costo <= 0) {
      alert('Completa todos los datos obligatorios correctamente.');
      return;
    }

    const nuevaReparacion = {
      id: siguienteReparacionId++,
      cliente,
      telefono,
      domicilio,
      equipo,
      numeroSerie,
      problema,
      costo,
      contrasena,
      patron,
      estado: 'Recibido',
      vendedor,
      fecha: new Date().toISOString(),
      turnoId: turnoActual ? turnoActual.id : null
    };

    reparaciones.push(nuevaReparacion);
    if (turnoActual) {
      turnoActual.reparaciones = turnoActual.reparaciones || [];
      turnoActual.reparaciones.push(nuevaReparacion);
    }

    saveState();
    alert('Reparación registrada con estado Recibido.');
    showRepairs();
  });
}

function showRepairs() {
  renderPanel(`
    <h2>Reparaciones registradas</h2>
    ${crearTablaReparaciones(reparaciones)}
  `);
}

function showFilterState() {
  renderPanel(`
    <h2>Filtrar reparaciones por estado</h2>
    <div class="field">
      <label for="estadoFiltro">Estado</label>
      <select id="estadoFiltro">
        <option value="Recibido">Recibido</option>
        <option value="Pendiente">Pendiente</option>
        <option value="En proceso">En proceso</option>
        <option value="Completado">Completado</option>
      </select>
    </div>
    <div class="actions">
      <button id="filtrarEstado">Filtrar</button>
    </div>
    <div id="resultadosFiltro"></div>
  `);

  document.getElementById('filtrarEstado').addEventListener('click', () => {
    const estado = document.getElementById('estadoFiltro').value;
    const resultados = reparaciones.filter(r => r.estado === estado);
    document.getElementById('resultadosFiltro').innerHTML = crearTablaReparaciones(resultados);
  });
}

function showCompletedHistory() {
  const resultados = reparaciones.filter(r => r.estado === 'Completado');
  renderPanel(`
    <h2>Historial de reparaciones completadas</h2>
    ${crearTablaReparaciones(resultados)}
  `);
}

function showCompletedIncome() {
  const resultados = reparaciones.filter(r => r.estado === 'Completado');
  const total = resultados.reduce((sum, r) => sum + r.costo, 0);

  renderPanel(`
    <h2>Ingresos por reparaciones completadas</h2>
    <p class="note">Reparaciones completadas: ${resultados.length}</p>
    <p class="note">Ingresos totales: $${total.toFixed(2)}</p>
  `);
}

function showUpdateRepair() {
  if (reparaciones.length === 0) {
    renderPanel('<h2>Actualizar estado reparación</h2><p class="note">No hay reparaciones registradas.</p>');
    return;
  }

  renderPanel(`
    <h2>Actualizar estado de reparación</h2>
    <div class="field">
      <label for="reparacionSeleccionada">Reparación</label>
      <select id="reparacionSeleccionada">
        ${reparaciones.map(r => `<option value="${r.id}">${r.id} - ${r.cliente} (${r.equipo}) [${r.estado}]</option>`).join('')}
      </select>
    </div>
    <div class="field">
      <label for="estadoNuevo">Nuevo estado</label>
      <select id="estadoNuevo">
        <option value="Recibido">Recibido</option>
        <option value="Pendiente">Pendiente</option>
        <option value="En proceso">En proceso</option>
        <option value="Completado">Completado</option>
      </select>
    </div>
    <div class="actions">
      <button id="guardarEstado">Actualizar</button>
    </div>
  `);

  document.getElementById('guardarEstado').addEventListener('click', () => {
    const id = parseInt(document.getElementById('reparacionSeleccionada').value, 10);
    const estado = document.getElementById('estadoNuevo').value;
    const reparacion = reparaciones.find(r => r.id === id);

    if (!reparacion) return;

    reparacion.estado = estado;
    saveState();
    alert('Estado actualizado correctamente.');
    showRepairs();
  });
}

function showSearch() {
  renderPanel(`
    <h2>Buscar producto o reparación</h2>
    <div class="field">
      <label for="tipoBuscar">Tipo de búsqueda</label>
      <select id="tipoBuscar">
        <option value="accesorio">Accesorio</option>
        <option value="reparacion">Reparación</option>
      </select>
    </div>
    <div class="field">
      <label for="termino">Nombre o palabra clave</label>
      <input id="termino" type="text" placeholder="Ej. protector, Samsung, batería">
    </div>
    <div class="actions">
      <button id="buscar">Buscar</button>
    </div>
    <div id="resultadosBusqueda"></div>
  `);

  document.getElementById('buscar').addEventListener('click', () => {
    const tipo = document.getElementById('tipoBuscar').value;
    const termino = document.getElementById('termino').value.trim().toLowerCase();
    const resultadosContenedor = document.getElementById('resultadosBusqueda');

    if (!termino) {
      resultadosContenedor.innerHTML = '<p class="note">Ingresa un término para buscar.</p>';
      return;
    }

    if (tipo === 'accesorio') {
      const resultados = productos.filter(p => p.categoria === 'Accesorio' && p.nombre.toLowerCase().includes(termino));
      resultadosContenedor.innerHTML = crearTablaProductos(resultados);
    } else {
      const resultados = reparaciones.filter(r =>
        r.cliente.toLowerCase().includes(termino) ||
        r.telefono.toLowerCase().includes(termino) ||
        r.domicilio.toLowerCase().includes(termino) ||
        r.equipo.toLowerCase().includes(termino) ||
        r.numeroSerie.toLowerCase().includes(termino) ||
        r.problema.toLowerCase().includes(termino) ||
        r.contrasena.toLowerCase().includes(termino) ||
        r.patron.toLowerCase().includes(termino) ||
        (r.vendedor || '').toLowerCase().includes(termino)
      );
      resultadosContenedor.innerHTML = crearTablaReparaciones(resultados);
    }
  });
}

function showCloseShift() {
  if (turnoActual) {
    const totalVentas = turnoActual.ventas ? turnoActual.ventas.reduce((sum, v) => sum + v.precio, 0) : 0;
    const totalReparaciones = turnoActual.reparaciones ? turnoActual.reparaciones.reduce((sum, r) => sum + r.costo, 0) : 0;
    const ingresosTotales = totalVentas + totalReparaciones;

    renderPanel(`
      <h2>Cierre de turno</h2>
      <div class="note">
        Turno activo: #${turnoActual.id} - ${turnoActual.vendedor}<br>
        Inicio: ${new Date(turnoActual.inicio).toLocaleString()}<br>
        Ventas registradas: ${turnoActual.ventas ? turnoActual.ventas.length : 0}<br>
        Reparaciones registradas: ${turnoActual.reparaciones ? turnoActual.reparaciones.length : 0}<br>
        Total de ingresos: $${ingresosTotales.toFixed(2)}
      </div>
      <div class="actions">
        <button id="cerrarTurno">Cerrar turno</button>
      </div>
    `);

    document.getElementById('cerrarTurno').addEventListener('click', () => {
      const turnoCerrado = {
        ...turnoActual,
        fin: new Date().toISOString(),
        totalVentas,
        totalReparaciones,
        ingresosTotales
      };
      turnos.push(turnoCerrado);
      turnoActual = null;
      saveState();
      alert('Turno cerrado correctamente.');
      if (usuarioActual && usuarioActual.rol === 'admin') {
        showSellerReport();
      } else {
        logout();
      }
    });
  } else {
    if (usuarioActual && usuarioActual.rol === 'admin') {
      showSellerReport();
      return;
    }

    const vendedores = getVendedoresRegistrados();
    const esVendedor = usuarioActual && usuarioActual.rol === 'vendedor';

    renderPanel(`
      <h2>Apertura de turno</h2>
      ${esVendedor ? `<div class="note">Vendedor autenticado: ${usuarioActual.usuario}</div>` : ''}
      ${usuarioActual && usuarioActual.rol === 'admin' ? `
        <div class="field">
          <label for="vendedorTurno">Selecciona vendedor</label>
          <select id="vendedorTurno">
            <option value="">Selecciona...</option>
            ${vendedores.map(u => `<option value="${u.usuario}">${u.usuario}</option>`).join('')}
          </select>
        </div>
        ${vendedores.length === 0 ? '<p class="note">No hay vendedores registrados. Crea usuarios de vendedor primero.</p>' : ''}
      ` : ''}
      <div class="actions">
        <button id="iniciarTurno">Iniciar turno</button>
      </div>
    `);

    document.getElementById('iniciarTurno').addEventListener('click', () => {
      let vendedor = '';
      if (esVendedor) {
        vendedor = usuarioActual.usuario;
      } else {
        vendedor = document.getElementById('vendedorTurno') ? document.getElementById('vendedorTurno').value.trim() : '';
      }

      if (!vendedor) {
        alert('Selecciona el usuario de vendedor para iniciar el turno.');
        return;
      }

      turnoActual = {
        id: siguienteTurnoId++,
        vendedor,
        inicio: new Date().toISOString(),
        ventas: [],
        reparaciones: []
      };
      saveState();
      alert(`Turno iniciado para ${vendedor}.`);
      showCloseShift();
    });
  }
}

function showSellerReport() {
  if (!usuarioActual || usuarioActual.rol !== 'admin') {
    alert('Solo el administrador puede ver el reporte detallado por vendedor.');
    return;
  }

  const vendedoresSet = new Set();
  ventas.forEach(v => vendedoresSet.add(v.vendedor));
  reparaciones.forEach(r => vendedoresSet.add(r.vendedor || 'Sin vendedor'));
  turnos.forEach(t => vendedoresSet.add(t.vendedor));
  if (turnoActual) vendedoresSet.add(turnoActual.vendedor);

  const vendedores = Array.from(vendedoresSet).sort();

  const filas = vendedores.map(vendedor => {
    const ventasVendedor = ventas.filter(v => v.vendedor === vendedor);
    const reparacionesVendedor = reparaciones.filter(r => (r.vendedor || 'Sin vendedor') === vendedor);
    const turnosVendedor = turnos.filter(t => t.vendedor === vendedor);
    const ventasCount = ventasVendedor.length;
    const reparacionesCount = reparacionesVendedor.length;
    const ingresosVentas = ventasVendedor.reduce((sum, v) => sum + v.precio, 0);
    const ingresosReparaciones = reparacionesVendedor.reduce((sum, r) => sum + r.costo, 0);
    const ingresosTotales = ingresosVentas + ingresosReparaciones;

    const inicioTurnoActivo = turnoActual && turnoActual.vendedor === vendedor ? new Date(turnoActual.inicio).toLocaleString() : null;
    const turnosInicio = turnosVendedor.map(t => new Date(t.inicio).getTime());
    const inicioMasAntiguo = turnosInicio.length > 0 ? new Date(Math.min(...turnosInicio)).toLocaleString() : null;
    const inicioTexto = inicioTurnoActivo || inicioMasAntiguo || 'N/A';

    const finTurnos = turnosVendedor.filter(t => t.fin).map(t => new Date(t.fin).getTime());
    const finMasReciente = finTurnos.length > 0 ? new Date(Math.max(...finTurnos)).toLocaleString() : null;
    const finTexto = inicioTurnoActivo ? 'Activo' : (finMasReciente || 'N/A');

    return `
      <tr>
        <td>${vendedor}</td>
        <td>${ventasCount}</td>
        <td>$${ingresosVentas.toFixed(2)}</td>
        <td>${reparacionesCount}</td>
        <td>$${ingresosReparaciones.toFixed(2)}</td>
        <td>$${ingresosTotales.toFixed(2)}</td>
        <td>${turnosVendedor.length}</td>
        <td>${inicioTexto}</td>
        <td>${finTexto}</td>
      </tr>
    `;
  }).join('');

  renderPanel(`
    <h2>Reporte detallado por vendedor</h2>
    <div class="note">Turno activo: ${turnoActual ? `#${turnoActual.id} - ${turnoActual.vendedor}` : 'No hay turno activo'}</div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Vendedor</th>
            <th>Ventas</th>
            <th>Ingresos por ventas</th>
            <th>Reparaciones</th>
            <th>Ingresos por reparaciones</th>
            <th>Ingresos totales</th>
            <th>Turnos cerrados</th>
            <th>Apertura turno</th>
            <th>Cierre turno</th>
          </tr>
        </thead>
        <tbody>
          ${filas || '<tr><td colspan="9">No hay datos de vendedores.</td></tr>'}
        </tbody>
      </table>
    </div>
    <div class="actions">
      <button id="verTurnos">Ver historial de turnos</button>
    </div>
    <div id="turnoHistory"></div>
  `);

  document.getElementById('verTurnos').addEventListener('click', () => {
    const historial = turnos.map(t => `
      <div class="note">
        Turno #${t.id} - ${t.vendedor}<br>
        Inicio: ${new Date(t.inicio).toLocaleString()}<br>
        Cierre: ${new Date(t.fin).toLocaleString()}<br>
        Ventas: ${t.ventas ? t.ventas.length : 0}<br>
        Reparaciones: ${t.reparaciones ? t.reparaciones.length : 0}<br>
        Total: $${(t.ingresosTotales || 0).toFixed(2)}
      </div>
    `).join('') || '<p class="note">No hay turnos cerrados.</p>';
    document.getElementById('turnoHistory').innerHTML = historial;
  });
}

function registrarEventos() {
  botones.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      if (action === 'add-product') showAddProduct();
      if (action === 'show-products') showProducts();
      if (action === 'sell-product') showSellProduct();
      if (action === 'register-repair') showRegisterRepair();
      if (action === 'show-repairs') showRepairs();
      if (action === 'stock-control') showStockControl();
      if (action === 'filter-state') showFilterState();
      if (action === 'completed-history') showCompletedHistory();
      if (action === 'completed-income') showCompletedIncome();
      if (action === 'update-repair') showUpdateRepair();
      if (action === 'search') showSearch();
      if (action === 'start-shift') showCloseShift();
      if (action === 'export-data') exportStateToFile();
      if (action === 'import-data') importStateFromFile();
      if (action === 'reset-data') resetStateUI();
      if (action === 'test-save') showSaveTest();
      if (action === 'close-shift') showCloseShift();
      if (action === 'seller-report') showSellerReport();
      if (action === 'manage-users') showManageUsers();
    });
  });

  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }
}

function showManageUsers() {
  if (!usuarioActual || usuarioActual.rol !== 'admin') {
    alert('Solo el usuario maestro puede administrar cuentas.');
    return;
  }

  renderPanel(`
    <h2>Administrar usuarios</h2>
    <div class="actions">
      <button id="crearUsuario">Crear usuario</button>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${usuarios.map(u => `
            <tr>
              <td>${u.id}</td>
              <td>${u.usuario}</td>
              <td>${u.rol}</td>
              <td>
                <button class="edit-user" data-id="${u.id}">Editar</button>
                ${u.rol !== 'admin' ? `<button class="delete-user" data-id="${u.id}">Eliminar</button>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div id="userFormContainer"></div>
  `);

  document.getElementById('crearUsuario').addEventListener('click', () => showUserForm());
  document.querySelectorAll('.edit-user').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      showUserForm(usuarios.find(u => u.id === id));
    });
  });
  document.querySelectorAll('.delete-user').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      if (!confirm('Eliminar este usuario?')) return;
      const index = usuarios.findIndex(u => u.id === id);
      if (index >= 0) {
        usuarios.splice(index, 1);
        saveState();
        showManageUsers();
      }
    });
  });
}

function showUserForm(usuario = null) {
  const isEdit = Boolean(usuario);
  const selectedRol = usuario ? usuario.rol : 'vendedor';
  const userFormContainer = document.getElementById('userFormContainer');
  if (!userFormContainer) return;

  userFormContainer.innerHTML = `
    <div class="panel subpanel">
      <h3>${isEdit ? 'Editar usuario' : 'Crear usuario'}</h3>
      <div class="field">
        <label for="nuevoUsuario">Usuario</label>
        <input id="nuevoUsuario" type="text" value="${usuario ? usuario.usuario : ''}" ${isEdit ? 'disabled' : ''}>
      </div>
      <div class="field">
        <label for="nuevaPassword">Contraseña</label>
        <input id="nuevaPassword" type="password" placeholder="${isEdit ? 'Dejar en blanco para mantener' : 'Contraseña'}">
      </div>
      <div class="field">
        <label for="nuevoRol">Rol</label>
        <select id="nuevoRol">
          <option value="admin" ${selectedRol === 'admin' ? 'selected' : ''}>Administrador</option>
          <option value="vendedor" ${selectedRol === 'vendedor' ? 'selected' : ''}>Vendedor</option>
        </select>
      </div>
      <div class="actions">
        <button id="guardarUsuario">${isEdit ? 'Guardar cambios' : 'Crear usuario'}</button>
        <button id="cancelarUsuario" type="button">Cancelar</button>
      </div>
    </div>
  `;

  document.getElementById('guardarUsuario').addEventListener('click', () => {
    const username = document.getElementById('nuevoUsuario').value.trim();
    const password = document.getElementById('nuevaPassword').value.trim();
    const rol = document.getElementById('nuevoRol').value;

    if (!username) {
      alert('Ingresa un usuario válido.');
      return;
    }

    if (!isEdit && !password) {
      alert('Ingresa una contraseña para el nuevo usuario.');
      return;
    }

    if (isEdit) {
      usuario.rol = rol;
      if (password) usuario.password = password;
    } else {
      if (usuarios.find(u => u.usuario === username)) {
        alert('Ya existe un usuario con ese nombre.');
        return;
      }
      usuarios.push({ id: siguienteUsuarioId++, usuario: username, password, rol });
    }

    saveState();
    showManageUsers();
  });

  document.getElementById('cancelarUsuario').addEventListener('click', () => showManageUsers());
}

function exportStateToFile() {
  try {
    const raw = localStorage.getItem('caja_frenchies_state') || JSON.stringify({ productos, reparaciones, ventas, turnos, usuarios, usuarioActual, turnoActual, siguienteProductoId, siguienteReparacionId, siguienteVentaId, siguienteTurnoId, siguienteUsuarioId });
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'caja_frenchies_backup.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert('No se pudo exportar los datos. Revisa la consola.');
    console.warn(e);
  }
}

function importStateFromFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const state = JSON.parse(text);
      if (state && Array.isArray(state.productos)) {
        productos.length = 0;
        state.productos.forEach(p => productos.push(p));
        reparaciones.length = 0;
        if (Array.isArray(state.reparaciones)) state.reparaciones.forEach(r => reparaciones.push(r));
        ventas.length = 0;
        if (Array.isArray(state.ventas)) state.ventas.forEach(v => ventas.push(v));
        turnos.length = 0;
        if (Array.isArray(state.turnos)) state.turnos.forEach(t => turnos.push(t));
        usuarios.length = 0;
        if (Array.isArray(state.usuarios)) state.usuarios.forEach(u => usuarios.push(u));
        usuarioActual = state.usuarioActual || null;
        turnoActual = state.turnoActual || null;
        siguienteProductoId = state.siguienteProductoId || siguienteProductoId;
        siguienteReparacionId = state.siguienteReparacionId || siguienteReparacionId;
        siguienteVentaId = state.siguienteVentaId || siguienteVentaId;
        siguienteTurnoId = state.siguienteTurnoId || siguienteTurnoId;
        siguienteUsuarioId = state.siguienteUsuarioId || siguienteUsuarioId;
        saveState();
        alert('Importación completada.');
        showProducts();
      } else {
        alert('Archivo inválido.');
      }
    } catch (e) {
      alert('Error al importar el archivo.');
      console.warn(e);
    }
  };
  input.click();
}

function resetStateUI() {
  if (!confirm('¿Restablecer datos? Esto eliminará los productos, reparaciones y cuentas guardadas.')) return;
  localStorage.removeItem('caja_frenchies_state');
  productos.length = 0;
  reparaciones.length = 0;
  ventas.length = 0;
  turnos.length = 0;
  usuarios.length = 0;
  usuarioActual = null;
  turnoActual = null;
  siguienteProductoId = 1;
  siguienteReparacionId = 1;
  siguienteVentaId = 1;
  siguienteTurnoId = 1;
  siguienteUsuarioId = 1;
  inicializar();
  ensureDefaultAdmin();
  saveState();
  showLogin('Datos restablecidos. Inicia sesión con el usuario administrador.');
}

function showStorageStatus(message, level = 'info') {
  const el = document.getElementById('storageNotifier');
  if (!el) return;
  el.textContent = message;
  el.className = 'storage-notifier ' + (level === 'error' ? 'error' : 'info');
  el.style.display = 'block';
}

function hideStorageStatus() {
  const el = document.getElementById('storageNotifier');
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}

function showSaveTest() {
  let raw = null;
  try {
    raw = localStorage.getItem('caja_frenchies_state') || JSON.stringify({ productos, reparaciones, ventas, turnos, turnoActual, siguienteProductoId, siguienteReparacionId, siguienteVentaId, siguienteTurnoId }, null, 2);
  } catch (e) {
    raw = 'Error accediendo a localStorage: ' + (e && e.message ? e.message : '');
  }

  renderPanel(`
    <h2>Probar guardado</h2>
    <div class="actions">
      <button id="backFromTest">Volver</button>
      <button id="downloadState">Descargar JSON</button>
    </div>
    <div class="json-output"><pre>${escapeHtml(raw)}</pre></div>
  `);

  document.getElementById('backFromTest').addEventListener('click', () => showProducts());
  document.getElementById('downloadState').addEventListener('click', () => {
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'caja_frenchies_state_debug.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Cargar estado persistente; si no existe, inicializar con datos de ejemplo
function checkLocalStorageAvailable() {
  try {
    const testKey = '__caja_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

if (!checkLocalStorageAvailable()) {
  // show persistent notification
  document.addEventListener('DOMContentLoaded', () => {
    showStorageStatus('LocalStorage no está disponible en este contexto. Usa Exportar/Importar como alternativa.', 'error');
    registrarEventosConexion();
    registrarEventos();
    updateUserHeader();
    showLogin();
  });
} else {
  const loaded = loadState();
  if (!loaded) {
    inicializar();
    ensureDefaultAdmin();
    saveState();
  } else {
    ensureDefaultAdmin();
  }
  registrarEventosConexion();
  registrarEventos();
  updateUserHeader();
  if (usuarioActual) {
    showProducts();
  } else {
    showLogin();
  }
}
