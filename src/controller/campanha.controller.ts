// Reúno aqui as regras de validação e exclusão das campanhas.
import type { FormularioCampanha } from "../interfaces/campanha.interface.ts"
import { apiController as api, record } from "./api.controller.ts"
import { removerVinculos } from "./comunidade.controller.ts"

export const aberta = campanha => ["aberta", "open"].includes(campanha?.status)
export const mestreId = campanha => campanha?.masterId ?? campanha?.mestreId

export function validarCampanha(formulario: FormularioCampanha, minimo = 2) {
    const nome = formulario.nome.trim()
    const sistema = formulario.sistema.trim()
    const descricao = formulario.descricao.trim()
    const maxJogadores = formulario.maxJogadores
    if (!nome || !sistema || !descricao) throw new Error("Preencha todos os campos.")
    if (!Number.isInteger(maxJogadores) || maxJogadores < minimo || maxJogadores > 20)
        throw new Error(`Escolha entre ${minimo} e 20 jogadores, respeitando os participantes atuais.`)
    return { nome, sistema, descricao, maxJogadores }
}

export async function excluirCampanha(id) {
    const campanha = await api.get(record("campaigns", id))
    const idUsuario = localStorage.getItem("idUser")
    if (String(campanha.masterId ?? campanha.mestreId) !== String(idUsuario)) {
        throw new Error("Somente o mestre pode excluir esta campanha.")
    }

    await removerVinculos(["campaignPosts", "campaignMembers"], { campaignId: id })

    return api.remove(record("campaigns", id))
}
