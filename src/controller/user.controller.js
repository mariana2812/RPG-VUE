import { reactive } from 'vue'
import { API, serviceController as api } from './service.controller.js'
export const session = reactive({
  userId: localStorage.getItem('idUser'),
  token: localStorage.getItem('accessToken'),
})
export const userController = {
  login: (dados) => api.post(API.login, dados),
  register: (dados) => api.post(API.cadastro, dados),
}
export function saveSession(data) {
  if (!data?.accessToken || data?.user?.id == null)
    throw new Error('A API precisa retornar accessToken e user.id para iniciar a sessão.')
  localStorage.removeItem('blogID')
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('idUser', data.user.id)
  session.userId = String(data.user.id)
  session.token = data.accessToken
}
export function clearSession() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('idUser')
  session.userId = session.token = null
}
