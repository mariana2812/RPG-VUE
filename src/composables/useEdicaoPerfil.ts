// Separo a edição do perfil e dos sistemas das consultas que montam a página.
import { ref, nextTick } from "vue"
import type { DadosPerfil } from "./useDadosPerfil.ts"
import { apiController as api, record, query } from "../controller/api.controller.ts"
import { sessao } from "../controller/usuario.controller.ts"
import { privado, avatarUsuario, criarAvatar } from "../controller/comunidade.controller.ts"

export function useEdicaoPerfil(perfil: DadosPerfil) {
    const { user, mine, userId, load, loadSystems, executar, mensagem } = perfil
    const avatars = ref([])
    const editing = ref(false)
    const formulario = ref({ nome: "", biografia: "", privacidade: "publico", avatar: "" })
    const systemName = ref("")

    // Copio os dados para o formulário para só salvar as alterações após a confirmação.
    async function startEdit() {
        if (!mine || !user.value) return
        formulario.value.nome = user.value.nome || ""
        formulario.value.biografia = user.value.biografia || ""
        formulario.value.privacidade = privado(user.value) ? "privado" : "publico"
        formulario.value.avatar = avatarUsuario(user.value)
        let catalog
        try {
            catalog = await api.get("/avatar")
        } catch (error) {
            if (error.status !== 404) throw error
            catalog = ["novo", "Mariana", "Olivier"].map(name => ({ url: criarAvatar(name) }))
        }
        if (!Array.isArray(catalog)) throw new Error("A lista de avatares está inválida.")
        avatars.value = [
            { url: formulario.value.avatar },
            ...catalog.filter(
                item => item?.url && typeof item.url === "string" && item.url !== formulario.value.avatar
            )
        ]
        editing.value = true
        await nextTick()
        document.getElementById("nome")?.focus()
    }

    async function cancelEdit() {
        editing.value = false
        await nextTick()
        document.getElementById("abrirEdicao")?.focus()
    }

    function save() {
        executar(async () => {
            if (!mine) return
            const nome = formulario.value.nome.trim()
            if (!nome) throw new Error("Digite seu nome.")
            await api.patch(record("users", userId), {
                nome,
                biografia: formulario.value.biografia.trim(),
                avatar: formulario.value.avatar,
                privado: formulario.value.privacidade === "privado"
            })
            editing.value = false
            await load()
            mensagem.value = "Perfil salvo com sucesso."
        })
    }

    function addSystem() {
        executar(async () => {
            if (!mine) return
            const nome = systemName.value.trim()
            if (!nome) return
            const all = await api.get("/systems")
            let system = all.find(item => item.nome.toLowerCase() === nome.toLowerCase())
            if (!system) system = await api.post("/systems", { nome })
            const links = await api.get(query("userSystems", { userId, systemId: system.id }))
            if (!links.length) await api.post("/userSystems", { userId, systemId: system.id })
            systemName.value = ""
            await loadSystems()
        })
    }

    function removeSystem(system) {
        executar(async () => {
            if (!mine || sessao.userId !== userId)
                throw new Error("Você só pode remover sistemas do seu próprio perfil.")
            const links = (await api.get(query("userSystems", { userId, systemId: system.id }))).filter(
                item => String(item.userId) === userId && String(item.systemId) === String(system.id)
            )
            if (links.some(item => item.id == null || item.id === ""))
                throw new Error(
                    "Não foi possível remover: o vínculo do sistema está sem identificador no servidor."
                )
            for (const item of links) await api.remove(record("userSystems", item.id))
            await loadSystems()
            mensagem.value = "Sistema removido do perfil."
        })
    }
    return { avatars, editing, formulario, systemName, startEdit, cancelEdit, save, addSystem, removeSystem }
}
