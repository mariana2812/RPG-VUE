<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { clearSession, session } from '../controller/user.controller.js'
import { serviceController as api, record } from '../controller/service.controller.js'
import { useAction } from '../composables/useAction.js'
import PageTitle from '../components/PageTitle.vue'
const router = useRouter(), email = ref('')
const { message, run } = useAction()
onMounted(() => run(async () => { email.value = (await api.get(record('users', session.userId))).email }))
function logout() { clearSession(); router.push('/login') }
</script>
<template><main class="pagina-menor"><PageTitle label="CONTA" title="Configurações" /><p class="mensagem" role="status">{{ message }}</p><section class="card"><h2>Minha conta</h2><p id="email" style="color:#aaa;margin-bottom:20px">E-mail: {{ email }}</p><button id="perfil" class="botao" @click="router.push('/perfil#editar')">Editar perfil</button></section><section class="card"><h2>Sessão</h2><button id="sair" class="botao-perigo" @click="logout">Sair da conta</button></section></main></template>
