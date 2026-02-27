/**
 * NOMAD Autoworks - Backend Robusto (Google Apps Script)
 * Copia y pega este código en tu editor de Google Apps Script.
 * 
 * Instrucciones:
 * 1. Abre tu Google Sheet.
 * 2. Ve a Extensiones > Apps Script.
 * 3. Borra todo el código existente y pega este.
 * 4. Haz clic en "Implementar" > "Nueva implementación".
 * 5. Selecciona "Aplicación web".
 * 6. Configura: "Ejecutar como: Yo" y "Quién tiene acceso: Cualquiera".
 * 7. Copia la URL de la aplicación web y actualiza tu variable GAS_URL.
 */

const CONFIG = {
  SHEETS: {
    CLIENTES: {
      name: "Clientes",
      headers: ["id", "nombre", "telefono", "email", "fecha_creacion"]
    },
    VEHICULOS: {
      name: "Vehiculos",
      headers: ["id", "cliente_id", "marca", "modelo", "placa", "año", "fecha_creacion"]
    },
    ORDENES: {
      name: "Ordenes",
      headers: ["id", "fecha", "cliente_id", "vehiculo_id", "descripcion", "estado", "total", "pagado"]
    },
    GASTOS: {
      name: "Gastos",
      headers: ["fecha", "categoria", "descripcion", "monto"]
    },
    INVENTARIO: {
      name: "Inventario",
      headers: ["id", "nombre", "categoria", "costo", "precio", "stock_actual", "stock_minimo"]
    }
  }
};

/**
 * Inicializa el sistema creando todas las hojas necesarias.
 * Puedes ejecutar esta función manualmente desde el editor de Apps Script.
 */
function initializeSystem() {
  try {
    Object.values(CONFIG.SHEETS).forEach(sheetConfig => {
      getOrCreateSheet(sheetConfig.name, sheetConfig.headers);
    });
    return createJsonResponse(true, null, "Sistema inicializado correctamente.");
  } catch (e) {
    return createJsonResponse(false, null, "Error al inicializar: " + e.toString());
  }
}

/**
 * Obtiene una hoja por nombre o la crea con encabezados si no existe.
 */
function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    // Formatear encabezados
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground("#0078D2")
      .setFontColor("white")
      .setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * Maneja peticiones GET
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    let data = [];
    let message = "Operación exitosa";

    if (!action) throw new Error("Acción no especificada");

    switch (action) {
      case "getClientes":
        data = readData(CONFIG.SHEETS.CLIENTES);
        break;
      case "getVehiculos":
        data = readData(CONFIG.SHEETS.VEHICULOS);
        break;
      case "getOrdenes":
        data = readData(CONFIG.SHEETS.ORDENES);
        break;
      case "getGastos":
        data = readData(CONFIG.SHEETS.GASTOS);
        break;
      case "getInventario":
        data = readData(CONFIG.SHEETS.INVENTARIO);
        break;
      case "getDashboard":
        data = calculateDashboardStats();
        break;
      case "initialize":
        return initializeSystem();
      default:
        throw new Error("Acción GET no reconocida: " + action);
    }

    return createJsonResponse(true, data, message);
  } catch (err) {
    return createJsonResponse(false, null, err.toString());
  }
}

/**
 * Maneja peticiones POST
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const payload = body.payload;
    let result = null;

    if (!action) throw new Error("Acción POST no especificada");

    switch (action) {
      case "createCliente":
        result = createRecord(CONFIG.SHEETS.CLIENTES, payload);
        break;
      case "updateCliente":
        result = updateRecord(CONFIG.SHEETS.CLIENTES, payload);
        break;
      case "deleteCliente":
        result = deleteRecord(CONFIG.SHEETS.CLIENTES, payload.id);
        break;
      case "createVehiculo":
        result = createRecord(CONFIG.SHEETS.VEHICULOS, payload);
        break;
      case "updateVehiculo":
        result = updateRecord(CONFIG.SHEETS.VEHICULOS, payload);
        break;
      case "deleteVehiculo":
        result = deleteRecord(CONFIG.SHEETS.VEHICULOS, payload.id);
        break;
      case "createOrden":
        result = createRecord(CONFIG.SHEETS.ORDENES, payload);
        break;
      case "updateOrden":
        result = updateRecord(CONFIG.SHEETS.ORDENES, payload);
        break;
      case "deleteOrden":
        result = deleteRecord(CONFIG.SHEETS.ORDENES, payload.id);
        break;
      case "createGasto":
        result = createRecord(CONFIG.SHEETS.GASTOS, payload, false);
        break;
      case "createInventario":
        result = createRecord(CONFIG.SHEETS.INVENTARIO, payload);
        break;
      case "updateInventario":
        result = updateRecord(CONFIG.SHEETS.INVENTARIO, payload);
        break;
      case "deleteInventario":
        result = deleteRecord(CONFIG.SHEETS.INVENTARIO, payload.id);
        break;
      default:
        throw new Error("Acción POST no reconocida: " + action);
    }

    return createJsonResponse(true, result, "Operación completada");
  } catch (err) {
    return createJsonResponse(false, null, err.toString());
  }
}

/**
 * Lee datos de una hoja y los convierte a objeto JSON
 */
