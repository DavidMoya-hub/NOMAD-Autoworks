export async function apiFetch(url: string, options?: RequestInit, retries = 3) {
  try {
    const res = await fetch(url, options);
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
      
      // If we get the "Starting Server" page, retry after a delay
      if (text.includes("Please wait while your application starts") && retries > 0) {
        console.log(`Servidor en calentamiento, reintentando... (${retries} intentos restantes)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return apiFetch(url, options, retries - 1);
      }
      
      console.error("Respuesta no JSON:", text.substring(0, 200));
      throw new Error("El servidor no devolvió una respuesta válida (JSON). Es posible que el servidor se esté reiniciando.");
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
