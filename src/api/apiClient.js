const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080";

let csrfData = null;

function isMutationMethod(method) {
  return [
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ].includes(method.toUpperCase());
}

async function getCsrfToken() {
  if (csrfData?.token) {
    return csrfData;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/auth/csrf`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(
      "No se pudo obtener el token CSRF"
    );
  }

  csrfData = await response.json();

  return csrfData;
}

export async function apiRequest(
  path,
  options = {}
) {
  const method =
    options.method || "GET";

  let csrfHeaders = {};

  if (
    isMutationMethod(method) &&
    path !== "/api/auth/login"
  ) {
    const csrf =
      await getCsrfToken();

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

  if (!esFormData) {
    headers["Content-Type"] =
      "application/json";
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

  let data = null;

  const contentType =
    response.headers.get(
      "content-type"
    );

  if (
    contentType &&
    contentType.includes(
      "application/json"
    )
  ) {
    data = await response.json();
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      "Error en la solicitud";

    throw new Error(message);
  }

  return data;
}

export async function apiDownload(
  path,
  nombreArchivo
) {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    let message = "No se pudo descargar el archivo.";

    const contentType =
      response.headers.get("content-type");

    if (
      contentType &&
      contentType.includes("application/json")
    ) {
      const data = await response.json();
      message =
        data?.message ||
        data?.error ||
        message;
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
