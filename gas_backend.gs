/**
 * NOMAD Autoworks - Backend Inteligente v3.6
 * Este código detecta automáticamente las columnas por su nombre.
 */

const CONFIG = {
  SHEETS: {
    CLIENTES: { name: "Clientes", headers: ["id", "nombre", "telefono", "email", "direccion", "fecha_creacion"] },
    VEHICULOS: { name: "Vehiculos", headers: ["id", "clienteid", "marca", "modelo", "año", "vin", "fecha_creacion"] },
    ORDENES: { name: "Ordenes", headers: ["id", "fecha", "clienteid", "vehiculoid", "servicio", "estado", "total", "costo_partes", "costo_mano_obra", "ganancia", "comentarios", "itemsjson"] },
    GASTOS: { name: "Gastos", headers: ["id", "fecha", "categoria", "descripcion", "monto"] },
    INVENTARIO: { name: "Inventario", headers: ["id", "nombre", "categoria", "costo", "precio", "stock_actual", "stock_minimo"] }
  }
};

function doGet(e) {
  try {
    const action = e.parameter.action;
    if (!action) throw new Error("Acción no especificada");

    let data = [];
    if (action === "getDashboard") data = calculateDashboardStats();
    else if (action === "getClientes") data = readData(CONFIG.SHEETS.CLIENTES);
    else if (action === "getVehiculos") data = readData(CONFIG.SHEETS.VEHICULOS);
    else if (action === "getOrdenes") data = readData(CONFIG.SHEETS.ORDENES);
    else if (action === "getGastos") data = readData(CONFIG.SHEETS.GASTOS);
    else if (action === "getInventario") data = readData(CONFIG.SHEETS.INVENTARIO);
    else if (action === "initialize") return initializeSystem();
    else throw new Error("Acción GET no reconocida");

    return createJsonResponse(true, data, "OK");
  } catch (err) { return createJsonResponse(false, null, err.toString()); }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const payload = body.payload;
    let result = null;

    if (action.startsWith("create")) {
      const entity = action.replace("create", "").toUpperCase();
      const config = CONFIG.SHEETS[entity] || CONFIG.SHEETS[entity + 'S'];
      result = createRecord(config, payload);
    } 
    else if (action.startsWith("update")) {
      const entity = action.replace("update", "").toUpperCase();
      const config = CONFIG.SHEETS[entity] || CONFIG.SHEETS[entity + 'S'];
      result = updateRecord(config, payload);
    } 
    else if (action.startsWith("delete")) {
      const entity = action.replace("delete", "").toUpperCase();
      const config = CONFIG.SHEETS[entity] || CONFIG.SHEETS[entity + 'S'];
      result = deleteRecord(config, payload.id);
    } 
    else throw new Error("Acción POST no reconocida");

    return createJsonResponse(true, result, "Operación exitosa");
  } catch (err) { return createJsonResponse(false, null, err.toString()); }
}

function calculateDashboardStats() {
  const ordenes = readData(CONFIG.SHEETS.ORDENES);
  const gastos = readData(CONFIG.SHEETS.GASTOS);
  const inventario = readData(CONFIG.SHEETS.INVENTARIO);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let totalIncome = 0;
  let monthIncome = 0;
  let statusCounts = {};
  let inWorkshop = 0;

  ordenes.forEach(o => {
    const val = Number(o.total) || 0;
    totalIncome += val;
    
    const fechaRaw = o.fecha || o.date;
    if (fechaRaw) {
      const d = new Date(fechaRaw);
      if (!isNaN(d.getTime())) {
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          monthIncome += val;
        }
      }
    }
    
    const status = o.estado || "Desconocido";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    if (status !== "Entregado" && status !== "Cancelado") inWorkshop++;
  });

  let totalExpenses = 0;
  let monthExpenses = 0;
  gastos.forEach(g => {
    const val = Number(g.monto || g.amount) || 0;
    totalExpenses += val;
    
    const fechaRaw = g.fecha || g.date;
    if (fechaRaw) {
      const d = new Date(fechaRaw);
      if (!isNaN(d.getTime())) {
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          monthExpenses += val;
        }
      }
    }
  });

  const netProfit = totalIncome - totalExpenses;
  const lowStockCount = inventario.filter(i => Number(i.stock_actual) <= Number(i.stock_minimo)).length;

  return {
    totalIncome, totalExpenses, monthIncome, monthExpenses, netProfit,
    statusCounts, avgTicket: ordenes.length > 0 ? totalIncome / ordenes.length : 0,
    margin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
    ordersCount: ordenes.length, inWorkshop, lowStockCount
  };
}

