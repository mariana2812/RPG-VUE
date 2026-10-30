<script setup lang="ts">
// Confiro se o usuário é dono ou participante para mostrar as ações do card.
import type { Usuario } from "../../interfaces/usuario.interface.ts"
import type { Id } from "../../interfaces/identificador.interface.ts"
import { computed } from "vue"
import { sessao } from "../../controller/usuario.controller.ts"
import { nomeUsuario, participantesDaComunidade } from "../../controller/comunidade.controller.ts"
import AvatarUsuario from "../AvatarUsuario.vue"
interface Comunidade {
    id: Id
    ownerId: Id
    nome: string
    descricao?: string
}
interface Membro {
    communityId: Id
    userId: Id
}
const props = defineProps<{
    community: Comunidade
    members: Membro[]
    users: Usuario[]
    expanded: boolean
    carregando: boolean
}>()
const emit = defineEmits(["participar", "editar", "participantes"])
const owner = computed(() => String(props.community.ownerId) === sessao.userId)
const membership = computed(() =>
    props.members.some(
        item =>
            String(item.communityId) === String(props.community.id) && String(item.userId) === sessao.userId
    )
)
const participantIds = computed(() => participantesDaComunidade(props.community, props.members))
</script>
<template>
    <article class="card">
        <h3>{{ community.nome }}</h3>
        <p>{{ community.descricao }}</p>
        <p>{{ participantIds.size }} participante(s)</p>
        <button class="botao" :disabled="carregando || owner" @click="emit('participar')">
            {{ owner ? "Sua comunidade" : membership ? "Sair" : "Entrar" }}
        </button>
        <template v-if="owner || membership">
            <RouterLink
                class="botao-secundario"
                :to="{ path: '/mensagens', query: { comunidade: community.id } }"
            >
                Abrir chat
            </RouterLink>
            <button v-if="owner" class="botao-secundario" @click="emit('editar')">Editar comunidade</button>
            <button
                type="button"
                class="botao-secundario ver-participantes"
                :aria-expanded="expanded"
                :disabled="carregando"
                @click="emit('participantes')"
            >
                Ver participantes
            </button>
            <div v-if="expanded" class="comunidade-participantes">
                <RouterLink
                    v-for="user in users.filter(item => participantIds.has(String(item.id)))"
                    :key="user.id"
                    :to="{ path: '/perfil', query: { id: user.id } }"
                >
                    <AvatarUsuario :user="user" />
                    <span>{{ nomeUsuario(user) }}</span>
                </RouterLink>
            </div>
        </template>
    </article>
</template>
