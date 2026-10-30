export const API = {
    baseUrl: import.meta.env?.VITE_API_URL || "http://localhost:3001",
    cadastro: "/register",
    login: "/login",
    blog: "/blog"
}

export async function apiRequest(path, options = {}) {
    const token = localStorage.getItem("accessToken")
    const isAuthRequest = path === API.cadastro || path === API.login
    let response
    try {
        response = await fetch(API.baseUrl + path, {
            ...options,
            headers: {
                ...(options.body ? { "Content-Type": "application/json" } : {}),
                ...(token && !isAuthRequest ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers
            }
        })
    } catch {
        throw new Error(
            "Não foi possível conectar à API em " +
                API.baseUrl +
                ". Verifique se o servidor está ligado, a porta está correta e o CORS permite esta página."
        )
    }
    const text = await response.text()
    let data = text || null
    try {
        data = text ? JSON.parse(text) : null
    } catch {
        if (response.ok) {
            throw new Error("O servidor retornou uma resposta inválida: era esperado JSON.")
        }
    }
    if (!response.ok) {
        const detail = typeof data === "string" ? data : data?.message
        const error = new Error(`Erro na requisição (${response.status}): ${detail || response.statusText}`)
        error.status = response.status
        throw error
    }
    return data
}

export const serviceController = {
    get: path => apiRequest(path),
    post: (path, data) => apiRequest(path, { method: "POST", body: JSON.stringify(data) }),
    patch: (path, data) => apiRequest(path, { method: "PATCH", body: JSON.stringify(data) }),
    remove: path => apiRequest(path, { method: "DELETE" })
}
export const query = (collection, filters = {}) => "/" + collection + "?" + new URLSearchParams(filters)
export const record = (collection, id) => "/" + collection + "/" + encodeURIComponent(id)
