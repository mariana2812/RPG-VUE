<script setup>
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAction } from '../composables/useAction.js'
import { userController, saveSession } from '../controller/user.controller.js'
const props = defineProps({ register: Boolean })
const router = useRouter()
const data = reactive({ email: '', password: '' })
const { busy, message, run } = useAction()
const title = computed(() => (props.register ? 'Cadastro' : 'Login'))
function submit() {
  run(async () => {
    message.value = props.register ? 'Criando conta...' : 'Entrando...'
    const result = await userController[props.register ? 'register' : 'login']({
      email: data.email.trim(),
      password: data.password,
    })
    saveSession(result)
    await router.push(props.register ? '/perfil' : '/taverna')
  })
}
</script>
<template>
  <form @submit.prevent="submit">
    <h1>{{ title }}</h1>
    <div>
      <label for="email">Email</label
      ><input
        id="email"
        v-model="data.email"
        type="email"
        name="email"
        autocomplete="email"
        placeholder="Digite seu email"
        required
      />
    </div>
    <div>
      <label for="senha">Senha</label
      ><input
        id="senha"
        v-model="data.password"
        type="password"
        name="senha"
        :autocomplete="register ? 'new-password' : 'current-password'"
        placeholder="Digite sua senha"
        required
      />
    </div>
    <button type="submit" :disabled="busy">{{ register ? 'Cadastrar' : 'Entrar' }}</button>
    <RouterLink :to="register ? '/login' : '/cadastro'">{{
      register ? 'Já possui uma conta? Entre' : 'Ainda não tem uma conta? Cadastre-se'
    }}</RouterLink>
    <p id="message" role="status">{{ message }}</p>
  </form>
</template>
