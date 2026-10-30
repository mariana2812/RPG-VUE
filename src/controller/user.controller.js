import { reactive } from "vue"
import { API, serviceController as api } from "./service.controller.js"
export const sessao = reactive({
    userId: localStorage.getItem("idUser"),
    token: localStorage.getItem("accessToken")
})
export const userController = {
    login: dados => api.post(API.login, dados),
    register: dados => api.post(API.cadastro, dados)
}
export function salvarSessao(data) {
    if (!data?.accessToken || data?.user?.id == null)
        throw new Error("A API precisa retornar accessToken e user.id para iniciar a sessão.")
    localStorage.removeItem("blogID")
    localStorage.setItem("accessToken", data.accessToken)
    localStorage.setItem("idUser", data.user.id)
    sessao.userId = String(data.user.id)
    sessao.token = data.accessToken
}
export function limparSessao() {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("idUser")
    sessao.userId = sessao.token = null
}
