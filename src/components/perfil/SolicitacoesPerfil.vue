<script setup lang="ts">
// Mostro as solicitações e envio a resposta escolhida para a página de perfil.
import type { Relacao } from "../../interfaces/comunidade.interface.ts"
import type { Usuario } from "../../interfaces/usuario.interface.ts"
import { nomeUsuario } from "../../controller/comunidade.controller.ts"
defineProps<{ requests: Relacao[]; people: Usuario[]; carregando: boolean }>()
const emit = defineEmits<{ responder: [request: Relacao, aceitar: boolean]; seguir: [request: Relacao] }>()
</script>
<template>
    <section id="solicitacoesCard" class="card">
        <h2>Seguidores e solicitações</h2>
        <div id="solicitacoesPerfil" class="lista">
            <p v-if="!requests.length">Você não tem solicitações ou novos seguidores.</p>
            <div v-for="request in requests" :key="request.id" class="item-lista">
                <RouterLink class="item-info" :to="{ path: '/perfil', query: { id: request.userId } }">
                    <strong>
                        {{ nomeUsuario(people.find(person => String(person.id) === String(request.userId))) }}
                    </strong>
                    <p>
                        {{
                            request.status === "pending" ? "Solicitou para seguir você" : "Está seguindo você"
                        }}
                    </p>
                </RouterLink>
                <div class="acoes-seguidor">
                    <template v-if="request.status === 'pending'">
                        <button
                            class="botao"
                            :disabled="carregando"
                            @click="emit('responder', request, true)"
                        >
                            Aceitar
                        </button>
                        <button
                            class="botao-secundario"
                            :disabled="carregando"
                            @click="emit('responder', request, false)"
                        >
                            Recusar
                        </button>
                    </template>
                    <button v-else class="botao" :disabled="carregando" @click="emit('seguir', request)">
                        Seguir de volta
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>
