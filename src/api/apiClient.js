const configuredApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL =
  configuredApiBaseUrl ||
  (import.meta.env.DEV
    ? "http://localhost:8080"
    : "");

if (!API_BASE_URL) {
  throw new Error(
    "Falta configurar VITE_API_BASE_URL para producción"
  );
}

function isMutationMethod(method) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(
    method.toUpperCase()
  );
}

function notifyUnauthorized(path) {
  if (
    path !== "/api/auth/login" &&
    path !== "/api/auth/me"
  ) {
    window.dispatchEvent(
      new CustomEvent("auth:unauthorized")
    );
  }
}

async function getCsrfToken() {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/csrf`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "No se pudo obtener el token CSRF"
    );
  }

  return response.json();
}

async function readErrorMessage(
  response,
  fallback = "Error en la solicitud"
) {
  const contentType =
    response.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return data?.message || data?.error || fallback;
    }

    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

export async function apiRequest(
  path,
  options = {}
) {
  const method = options.method || "GET";

  let csrfHeaders = {};

  if (
    isMutationMethod(method) &&
    path !== "/api/auth/login"
  ) {
    const csrf = await getCsrfToken();

    csrfHeaders = {
      [csrf.headerName || "X-XSRF-TOKEN"]:
        csrf.token,
    };
  }

  const esFormData =
    options.body instanceof FormData;

  const headers = {
    ...csrfHeaders,
    ...(options.headers || {}),
  };

  if (!esFormData && options.body != null) {
    headers["Content-Type"] =
      headers["Content-Type"] || "application/json";
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      method,
      credentials: "include",
      headers,
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      notifyUnauthorized(path);
    }

    const message = await readErrorMessage(
      response
    );
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return null;
}

export async function apiDownload(
  path,
  nombreArchivo,
  mensajeError = "No se pudo descargar el archivo."
) {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      notifyUnauthorized(path);
    }

    const message = await readErrorMessage(
      response,
      mensajeError
    );
    throw new Error(message);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
