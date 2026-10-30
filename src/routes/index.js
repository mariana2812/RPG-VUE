import { createRouter, createWebHistory } from 'vue-router'
import { session } from '../controller/user.controller.js'
import { closeDialog } from '../composables/useDialog.js'
import { notificationsOpen } from '../composables/useNotifications.js'
import homeCss from '../assets/styles/home.css?raw'
import loginCss from '../assets/styles/login.css?raw'
import registerCss from '../assets/styles/register.css?raw'
import communityCss from '../assets/styles/community.css?raw'
import navigationCss from '../assets/styles/navigation.css?raw'
import feedCss from '../assets/styles/feed.css?raw'
import tavernCss from '../assets/styles/tavern.css?raw'
import profileCss from '../assets/styles/profile.css?raw'
const placeholder = { template: '<main class="pagina"><p>Migrando esta tela para Vue.</p></main>' }
const page = (path, name, title, component, style, section = path) => ({ path, name, component, alias: ['/' + (name === 'Tavern' ? 'Blog' : name === 'Register' ? 'Cadastro' : path.slice(1)) + '/index.html', ...(path === '/' ? ['/index.html'] : [])], meta: { title, style, section, protected: !['Home','Login','Register'].includes(name) } })
export const router = createRouter({
    history: createWebHistory(),
    routes: [
        page('/', 'Home', 'FrontD', () => import('../view/Home.vue'), homeCss),
        page('/login', 'Login', 'Login', () => import('../view/Login.vue'), loginCss),
        page('/cadastro', 'Register', 'Cadastro', () => import('../view/Register.vue'), registerCss),
        page('/taverna', 'Tavern', 'A taverna', placeholder, feedCss + tavernCss),
        page('/descobrir', 'Discover', 'Descobrir jogadores', placeholder, communityCss + navigationCss),
        page('/campanhas', 'Campaigns', 'Campanhas', placeholder, communityCss + navigationCss),
        page('/campanha', 'Campaign', 'Campanha', placeholder, communityCss + navigationCss, '/campanhas'),
        page('/comunidades', 'Communities', 'Comunidades', placeholder, communityCss + navigationCss),
        page('/perfil', 'Profile', 'Perfil', placeholder, communityCss + profileCss + navigationCss),
        page('/mensagens', 'Messages', 'Mensagens', placeholder, communityCss + navigationCss),
        page('/configuracoes', 'Settings', 'Configura??es', () => import('../view/Settings.vue'), communityCss + navigationCss),
        { path: '/Blog', redirect: '/taverna' }, { path: '/:pathMatch(.*)*', redirect: '/' }
    ],
    scrollBehavior(to) { return to.hash ? { el: to.hash, behavior: 'smooth' } : { top: 0 } }
})
router.beforeEach(to => { if (to.meta.protected && (!session.token || !session.userId)) return '/login' })
router.afterEach(to => {
    closeDialog()
    notificationsOpen.value = false
    document.title = to.meta.title + ' - FrontD'
    document.body.classList.remove('app-comunidade', 'app-mensagens', 'menu-aberto')
    if (to.meta.protected && to.name !== 'Tavern') document.body.classList.add('app-comunidade')
    if (to.name === 'Messages') document.body.classList.add('app-mensagens')
    let styles = document.getElementById('page-styles')
    if (!styles) { styles = document.createElement('style'); styles.id = 'page-styles'; document.head.appendChild(styles) }
    styles.textContent = to.meta.style || ''
})
