import { createRouter, createWebHistory } from "vue-router"
import { sessao } from "../controller/user.controller.js"
import { fecharModal } from "../composables/useModal.js"
import { notificacoesAbertas } from "../composables/useNotificacoes.js"
import homeCss from "../assets/styles/home.css?raw"
import loginCss from "../assets/styles/login.css?raw"
import communityCss from "../assets/styles/community.css?raw"
import navigationCss from "../assets/styles/navigation.css?raw"
import feedCss from "../assets/styles/feed.css?raw"
import tavernCss from "../assets/styles/tavern.css?raw"
import profileCss from "../assets/styles/profile.css?raw"
const estiloComunidade = communityCss + navigationCss

const page = (path, name, title, component, style, section = path) => ({
    path,
    name,
    component,
    alias:
        path === "/"
            ? ["/index.html"]
            : [
                  "/" +
                      (name === "Taverna" ? "Blog" : name === "Register" ? "Cadastro" : path.slice(1)) +
                      "/index.html"
              ],
    meta: { title, style, section, protected: !["Home", "Login", "Register"].includes(name) }
})
export const router = createRouter({
    history: createWebHistory(),
    routes: [
        page("/", "Home", "FrontD", () => import("../view/Home.vue"), homeCss),
        page("/login", "Login", "Login", () => import("../view/Login.vue"), loginCss),
        page("/cadastro", "Register", "Cadastro", () => import("../view/Register.vue"), loginCss),
        page("/taverna", "Taverna", "A taverna", () => import("../view/Taverna.vue"), feedCss + tavernCss),
        page(
            "/descobrir",
            "Descobrir",
            "Descobrir jogadores",
            () => import("../view/Descobrir.vue"),
            estiloComunidade
        ),
        page("/campanhas", "Campanhas", "Campanhas", () => import("../view/Campanhas.vue"), estiloComunidade),
        page(
            "/campanha",
            "Campanha",
            "Campanha",
            () => import("../view/Campanha.vue"),
            estiloComunidade,
            "/campanhas"
        ),
        page(
            "/comunidades",
            "Comunidades",
            "Comunidades",
            () => import("../view/Comunidades.vue"),
            estiloComunidade
        ),
        page(
            "/perfil",
            "Perfil",
            "Perfil",
            () => import("../view/Perfil.vue"),
            communityCss + profileCss + navigationCss
        ),
        page("/mensagens", "Mensagens", "Mensagens", () => import("../view/Mensagens.vue"), estiloComunidade),
        page(
            "/configuracoes",
            "Configuracoes",
            "Configurações",
            () => import("../view/Configuracoes.vue"),
            estiloComunidade
        ),
        { path: "/Blog", redirect: "/taverna" },
        { path: "/:pathMatch(.*)*", redirect: "/" }
    ],
    scrollBehavior(to) {
        return to.hash ? { el: to.hash, behavior: "smooth" } : { top: 0 }
    }
})
router.beforeEach(to => {
    if (to.meta.protected && (!sessao.token || !sessao.userId)) return "/login"
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
    styles.textContent = to.meta.style || ""
})
