// src/views/__tests__/LoginView.spec.ts
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '../mocks/firebase'
import { renderWithPlugins } from '../utils'

describe('LoginView', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Renderização ---
  describe('renderização inicial', () => {
    it('exibe o título e os campos do formulário', async () => {
      await renderWithPlugins(LoginView)

      expect(screen.getByText('Ultimate Starter')).toBeInTheDocument()
      expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
      expect(screen.getByLabelText('Senha')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
    })

    it('exibe o botão de login com Google', async () => {
      await renderWithPlugins(LoginView)
      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument()
    })

    it('não exibe mensagem de erro inicialmente', async () => {
      await renderWithPlugins(LoginView)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  // --- Formulário de login ---
  describe('submissão do formulário', () => {
    it('chama store.loginEmail com email e senha corretos', async () => {
      await renderWithPlugins(LoginView)

      const authStore = useAuthStore()
      const loginSpy = vi.spyOn(authStore, 'loginEmail').mockResolvedValue()

      await user.type(screen.getByLabelText('E-mail'), 'user@test.com')
      await user.type(screen.getByLabelText('Senha'), 'mypassword')
      await user.click(screen.getByRole('button', { name: /entrar/i }))

      expect(loginSpy).toHaveBeenCalledWith('user@test.com', 'mypassword')
    })

    it('exibe o spinner de loading durante a requisição', async () => {
      await renderWithPlugins(LoginView)

      const authStore = useAuthStore()
      // Mantém a promise pendente para capturar o loading state
      vi.spyOn(authStore, 'loginEmail').mockImplementation(() => new Promise(() => {}))

      await user.type(screen.getByLabelText('E-mail'), 'user@test.com')
      await user.type(screen.getByLabelText('Senha'), 'pass')
      await user.click(screen.getByRole('button', { name: /entrar/i }))

      expect(screen.getByRole('button', { name: /entrar/i })).toBeDisabled()
    })

    it('exibe a mensagem de erro do store quando o login falha', async () => {
      await renderWithPlugins(LoginView)

      const authStore = useAuthStore()
      vi.spyOn(authStore, 'loginEmail').mockRejectedValue(new Error('auth/wrong-password'))
      // Simula o store setando o error (normalmente feito dentro do action)
      authStore.$patch({ error: 'Senha incorreta.' })

      await user.type(screen.getByLabelText('E-mail'), 'user@test.com')
      await user.type(screen.getByLabelText('Senha'), 'wrong')
      await user.click(screen.getByRole('button', { name: /entrar/i }))

      await waitFor(() => {
        expect(screen.getByText('Senha incorreta.')).toBeInTheDocument()
      })
    })
  })

  // --- Toggle de modo (Login / Cadastro) ---
  describe('alternância de modo', () => {
    it('muda para modo "Criar conta" ao clicar no link', async () => {
      await renderWithPlugins(LoginView)

      const toggleButton = screen.getByRole('button', { name: /criar conta/i })
      await user.click(toggleButton)

      expect(
        screen.getByRole('button', { name: /criar conta/i, hidden: false })
      ).toBeInTheDocument()
      // O botão de submit deve mudar de texto
      expect(
        screen.getAllByRole('button').some((btn) => btn.textContent?.includes('Criar conta'))
      ).toBe(true)
    })

    it('limpa o error ao alternar o modo', async () => {
      await renderWithPlugins(LoginView)

      const authStore = useAuthStore()
      authStore.$patch({ error: 'Erro anterior' })

      const toggleButton = screen.getByRole('button', { name: /criar conta/i })
      await user.click(toggleButton)

      // clearError() deve ter sido chamado
      expect(authStore.error).toBeNull()
    })
  })

  // --- Visibilidade da senha ---
  describe('toggle de visibilidade da senha', () => {
    it('revela a senha ao clicar no ícone', async () => {
      await renderWithPlugins(LoginView)

      const passwordInput = screen.getByLabelText('Senha')
      expect(passwordInput).toHaveAttribute('type', 'password')

      // O botão de toggle não tem label visível, selecionamos pelo papel
      const toggleBtn = screen.getByRole('button', {
        name: (name) => name === '' || name.length === 0,
      })
      await user.click(toggleBtn)

      expect(passwordInput).toHaveAttribute('type', 'text')
    })
  })

  // --- Dark mode ---
  describe('botão de tema', () => {
    it('renderiza o botão de toggle de tema', async () => {
      await renderWithPlugins(LoginView)
      // Botão tem aria-label dinâmico
      const themeBtn = screen.getByRole('button', { name: /modo/i })
      expect(themeBtn).toBeInTheDocument()
    })
  })
})
