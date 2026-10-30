// Separo os dados usados no formulário dos dados da campanha salva.
import type { Id } from "./identificador.interface.ts"

export interface FormularioCampanha {
    nome: string
    sistema: string
    descricao: string
    maxJogadores: number
    removerCapa?: boolean
}

export interface Campanha {
    id: Id
    nome: string
    sistema?: string
    sistemaNome?: string
    descricao?: string
    capa?: string
    status?: string
    masterId?: Id
    mestreId?: Id
    maxJogadores?: number
}
