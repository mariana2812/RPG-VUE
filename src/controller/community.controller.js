import { apiRequest } from './service.controller.js'
import { abrirModal } from '../composables/useDialog.js'
export async function deleteByIdOrFilter(collection, id, filters = {}) {
  if (id != null && id !== '') {
    try {
      return await apiRequest(`/${collection}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
    } catch (error) {
      if (error.status !== 404) throw error
    }
  }

  const query = new URLSearchParams(filters).toString()
  const endpoint = query ? `/${collection}?${query}` : `/${collection}`
  const items = await apiRequest(endpoint)

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Registro não encontrado para remover.')
  }

  const item = items[0]
  if (item?.id == null) {
    throw new Error('Este registro não possui identificador para exclusão.')
  }

  return apiRequest(`/${collection}/${encodeURIComponent(item.id)}`, { method: 'DELETE' })
}

export function isAcceptedFriendRelation(relation) {
  return !relation.status || relation.status === 'accepted' || relation.status === 'friend'
}

export async function excluirCampanha(id) {
  const campanha = await apiRequest('/campaigns/' + encodeURIComponent(id))
  const idUsuario = localStorage.getItem('idUser')
  if (String(campanha.masterId ?? campanha.mestreId) !== String(idUsuario)) {
    throw new Error('Somente o mestre pode excluir esta campanha.')
  }

  for (const collection of ['campaignPosts', 'campaignMembers']) {
    const items = await apiRequest(`/${collection}?campaignId=${encodeURIComponent(id)}`)
    for (const item of items) {
      await apiRequest(`/${collection}/${encodeURIComponent(item.id)}`, { method: 'DELETE' })
    }
  }

  return apiRequest('/campaigns/' + encodeURIComponent(id), { method: 'DELETE' })
}

export function criarAvatar(nome) {
  return 'https://api.dicebear.com/9.x/bottts/svg?seed=' + encodeURIComponent(nome || 'RPG')
}

export async function lerImagem(arquivo) {
  if (!arquivo) return ''
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type) ||
    arquivo.size > 5 * 1024 * 1024
  ) {
    throw new Error('Escolha uma imagem JPG, PNG ou WebP de até 5 MB.')
  }
  const url = URL.createObjectURL(arquivo)
  try {
    const imagem = new Image()
    imagem.src = url
    await imagem.decode()
    const escala = Math.min(1, 1200 / Math.max(imagem.width, imagem.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(imagem.width * escala))
    canvas.height = Math.max(1, Math.round(imagem.height * escala))
    canvas.getContext('2d').drawImage(imagem, 0, 0, canvas.width, canvas.height)
    const dados = canvas.toDataURL('image/webp', 0.75)
    if (dados.length > 650000)
      throw new Error('Esta imagem tem muitos detalhes. Escolha uma versão menor.')
    return dados
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function excluirPublicacao(id) {
  const post = await apiRequest('/blog/' + encodeURIComponent(id))
  if (String(post.userId ?? post.user?.id) !== localStorage.getItem('idUser'))
    throw new Error('Somente o autor pode excluir esta publicação.')
  for (const colecao of ['likes', 'comments']) {
    const itens = await apiRequest('/' + colecao + '?postId=' + encodeURIComponent(id))
    for (const item of itens)
      await apiRequest('/' + colecao + '/' + encodeURIComponent(item.id), {
        method: 'DELETE',
      })
  }
  await deleteByIdOrFilter('blog', id, { id })
}

export async function editarPublicacao(id) {
  const post = await apiRequest('/blog/' + encodeURIComponent(id))
  if (String(post.userId ?? post.user?.id) !== localStorage.getItem('idUser'))
    throw new Error('Somente o autor pode editar esta publicação.')
  const conteudo = await abrirModal({
    titulo: 'Editar publicação',
    mensagem: 'Atualize sua história.',
    campo: true,
    multilinha: true,
    rotulo: 'Publicação',
    valor: post.conteudo || post.body || '',
    confirmar: 'Salvar alterações',
  })
  if (conteudo === null) return
  if (!conteudo) throw new Error('Escreva o texto da publicação.')
  await apiRequest('/blog/' + encodeURIComponent(id), {
    method: 'PATCH',
    body: JSON.stringify({ conteudo, updated_at: new Date().toISOString() }),
  })
}

export const privado = (usuario) => usuario?.privado === true || usuario?.privado === 'true'
export const nomeUsuario = (usuario) =>
  usuario?.nome || usuario?.username || usuario?.email || 'Usuário'
export const avatarUsuario = (usuario, estilo = 'bottts') =>
  usuario?.avatar ||
  'https://api.dicebear.com/9.x/' + estilo + '/svg?seed=' + encodeURIComponent(nomeUsuario(usuario))
export const relacaoEntre = (relacao, a, b) =>
  (String(relacao.userId) === String(a) && String(relacao.friendId) === String(b)) ||
  (String(relacao.userId) === String(b) && String(relacao.friendId) === String(a))
export const amigosDe = (relacoes, id) =>
  new Set(
    relacoes
      .filter(
        (item) =>
          isAcceptedFriendRelation(item) &&
          (String(item.userId) === String(id) || String(item.friendId) === String(id)),
      )
      .map((item) => String(String(item.userId) === String(id) ? item.friendId : item.userId)),
  )
export const aberta = (campanha) => ['aberta', 'open'].includes(campanha?.status)
export const mestreId = (campanha) => campanha?.masterId ?? campanha?.mestreId
