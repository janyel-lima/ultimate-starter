<script setup lang="ts">
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useAuthStore } from '@/stores/auth'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

const sidebarOpen = ref(false)
function initSidebarState() { sidebarOpen.value = window.innerWidth >= 1024 }
let resizeTimer: ReturnType<typeof setTimeout>
function handleResize() {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => { if (window.innerWidth < 1024) sidebarOpen.value = false }, 150)
}
onMounted(() => { initSidebarState(); window.addEventListener('resize', handleResize) })
onUnmounted(() => { window.removeEventListener('resize', handleResize); clearTimeout(resizeTimer) })

const presetColors = [
    { label: 'Indigo', value: '#6366f1' }, { label: 'Violet', value: '#8b5cf6' },
    { label: 'Rose', value: '#f43f5e' }, { label: 'Amber', value: '#f59e0b' },
    { label: 'Teal', value: '#14b8a6' }, { label: 'Sky', value: '#0ea5e9' },
]

async function handleLogout() {
    await authStore.logout()
    router.push({ name: 'login' })
}
</script>

<template>
    <div class="flex h-screen overflow-hidden bg-[rgb(var(--bg-base))] dark:bg-[rgb(var(--dark-bg-base))]">
        <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
        <div class="flex flex-col flex-1 overflow-hidden min-w-0 w-full">
            <AppHeader :breadcrumb="['Ultimate Starter']" :preset-colors="presetColors" :notification-count="0"
                @toggle-sidebar="sidebarOpen = !sidebarOpen" @logout="handleLogout" @search="() => { }" />
            <main class="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
                <RouterView v-slot="{ Component }">
                    <Transition name="fade-content" mode="out-in">
                        <component :is="Component" />
                    </Transition>
                </RouterView>
            </main>
            <AppFooter version="v1.0.0" status="operational" />
        </div>
    </div>
</template>

<style scoped>
.fade-content-enter-active,
.fade-content-leave-active {
    transition: opacity 0.15s ease;
}

.fade-content-enter-from,
.fade-content-leave-to {
    opacity: 0;
}
</style>
