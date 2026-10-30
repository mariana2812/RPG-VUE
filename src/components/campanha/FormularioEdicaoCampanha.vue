<script setup lang="ts">
// Deixo aqui os campos e as ações usadas somente para editar uma campanha.
import { ref, nextTick } from "vue"
import type { Campanha, FormularioCampanha } from "../../interfaces/campanha.interface.ts"
import { apiController as api, query, record } from "../../controller/api.controller.ts"
import { mestreId, validarCampanha } from "../../controller/campanha.controller.ts"
import { sessao } from "../../controller/usuario.controller.ts"
import { useImagem } from "../../composables/useImagem.ts"
import { useOperacaoAssincrona } from "../../composables/useOperacaoAssincrona.ts"
import CamposCampanha from "../CamposCampanha.vue"
const props = defineProps<{ campanha?: Campanha; bloqueado: boolean }>()
const emit = defineEmits(["salva"])
const userId = sessao.userId
const editando = ref(false)
const formulario = ref<FormularioCampanha>({ nome: "", sistema: "", descricao: "", maxJogadores: 5 })
const { carregando, mensagem, executar } = useOperacaoAssincrona()
const { imagem: previa, lendo: lendoImagem, selecionar: selecionarImagem, limpar: limparImagem } = useImagem(mensagem)
async function verificarMestre() {
    const dados = await api.get(record("campaigns", props.campanha.id))
    if (String(mestreId(dados)) !== userId) throw new Error("Somente o mestre pode editar esta campanha.")
}
async function editarCampanha() {
    formulario.value = {
        nome: props.campanha.nome || "",
        sistema: props.campanha.sistema || props.campanha.sistemaNome || "",
        descricao: props.campanha.descricao || "",
        maxJogadores: props.campanha.maxJogadores || 5,
        removerCapa: false
    }
    limparImagem(props.campanha.capa || "")
    editando.value = true
    await nextTick()
    document.getElementById("editarNome")?.focus()
}
async function selecionarCapa(file) {
    if (await selecionarImagem(file)) formulario.value.removerCapa = false
}
function removerCapa() {
    if (formulario.value.removerCapa) limparImagem()
}
function salvarCampanha() {
    executar(async () => {
        await verificarMestre()
        const relations = await api.get(query("campaignMembers", { campaignId: String(props.campanha.id) }))
        const count = new Set(
            relations.filter(item => String(item.userId) !== userId).map(item => String(item.userId))
        ).size
        const dados = validarCampanha(formulario.value, Math.max(2, count))
        await api.patch(record("campaigns", props.campanha.id), {
            ...dados,
            capa: formulario.value.removerCapa ? "" : previa.value
        })
        editando.value = false
        emit("salva")
    })
}

defineExpose({ abrir: editarCampanha })
</script>
<template>
    <section v-if="editando" id="editarCampanha" class="card">
        <h2>Editar campanha</h2>
        <p class="mensagem" role="status">{{ mensagem }}</p>
        <form id="formEditarCampanha" class="formulario" @submit.prevent="salvarCampanha">
            <CamposCampanha
                v-model="formulario"
                edit
                :preview="previa"
                @image="selecionarCapa"
                @remove-image="removerCapa"
            />
            <button type="submit" class="botao" :disabled="bloqueado || carregando || lendoImagem">
                Salvar alterações
            </button>
            <button type="button" class="botao-secundario" @click="editando = false">Cancelar</button>
        </form>
    </section>
</template>
