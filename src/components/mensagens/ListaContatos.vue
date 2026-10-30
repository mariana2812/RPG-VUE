<script setup lang="ts">
// A lista recebe as conversas da página e avisa qual delas foi selecionada.
import type { Usuario } from "../../interfaces/usuario.interface.ts"
import { nomeUsuario } from "../../controller/comunidade.controller.ts"
import AvatarUsuario from "../AvatarUsuario.vue"
import Icone from "../Icone.vue"
import ContadorMensagens from "../ContadorMensagens.vue"
interface Conversa {
    type: string
    data: Usuario
}
const props = defineProps<{ conversas: Conversa[]; selected?: Conversa }>()
const search = defineModel<string>("search", { required: true })
const filter = defineModel<string>("filter", { required: true })
const emit = defineEmits<{ selecionar: [type: string, data: Usuario] }>()
const isSelected = (type: string, id: string | number) =>
    props.selected?.type === type && String(props.selected.data.id) === String(id)
</script>
<template>
    <aside class="painel-contatos">
        <RouterLink class="nova-conversa" to="/descobrir">
            <Icone name="user-plus" />
            Encontrar jogador
        </RouterLink>
        <label class="busca-contatos" for="buscarContato">Buscar contatos</label>
        <input id="buscarContato" v-model="search" type="search" placeholder="Nome do jogador..." />
        <nav class="filtros-contatos" aria-label="Filtrar contatos">
            <button
                v-for="[value, label] in [
                    ['todos', 'Todos'],
                    ['amigos', 'Amigos'],
                    ['comunidade', 'Comunidades']
                ]"
                :key="value"
                type="button"
                :data-filtro="value"
                :aria-pressed="filter === value"
                @click="filter = value"
            >
                {{ label }}
            </button>
        </nav>
        <div id="contatos" class="contatos">
            <button
                v-for="{ type, data } in conversas"
                :key="type + '-' + data.id"
                type="button"
                class="contato"
                :class="{
                    ativo: isSelected(type, data.id),
                    'contato-comunidade': type === 'comunidade'
                }"
                :title="type === 'comunidade' ? 'Chat da comunidade ' + data.nome : nomeUsuario(data)"
                :aria-pressed="isSelected(type, data.id)"
                @click="emit('selecionar', type, data)"
            >
                <span v-if="type === 'comunidade'" class="avatar avatar-comunidade" aria-hidden="true"
                    >#</span
                >
                <AvatarUsuario v-else :user="data" class="avatar" />
                <span>{{ type === "comunidade" ? data.nome : nomeUsuario(data) }}</span>
                <ContadorMensagens :type="type" :id="data.id" />
            </button>
            <p v-if="!conversas.length" class="contatos-vazio">
                {{
                    search
                        ? "Nenhuma conversa encontrada."
                        : filter === "comunidade"
                          ? "Você ainda não participa de comunidades."
                          : "Nenhum contato nesta lista."
                }}
            </p>
        </div>
        <RouterLink class="contatos-comunidades" to="/comunidades">Explorar comunidades</RouterLink>
    </aside>
</template>
