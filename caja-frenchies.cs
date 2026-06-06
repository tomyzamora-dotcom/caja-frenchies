using System;
using System.Collections.Generic;

enum Categoria
{
    Accesorio,
    Reparacion
}

enum EstadoReparacion
{
    Recibido,
    Pendiente,
    EnProceso,
    Completado
}

class Producto
{
    public int Id { get; set; }
    public string Nombre { get; set; }
    public decimal Precio { get; set; }
    public int Stock { get; set; }
    public Categoria Categoria { get; set; }
}

class Reparacion
{
    public int Id { get; set; }
    public string Cliente { get; set; }
    public string Telefono { get; set; }
    public string Domicilio { get; set; }
    public string Equipo { get; set; }
    public string NumeroSerie { get; set; }
    public string Problema { get; set; }
    public decimal Costo { get; set; }
    public string Contrasena { get; set; }
    public string Patron { get; set; }
    public EstadoReparacion Estado { get; set; }
}

class Program
{
    static List<Producto> productos = new List<Producto>();
    static List<Reparacion> reparaciones = new List<Reparacion>();
    static int siguienteProductoId = 1;
    static int siguienteReparacionId = 1;
    static int stockBajoThreshold = 3;

    static void Main()
    {
        InicializarProductos();
        bool continuar = true;

        while (continuar)
        {
            MostrarMenu();
            string opcion = Console.ReadLine();
            Console.Clear();

            switch (opcion)
            {
                case "1":
                    AgregarProducto();
                    break;
                case "2":
                    MostrarProductos();
                    break;
                case "3":
                    VenderProducto();
                    break;
                case "4":
                    ActualizarStockAccesorio();
                    break;
                case "5":
                    RegistrarReparacion();
                    break;
                case "6":
                    MostrarReparaciones();
                    break;
                case "7":
                    MostrarReparacionesPorEstado();
                    break;
                case "8":
                    MostrarReparacionesCompletadas();
                    break;
                case "9":
                    MostrarIngresosReparacionesCompletadas();
                    break;
                case "10":
                    ActualizarEstadoReparacion();
                    break;
                case "11":
                    BuscarItems();
                    break;
                case "12":
                    continuar = false;
                    break;
                default:
                    Console.WriteLine("Opción no válida. Intenta de nuevo.");
                    break;
            }

            if (continuar)
            {
                Console.WriteLine("\nPresiona ENTER para continuar...");
                Console.ReadLine();
                Console.Clear();
            }
        }
    }

    static void MostrarMenu()
    {
        Console.WriteLine("=== Sistema de Accesorios y Reparaciones de Celulares ===");
        Console.WriteLine("1. Agregar producto");
        Console.WriteLine("2. Mostrar productos");
        Console.WriteLine("3. Vender producto");
        Console.WriteLine("4. Actualizar stock de accesorios");
        Console.WriteLine("5. Registrar reparación");
        Console.WriteLine("6. Mostrar reparaciones");
        Console.WriteLine("7. Filtrar reparaciones por estado");
        Console.WriteLine("8. Historial de reparaciones completadas");
        Console.WriteLine("9. Total ingresos por reparaciones completadas");
        Console.WriteLine("10. Actualizar estado de reparación");
        Console.WriteLine("11. Buscar producto o reparación");
        Console.WriteLine("12. Salir");
        Console.Write("Elige una opción: ");
    }

    static void InicializarProductos()
    {
        productos.Add(new Producto { Id = siguienteProductoId++, Nombre = "Protector de pantalla vidrio templado", Precio = 150m, Stock = 20, Categoria = Categoria.Accesorio });
        productos.Add(new Producto { Id = siguienteProductoId++, Nombre = "Funda de silicona", Precio = 250m, Stock = 15, Categoria = Categoria.Accesorio });
        productos.Add(new Producto { Id = siguienteProductoId++, Nombre = "Cargador USB-C", Precio = 450m, Stock = 12, Categoria = Categoria.Accesorio });
        productos.Add(new Producto { Id = siguienteProductoId++, Nombre = "Auriculares Bluetooth", Precio = 850m, Stock = 8, Categoria = Categoria.Accesorio });
    }

