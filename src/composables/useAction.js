import { ref } from 'vue'
export function useAction() {
    const busy = ref(false)
    const message = ref('')
    async function run(action) {
        if (busy.value) return
        busy.value = true
        message.value = ''
        try { return await action() }
        catch (error) { message.value = error.message || 'Não foi poss?vel concluir a operação.' }
        finally { busy.value = false }
    }
    return { busy, message, run }
}
