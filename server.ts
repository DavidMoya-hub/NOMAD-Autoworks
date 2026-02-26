import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

const GAS_URL = process.env.GAS_URL || "https://script.google.com/macros/s/AKfycbpbAO7BV2wDpyN77ds_jTGSi-mxmpzh1juPck9UYF4BLhxE9Z0iUDeOD6YMkK-1crwvw/exec";

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
      console.error("GAS returned non-JSON:", text);
      // If it's HTML, it might be a Google login page or a script error
      if (text.includes("<html")) {
        throw new Error("El script de Google devolvió una página HTML en lugar de JSON. Asegúrate de que esté publicado como 'Anyone' y ejecutado como 'Me'.");
      }
      throw new Error("Error al procesar la respuesta del servidor de Google.");
    }
  };

  // API Routes
  app.get("/api/stats", async (req, res) => {
    try {
      const result = await callGAS("getDashboard");
      res.json(result.data);
    } catch (err) {
      res.status(500).json({ error: err.toString() });
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
        res.json(result.data);
      } catch (err: any) {
        res.status(500).json({ error: err.message || err.toString() });
      }
    });

    app.post(`/api/${route}`, async (req, res) => {
      try {
        const action = `create${gasEntity}`;
        const result = await callGAS(action, "POST", req.body);
        res.json(result);
      } catch (err: any) {
        res.status(500).json({ error: err.message || err.toString() });
      }
    });

    app.delete(`/api/${route}/:id`, async (req, res) => {
      try {
        const action = `delete${gasEntity}`;
        const result = await callGAS(action, "POST", { id: req.params.id });
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