    static void AgregarProducto()
    {
        Console.WriteLine("--- Agregar producto ---");
        Console.WriteLine("1. Accesorio");
        Console.WriteLine("2. Reparación (servicio)");
        Console.Write("Selecciona la categoría: ");
        string categoriaInput = Console.ReadLine();

        Categoria categoria;
        if (categoriaInput == "1")
        {
            categoria = Categoria.Accesorio;
        }
        else if (categoriaInput == "2")
        {
            categoria = Categoria.Reparacion;
        }
        else
        {
            Console.WriteLine("Categoría inválida.");
            return;
        }

        Console.Write("Nombre: ");
        string nombre = Console.ReadLine();

        Console.Write("Precio: ");
        if (!decimal.TryParse(Console.ReadLine(), out decimal precio))
        {
            Console.WriteLine("Precio inválido.");
            return;
        }

        int stock = 0;
        if (categoria == Categoria.Accesorio)
        {
            Console.Write("Stock: ");
            if (!int.TryParse(Console.ReadLine(), out stock))
            {
                Console.WriteLine("Stock inválido.");
                return;
            }
        }

        productos.Add(new Producto { Id = siguienteProductoId++, Nombre = nombre, Precio = precio, Stock = stock, Categoria = categoria });
        Console.WriteLine("Producto agregado correctamente.");
    }

    static void MostrarProductos()
    {
        Console.WriteLine("--- Productos disponibles ---");

        if (productos.Count == 0)
        {
            Console.WriteLine("No hay productos registrados.");
            return;
        }

        foreach (var producto in productos)
        {
            string categoriaTexto = producto.Categoria == Categoria.Accesorio ? "Accesorio" : "Servicio de reparación";
            string stockTexto = producto.Categoria == Categoria.Accesorio ? $"Stock: {producto.Stock}{(producto.Stock <= stockBajoThreshold ? " (Bajo)" : "")}" : "Stock: N/A";
            Console.WriteLine($"ID: {producto.Id} | {producto.Nombre} | Categoria: {categoriaTexto} | Precio: ${producto.Precio:F2} | {stockTexto}");
        }
    }

    static void VenderProducto()
    {
        Console.WriteLine("--- Vender producto ---");
        MostrarProductos();

        Console.Write("ID del producto: ");
        if (!int.TryParse(Console.ReadLine(), out int id))
        {
            Console.WriteLine("ID inválido.");
            return;
        }

        var producto = productos.Find(p => p.Id == id);
        if (producto == null)
        {
            Console.WriteLine("Producto no encontrado.");
            return;
        }

        if (producto.Categoria == Categoria.Accesorio)
        {
            if (producto.Stock <= 0)
            {
                Console.WriteLine("No hay stock disponible para este producto.");
                return;
            }

            producto.Stock--;
            if (producto.Stock <= stockBajoThreshold)
            {
                Console.WriteLine($"¡Stock bajo! Quedan {producto.Stock} unidades de {producto.Nombre}.");
            }
        }

        Console.WriteLine($"Venta realizada: {producto.Nombre} | Total: ${producto.Precio:F2}");
    }

    static void ActualizarStockAccesorio()
    {
        Console.WriteLine("--- Actualizar stock de accesorios ---");
        var accesorios = productos.FindAll(p => p.Categoria == Categoria.Accesorio);

        if (accesorios.Count == 0)
        {
            Console.WriteLine("No hay accesorios registrados.");
            return;
        }

        foreach (var producto in accesorios)
        {
            Console.WriteLine($"ID: {producto.Id} | {producto.Nombre} | Stock actual: {producto.Stock}");
        }

        Console.Write("ID del accesorio: ");
        if (!int.TryParse(Console.ReadLine(), out int id))
        {
            Console.WriteLine("ID inválido.");
            return;
        }

        var accesorio = accesorios.Find(p => p.Id == id);
        if (accesorio == null)
        {
            Console.WriteLine("Accesorio no encontrado.");
            return;
        }

        Console.Write("Cantidad a agregar o quitar (usa signo negativo para reducir): ");
        if (!int.TryParse(Console.ReadLine(), out int cantidad))
        {
            Console.WriteLine("Cantidad inválida.");
            return;
        }

        accesorio.Stock = Math.Max(0, accesorio.Stock + cantidad);
        Console.WriteLine($"Stock actualizado. Nuevo stock de {accesorio.Nombre}: {accesorio.Stock}");
        if (accesorio.Stock <= stockBajoThreshold)
        {
            Console.WriteLine($"¡Stock bajo! Quedan {accesorio.Stock} unidades de {accesorio.Nombre}.");
        }
    }