function readData(sheetConfig) {
  const sheet = getOrCreateSheet(sheetConfig.name, sheetConfig.headers);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  
  const headers = rows[0];
  const data = [];

  for (let i = 1; i < rows.length; i++) {
    const obj = {};
    rows[i].forEach((val, idx) => {
      obj[headers[idx]] = val;
    });
    data.push(obj);
  }
  return data;
}

/**
 * Crea un nuevo registro con ID incremental
 */
function createRecord(sheetConfig, data, hasId = true) {
  const sheet = getOrCreateSheet(sheetConfig.name, sheetConfig.headers);
  const headers = sheetConfig.headers;
  
  if (hasId) {
    const lastRow = sheet.getLastRow();
    let nextId = 1;
    if (lastRow > 1) {
      const lastId = sheet.getRange(lastRow, 1).getValue();
      nextId = (parseInt(lastId) || 0) + 1;
    }
    data.id = nextId;
  }
  
  if (headers.includes("fecha_creacion") && !data.fecha_creacion) {
    data.fecha_creacion = new Date().toISOString();
  }

  const row = headers.map(h => data[h] !== undefined ? data[h] : "");
  sheet.appendRow(row);
  return data;
}

/**
 * Actualiza un registro existente por ID
 */
function updateRecord(sheetConfig, data) {
  const sheet = getOrCreateSheet(sheetConfig.name, sheetConfig.headers);
  const rows = sheet.getDataRange().getValues();
  const id = data.id;
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == id) {
      const rowNum = i + 1;
      const headers = sheetConfig.headers;
      const newRow = headers.map(h => data[h] !== undefined ? data[h] : rows[i][headers.indexOf(h)]);
      sheet.getRange(rowNum, 1, 1, headers.length).setValues([newRow]);
      return data;
    }
  }
  throw new Error("Registro con ID " + id + " no encontrado en " + sheetConfig.name);
}

/**
 * Elimina un registro por ID
 */
function deleteRecord(sheetConfig, id) {
  const sheet = getOrCreateSheet(sheetConfig.name, sheetConfig.headers);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == id) {
      sheet.deleteRow(i + 1);
      return { id: id, deleted: true };
    }
  }
  throw new Error("Registro con ID " + id + " no encontrado");
}

/**
 * Calcula estadísticas para el dashboard
 */
function calculateDashboardStats() {
  const ordenes = readData(CONFIG.SHEETS.ORDENES);
  const gastos = readData(CONFIG.SHEETS.GASTOS);
  
  const totalIncome = ordenes.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const monthIncome = totalIncome; // Simplificado
  const totalExpenses = gastos.reduce((sum, g) => sum + (Number(g.monto) || 0), 0);
  const monthExpenses = totalExpenses; // Simplificado
  
  return {
    totalIncome,
    monthIncome,
    totalExpenses,
    monthExpenses,
    totalOrders: ordenes.length,
    pendingOrders: ordenes.filter(o => o.estado !== "Completado" && o.estado !== "Entregado").length,
    completedOrders: ordenes.filter(o => o.estado === "Completado" || o.estado === "Entregado").length
  };
}

/**
 * Helper para crear respuesta JSON consistente
 */
function createJsonResponse(success, data, message) {
  const res = {
    success: success,
    data: data,
    message: message
  };
  return ContentService.createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON);
}
