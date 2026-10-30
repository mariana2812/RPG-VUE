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
const page = (path, name, title, component, style, section = path) => ({ path, name, component, alias: path === '/' ? ['/index.html'] : ['/' + (name === 'Tavern' ? 'Blog' : name === 'Register' ? 'Cadastro' : path.slice(1)) + '/index.html'], meta: { title, style, section, protected: !['Home','Login','Register'].includes(name) } })
export const router = createRouter({
    history: createWebHistory(),
    routes: [
        page('/', 'Home', 'FrontD', () => import('../view/Home.vue'), homeCss),
        page('/login', 'Login', 'Login', () => import('../view/Login.vue'), loginCss),
        page('/cadastro', 'Register', 'Cadastro', () => import('../view/Register.vue'), registerCss),
        page('/taverna', 'Tavern', 'A taverna', () => import('../view/Tavern.vue'), feedCss + tavernCss),
        page('/descobrir', 'Discover', 'Descobrir jogadores', () => import('../view/Discover.vue'), communityCss + navigationCss),
        page('/campanhas', 'Campaigns', 'Campanhas', () => import('../view/Campaigns.vue'), communityCss + navigationCss),
        page('/campanha', 'Campaign', 'Campanha', () => import('../view/Campaign.vue'), communityCss + navigationCss, '/campanhas'),
        page('/comunidades', 'Communities', 'Comunidades', () => import('../view/Communities.vue'), communityCss + navigationCss),
        page('/perfil', 'Profile', 'Perfil', () => import('../view/Profile.vue'), communityCss + profileCss + navigationCss),
        page('/mensagens', 'Messages', 'Mensagens', () => import('../view/Messages.vue'), communityCss + navigationCss),
        page('/configuracoes', 'Settings', 'Configurações', () => import('../view/Settings.vue'), communityCss + navigationCss),
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
