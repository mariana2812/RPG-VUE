<script setup lang="ts">
// Os botões mudam conforme a participação do usuário e a situação da campanha.
import type { Campanha } from "../../interfaces/campanha.interface.ts"
import { computed } from "vue"
import { aberta } from "../../controller/campanha.controller.ts"
const props = defineProps<{
    campanha?: Campanha
    mestre: string
    ehMestre: boolean
    inscrito: boolean
    lotada: boolean
    carregando: boolean
}>()
const emit = defineEmits(["alterar-status", "editar", "excluir", "entrar-ou-sair"])
const textoBotao = computed(() => {
    if (props.inscrito) return "Sair da campanha"
    if (!aberta(props.campanha)) return "Inscrições fechadas"
    if (props.lotada) return "Campanha cheia"
    return "Entrar na campanha"
})
</script>
<template>
    <section class="card">
        <img
            v-if="campanha?.capa"
            id="capaCampanha"
            :src="campanha.capa"
            class="capa-campanha"
            alt="Capa da campanha"
        />
        <small id="sistema" style="color: var(--dourado)">
            {{ campanha?.sistema || campanha?.sistemaNome }}
        </small>
        <h1 id="nome" style="margin: 8px 0">{{ campanha?.nome || "Carregando..." }}</h1>
        <p id="descricao" style="color: #aaa; line-height: 1.6">{{ campanha?.descricao }}</p>
        <p id="mestre" style="margin-top: 15px">Mestre: {{ mestre }}</p>
        <div v-if="campanha" id="acao" style="margin-top: 20px">
            <template v-if="ehMestre">
                Você é o mestre
                <button class="botao-secundario" :disabled="carregando" @click="emit('alterar-status')">
                    {{ aberta(campanha) ? "Fechar inscrições" : "Reabrir inscrições" }}
                </button>
                <button class="botao" @click="emit('editar')">Editar campanha</button>
                <button class="botao-perigo" :disabled="carregando" @click="emit('excluir')">
                    Excluir campanha
                </button>
            </template>
            <button
                v-else
                class="botao"
                :disabled="carregando || (!inscrito && (!aberta(campanha) || lotada))"
                @click="emit('entrar-ou-sair')"
            >
                {{ textoBotao }}
            </button>
        </div>
    </section>
</template>
