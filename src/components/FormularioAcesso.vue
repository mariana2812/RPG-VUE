<script setup>
import { reactive } from "vue"
import { useRouter } from "vue-router"
import Form from "./Form.vue"
import Input from "./input/Input.vue"
import { useAcao } from "../composables/useAcao.js"
import { userController, salvarSessao } from "../controller/user.controller.js"

const props = defineProps({ cadastro: Boolean })
const router = useRouter()
const dados = reactive({ email: "", password: "" })
const { carregando, mensagem, executar } = useAcao()

function enviar() {
    executar(async () => {
        mensagem.value = props.cadastro ? "Criando conta..." : "Entrando..."
        const resultado = await userController[props.cadastro ? "register" : "login"]({
            email: dados.email.trim(),
            password: dados.password
        })
        salvarSessao(resultado)
        await router.push(props.cadastro ? "/perfil" : "/taverna")
    })
}
</script>

<template>
    <Form
        :title="cadastro ? 'Cadastro' : 'Login'"
        :button-label="cadastro ? 'Cadastrar' : 'Entrar'"
        :loading="carregando"
        @submit.prevent="enviar"
    >
        <Input
            id="email"
            v-model="dados.email"
            label="Email"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="Digite seu email"
            required
        />
        <Input
            id="senha"
            v-model="dados.password"
            label="Senha"
            type="password"
            name="senha"
            :autocomplete="cadastro ? 'new-password' : 'current-password'"
            placeholder="Digite sua senha"
            required
        />
        <template #rodape>
            <RouterLink :to="cadastro ? '/login' : '/cadastro'">
                {{ cadastro ? "Já possui uma conta? Entre" : "Ainda não tem uma conta? Cadastre-se" }}
            </RouterLink>
            <p id="message" role="status">{{ mensagem }}</p>
        </template>
    </Form>
</template>