    static void RegistrarReparacion()
    {
        Console.WriteLine("--- Registrar reparación ---");
        Console.Write("Nombre del cliente: ");
        string cliente = Console.ReadLine();

        Console.Write("Teléfono de contacto: ");
        string telefono = Console.ReadLine();

        Console.Write("Domicilio: ");
        string domicilio = Console.ReadLine();

        Console.Write("Equipo (modelo/marca): ");
        string equipo = Console.ReadLine();

        Console.Write("Número de serie: ");
        string numeroSerie = Console.ReadLine();

        Console.Write("Contraseña del celular (opcional): ");
        string contrasena = Console.ReadLine();

        Console.Write("Patrón del celular (opcional): ");
        string patron = Console.ReadLine();

        Console.Write("Descripción del problema: ");
        string problema = Console.ReadLine();

        Console.Write("Costo estimado: ");
        if (!decimal.TryParse(Console.ReadLine(), out decimal costo))
        {
            Console.WriteLine("Costo inválido.");
            return;
        }

        reparaciones.Add(new Reparacion
        {
            Id = siguienteReparacionId++,
            Cliente = cliente,
            Telefono = telefono,
            Domicilio = domicilio,
            Equipo = equipo,
            NumeroSerie = numeroSerie,
            Problema = problema,
            Costo = costo,
            Contrasena = contrasena,
            Patron = patron,
            Estado = EstadoReparacion.Recibido
        });

        Console.WriteLine("Reparación registrada correctamente con estado Recibido.");
    }

    static void MostrarReparaciones()
    {
        Console.WriteLine("--- Reparaciones registradas ---");

        if (reparaciones.Count == 0)
        {
            Console.WriteLine("No hay reparaciones registradas.");
            return;
        }

        foreach (var reparacion in reparaciones)
        {
            Console.WriteLine($"ID: {reparacion.Id} | Cliente: {reparacion.Cliente} | Teléfono: {reparacion.Telefono} | Domicilio: {reparacion.Domicilio} | Equipo: {reparacion.Equipo} | Serie: {reparacion.NumeroSerie} | Problema: {reparacion.Problema} | Contraseña: {reparacion.Contrasena} | Patrón: {reparacion.Patron} | Costo: ${reparacion.Costo:F2} | Estado: {reparacion.Estado}");
        }
    }

    static void MostrarReparacionesPorEstado()
    {
        Console.WriteLine("--- Filtrar reparaciones por estado ---");
        Console.WriteLine("1. Recibido");
        Console.WriteLine("2. Pendiente");
        Console.WriteLine("3. En proceso");
        Console.WriteLine("4. Completado");
        Console.Write("Selecciona el estado: ");
        string seleccion = Console.ReadLine();

        if (!TryParseEstado(seleccion, out EstadoReparacion estadoSeleccionado))
        {
            Console.WriteLine("Estado inválido.");
            return;
        }

        var resultados = reparaciones.FindAll(r => r.Estado == estadoSeleccionado);
        Console.WriteLine($"--- Reparaciones en estado {estadoSeleccionado} ---");

        if (resultados.Count == 0)
        {
            Console.WriteLine("No se encontraron reparaciones en ese estado.");
            return;
        }

        foreach (var reparacion in resultados)
        {
            Console.WriteLine($"ID: {reparacion.Id} | Cliente: {reparacion.Cliente} | Equipo: {reparacion.Equipo} | Problema: {reparacion.Problema} | Costo: ${reparacion.Costo:F2} | Estado: {reparacion.Estado}");
        }
    }

    static void MostrarReparacionesCompletadas()
    {
        Console.WriteLine("--- Historial de reparaciones completadas ---");

        var resultados = reparaciones.FindAll(r => r.Estado == EstadoReparacion.Completado);
        if (resultados.Count == 0)
        {
            Console.WriteLine("No hay reparaciones completadas aún.");
            return;
        }

        foreach (var reparacion in resultados)
        {
            Console.WriteLine($"ID: {reparacion.Id} | Cliente: {reparacion.Cliente} | Equipo: {reparacion.Equipo} | Problema: {reparacion.Problema} | Costo: ${reparacion.Costo:F2} | Estado: {reparacion.Estado}");
        }
    }

    static void MostrarIngresosReparacionesCompletadas()
    {
        Console.WriteLine("--- Total de ingresos por reparaciones completadas ---");

        var resultados = reparaciones.FindAll(r => r.Estado == EstadoReparacion.Completado);
        if (resultados.Count == 0)
        {
            Console.WriteLine("No hay reparaciones completadas aún.");
            return;
        }

        decimal totalIngresos = 0;
        foreach (var reparacion in resultados)
        {
            totalIngresos += reparacion.Costo;
        }

        Console.WriteLine($"Total de reparaciones completadas: {resultados.Count}");
        Console.WriteLine($"Ingresos totales: ${totalIngresos:F2}");
    }

