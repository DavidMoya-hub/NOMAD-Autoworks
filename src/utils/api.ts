//codigo de gemini
export async function apiFetch(url: string, options?: RequestInit, retries = 3) {
  try {
    // 1. Redirigir las peticiones locales hacia Google Apps Script
    let finalUrl = url;
    
    // Pegamos directamente tu URL de Google Apps Script para asegurar la conexión
    const GAS_URL = "https://script.google.com/macros/s/AKfycbx1DWkdsoxy8YrEuzxnyyRpNBVa0iLE9O2PSuWrpbqAZzJbHO7yFW4iNwl13TGHfOh8Kg/exec";

    // Si la aplicación intenta llamar a tu servidor local (ej. /api/stats)
    if (url.startsWith("/api/")) {
      const ruta = url.replace("/api/", ""); // Extraemos la palabra "stats"
      
      // Construimos la URL asumiendo que tu Google Apps Script usa el parámetro "action"
      if (ruta.includes("?")) {
        finalUrl = `${GAS_URL}&action=${ruta.replace("?", "&")}`;
      } else {
        finalUrl = `${GAS_URL}?action=${ruta}`;
      }
    }

    // 2. Hacer la petición a la URL real en lugar de la local
    const res = await fetch(finalUrl, options);
    const contentType = res.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      const result = await res.json();
      if (res.ok) {
        return result;
      } else {
        throw new Error(result.error || result.message || `Error del servidor (${res.status})`);
      }
    } else {
      const text = await res.text();
      
      // Manejo de servidores en calentamiento
      if (text.includes("Please wait while your application starts") && retries > 0) {
        console.log(`Servidor en calentamiento, reintentando... (${retries} intentos restantes)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return apiFetch(url, options, retries - 1);
      }
      
      console.error("Respuesta no JSON:", text.substring(0, 200));
      throw new Error("El servidor no devolvió una respuesta válida (JSON). Es posible que el enlace de GAS esté incorrecto.");
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
