import { serviceController as api, record } from './service.controller.js'
import { session } from './user.controller.js'
import { relacaoEntre } from './community.controller.js'
export async function criarAmizadeMutua(outroId, relacoes) {
  const userId = session.userId
  let seguindo = relacoes.find(
    (item) => String(item.userId) === userId && String(item.friendId) === String(outroId),
  )
  if (!seguindo)
    seguindo = await api.post('/friends', { userId, friendId: outroId, status: 'following' })
  const par = [...relacoes.filter((item) => relacaoEntre(item, userId, outroId)), seguindo]
  const unicas = new Map(
    par.filter((item) => item.id != null).map((item) => [String(item.id), item]),
  )
  for (const item of unicas.values())
    if (item.status !== 'friend') await api.patch(record('friends', item.id), { status: 'friend' })
}
