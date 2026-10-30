import { ref, onScopeDispose } from "vue"
import { lerImagem } from "../controller/comunidade.controller.js"

export function useImagem(mensagem, limparNoErro = false) {
    const imagem = ref("")
    const lendo = ref(false)
    let versao = 0

    function limpar(valor = "") {
        versao++
        imagem.value = valor
        lendo.value = false
    }

    async function selecionar(arquivo) {
        const atual = ++versao
        lendo.value = true
        try {
            const dados = await lerImagem(arquivo)
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
