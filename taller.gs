/**
 * SISTEMA ADMINISTRADOR DE TALLER MECÁNICO - NOMAD AUTOWORKS
 * 
 * Instrucciones:
 * 1. Abre tu Google Sheet.
 * 2. Ve a Extensiones > Apps Script.
 * 3. Pega este código y guarda.
 * 4. Recarga la hoja para ver el menú "Taller".
 */

const CONFIG = {
  SHEETS: {
    DASHBOARD: "Dashboard",
    ORDENES: "Ordenes",
    GASTOS: "Gastos",
    CLIENTES: "Clientes",
    VEHICULOS: "Vehiculos",
    INVENTARIO: "Inventario"
  },
  COLORS: {
    BRAND: "#0078D2", // Azul Mopar
    DARK: "#0A0A0A",
    TEXT: "#FFFFFF"
  }
};

/**
 * Crea el menú personalizado al abrir
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🛠️ NOMAD')
    .addItem('Actualizar Dashboard', 'updateDashboard')
    .addSeparator()
    .addItem('Configurar Sistema Completo', 'setupSheets')
    .addToUi();
}

/**
 * Configura las hojas si no existen
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
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
        .setBackground(CONFIG.COLORS.BRAND).setFontColor("white").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  });
  
  let sheetDash = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
  if (!sheetDash) {
    sheetDash = ss.insertSheet(CONFIG.SHEETS.DASHBOARD);
    ss.moveActiveSheet(1);
  }
  
  updateDashboard();
}

/**
 * Actualiza métricas y gráficas en el Dashboard
 */
function updateDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dash = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
  const ordenes = ss.getSheetByName(CONFIG.SHEETS.ORDENES);
  const gastos = ss.getSheetByName(CONFIG.SHEETS.GASTOS);
  
  if (!dash || !ordenes || !gastos) return;
  
  const dataOrdenes = ordenes.getDataRange().getValues();
  const dataGastos = gastos.getDataRange().getValues();
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let monthIncome = 0;
  let monthExpenses = 0;
  let inProcessCount = 0;
  let statusCounts = { "En ingreso": 0, "En proceso": 0, "Listo": 0, "Entregado": 0 };
  
  for (let i = 1; i < dataOrdenes.length; i++) {
    const row = dataOrdenes[i];
    const date = new Date(row[1]);
    const total = Number(row[6]) || 0;
    const status = row[5];
    
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      monthIncome += total;
    }
    
    if (status !== "Entregado" && status !== "Cancelado") inProcessCount++;
    if (statusCounts.hasOwnProperty(status)) statusCounts[status]++;
  }
  
  for (let i = 1; i < dataGastos.length; i++) {
    const row = dataGastos[i];
    const date = new Date(row[0]);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      monthExpenses += Number(row[3]) || 0;
    }
  }
  
  dash.clear();
  dash.setBackground("#F3F3F3");
  dash.getRange("B2").setValue("NOMAD AUTOWORKS - PANEL DE CONTROL")
    .setFontSize(18).setFontWeight("bold").setFontColor(CONFIG.COLORS.BRAND);
  
  const metrics = [
    ["INGRESOS MES", monthIncome],
    ["GASTOS MES", monthExpenses],
    ["UTILIDAD NETO", monthIncome - monthExpenses],
    ["EN TALLER", inProcessCount]
  ];
  
  metrics.forEach((m, idx) => {
    const col = 2 + (idx * 2);
    dash.getRange(4, col).setValue(m[0]).setFontWeight("bold").setFontColor("#666").setFontSize(9);
    dash.getRange(5, col).setValue(m[1]).setFontSize(14).setFontWeight("bold")
      .setNumberFormat("$#,##0").setFontColor(m[0].includes("UTILIDAD") ? "#228B22" : "#333");
  });

  SpreadsheetApp.getActive().toast("Dashboard actualizado", "NOMAD");
}

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    if (action === "getStats") {
      const ordenes = ss.getSheetByName(CONFIG.SHEETS.ORDENES).getDataRange().getValues();
      const gastos = ss.getSheetByName(CONFIG.SHEETS.GASTOS).getDataRange().getValues();
      const inventario = ss.getSheetByName(CONFIG.SHEETS.INVENTARIO).getDataRange().getValues();
      
      const now = new Date();
      let monthIncome = 0;
      let monthExpenses = 0;
      let statusCounts = { "En ingreso": 0, "En proceso": 0, "Listo": 0, "Entregado": 0 };
      let lowStockCount = 0;

      for (let i = 1; i < ordenes.length; i++) {
        const row = ordenes[i];
        const date = new Date(row[1]);
        if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
          monthIncome += Number(row[6]) || 0;
        }
        const status = row[5];
        if (statusCounts.hasOwnProperty(status)) statusCounts[status]++;
      }

      for (let i = 1; i < gastos.length; i++) {
        const row = gastos[i];
        const date = new Date(row[0]);
        if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
          monthExpenses += Number(row[3]) || 0;
        }
      }

      for (let i = 1; i < inventario.length; i++) {
        if (Number(inventario[i][3]) <= Number(inventario[i][6])) lowStockCount++;
      }

      return jsonResponse({
        monthIncome,
        monthExpenses,
        netProfit: monthIncome - monthExpenses,
        statusCounts,
        lowStockCount,
        inWorkshop: statusCounts["En ingreso"] + statusCounts["En proceso"] + statusCounts["Listo"]
      });
    }

    if (["getOrders", "getExpenses", "getClients", "getVehicles", "getInventory"].includes(action)) {
      const sheetName = CONFIG.SHEETS[action.replace("get", "").toUpperCase()];
      const sheet = ss.getSheetByName(sheetName);
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const result = data.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => {
          const key = h.toLowerCase().replace(/ /g, "_").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          obj[key] = row[i];
        });
        return obj;
      });
      return jsonResponse(result);
    }
    
    return jsonResponse({ error: "Acción no válida" });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const params = JSON.parse(e.postData.contents);
  const action = params.action;
  
  try {
    const sheetMapping = {
      "addOrder": CONFIG.SHEETS.ORDENES,
      "addClient": CONFIG.SHEETS.CLIENTES,
      "addVehicle": CONFIG.SHEETS.VEHICULOS,
      "addInventory": CONFIG.SHEETS.INVENTARIO,
      "addExpense": CONFIG.SHEETS.GASTOS
    };

    if (sheetMapping[action]) {
      const sheet = ss.getSheetByName(sheetMapping[action]);
      const data = params.data;
      if (action !== "addExpense") {
        const lastId = sheet.getLastRow() > 1 ? sheet.getRange(sheet.getLastRow(), 1).getValue() : 0;
        data.unshift((Number(lastId) || 0) + 1);
      }
      sheet.appendRow(data);
      updateDashboard();
      return jsonResponse({ success: true });
    }

    // Generic Delete/Update could be added here
    
    return jsonResponse({ error: "Acción no válida" });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
