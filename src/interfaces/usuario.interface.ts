// Estas interfaces descrevem os dados do usuário, do formulário e da resposta do login.
import type { Id } from "./identificador.interface.ts"

export interface Usuario {
    id?: Id
    nome?: string
    username?: string
    email?: string
    avatar?: string
    biografia?: string
    privado?: boolean | string
}

export interface Credenciais {
    email: string
    password: string
}

export interface RespostaAutenticacao {
    accessToken: string
    user: Usuario & { id: Id }
}
