/**
 * SISTEMA ADMINISTRADOR DE TALLER MECÁNICO - NOMAD AUTOWORKS
 * 
 * Backend: Google Apps Script
 */

const CONFIG = {
  SHEETS: {
    DASHBOARD: "Dashboard",
    ORDENES: "Ordenes",
    GASTOS: "Gastos",
    CLIENTES: "Clientes",
    VEHICULOS: "Vehiculos",
    INVENTARIO: "Inventario"
  }
};

function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch(action) {
      case "getDashboard":
        return jsonResponse(true, getDashboardData(), "Dashboard cargado");
      case "getClientes":
        return jsonResponse(true, getSheetData(CONFIG.SHEETS.CLIENTES), "Clientes cargados");
      case "getVehiculos":
        return jsonResponse(true, getSheetData(CONFIG.SHEETS.VEHICULOS), "Vehículos cargados");
      case "getOrdenes":
        return jsonResponse(true, getSheetData(CONFIG.SHEETS.ORDENES), "Órdenes cargadas");
      case "getInventario":
        return jsonResponse(true, getSheetData(CONFIG.SHEETS.INVENTARIO), "Inventario cargado");
      case "getGastos":
        return jsonResponse(true, getSheetData(CONFIG.SHEETS.GASTOS), "Gastos cargados");
      default:
        return jsonResponse(false, null, "Acción no reconocida");
    }
  } catch (err) {
    return jsonResponse(false, null, err.toString());
  }
}

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const payload = request.payload;
    
    switch(action) {
      case "createCliente":
        return addRow(CONFIG.SHEETS.CLIENTES, payload);
      case "createVehiculo":
        return addRow(CONFIG.SHEETS.VEHICULOS, payload);
      case "createOrden":
        return addRow(CONFIG.SHEETS.ORDENES, payload);
      case "createGasto":
        return addRow(CONFIG.SHEETS.GASTOS, payload, false); // No ID for expenses
      case "createInventario":
        return addRow(CONFIG.SHEETS.INVENTARIO, payload);
      default:
        return jsonResponse(false, null, "Acción POST no reconocida");
    }
  } catch (err) {
    return jsonResponse(false, null, err.toString());
  }
}

function getDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ordenes = ss.getSheetByName(CONFIG.SHEETS.ORDENES).getDataRange().getValues();
  const gastos = ss.getSheetByName(CONFIG.SHEETS.GASTOS).getDataRange().getValues();
  const inventario = ss.getSheetByName(CONFIG.SHEETS.INVENTARIO).getDataRange().getValues();
  
  const now = new Date();
  let monthIncome = 0;
  let monthExpenses = 0;
  let statusCounts = { "En ingreso": 0, "En proceso": 0, "Listo": 0, "Entregado": 0 };
  let lowStockCount = 0;

  // Process Orders
  for (let i = 1; i < ordenes.length; i++) {
    const row = ordenes[i];
    const date = new Date(row[1]);
    if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
      monthIncome += Number(row[6]) || 0;
    }
    const status = row[5];
    if (statusCounts.hasOwnProperty(status)) statusCounts[status]++;
  }

  // Process Expenses
  for (let i = 1; i < gastos.length; i++) {
    const row = gastos[i];
    const date = new Date(row[0]);
    if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
      monthExpenses += Number(row[3]) || 0;
    }
  }

  // Process Inventory
  for (let i = 1; i < inventario.length; i++) {
    if (Number(inventario[i][3]) <= Number(inventario[i][6])) lowStockCount++;
  }

  return {
    monthIncome,
    monthExpenses,
    netProfit: monthIncome - monthExpenses,
    statusCounts,
    lowStockCount,
    inWorkshop: statusCounts["En ingreso"] + statusCounts["En proceso"] + statusCounts["Listo"]
  };
}

function getSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  return data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      const key = h.toLowerCase().replace(/ /g, "_").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      obj[key] = row[i];
    });
    return obj;
  });
}

function addRow(sheetName, payload, autoId = true) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  let rowData = headers.map(h => {
    const key = h.toLowerCase().replace(/ /g, "_").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return payload[key] !== undefined ? payload[key] : "";
  });

  if (autoId) {
    const lastId = sheet.getLastRow() > 1 ? sheet.getRange(sheet.getLastRow(), 1).getValue() : 0;
    rowData[0] = (Number(lastId) || 0) + 1;
  }

  sheet.appendRow(rowData);
  return jsonResponse(true, { id: rowData[0] }, "Registro guardado correctamente");
}

function jsonResponse(success, data, message) {
  const response = {
    success: success,
    data: data,
    message: message
  };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const brandColor = "#0078D2";
  
  const sheetsConfig = [
    { name: CONFIG.SHEETS.ORDENES, headers: ["ID", "Fecha", "ClienteID", "VehiculoID", "Servicio", "Estado", "Total", "Costo Partes", "Costo Mano Obra", "Ganancia", "Comentarios", "ItemsJSON"] },
    { name: CONFIG.SHEETS.GASTOS, headers: ["Fecha", "Tipo", "Descripción", "Monto"] },
    { name: CONFIG.SHEETS.CLIENTES, headers: ["ID", "Nombre", "Teléfono", "Dirección"] },
    { name: CONFIG.SHEETS.VEHICULOS, headers: ["ID", "ClienteID", "Marca", "Modelo", "Año", "Placas", "VIN"] },
    { name: CONFIG.SHEETS.INVENTARIO, headers: ["ID", "Nombre", "SKU", "Stock", "Precio Venta", "Costo", "Alerta Min"] }
  ];

  sheetsConfig.forEach(conf => {
    let sheet = ss.getSheetByName(conf.name);
    if (!sheet) {
      sheet = ss.insertSheet(conf.name);
      sheet.getRange(1, 1, 1, conf.headers.length).setValues([conf.headers])
        .setBackground(brandColor).setFontColor("white").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  });
}
