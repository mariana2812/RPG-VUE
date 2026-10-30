// Centralizo a conexão com o servidor para não repetir as requisições em cada tela.
export const API = {
    baseUrl: import.meta.env?.VITE_API_URL || "http://localhost:3001",
    login: "/login",
    cadastro: "/register"
}

async function requisicao<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
    const headers = new Headers(opcoes.headers)
    if (opcoes.body) headers.set("Content-Type", "application/json")
    // Envio o token nas consultas aos dados, mas login e cadastro não precisam dele.
    const token = localStorage.getItem("accessToken")
    if (token && caminho !== API.login && caminho !== API.cadastro)
        headers.set("Authorization", "Bearer " + token)

    let resposta: Response
    try {
        resposta = await fetch(API.baseUrl + caminho, { ...opcoes, headers })
    } catch {
        throw new Error(
            "Não foi possível conectar ao servidor em " +
                API.baseUrl +
                ". Verifique se o JSON Server está ligado."
        )
    }
    // Leio a resposta antes de converter para JSON, pois uma exclusão pode vir sem conteúdo.
    const texto = await resposta.text()
    let dados = null
    try {
        dados = texto ? JSON.parse(texto) : null
    } catch {
        if (resposta.ok) throw new Error("O servidor retornou uma resposta inválida: era esperado JSON.")
        dados = texto
    }
    if (!resposta.ok) {
        const mensagem = typeof dados === "string" ? dados : dados?.message
        throw Object.assign(new Error(mensagem || "Erro na requisição: " + resposta.status), {
            status: resposta.status
        })
    }
    return dados as T
}

export const apiController = {
    get: <T = any>(caminho: string) => requisicao<T>(caminho),
    post: <T = any>(caminho: string, dados: object) =>
        requisicao<T>(caminho, { method: "POST", body: JSON.stringify(dados) }),
    patch: <T = any>(caminho: string, dados: object) =>
        requisicao<T>(caminho, { method: "PATCH", body: JSON.stringify(dados) }),
    remove: (caminho: string) => requisicao<null>(caminho, { method: "DELETE" })
}

export const query = (colecao: string, filtros: Record<string, string> = {}) =>
    "/" + colecao + "?" + new URLSearchParams(filtros)
export const record = (colecao: string, id: string | number) => "/" + colecao + "/" + encodeURIComponent(id)
