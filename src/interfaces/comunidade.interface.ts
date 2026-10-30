// Aqui eu descrevo os campos usados nas relações de amizade e nas publicações.
import type { Id } from "./identificador.interface.ts"
import type { Usuario } from "./usuario.interface.ts"

export interface Relacao {
    id?: Id
    userId: Id
    friendId: Id
    status?: string
}

export interface Publicacao {
    id: Id
    userId?: Id
    user?: Usuario
    conteudo?: string
    body?: string
    imagem?: string
    sistema?: string
    created_at?: string
    updated_at?: string
}