    static bool TryParseEstado(string seleccion, out EstadoReparacion estado)
    {
        switch (seleccion)
        {
            case "1":
                estado = EstadoReparacion.Recibido;
                return true;
            case "2":
                estado = EstadoReparacion.Pendiente;
                return true;
            case "3":
                estado = EstadoReparacion.EnProceso;
                return true;
            case "4":
                estado = EstadoReparacion.Completado;
                return true;
            default:
                estado = EstadoReparacion.Recibido;
                return false;
        }
    }

    static void ActualizarEstadoReparacion()
    {
        Console.WriteLine("--- Actualizar estado de reparación ---");
        MostrarReparaciones();

        Console.Write("ID de la reparación: ");
        if (!int.TryParse(Console.ReadLine(), out int id))
        {
            Console.WriteLine("ID inválido.");
            return;
        }

        var reparacion = reparaciones.Find(r => r.Id == id);
        if (reparacion == null)
        {
            Console.WriteLine("Reparación no encontrada.");
            return;
        }

        Console.WriteLine($"Estado actual: {reparacion.Estado}");
        Console.WriteLine("Selecciona el nuevo estado:");
        Console.WriteLine("1. Recibido");
        Console.WriteLine("2. Pendiente");
        Console.WriteLine("3. En proceso");
        Console.WriteLine("4. Completado");
        Console.Write("Opción: ");
        string estadoInput = Console.ReadLine();

        switch (estadoInput)
        {
            case "1":
                reparacion.Estado = EstadoReparacion.Recibido;
                break;
            case "2":
                reparacion.Estado = EstadoReparacion.Pendiente;
                break;
            case "3":
                reparacion.Estado = EstadoReparacion.EnProceso;
                break;
            case "4":
                reparacion.Estado = EstadoReparacion.Completado;
                break;
            default:
                Console.WriteLine("Estado inválido.");
                return;
        }

        Console.WriteLine("Estado de reparación actualizado correctamente.");
    }

    static void BuscarItems()
    {
        Console.WriteLine("--- Buscar ---");
        Console.WriteLine("1. Buscar accesorio");
        Console.WriteLine("2. Buscar reparación");
        Console.Write("Selecciona opción: ");
        string opcion = Console.ReadLine();

        Console.Write("Ingresa el nombre o palabra clave: ");
        string termino = Console.ReadLine().ToLower();

        if (opcion == "1")
        {
            var resultados = productos.FindAll(p => p.Categoria == Categoria.Accesorio && p.Nombre.ToLower().Contains(termino));
            Console.WriteLine("--- Resultados de accesorios ---");

            if (resultados.Count == 0)
            {
                Console.WriteLine("No se encontraron accesorios con ese término.");
                return;
            }

            foreach (var producto in resultados)
            {
                Console.WriteLine($"ID: {producto.Id} | {producto.Nombre} | Precio: ${producto.Precio:F2} | Stock: {producto.Stock}");
            }
        }
        else if (opcion == "2")
        {
            var resultados = reparaciones.FindAll(r =>
                r.Cliente.ToLower().Contains(termino) ||
                r.Telefono.ToLower().Contains(termino) ||
                r.Domicilio.ToLower().Contains(termino) ||
                r.Equipo.ToLower().Contains(termino) ||
                r.NumeroSerie.ToLower().Contains(termino) ||
                r.Problema.ToLower().Contains(termino) ||
                r.Contrasena.ToLower().Contains(termino) ||
                r.Patron.ToLower().Contains(termino));

            Console.WriteLine("--- Resultados de reparaciones ---");

            if (resultados.Count == 0)
            {
                Console.WriteLine("No se encontraron reparaciones con ese término.");
                return;
            }

            foreach (var reparacion in resultados)
            {
                Console.WriteLine($"ID: {reparacion.Id} | Cliente: {reparacion.Cliente} | Equipo: {reparacion.Equipo} | Problema: {reparacion.Problema} | Costo: ${reparacion.Costo:F2} | Estado: {reparacion.Estado}");
            }
        }
        else
        {
            Console.WriteLine("Opción inválida para búsqueda.");
        }
    }
}
