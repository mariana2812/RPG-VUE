// Aqui eu organizo o login, o cadastro e os dados da sessão.
import type { Credenciais, RespostaAutenticacao } from "../interfaces/usuario.interface.ts"
import { reactive } from "vue"
import { API, apiController as api } from "./api.controller.ts"

export const sessao = reactive({
    userId: localStorage.getItem("idUser"),
    token: localStorage.getItem("accessToken")
})

export const usuarioController = {
    login: (dados: Credenciais) => api.post<RespostaAutenticacao>(API.login, dados),
    register: (dados: Credenciais) => api.post<RespostaAutenticacao>(API.cadastro, dados)
}

// Guardo o token e o ID para manter a sessão depois de recarregar a página.
export function salvarSessao(dados: RespostaAutenticacao) {
    if (!dados?.accessToken || dados.user?.id == null)
        throw new Error("O servidor precisa retornar accessToken e user.id para iniciar a sessão.")
    localStorage.setItem("accessToken", dados.accessToken)
    localStorage.setItem("idUser", String(dados.user.id))
    sessao.userId = String(dados.user.id)
    sessao.token = dados.accessToken
}

export function limparSessao() {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("idUser")
    sessao.userId = sessao.token = null
}
