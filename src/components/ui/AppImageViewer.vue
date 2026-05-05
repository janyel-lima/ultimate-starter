<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

type ImageSrc = string | File | Blob | null | undefined

interface Props {
    src: ImageSrc
    alt?: string
    open: boolean
}

const props = withDefaults(defineProps<Props>(), { alt: 'Screenshot' })
const emit = defineEmits<{ close: [] }>()

// ─── Estado interno ────────────────────────────────────────────────────────
const resolvedUrl = ref<string>('')
const ownedUrl = ref<string | null>(null)   // blob URLs que criamos e devemos revogar
const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')

const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const lastTranslate = ref({ x: 0, y: 0 })

// Touch (pinch-to-zoom)
const lastPinchDist = ref<number | null>(null)

// ─── Resolução de src ──────────────────────────────────────────────────────
function dataURLtoBlob(dataURL: string): Blob {
    const [header, b64] = dataURL.split(',')
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
    const binary = atob(b64)
    const buf = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i)
    return new Blob([buf], { type: mime })
}

function revokeOwned() {
    if (ownedUrl.value) {
        URL.revokeObjectURL(ownedUrl.value)
        ownedUrl.value = null
    }
}

function resolveSrc(src: ImageSrc) {
    revokeOwned()
    resolvedUrl.value = ''
    status.value = 'loading'

    if (!src) { status.value = 'error'; return }

    if (src instanceof Blob || src instanceof File) {
        // Blob/File → object URL
        const url = URL.createObjectURL(src)
        ownedUrl.value = url
        resolvedUrl.value = url
        status.value = 'ready'
        return
    }

    if (typeof src === 'string') {
        if (src.startsWith('data:')) {
            // base64 → blob URL (mais eficiente em memória que manter a string gigante)
            try {
                const blob = dataURLtoBlob(src)
                const url = URL.createObjectURL(blob)
                ownedUrl.value = url
                resolvedUrl.value = url
                status.value = 'ready'
            } catch {
                status.value = 'error'
            }
            return
        }

        if (src.startsWith('blob:') || src.startsWith('http') || src.startsWith('/') || src.startsWith('./')) {
            // URL normal ou blob URL externo — usar direto
            resolvedUrl.value = src
            status.value = 'ready'
            return
        }

        // Fallback: tenta usar como está
        resolvedUrl.value = src
        status.value = 'ready'
    }
}

// ─── Controles de zoom/pan ─────────────────────────────────────────────────
function close() { emit('close') }

const zoomStep = 0.5
function zoomIn() { scale.value = Math.min(scale.value + zoomStep, 5) }
function zoomOut() { scale.value = Math.max(scale.value - zoomStep, 0.5); if (scale.value <= 1) resetPan() }
function resetZoom() { scale.value = 1; resetPan() }
function resetPan() { translateX.value = 0; translateY.value = 0 }

// ─── Mouse ─────────────────────────────────────────────────────────────────
function handleWheel(e: WheelEvent) {
    e.preventDefault()
    const delta = e.ctrlKey ? e.deltaY * 0.01 : e.deltaY > 0 ? zoomStep : -zoomStep
    scale.value = Math.min(Math.max(scale.value - delta, 0.5), 5)
    if (scale.value <= 1) resetPan()
}

function handleMouseDown(e: MouseEvent) {
    if (scale.value <= 1) return
    isDragging.value = true
    dragStart.value = { x: e.clientX, y: e.clientY }
    lastTranslate.value = { x: translateX.value, y: translateY.value }
}
function handleMouseMove(e: MouseEvent) {
    if (!isDragging.value) return
    translateX.value = lastTranslate.value.x + (e.clientX - dragStart.value.x)
    translateY.value = lastTranslate.value.y + (e.clientY - dragStart.value.y)
}
function handleMouseUp() { isDragging.value = false }

// ─── Touch ─────────────────────────────────────────────────────────────────
function pinchDist(t: TouchList) {
    const [a, b] = [t[0], t[1]]
    return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)
}

function handleTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
        lastPinchDist.value = pinchDist(e.touches)
    } else if (e.touches.length === 1 && scale.value > 1) {
        isDragging.value = true
        dragStart.value = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        lastTranslate.value = { x: translateX.value, y: translateY.value }
    }
}
function handleTouchMove(e: TouchEvent) {
    e.preventDefault()
    if (e.touches.length === 2 && lastPinchDist.value !== null) {
        const dist = pinchDist(e.touches)
        const ratio = dist / lastPinchDist.value
        scale.value = Math.min(Math.max(scale.value * ratio, 0.5), 5)
        lastPinchDist.value = dist
        if (scale.value <= 1) resetPan()
    } else if (e.touches.length === 1 && isDragging.value) {
        translateX.value = lastTranslate.value.x + (e.touches[0].clientX - dragStart.value.x)
        translateY.value = lastTranslate.value.y + (e.touches[0].clientY - dragStart.value.y)
    }
}
function handleTouchEnd(e: TouchEvent) {
    if (e.touches.length < 2) lastPinchDist.value = null
    if (e.touches.length === 0) isDragging.value = false
}

