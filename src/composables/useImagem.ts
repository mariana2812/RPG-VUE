// Aqui eu preparo a imagem escolhida e controlo sua prévia antes de salvar.
import type { Ref } from "vue"
import { ref, onScopeDispose } from "vue"

export function useImagem(mensagem: Ref<string>, limparNoErro = false) {
    const imagem = ref("")
    const lendo = ref(false)
    let versao = 0

    function limpar(valor = "") {
        versao++
        imagem.value = valor
        lendo.value = false
    }

    async function selecionar(arquivo: File | undefined) {
        const atual = ++versao
        lendo.value = true
        try {
            const dados = await lerImagem(arquivo)
            // Se outra imagem foi escolhida enquanto eu carregava esta, ignoro o resultado antigo.
            if (atual !== versao) return false
            imagem.value = dados
            return true
        } catch (erro) {
            if (atual === versao) {
                mensagem.value = erro.message
                if (limparNoErro) imagem.value = ""
            }
            return false
        } finally {
            if (atual === versao) lendo.value = false
        }
    }

    onScopeDispose(() => limpar())
    return { imagem, lendo, selecionar, limpar }
}

async function lerImagem(arquivo: File | undefined): Promise<string> {
    if (!arquivo) return ""
    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type) || arquivo.size > 5 * 1024 * 1024) {
        throw new Error("Escolha uma imagem JPG, PNG ou WebP de até 5 MB.")
    }
    const url = URL.createObjectURL(arquivo)
    try {
        const imagem = new Image()
        imagem.src = url
        await imagem.decode()
        const escala = Math.min(1, 1200 / Math.max(imagem.width, imagem.height))
        const canvas = document.createElement("canvas")
        canvas.width = Math.max(1, Math.round(imagem.width * escala))
        canvas.height = Math.max(1, Math.round(imagem.height * escala))
        canvas.getContext("2d").drawImage(imagem, 0, 0, canvas.width, canvas.height)
        const dados = canvas.toDataURL("image/webp", 0.75)
        if (dados.length > 650000)
            throw new Error("Esta imagem tem muitos detalhes. Escolha uma versão menor.")
        return dados
    } finally {
        URL.revokeObjectURL(url)
    }
}
