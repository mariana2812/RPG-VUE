import { createApp } from 'vue'
import App from './App.vue'
import { router } from './routes/index.js'
import './assets/styles/global.css'
import './assets/styles/app.css'
createApp(App).use(router).mount('#app')
