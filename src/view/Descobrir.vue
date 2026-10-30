<script setup>
import { ref, computed, onMounted } from "vue"
import { serviceController as api } from "../controller/service.controller.js"
import { sessao } from "../controller/user.controller.js"
import { amigosDe, nomeUsuario, privado } from "../controller/comunidade.controller.js"
import { useAcao } from "../composables/useAcao.js"
import Avatar from "../components/Avatar.vue"
import TituloPagina from "../components/TituloPagina.vue"

const usuarios = ref([])
const amigos = ref(new Set())
const pesquisa = ref("")
const { carregando, mensagem, executar } = useAcao()
const resultado = computed(() => {
    const texto = pesquisa.value.trim().toLowerCase()
    return usuarios.value.filter(
        usuario =>
            String(usuario.id) !== sessao.userId &&
            `${usuario.nome || ""} ${usuario.email || ""}`.toLowerCase().includes(texto)
    )
})

async function carregarUsuarios() {
    const [pessoas, relacoes] = await Promise.all([api.get("/users"), api.get("/friends")])
    usuarios.value = pessoas
    amigos.value = amigosDe(relacoes, sessao.userId)
}

onMounted(() => executar(carregarUsuarios))
</script>

<template>
    <main class="pagina">
        <TituloPagina
            label="COMUNIDADE"
            title="Descobrir jogadores"
            description="Encontre novas pessoas para suas aventuras."
        />
        <p class="mensagem" role="status">{{ mensagem }}</p>
        <section class="card">
            <input
                id="pesquisa"
                v-model="pesquisa"
                placeholder="Pesquisar por nome ou e-mail..."
                aria-label="Pesquisar jogadores"
            />
        </section>
        <section class="card">
            <div id="usuarios" class="lista">
                <p v-if="!resultado.length && !carregando">Nenhum jogador encontrado.</p>
                <div v-for="usuario in resultado" :key="usuario.id" class="item-lista">
                    <Avatar :user="usuario" class="avatar" />
                    <div class="item-info">
                        <strong>{{ nomeUsuario(usuario) }}</strong>
                        <p>
                            {{
                                privado(usuario) && !amigos.has(String(usuario.id))
                                    ? "Perfil privado"
                                    : usuario.biografia || "Sem biografia"
                            }}
                        </p>
                    </div>
                    <RouterLink class="botao" :to="{ path: '/perfil', query: { id: usuario.id } }">
                        Ver perfil
                    </RouterLink>
                </div>
            </div>
        </section>
    </main>
</template>
