// Aqui eu relaciono cada endereço com a página que ele deve abrir.
import { createRouter, createWebHistory } from "vue-router"
import { sessao } from "../controller/usuario.controller.ts"
import { fecharModal } from "../composables/useModal.ts"
import { notificacoesAbertas } from "../composables/useNotificacoes.ts"
import homeCss from "../assets/styles/home.css?raw"
import loginCss from "../assets/styles/login.css?raw"
import communityCss from "../assets/styles/community.css?raw"
import navigationCss from "../assets/styles/navigation.css?raw"
import feedCss from "../assets/styles/feed.css?raw"
import tavernCss from "../assets/styles/tavern.css?raw"
import profileCss from "../assets/styles/profile.css?raw"
const estiloComunidade = communityCss + navigationCss

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/",
            name: "Home",
            component: () => import("../view/PaginaInicial.vue"),
            alias: "/index.html",
            meta: { title: "FrontD", style: homeCss, section: "/", protected: false }
        },
        {
            path: "/login",
            name: "Login",
            component: () => import("../view/Entrar.vue"),
            alias: "/login/index.html",
            meta: { title: "Login", style: loginCss, section: "/login", protected: false }
        },
        {
            path: "/cadastro",
            name: "Register",
            component: () => import("../view/Cadastro.vue"),
            alias: "/Cadastro/index.html",
            meta: { title: "Cadastro", style: loginCss, section: "/cadastro", protected: false }
        },
        {
            path: "/taverna",
            name: "Taverna",
            component: () => import("../view/Taverna.vue"),
            alias: "/Blog/index.html",
            meta: { title: "A taverna", style: feedCss + tavernCss, section: "/taverna", protected: true }
        },
        {
            path: "/descobrir",
            name: "Descobrir",
            component: () => import("../view/DescobrirJogadores.vue"),
            alias: "/descobrir/index.html",
            meta: {
                title: "Descobrir jogadores",
                style: estiloComunidade,
                section: "/descobrir",
                protected: true
            }
        },
        {
            path: "/campanhas",
            name: "Campanhas",
            component: () => import("../view/Campanhas.vue"),
            alias: "/campanhas/index.html",
            meta: { title: "Campanhas", style: estiloComunidade, section: "/campanhas", protected: true }
        },
        {
            path: "/campanha",
            name: "Campanha",
            component: () => import("../view/DetalhesCampanha.vue"),
            alias: "/campanha/index.html",
            meta: { title: "Campanha", style: estiloComunidade, section: "/campanhas", protected: true }
        },
        {
            path: "/comunidades",
            name: "Comunidades",
            component: () => import("../view/Comunidades.vue"),
            alias: "/comunidades/index.html",
            meta: { title: "Comunidades", style: estiloComunidade, section: "/comunidades", protected: true }
        },
        {
            path: "/perfil",
            name: "Perfil",
            component: () => import("../view/Perfil.vue"),
            alias: "/perfil/index.html",
            meta: {
                title: "Perfil",
                style: communityCss + profileCss + navigationCss,
                section: "/perfil",
                protected: true
            }
        },
        {
            path: "/mensagens",
            name: "Mensagens",
            component: () => import("../view/Mensagens.vue"),
            alias: "/mensagens/index.html",
            meta: { title: "Mensagens", style: estiloComunidade, section: "/mensagens", protected: true }
        },
        {
            path: "/configuracoes",
            name: "Configuracoes",
            component: () => import("../view/Configuracoes.vue"),
            alias: "/configuracoes/index.html",
            meta: {
                title: "Configurações",
                style: estiloComunidade,
                section: "/configuracoes",
                protected: true
            }
        },
        { path: "/Blog", redirect: "/taverna" },
        { path: "/:pathMatch(.*)*", redirect: "/" }
    ],
    scrollBehavior(to) {
        return to.hash ? { el: to.hash, behavior: "smooth" } : { top: 0 }
    }
})
// Antes de abrir uma página protegida, confiro se há uma sessão salva.
router.beforeEach(to => {
    if (to.meta.protected && (!sessao.userId || !sessao.token)) return "/login"
})
router.afterEach(to => {
    fecharModal()
    notificacoesAbertas.value = false
    document.title = to.meta.title + " - FrontD"
    document.body.classList.remove("app-comunidade", "app-mensagens", "menu-aberto")
    if (to.meta.protected && to.name !== "Taverna") document.body.classList.add("app-comunidade")
    if (to.name === "Mensagens") document.body.classList.add("app-mensagens")
    let styles = document.getElementById("page-styles")
    if (!styles) {
        styles = document.createElement("style")
        styles.id = "page-styles"
        document.head.appendChild(styles)
    }
    styles.textContent = typeof to.meta.style === "string" ? to.meta.style : ""
})
