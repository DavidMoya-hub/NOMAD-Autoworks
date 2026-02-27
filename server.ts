import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

const GAS_URL = process.env.GAS_URL || "https://script.google.com/macros/s/AKfycbx1DWkdsoxy8YrEuzxnyyRpNBVa0iLE9O2PSuWrpbqAZzJbHO7yFW4iNwl13TGHfOh8Kg/exec";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to call GAS
  const callGAS = async (action: string, method: string = "GET", payload: any = null) => {
    const url = new URL(GAS_URL);
    if (method === "GET") {
      url.searchParams.append("action", action);
    }
    
    const options: any = {
      method: method,
      redirect: "follow"
    };

    if (method === "POST") {
      options.body = JSON.stringify({ action, payload });
      options.headers = { "Content-Type": "text/plain" };
    }

    const response = await fetch(url.toString(), options);
    const text = await response.text();
    
    if (!response.ok) {
      throw new Error(`GAS responded with ${response.status}: ${text.substring(0, 100)}`);
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("GAS returned non-JSON:", text.substring(0, 500));
      // If it's HTML, it might be a Google login page or a script error
      if (text.includes("<html")) {
        if (text.includes("Google Accounts") || text.includes("login")) {
          throw new Error("Error de permisos: El script de Google requiere iniciar sesión. Asegúrate de que esté publicado como 'Anyone' (Cualquiera) y NO solo para tu organización.");
        }
        throw new Error(`El script de Google devolvió una página HTML. Esto suele ser un error interno del script o falta de permisos. Inicio de la respuesta: ${text.substring(0, 100)}...`);
      }
      throw new Error("Error al procesar la respuesta del servidor de Google. La respuesta no es un JSON válido.");
    }
  };

  // API Routes
  app.get("/api/stats", async (req, res) => {
    try {
      const result = await callGAS("getDashboard");
      if (!result.success) throw new Error(result.message || "Error al obtener estadísticas");
      res.json(result.data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || err.toString() });
    }
  });

  const entityMapping: Record<string, string> = {
    "orders": "Orden",
    "expenses": "Gasto",
    "clients": "Cliente",
    "vehicles": "Vehiculo",
    "inventory": "Inventario"
  };
  
  Object.entries(entityMapping).forEach(([route, gasEntity]) => {
    app.get(`/api/${route}`, async (req, res) => {
      try {
        const action = `get${gasEntity}${gasEntity.endsWith('o') || gasEntity.endsWith('e') || gasEntity.endsWith('a') ? 's' : 'es'}`;
        // Special case for inventory and others if needed
        let finalAction = action;
        if (gasEntity === "Orden") finalAction = "getOrdenes";
        if (gasEntity === "Cliente") finalAction = "getClientes";
        if (gasEntity === "Gasto") finalAction = "getGastos";
        if (gasEntity === "Vehiculo") finalAction = "getVehiculos";
        if (gasEntity === "Inventario") finalAction = "getInventario";

        const result = await callGAS(finalAction);
        if (!result.success) throw new Error(result.message || `Error al obtener ${route}`);
        res.json(result.data);
      } catch (err: any) {
        res.status(500).json({ error: err.message || err.toString() });
      }
    });

    app.post(`/api/${route}`, async (req, res) => {
      try {
        const action = `create${gasEntity}`;
        const result = await callGAS(action, "POST", req.body);
        if (!result.success) throw new Error(result.message || `Error al crear ${gasEntity}`);
        res.json(result);
      } catch (err: any) {
        res.status(500).json({ error: err.message || err.toString() });
      }
    });

    app.put(`/api/${route}/:id`, async (req, res) => {
      try {
        const action = `update${gasEntity}`;
        const result = await callGAS(action, "POST", { ...req.body, id: req.params.id });
        if (!result.success) throw new Error(result.message || `Error al actualizar ${gasEntity}`);
        res.json(result);
      } catch (err: any) {
        res.status(500).json({ error: err.message || err.toString() });
      }
    });

    app.delete(`/api/${route}/:id`, async (req, res) => {
      try {
        const action = `delete${gasEntity}`;
        const result = await callGAS(action, "POST", { id: req.params.id });
        if (!result.success) throw new Error(result.message || `Error al eliminar ${gasEntity}`);
        res.json(result);
      } catch (err: any) {
        res.status(500).json({ error: err.message || err.toString() });
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
