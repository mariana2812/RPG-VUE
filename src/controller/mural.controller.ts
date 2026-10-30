// Busco os autores e mostro as publicações permitidas para o usuário atual.
import { apiController as api, record } from "./api.controller.ts"
import { amigosDe, privado } from "./comunidade.controller.ts"

export async function carregarMural(userId: string) {
    const [data, relations] = await Promise.all([api.get("/blog"), api.get("/friends")])
    if (!Array.isArray(data)) throw new Error("A rota do blog precisa retornar uma lista.")
    const friends = amigosDe(relations, userId)
    const ids = [...new Set(data.map(post => post.userId ?? post.user?.id).filter(id => id != null))]
    const authors = new Map(
        await Promise.all(
            ids.map(async id => {
                try {
                    return [String(id), await api.get(record("users", id))] as const
                } catch {
                    return [String(id), null] as const
                }
            })
        )
    )
    const posts = data
        .map(post => ({
            ...post,
            user: authors.get(String(post.userId ?? post.user?.id)) || post.user
        }))
        .filter(
            post =>
                String(post.userId ?? post.user?.id) === userId ||
                !privado(post.user) ||
                friends.has(String(post.userId ?? post.user?.id))
        )
        .reverse()

    return { posts, friends }
}
