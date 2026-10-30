// Aqui eu inicio o Vue e habilito a navegação entre as páginas.
import { createApp } from "vue"
import App from "./App.vue"
import { router } from "./routes/index.ts"
import "./assets/styles/global.css"
import "./assets/styles/app.css"
const app = createApp(App)
app.use(router)
app.mount("#app")
