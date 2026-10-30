// Estes tipos ajudam a definir os dados recebidos pelos painéis da Taverna.
import type { Usuario } from "./usuario.interface.ts"
import type { Id } from "./identificador.interface.ts"

export interface SistemaResumo {
    id: Id
    nome: string
}
export interface CampanhaResumo {
    id: Id
    nome: string
    sistema?: string
    sistemaNome?: string
    capa?: string
    vagas?: number
}
export interface ResumoPerfilTavernaProps {
    user?: Usuario
    systems: SistemaResumo[]
    campaignCount: number
    friendCount: number
}
