import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

const GAS_URL = process.env.GAS_URL || "https://script.google.com/macros/s/AKfycbzuucqFqqKk4lhdi9N2HkgLAhJ0KCbjB1_kiOvdvFzVmwi5YKx6YIrXV9nrEOj0RtV4Jw/exec";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to call GAS
  const callGAS = async (action: string, method: string = "GET", body: any = null) => {
    const url = new URL(GAS_URL);
    if (method === "GET") {
      url.searchParams.append("action", action);
    }
    
    const options: any = {
      method: method,
      redirect: "follow"
    };

    if (method === "POST") {
      options.body = JSON.stringify({ action, ...body });
      options.headers = { "Content-Type": "text/plain" }; // GAS expects text/plain for POST data usually
    }

    const response = await fetch(url.toString(), options);
    if (!response.ok) {
      throw new Error(`GAS responded with ${response.status}`);
    }
    const data = await response.json();
    if (data && data.error) {
      throw new Error(data.error);
    }
    return data;
  };

  // API Routes
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await callGAS("getStats");
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.toString() });
    }
  });

  const entityRoutes = ["orders", "expenses", "clients", "vehicles", "inventory"];
  
  entityRoutes.forEach(entity => {
    app.get(`/api/${entity}`, async (req, res) => {
      try {
        const action = `get${entity.charAt(0).toUpperCase() + entity.slice(1)}`;
        const data = await callGAS(action);
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: err.toString() });
      }
    });

    app.post(`/api/${entity}`, async (req, res) => {
      try {
        const action = `add${entity.charAt(0).toUpperCase() + entity.slice(1).replace(/s$/, "")}`;
        // Map body to array for GAS appendRow
        // This is a simplification; in a real app, we'd map keys to columns
        const data = Object.values(req.body);
        const result = await callGAS(action, "POST", { data });
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
