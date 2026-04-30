// src/directives/clickOutside.ts
// Diretiva v-click-outside usada no DashboardView para fechar
// dropdowns ao clicar fora deles.
//
// Registrada globalmente em main.ts:
//   app.directive('click-outside', clickOutside)
//
// Uso no template:
//   <div v-click-outside="() => showMenu = false">...</div>

import type { DirectiveBinding, ObjectDirective } from 'vue'

type ClickOutsideHandler = (event: MouseEvent) => void

interface ClickOutsideHTMLElement extends HTMLElement {
  _clickOutsideHandler?: ClickOutsideHandler
}

export const clickOutside: ObjectDirective<ClickOutsideHTMLElement> = {
  mounted(el, binding: DirectiveBinding<ClickOutsideHandler>) {
    el._clickOutsideHandler = (event: MouseEvent) => {
      // Dispara o callback apenas quando o clique foi fora do elemento
      if (!el.contains(event.target as Node)) {
        binding.value(event)
      }
    }
    document.addEventListener('mousedown', el._clickOutsideHandler)
  },

  unmounted(el) {
    if (el._clickOutsideHandler) {
      document.removeEventListener('mousedown', el._clickOutsideHandler)
      delete el._clickOutsideHandler
    }
  },
}
