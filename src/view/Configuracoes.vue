<script setup lang="ts">
// Aqui eu mostro os dados da conta e a opção de encerrar a sessão.
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { limparSessao, sessao } from "../controller/usuario.controller.ts"
import { apiController as api, record } from "../controller/api.controller.ts"
import { useOperacaoAssincrona } from "../composables/useOperacaoAssincrona.ts"
import TituloPagina from "../components/TituloPagina.vue"

const router = useRouter()
const email = ref("")
const { mensagem, executar } = useOperacaoAssincrona()

async function carregarConta() {
    const usuario = await api.get(record("users", sessao.userId))
    email.value = usuario.email
}

function sair() {
    limparSessao()
    router.push("/login")
}

onMounted(() => executar(carregarConta))
</script>

<template>
    <main class="pagina-menor">
        <TituloPagina label="CONTA" title="Configurações" />
        <p class="mensagem" role="status">{{ mensagem }}</p>
        <section class="card">
            <h2>Minha conta</h2>
            <p id="email" style="color: #aaa; margin-bottom: 20px">E-mail: {{ email }}</p>
            <button id="perfil" class="botao" @click="router.push('/perfil#editar')">Editar perfil</button>
        </section>
        <section class="card">
            <h2>Sessão</h2>
            <button id="sair" class="botao-perigo" @click="sair">Sair da conta</button>
        </section>
    </main>
</template>
