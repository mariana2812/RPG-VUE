<script setup lang="ts">
// Relaciono os nomes usados no projeto aos ícones da biblioteca.
import {
    Hash,
    Compass,
    Swords,
    MessageCircle,
    Castle,
    UserRound,
    Settings,
    MessagesSquare,
    ChevronRight,
    Plus,
    ArrowLeft,
    Menu,
    Bell,
    Dices,
    RefreshCw,
    UserPlus,
    Search,
    Image,
    Users,
    ArrowRight,
    ArrowUpRight,
    UsersRound
} from "lucide-vue-next"
interface IconeProps {
    name: string
}
defineProps<IconeProps>()
const icons = {
    hash: Hash,
    compass: Compass,
    swords: Swords,
    "message-circle": MessageCircle,
    castle: Castle,
    "user-round": UserRound,
    settings: Settings,
    "messages-square": MessagesSquare,
    "chevron-right": ChevronRight,
    plus: Plus,
    "arrow-left": ArrowLeft,
    menu: Menu,
    bell: Bell,
    dices: Dices,
    "refresh-cw": RefreshCw,
    "user-plus": UserPlus,
    search: Search,
    image: Image,
    users: Users,
    "arrow-right": ArrowRight,
    "arrow-up-right": ArrowUpRight,
    "users-round": UsersRound
}
</script>
<template><component :is="icons[name]" :data-lucide="name" aria-hidden="true" /></template>
