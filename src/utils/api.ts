export async function apiFetch(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      const result = await res.json();
      if (res.ok) {
        return result;
      } else {
        // Proxy error { error: "..." }
        throw new Error(result.error || result.message || `Error del servidor (${res.status})`);
      }
    } else {
      const text = await res.text();
      console.error("Respuesta no JSON:", text);
      throw new Error("El servidor no devolvió una respuesta válida (JSON).");
    }
  } catch (err: any) {
    console.error("Error en apiFetch:", err);
    throw err;
  }
}
