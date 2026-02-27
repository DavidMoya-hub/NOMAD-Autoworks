//codigo gemini 2.0
export async function apiFetch(url: string, options?: RequestInit, retries = 3): Promise<any> {
  try {
    const GAS_URL = "https://script.google.com/macros/s/AKfycbx1DWkdsoxy8YrEuzxnyyRpNBVa0iLE9O2PSuWrpbqAZzJbHO7yFW4iNwl13TGHfOh8Kg/exec";
    
    let finalUrl = url;
    let finalOptions: RequestInit = { ...options };
    let isGASRequest = false;

    // Si es una ruta de nuestra API, la traducimos para Google Apps Script
    if (url.startsWith("/api/")) {
      isGASRequest = true;
      const urlSinQuery = url.split("?")[0];
      const urlParts = urlSinQuery.replace("/api/", "").split("/");
      const route = urlParts[0]; // ej: "stats", "expenses"
      const id = urlParts[1];    // ej: "123" (para editar o borrar)

      let action = "";
      let gasEntity = "";

      // 1. Traducir la ruta a la acción exacta de tu Google Apps Script
      if (route === "stats") {
        action = "getDashboard";
      } else {
        const entityMapping: Record<string, string> = {
          "orders": "Orden",
          "expenses": "Gasto",
          "clients": "Cliente",
          "vehicles": "Vehiculo",
          "inventory": "Inventario"
        };
        gasEntity = entityMapping[route] || route;

        const method = options?.method || "GET";
        
        if (method === "GET") {
          if (gasEntity === "Orden") action = "getOrdenes";
          else if (gasEntity === "Cliente") action = "getClientes";
          else if (gasEntity === "Gasto") action = "getGastos";
          else if (gasEntity === "Vehiculo") action = "getVehiculos";
          else if (gasEntity === "Inventario") action = "getInventario";
          else action = `get${gasEntity}s`;
        } else if (method === "POST" && !id) {
          action = `create${gasEntity}`;
        } else if (method === "PUT" || (method === "POST" && id)) {
          action = `update${gasEntity}`;
        } else if (method === "DELETE") {
          action = `delete${gasEntity}`;
        }
      }

      // 2. Preparar la petición exactamente como lo hacía tu server.ts
      const method = options?.method || "GET";
      
      if (method === "GET") {
        finalUrl = `${GAS_URL}?action=${action}`;
        finalOptions = { method: "GET", redirect: "follow" };
      } else {
        finalUrl = GAS_URL;
        let payloadData = {};
        if (options?.body) {
          try { payloadData = JSON.parse(options.body as string); } catch(e) {}
        }
        if (id) {
          payloadData = { ...payloadData, id }; // Inyectar ID si existe
        }
        
        // MAGIA ANTI-CORS: Enviar como POST y text/plain
        finalOptions = {
          method: "POST",
          redirect: "follow",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action: action, payload: payloadData })
        };
      }
    }

    // 3. Ejecutar la petición
    const res = await fetch(finalUrl, finalOptions);
    const contentType = res.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      const result = await res.json();
      
      if (res.ok) {
        // Desempaquetar los datos como lo hacía server.ts
        if (isGASRequest && result.success !== undefined) {
          if (!result.success) throw new Error(result.message || "Error en GAS");
          
          const method = options?.method || "GET";
          if (method === "GET" && result.data !== undefined) {
            return result.data;
          }
          return result;
        }
        return result;
      } else {
        throw new Error(result.error || result.message || `Error del servidor (${res.status})`);
      }
    } else {
      const text = await res.text();
      throw new Error(`Respuesta no válida del servidor. Google devolvió un HTML. Revisa los permisos de Apps Script.`);
    }
  } catch (err: any) {
    if (err.message.includes("Failed to fetch") && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return apiFetch(url, options, retries - 1);
    }
    console.error("Error en apiFetch:", err);
    throw err;
  }
}
