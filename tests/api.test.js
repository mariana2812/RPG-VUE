import { test, afterEach } from "node:test"
import assert from "node:assert/strict"
import { apiRequest, query, record } from "../src/controller/service.controller.js"
import {
    deleteByIdOrFilter,
    excluirPublicacao,
    excluirCampanha,
    amigosDe,
    privado
} from "../src/controller/comunidade.controller.js"
import { abrirModal, fecharModal } from "../src/composables/useModal.js"
const originalFetch = globalThis.fetch
const values = new Map([
    ["idUser", "1"],
    ["accessToken", "token"]
])
Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: key => values.get(key) ?? null }
})
afterEach(() => {
    globalThis.fetch = originalFetch
    fecharModal()
})
function respond(data, status = 200) {
    return new Response(data === undefined ? null : JSON.stringify(data), { status })
}
test("envia Bearer nas coleções e mantém login e cadastro sem token", async () => {
    const requests = []
    globalThis.fetch = async (url, options) => {
        requests.push({ url, ...options })
        return respond({ ok: true })
    }
    await apiRequest("/users")
    await apiRequest("/login", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", password: "password" })
    })
    await apiRequest("/register", { method: "POST", body: "{}" })
    assert.equal(requests[0].headers.Authorization, "Bearer token")
    assert.equal(requests[1].headers.Authorization, undefined)
    assert.equal(requests[2].headers.Authorization, undefined)
    assert.equal(requests[1].headers["Content-Type"], "application/json")
    assert.equal(requests[0].url, "http://localhost:3001/users")
})
test("preserva status e mensagem de erro retornados pela API", async () => {
    globalThis.fetch = async () => respond({ message: "Sem permissão" }, 403)
    await assert.rejects(
        apiRequest("/blog"),
        error => error.status === 403 && error.message.includes("Sem permissão")
    )
})
test("trata resposta vazia de DELETE, JSON inválido e servidor desligado", async () => {
    globalThis.fetch = async () => respond(undefined, 204)
    assert.equal(await apiRequest("/blog/1", { method: "DELETE" }), null)
    globalThis.fetch = async () => new Response("<html>erro</html>")
    await assert.rejects(apiRequest("/blog"), /esperado JSON/)
    globalThis.fetch = async () => {
        throw new TypeError("Failed to fetch")
    }
    await assert.rejects(apiRequest("/blog"), /Não foi possível conectar/)
})
test("exclusão de publicação verifica autoria e remove comentários e curtidas", async () => {
    const calls = []
    globalThis.fetch = async (url, options) => {
        const path = new URL(url).pathname + new URL(url).search
        calls.push([options.method || "GET", path])
        return respond(
            path === "/blog/p1"
                ? { id: "p1", userId: 1 }
                : path.startsWith("/likes?")
                  ? [{ id: "l1" }]
                  : path.startsWith("/comments?")
                    ? [{ id: "c1" }]
                    : {}
        )
    }
    await excluirPublicacao("p1")
    assert.deepEqual(
        calls.filter(([method]) => method === "DELETE"),
        [
            ["DELETE", "/likes/l1"],
            ["DELETE", "/comments/c1"],
            ["DELETE", "/blog/p1"]
        ]
    )
    globalThis.fetch = async () => respond({ userId: 2 })
    await assert.rejects(excluirPublicacao("p1"), /Somente o autor/)
})
test("exclusão de campanha exige o mestre e remove seus vínculos", async () => {
    const calls = []
    globalThis.fetch = async (url, options) => {
        const path = new URL(url).pathname + new URL(url).search
        calls.push([options.method || "GET", path])
        return respond(
            path === "/campaigns/a"
                ? { mestreId: "1" }
                : path.startsWith("/campaignPosts?")
                  ? [{ id: "p" }]
                  : path.startsWith("/campaignMembers?")
                    ? [{ id: "m" }]
                    : {}
        )
    }
    await excluirCampanha("a")
    assert.deepEqual(
        calls.filter(([method]) => method === "DELETE").map(([, path]) => path),
        ["/campaignPosts/p", "/campaignMembers/m", "/campaigns/a"]
    )
})
test("fallback de exclusão usa filtro quando o servidor retorna 404", async () => {
    const calls = []
    globalThis.fetch = async (url, options) => {
        const path = new URL(url).pathname + new URL(url).search
        calls.push(path)
        if (path === "/likes/old") return respond({ message: "Not found" }, 404)
        return respond(path.startsWith("/likes?") ? [{ id: "new" }] : {})
    }
    await deleteByIdOrFilter("likes", "old", { postId: "a b" })
    assert.deepEqual(calls, ["/likes/old", "/likes?postId=a+b", "/likes/new"])
    assert.equal(record("users", "a/b"), "/users/a%2Fb")
    assert.equal(query("messages", { userId: "a b" }), "/messages?userId=a+b")
})
test("reconhece IDs numéricos, amizades aceitas e privacidade booleana ou texto", () => {
    const friends = amigosDe(
        [
            { userId: 1, friendId: 2, status: "friend" },
            { userId: 3, friendId: 1, status: "accepted" },
            { userId: 1, friendId: 4, status: "pending" }
        ],
        "1"
    )
    assert.deepEqual([...friends], ["2", "3"])
    assert.equal(privado({ privado: "true" }), true)
    assert.equal(privado({ privado: "false" }), false)
})
test("modal permite cancelar e impede duas confirmações simultâneas", async () => {
    const first = abrirModal({ titulo: "Confirmar" })
    assert.equal(await abrirModal({ titulo: "Outro" }), null)
    fecharModal("valor")
    assert.equal(await first, "valor")
})
