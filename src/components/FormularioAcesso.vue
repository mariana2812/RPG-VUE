<script setup lang="ts">
// A prop cadastro define se este formulário vai criar uma conta ou fazer login.
import { reactive } from "vue"
import { useRouter } from "vue-router"
import FormularioBase from "./FormularioBase.vue"
import CampoFormulario from "./CampoFormulario.vue"
import { useOperacaoAssincrona } from "../composables/useOperacaoAssincrona.ts"
import { usuarioController, salvarSessao } from "../controller/usuario.controller.ts"

const props = defineProps<{ cadastro?: boolean }>()
const router = useRouter()
// O reactive mantém os valores dos campos ligados ao formulário.
const dados = reactive({ email: "", password: "" })
const { carregando, mensagem, executar } = useOperacaoAssincrona()

function enviar() {
    executar(async () => {
        mensagem.value = props.cadastro ? "Criando conta..." : "Entrando..."
        const credenciais = {
            email: dados.email.trim(),
            password: dados.password
        }
        let resultado
        if (props.cadastro) {
            resultado = await usuarioController.register(credenciais)
        } else {
            resultado = await usuarioController.login(credenciais)
        }
        // Depois da resposta do servidor, guardo a sessão e abro a próxima página.
        salvarSessao(resultado)
        await router.push(props.cadastro ? "/perfil" : "/taverna")
    })
}
</script>

<template>
    <FormularioBase
        :title="cadastro ? 'Cadastro' : 'Login'"
        :button-label="cadastro ? 'Cadastrar' : 'Entrar'"
        :loading="carregando"
        @submit.prevent="enviar"
    >
        <CampoFormulario
            id="email"
            v-model="dados.email"
            label="Email"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="Digite seu email"
            required
        />
        <CampoFormulario
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
    </FormularioBase>
</template>
