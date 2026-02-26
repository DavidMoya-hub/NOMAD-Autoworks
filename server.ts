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
    if (!response.ok) {
      throw new Error(`GAS responded with ${response.status}`);
    }
    const result = await response.json();
    return result; // result is { success, data, message }
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
    "orders": "Ordenes",
    "expenses": "Gastos",
    "clients": "Clientes",
    "vehicles": "Vehiculos",
    "inventory": "Inventario"
  };
  
  Object.entries(entityMapping).forEach(([route, gasEntity]) => {
    app.get(`/api/${route}`, async (req, res) => {
      try {
        const action = `get${gasEntity}`;
        const result = await callGAS(action);
        res.json(result.data);
      } catch (err) {
        res.status(500).json({ error: err.toString() });
      }
    });

    app.post(`/api/${route}`, async (req, res) => {
      try {
        const action = `create${gasEntity.replace(/s$/, "")}`;
        const result = await callGAS(action, "POST", req.body);
        res.json(result);
      } catch (err) {
        res.status(500).json({ error: err.toString() });
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