// ─── Teclado ───────────────────────────────────────────────────────────────
function handleKeydown(e: KeyboardEvent) {
    if (!props.open) return
    const map: Record<string, () => void> = {
        Escape: close, '+': zoomIn, '=': zoomIn,
        '-': zoomOut, '_': zoomOut, '0': resetZoom,
    }
    map[e.key]?.()
}

// ─── Download ──────────────────────────────────────────────────────────────
function downloadImage() {
    const a = document.createElement('a')
    a.href = resolvedUrl.value
    a.download = props.alt ?? 'screenshot'
    a.target = '_blank'
    a.click()
}

// ─── Watchers / lifecycle ──────────────────────────────────────────────────
watch(() => props.src, (src) => { if (props.open || src) resolveSrc(src) }, { immediate: true })

watch(() => props.open, (open) => {
    if (!open) resetZoom()
    document.body.style.overflow = open ? 'hidden' : ''
})

const imgStyle = computed(() => ({
    transform: `scale(${scale.value}) translate(${translateX.value / scale.value}px, ${translateY.value / scale.value}px)`,
    cursor: scale.value > 1 ? (isDragging.value ? 'grabbing' : 'grab') : 'zoom-in',
    transition: isDragging.value ? 'none' : 'transform 0.2s cubic-bezier(0.16,1,0.3,1)',
}))

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
    revokeOwned()
})
</script>

<template>
    <Teleport to="body">
        <Transition name="viewer">
            <div v-if="open" class="fixed inset-0 z-[200] flex items-center justify-center select-none"
                @mouseup="handleMouseUp" @mousemove="handleMouseMove">

                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/85 backdrop-blur-md" @click="close" />

                <!-- Controles -->
                <div class="absolute top-4 right-4 z-10 flex items-center gap-1.5">
                    <button @click="zoomOut" :disabled="scale <= 0.5" class="btn-ctrl">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" />
                        </svg>
                    </button>
                    <button @click="resetZoom" class="btn-ctrl px-3 min-w-[56px] font-mono text-xs">
                        {{ Math.round(scale * 100) }}%
                    </button>
                    <button @click="zoomIn" :disabled="scale >= 5" class="btn-ctrl">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                    <div class="w-px h-5 bg-white/20 mx-0.5" />
                    <button @click="downloadImage" :disabled="status !== 'ready'" class="btn-ctrl" title="Baixar">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>
                    <button @click="close" class="btn-ctrl hover:!bg-red-500/60" title="Fechar (ESC)">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <!-- Hint -->
                <p
                    class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white/30 text-[11px] pointer-events-none">
                    Scroll · Pinch · Arrastar · ESC
                </p>

                <!-- Imagem / estados -->
                <div class="relative z-10 flex items-center justify-center max-w-[90vw] max-h-[85vh]"
                    @wheel.prevent="handleWheel" @touchstart.prevent="handleTouchStart"
                    @touchmove.prevent="handleTouchMove" @touchend="handleTouchEnd">

                    <!-- Loading -->
                    <div v-if="status === 'loading'" class="text-white/50 text-sm animate-pulse">
                        Carregando…
                    </div>

                    <!-- Erro -->
                    <div v-else-if="status === 'error'" class="flex flex-col items-center gap-2 text-white/50 text-sm">
                        <svg class="w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Não foi possível carregar a imagem
                    </div>

                    <!-- Imagem -->
                    <img v-else-if="status === 'ready'" :src="resolvedUrl" :alt="alt" :style="imgStyle"
                        class="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
                        @mousedown="handleMouseDown" @dblclick="scale === 1 ? zoomIn() : resetZoom()"
                        @error="status = 'error'" draggable="false" />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.btn-ctrl {
    @apply w-9 h-9 rounded-xl flex items-center justify-center transition-all text-white/70 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed;
}

.viewer-enter-active {
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.viewer-leave-active {
    transition: all 0.18s ease-in;
}

.viewer-enter-from,
.viewer-leave-to {
    opacity: 0;
}
</style>
