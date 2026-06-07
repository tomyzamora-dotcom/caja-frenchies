const productos = [];
const reparaciones = [];
let siguienteProductoId = 1;
let siguienteReparacionId = 1;
const lowStockThreshold = 3;

function saveState() {
  try {
    const state = {
      productos,
      reparaciones,
      siguienteProductoId,
      siguienteReparacionId
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
      siguienteProductoId = state.siguienteProductoId || siguienteProductoId;
      siguienteReparacionId = state.siguienteReparacionId || siguienteReparacionId;
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
    <div class="actions">
      <button id="vender">Vender</button>
    </div>
  `);

  document.getElementById('vender').addEventListener('click', () => {
    const id = parseInt(document.getElementById('productoVenta').value, 10);
    const producto = productos.find(p => p.id === id);

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

    alert(`Venta realizada: ${producto.nombre} \nTotal: $${producto.precio.toFixed(2)}`);
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
  renderPanel(`
    <h2>Registrar reparación</h2>
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

    reparaciones.push({ id: siguienteReparacionId++, cliente, telefono, domicilio, equipo, numeroSerie, problema, costo, contrasena, patron, estado: 'Recibido' });
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
        r.patron.toLowerCase().includes(termino)
      );
      resultadosContenedor.innerHTML = crearTablaReparaciones(resultados);
    }
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
      if (action === 'export-data') exportStateToFile();
      if (action === 'import-data') importStateFromFile();
      if (action === 'reset-data') resetStateUI();
      if (action === 'test-save') showSaveTest();
    });
  });
}

function exportStateToFile() {
  try {
    const raw = localStorage.getItem('caja_frenchies_state') || JSON.stringify({ productos, reparaciones, siguienteProductoId, siguienteReparacionId });
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
        siguienteProductoId = state.siguienteProductoId || siguienteProductoId;
        siguienteReparacionId = state.siguienteReparacionId || siguienteReparacionId;
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
  if (!confirm('¿Restablecer datos? Esto eliminará los productos y reparaciones guardados.')) return;
  localStorage.removeItem('caja_frenchies_state');
  productos.length = 0;
  reparaciones.length = 0;
  siguienteProductoId = 1;
  siguienteReparacionId = 1;
  inicializar();
  saveState();
  showProducts();
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
    raw = localStorage.getItem('caja_frenchies_state') || JSON.stringify({ productos, reparaciones, siguienteProductoId, siguienteReparacionId }, null, 2);
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
  });
} else {
  if (!loadState()) {
    inicializar();
  }
}

registrarEventos();
showProducts();