function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#0078D2").setFontColor("white").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readData(sheetConfig) {
  const sheet = getOrCreateSheet(sheetConfig.name, sheetConfig.headers);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  
  // Normalize headers from the sheet
  const sheetHeaders = rows[0].map(h => String(h).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  
  return rows.slice(1).map(row => {
    const obj = {};
    sheetConfig.headers.forEach(h => {
      const normalizedExpected = h.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const idx = sheetHeaders.indexOf(normalizedExpected);
      if (idx !== -1) {
        obj[h] = row[idx];
      }
    });
    return obj;
  });
}

function createRecord(sheetConfig, data) {
  const sheet = getOrCreateSheet(sheetConfig.name, sheetConfig.headers);
  const rows = sheet.getDataRange().getValues();
  const sheetHeaders = rows[0].map(h => String(h).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  
  if (sheetHeaders.includes("id")) {
    const lastRow = sheet.getLastRow();
    data.id = lastRow > 1 ? (parseInt(sheet.getRange(lastRow, 1).getValue()) || 0) + 1 : 1;
  }

  const newRow = sheetHeaders.map(h => {
    if (data[h] !== undefined) return data[h];
    
    const aliases = {
      "fecha": ["date", "fecha_creacion"],
      "monto": ["amount", "total"],
      "categoria": ["type", "sku", "categoria"],
      "descripcion": ["description", "servicio"],
      "clienteid": ["cliente_id"],
      "vehiculoid": ["vehiculo_id"]
    };
    
    const possibleKeys = aliases[h] || [];
    for (const key of possibleKeys) {
      if (data[key] !== undefined) return data[key];
    }
    return "";
  });

  sheet.appendRow(newRow);
  return data;
}

function updateRecord(sheetConfig, data) {
  const sheet = getOrCreateSheet(sheetConfig.name, sheetConfig.headers);
  const rows = sheet.getDataRange().getValues();
  const sheetHeaders = rows[0].map(h => String(h).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  
  // Find ID column
  const idIdx = sheetHeaders.indexOf("id");
  if (idIdx === -1) throw new Error("La hoja no tiene columna ID");

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idIdx]) === String(data.id)) {
      const updatedRow = sheetHeaders.map((h, idx) => {
        // If data has the exact header name, use it
        if (data[h] !== undefined) return data[h];
        
        // Check aliases for the header
        const aliases = {
          "fecha": ["date", "fecha_creacion"],
          "monto": ["amount", "total"],
          "categoria": ["type", "sku", "categoria"],
          "descripcion": ["description", "servicio"],
          "clienteid": ["cliente_id"],
          "vehiculoid": ["vehiculo_id"]
        };
        
        const possibleKeys = aliases[h] || [];
        for (const key of possibleKeys) {
          if (data[key] !== undefined) return data[key];
        }
        
        // Fallback to existing value in sheet
        return rows[i][idx];
      });
      
      sheet.getRange(i + 1, 1, 1, sheetHeaders.length).setValues([updatedRow]);
      return data;
    }
  }
  throw new Error("ID no encontrado: " + data.id);
}

function deleteRecord(sheetConfig, id) {
  const sheet = getOrCreateSheet(sheetConfig.name, sheetConfig.headers);
  const rows = sheet.getDataRange().getValues();
  const sheetHeaders = rows[0].map(h => String(h).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  
  const idIdx = sheetHeaders.indexOf("id");
  const searchIdx = idIdx === -1 ? 0 : idIdx; // Fallback to first column if no ID header

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][searchIdx]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { id };
    }
  }
  throw new Error("ID no encontrado para eliminar: " + id);
}

function initializeSystem() {
  Object.values(CONFIG.SHEETS).forEach(s => getOrCreateSheet(s.name, s.headers));
  return createJsonResponse(true, null, "Sistema inicializado");
}

function createJsonResponse(success, data, message) {
  return ContentService.createTextOutput(JSON.stringify({ success, data, message }))
    .setMimeType(ContentService.MimeType.JSON);
}
