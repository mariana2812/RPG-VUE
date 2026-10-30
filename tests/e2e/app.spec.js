import { test, expect } from "@playwright/test"
function seed() {
    return {
        users: [
            {
                id: "1",
                nome: "Mariana",
                email: "mariana@example.com",
                biografia: "Mestre de RPG",
                privado: false
            },
            {
                id: "2",
                nome: "Amigo",
                email: "amigo@example.com",
                biografia: "Aventureiro",
                privado: true
            },
            {
                id: "3",
                nome: "Privado",
                email: "privado@example.com",
                biografia: "Segredo",
                privado: true
            },
            { id: "4", nome: "Público", email: "publico@example.com", privado: false }
        ],
        blog: [
            { id: "p1", userId: "1", conteudo: "Minha aventura", created_at: "2026-10-30T12:00:00Z" },
            { id: "p2", userId: "2", conteudo: "Aventura entre amigos" },
            { id: "p3", userId: "3", conteudo: "Publicação secreta" }
        ],
        friends: [
            { id: "f1", userId: "1", friendId: "2", status: "friend" },
            { id: "f2", userId: "4", friendId: "1", status: "following" }
        ],
        campaigns: [
            {
                id: "a1",
                nome: "Aventura original",
                sistema: "D&D",
                descricao: "Nossa campanha",
                masterId: "1",
                status: "aberta",
                maxJogadores: 5
            },
            {
                id: "a2",
                nome: "Outra mesa",
                sistema: "Tormenta",
                descricao: "Uma aventura",
                masterId: "2",
                status: "aberta",
                maxJogadores: 2
            }
        ],
        campaignMembers: [],
        campaignPosts: [],
        communities: [
            { id: "g1", nome: "Taverna de teste", descricao: "Grupo de RPG", ownerId: "1" },
            { id: "g2", nome: "Outro grupo", descricao: "Conversas de RPG", ownerId: "2" }
        ],
        communityMembers: [],
        messages: [
            {
                id: "m1",
                senderId: "2",
                receiverId: "1",
                conteudo: "Vamos jogar?",
                created_at: "2026-10-30T12:00:00Z"
            }
        ],
        systems: [{ id: "s1", nome: "D&D" }],
        userSystems: [{ id: "us1", userId: "1", systemId: "s1" }],
        likes: [],
        comments: [],
        avatar: [{ id: "av1", url: "https://api.dicebear.com/9.x/bottts/svg?seed=novo" }]
    }
}
async function setup(page, { authenticated = true } = {}) {
    const db = seed(),
        requests = [],
        errors = []
    page.on("pageerror", error => errors.push(error.message))
    page.on("console", item => {
        if (/was accessed during render but is not defined|Failed to resolve component/.test(item.text())) {
            errors.push(item.text())
        }
    })
    await page.route("https://api.dicebear.com/**", route =>
        route.fulfill({
            contentType: "image/svg+xml",
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#b8860b"/></svg>'
        })
    )
    await page.route("https://images.openai.com/**", route => route.abort())
    await page.route("http://localhost:3001/**", async route => {
        const req = route.request(),
            url = new URL(req.url()),
            parts = url.pathname.split("/").filter(Boolean),
            method = req.method()
        const body = ["POST", "PATCH"].includes(method) ? req.postDataJSON() : null
        requests.push({ method, path: url.pathname, body, headers: req.headers() })
        if (method === "OPTIONS")
            return route.fulfill({
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Methods": "*"
                }
            })
        if (parts[0] === "login" || parts[0] === "register") {
            if (body.email === "erro@example.com")
                return route.fulfill({ status: 400, json: { message: "Dados inválidos" } })
            return route.fulfill({ json: { accessToken: "test-token", user: db.users[0] } })
        }
        const list = db[parts[0]]
        if (!list) return route.fulfill({ status: 404, json: { message: "Coleção não encontrada" } })
        let result
        if (method === "GET") {
            result = parts[1]
                ? list.find(item => String(item.id) === decodeURIComponent(parts[1]))
                : list.filter(item =>
                      [...url.searchParams].every(([key, value]) => String(item[key]) === value)
                  )
            if (!result) return route.fulfill({ status: 404, json: { message: "Registro não encontrado" } })
        } else if (method === "POST") {
            result = { ...body, id: "new-" + requests.length }
            list.push(result)
        } else if (method === "PATCH") {
            result = list.find(item => String(item.id) === decodeURIComponent(parts[1]))
            Object.assign(result, body)
        } else if (method === "DELETE") {
            const index = list.findIndex(item => String(item.id) === decodeURIComponent(parts[1]))
            list.splice(index, 1)
            result = {}
        }
        return route.fulfill({ json: result, headers: { "Access-Control-Allow-Origin": "*" } })
    })
    if (authenticated)
        await page.addInitScript(() => {
            localStorage.setItem("accessToken", "test-token")
            localStorage.setItem("idUser", "1")
        })
    return { db, requests, errors }
}
test("home, proteção de rota, login e links antigos", async ({ page }) => {
    const { requests, errors } = await setup(page, { authenticated: false })
    await page.goto("/")
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Conectando")
    await page.goto("/campanhas/index.html")
    await expect(page).toHaveURL(/\/login$/)
    await page.locator("#email").fill("mariana@example.com")
    await page.locator("#senha").fill("password")
    await page.getByRole("button", { name: "Entrar", exact: true }).click()
    await expect(page).toHaveURL(/\/taverna$/)
    await expect(page.locator("#profileName")).toHaveText("Mariana")
    const login = requests.find(item => item.path === "/login")
    expect(login.body).toEqual({ email: "mariana@example.com", password: "password" })
    expect(login.headers.authorization).toBeUndefined()
    await page.goto("/Blog/index.html")
    await expect(page.locator("#feed .post")).toHaveCount(2)
    expect(errors).toEqual([])
})
test("cadastro usa /register e exibe erros da API", async ({ page }) => {
    const { requests, errors } = await setup(page, { authenticated: false })
    await page.goto("/Cadastro/index.html")
    await page.locator("#email").fill("erro@example.com")
    await page.locator("#senha").fill("password")
    await page.getByRole("button", { name: "Cadastrar" }).click()
    await expect(page.locator("#message")).toContainText("Dados inválidos")
    await page.locator("#email").fill("nova@example.com")
    await page.getByRole("button", { name: "Cadastrar" }).click()
    await expect(page).toHaveURL(/\/perfil$/)
    await expect(page.locator("#nomePerfil")).toHaveText("Mariana")
    expect(requests.some(item => item.path === "/register")).toBeTruthy()
    expect(errors).toEqual([])
})
test("feed preserva privacidade e publica com sistema e imagem", async ({ page }) => {
    const { db, errors } = await setup(page)
    await page.goto("/taverna")
    await expect(page.locator("#feed .post")).toHaveCount(2)
    await expect(page.locator("#feed")).not.toContainText("Publicação secreta")
    await page.locator("#searchInput").fill("entre amigos")
    await expect(page.locator("#feed .post")).toHaveCount(1)
    await page.locator("#searchInput").fill("")
    await page.getByRole("button", { name: "Sistema", exact: true }).click()
    await page.locator("#valorModal").fill("Tormenta 20")
    await page.getByRole("button", { name: "Adicionar sistema", exact: true }).click()
    await page.locator('input[type="file"]').setInputFiles({
        name: "image.png",
        mimeType: "image/png",
        buffer: Buffer.from(
            await page.evaluate(() => {
                const canvas = document.createElement("canvas")
                canvas.width = canvas.height = 10
                canvas.getContext("2d").fillRect(0, 0, 10, 10)
                return canvas.toDataURL("image/png").split(",")[1]
            }),
            "base64"
        )
    })
    await expect(page.locator(".previa-publicacao")).toBeVisible()
    await page.locator("#postContent").fill("Nova história")
    await page.locator("#publishButton").click()
    await expect(page.locator("#feed")).toContainText("Nova história")
    expect(db.blog.at(-1)).toMatchObject({
        userId: "1",
        sistema: "Tormenta 20",
        conteudo: "Nova história"
    })
    expect(db.blog.at(-1).imagem).toMatch(/^data:image\/webp/)
    expect(errors).toEqual([])
})
test("curtir, comentar, editar e excluir com confirmação", async ({ page }) => {
    const { db, errors } = await setup(page)
    await page.goto("/taverna")
    const post = page.locator("#post-p1")
    await expect(post.locator(".like-button")).toBeEnabled()
    await post.locator(".like-button").click()
    await expect(post.locator(".like-count")).toHaveText("1")
    await post.locator(".like-button").click()
    await expect(post.locator(".like-count")).toHaveText("0")
    await post.locator(".comment-button").click()
    await post.locator(".comment-form input").fill("Boa aventura!")
    await post.locator(".comment-form input").press("Enter")
    await expect(post.locator(".comments-list")).toContainText("Boa aventura!")
    await post.locator(".edit-post-button").click()
    await page.locator("#valorModal").fill("História editada")
    await page.getByRole("button", { name: "Salvar alterações", exact: true }).click()
    await expect(post.locator(".post-content")).toHaveText("História editada")
    await post.locator(".delete-post-button").click()
    await page.getByRole("button", { name: "Cancelar", exact: true }).click()
    await expect(post).toBeVisible()
    await post.locator(".delete-post-button").click()
    await page.getByRole("button", { name: "Excluir publicação", exact: true }).click()
    await expect(post).toHaveCount(0)
    expect(db.comments).toHaveLength(0)
    expect(errors).toEqual([])
})
test("perfil privado, solicitação, cancelar e seguir de volta", async ({ page }) => {
    const { db, errors } = await setup(page)
    await page.goto("/perfil?id=3")
    await expect(page.locator("#perfilPrivadoAviso")).toBeVisible()
    await expect(page.locator("#bioPerfil")).not.toContainText("Segredo")
    await page.getByRole("button", { name: "Solicitar para seguir", exact: true }).click()
    await expect(page.getByRole("button", { name: "Cancelar solicitação" })).toBeVisible()
    expect(db.friends.some(item => item.friendId === "3" && item.status === "pending")).toBeTruthy()
    await page.getByRole("button", { name: "Cancelar solicitação" }).click()
    await expect(page.getByRole("button", { name: "Solicitar para seguir" })).toBeVisible()
    await page.goto("/perfil?id=4")
    await page.getByRole("button", { name: "Seguir de volta" }).click()
    await expect(page.getByRole("button", { name: "Remover amizade" })).toBeVisible()
    expect(
        db.friends
            .filter(item => item.userId === "4" || item.friendId === "4")
            .every(item => item.status === "friend")
    ).toBeTruthy()
    expect(errors).toEqual([])
})
test("editar perfil, trocar avatar, adicionar e remover sistemas", async ({ page }) => {
    const { db, errors } = await setup(page)
    await page.goto("/perfil#editar")
    await expect(page.locator("#editarPerfil")).toBeVisible()
    await page.locator("#nome").fill("Mariana Mestre")
    await page.locator("#biografia").fill("Nova bio")
    await page.locator("#privacidadePerfil").selectOption("privado")
    await page.locator(".avatar-escolha").last().click()
    await page.getByRole("button", { name: "Salvar perfil", exact: true }).click()
    await expect(page.locator("#nomePerfil")).toHaveText("Mariana Mestre")
    expect(db.users[0].privado).toBe(true)
    await page.locator("#abrirEdicao").click()
    await page.locator("#nomeSistema").fill("Tormenta")
    await page.locator("#adicionarSistema").click()
    await expect(page.locator("#sistemas")).toContainText("Tormenta")
    await page.getByRole("button", { name: "Remover sistema Tormenta", exact: true }).click()
    await expect(page.locator("#sistemas")).not.toContainText("Tormenta")
    expect(errors).toEqual([])
})
test("campanha: criar, editar, fechar, reabrir, publicar e excluir", async ({ page }) => {
    const { db, errors } = await setup(page)
    await page.goto("/campanhas")
    await page.locator("#nome").fill("Campanha Vue")
    await page.locator("#sistema").fill("D&D 5e")
    await page.locator("#descricao").fill("Mesa de teste")
    await page.locator("#maxJogadores").fill("4")
    await page.locator('#formCampanha button[type="submit"]').click()
    await expect(page).toHaveURL(/\/campanha\?id=/)
    await expect(page.locator("#nome")).toHaveText("Campanha Vue")
    await page.getByRole("button", { name: "Editar campanha", exact: true }).click()
    await page.locator("#editarNome").fill("Campanha editada")
    await page.getByRole("button", { name: "Salvar alterações", exact: true }).click()
    await expect(page.locator("#nome")).toHaveText("Campanha editada")
    await page.getByRole("button", { name: "Fechar inscrições" }).click()
    await expect(page.getByRole("button", { name: "Reabrir inscrições" })).toBeVisible()
    await page.getByRole("button", { name: "Reabrir inscrições" }).click()
    await expect(page.getByRole("button", { name: "Fechar inscrições" })).toBeVisible()
    await page.locator("#mensagem").fill("Sessão amanhã")
    await page.locator("#enviar").click()
    await expect(page.locator("#mural")).toContainText("Sessão amanhã")
    await page.getByRole("button", { name: "Excluir campanha", exact: true }).click()
    await page.locator(".modal-confirmar").click()
    await expect(page).toHaveURL(/\/campanhas$/)
    expect(db.campaignPosts).toHaveLength(0)
    expect(errors).toEqual([])
})
test("campanha de outro mestre: entrar, sair e impedir entrada quando cheia", async ({ page }) => {
    const { db, errors } = await setup(page)
    await page.goto("/campanha?id=a2")
    await page.getByRole("button", { name: "Entrar na campanha" }).click()
    await expect(page.getByRole("button", { name: "Sair da campanha" })).toBeVisible()
    await expect(page.locator("#mensagem")).toBeEnabled()
    await page.getByRole("button", { name: "Sair da campanha" }).click()
    await expect(page.getByRole("button", { name: "Entrar na campanha" })).toBeVisible()
    await expect(page.locator("#mensagem")).toBeDisabled()
    db.campaignMembers.push(
        { id: "cm1", campaignId: "a2", userId: "3" },
        { id: "cm2", campaignId: "a2", userId: "4" }
    )
    await page.reload()
    await expect(page.getByRole("button", { name: "Campanha cheia" })).toBeDisabled()
    expect(errors).toEqual([])
})
test("comunidade: criar, editar, entrar, participantes e sair", async ({ page }) => {
    const { db, errors } = await setup(page)
    await page.goto("/comunidades")
    await page.locator("#nome").fill("Grupo Vue")
    await page.locator("#descricao").fill("Novo grupo")
    await page.locator("#formComunidade .botao").click()
    await expect(page.locator("#comunidades")).toContainText("Grupo Vue")
    const own = page
        .locator("#comunidades article")
        .filter({ has: page.getByRole("heading", { name: "Grupo Vue", exact: true }) })
    await own.getByRole("button", { name: "Editar comunidade" }).click()
    await page.locator("#nome").fill("Grupo editado")
    await page.locator("#formComunidade .botao").click()
    await expect(page.locator("#comunidades")).toContainText("Grupo editado")
    const other = page
        .locator("#comunidades article")
        .filter({ has: page.getByRole("heading", { name: "Outro grupo", exact: true }) })
    await other.getByRole("button", { name: "Entrar", exact: true }).click()
    await expect(other.getByRole("button", { name: "Sair", exact: true })).toBeVisible()
    await other.getByRole("button", { name: "Ver participantes" }).click()
    await expect(other.locator(".comunidade-participantes")).toContainText("Mariana")
    await other.getByRole("button", { name: "Sair", exact: true }).click()
    await expect(other.getByRole("button", { name: "Entrar", exact: true })).toBeVisible()
    expect(db.communityMembers).toHaveLength(0)
    expect(errors).toEqual([])
})
test("mensagens diretas e de comunidade, filtros e mensagens lidas", async ({ page }) => {
    const { db, errors } = await setup(page)
    await page.goto("/mensagens?contato=2")
    await expect(page.locator("#chat")).toContainText("Vamos jogar?")
    await expect(page.locator("#nomeContato")).toHaveText("Amigo")
    await page.locator("#mensagem").fill("Vamos sim")
    await page.locator("#mensagem").press("Enter")
    await expect(page.locator("#chat")).toContainText("Vamos sim")
    expect(db.messages.at(-1)).toMatchObject({
        senderId: "1",
        receiverId: "2",
        conteudo: "Vamos sim"
    })
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("frontdReadMessages:1")))).toContain(
        "m1"
    )
    await page.getByRole("button", { name: "Comunidades", exact: true }).click()
    await expect(page.locator("#contatos .contato")).toHaveCount(1)
    await page.locator("#contatos .contato").click()
    await expect(page.locator("#nomeContato")).toHaveText("Taverna de teste")
    await page.locator("#mensagem").fill("Olá grupo")
    await page.locator("#enviar").click()
    await expect(page.locator("#chat")).toContainText("Olá grupo")
    expect(db.messages.at(-1)).toMatchObject({ communityId: "g1", senderId: "1" })
    expect(errors).toEqual([])
})
test("sino permite aceitar solicitação e sair limpa a sessão", async ({ page }) => {
    const { db, errors } = await setup(page)
    db.friends.push({ id: "pending", userId: "3", friendId: "1", status: "pending" })
    await page.goto("/descobrir")
    await page.getByRole("button", { name: "Notificações", exact: true }).click()
    await expect(page.locator("#listaSolicitacoes")).toBeVisible()
    await page.locator("#listaSolicitacoes").getByRole("button", { name: "Aceitar" }).click()
    await expect(page.locator("#listaSolicitacoes")).toContainText("Nenhuma solicitação pendente.")
    expect(db.friends.find(item => item.id === "pending").status).toBe("accepted")
    await page.locator("#listaSolicitacoes").getByRole("button", { name: "Fechar", exact: true }).click()
    await page.locator(".app-lateral").getByRole("link", { name: "Configurações", exact: true }).click()
    await page.locator("#sair").click()
    await expect(page).toHaveURL(/\/login$/)
    expect(await page.evaluate(() => localStorage.getItem("accessToken"))).toBeNull()
    expect(errors).toEqual([])
})
test("menu no celular e navegação SPA sem recarregar documento", async ({ page }) => {
    const { errors } = await setup(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/descobrir")
    await page.evaluate(() => {
        window.navigationMarker = "same-document"
    })
    await page.getByRole("button", { name: "Abrir navegação" }).click()
    await expect(page.locator("body")).toHaveClass(/menu-aberto/)
    await page.keyboard.press("Escape")
    await expect(page.locator("body")).not.toHaveClass(/menu-aberto/)
    await page.getByRole("button", { name: "Abrir navegação" }).click()
    await page.locator(".app-lateral").getByRole("link", { name: "Campanhas", exact: true }).click()
    await expect(page.locator("#formCampanha")).toBeVisible()
    expect(await page.evaluate(() => window.navigationMarker)).toBe("same-document")
    await expect(page.locator("body")).not.toHaveClass(/menu-aberto/)
    const widths = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
    expect(widths[0]).toBeLessThanOrEqual(widths[1])
    expect(errors).toEqual([])
})

test("layout responsivo nas telas principais", async ({ page }) => {
    const { errors } = await setup(page)
    for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 })
        for (const path of [
            "/taverna",
            "/perfil",
            "/mensagens",
            "/campanhas",
            "/comunidades",
            "/descobrir",
            "/configuracoes"
        ]) {
            await page.goto(path)
            await expect(page.locator("main")).toBeVisible()
            const dimensions = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
            expect(dimensions[0], `${path} em ${width}px`).toBeLessThanOrEqual(dimensions[1])
            if (["/taverna", "/mensagens", "/campanhas"].includes(path)) {
                await page.screenshot({
                    path: test.info().outputPath(path.slice(1) + "-" + width + ".png"),
                    fullPage: true
                })
            }
        }
    }
    expect(errors).toEqual([])
})
