// Descrevo aqui os dados usados na conversa e nas mensagens recebidas.
import type { Id } from "./identificador.interface.ts"
import type { Usuario } from "./usuario.interface.ts"
export interface Conversa {
    type: string
    data: Usuario
}
export interface Mensagem {
    id: Id
    senderId: Id
    receiverId?: Id
    communityId?: Id
    conteudo: string
    created_at: string
}
