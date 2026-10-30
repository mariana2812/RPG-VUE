// Uso Axios, como no exemplo da aula, para reunir as chamadas ao servidor.
import axios from "axios"

export const API = {
    baseUrl: import.meta.env?.VITE_API_URL || "http://localhost:3001",
    login: "/login",
    cadastro: "/register"
}
const servidor = axios.create({ baseURL: API.baseUrl })

async function requisicao<T>(method: string, url: string, data?: object): Promise<T> {
    const token = localStorage.getItem("accessToken")
    const headers = {}
    if (token && url !== API.login && url !== API.cadastro)
        headers["Authorization"] = "Bearer " + token
    try {
        const resposta = await servidor.request({ method, url, data, headers, responseType: "text" })
        // Uma exclusão pode retornar uma resposta vazia.
        return resposta.data ? JSON.parse(resposta.data) : null
    } catch (erro) {
        if (erro instanceof SyntaxError)
            throw new Error("O servidor retornou uma resposta inválida: era esperado JSON.")
        if (!axios.isAxiosError(erro)) throw erro
        if (!erro.response)
            throw new Error("Não foi possível conectar ao servidor em " + API.baseUrl)
        let detalhe = erro.response.data
        try { detalhe = JSON.parse(detalhe) } catch { /* A mensagem também pode vir em texto. */ }
        const mensagem = typeof detalhe === "string" ? detalhe : detalhe?.message
        throw Object.assign(new Error(mensagem || "Erro na requisição: " + erro.response.status), {
            status: erro.response.status
        })
    }
}

export const apiController = {
    async get<T = any>(url: string) { return requisicao<T>("GET", url) },
    async post<T = any>(url: string, dados: object) { return requisicao<T>("POST", url, dados) },
    async patch<T = any>(url: string, dados: object) { return requisicao<T>("PATCH", url, dados) },
    async remove(url: string) { return requisicao<null>("DELETE", url) }
}

export function query(colecao: string, filtros: Record<string, string> = {}) {
    return "/" + colecao + "?" + new URLSearchParams(filtros)
}
export function record(colecao: string, id: string | number) {
    return "/" + colecao + "/" + encodeURIComponent(id)
}
