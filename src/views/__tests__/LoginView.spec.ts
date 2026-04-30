// src/views/__tests__/LoginView.spec.ts
// FIX: importava '../mocks/firebase' e '../utils' com caminhos errados.
// Os arquivos reais estão em src/test/ — corrigido para '@/test/...'.

import { useAuthStore } from '@/stores/auth'
import '@/test/mocks/firebase'
import { renderWithPlugins } from '@/test/utils'
import LoginView from '@/views/LoginView.vue'
import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('LoginView', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Renderização inicial ---
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

  // --- Submissão do formulário ---
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

    it('botão de submit fica desabilitado durante o loading', async () => {
      await renderWithPlugins(LoginView)

      const authStore = useAuthStore()
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
      authStore.$patch({ error: 'Senha incorreta.' })

      await user.type(screen.getByLabelText('E-mail'), 'user@test.com')
      await user.type(screen.getByLabelText('Senha'), 'wrong')
      await user.click(screen.getByRole('button', { name: /entrar/i }))

      await waitFor(() => {
        expect(screen.getByText('Senha incorreta.')).toBeInTheDocument()
      })
    })
  })

  // --- Cadastro ---
  describe('modo de cadastro', () => {
    it('muda para modo "Criar conta" ao clicar no toggle', async () => {
      await renderWithPlugins(LoginView)

      await user.click(screen.getByTestId('toggle-auth-mode'))

      // O submit agora diz "Criar conta"
      expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument()
    })

    it('chama store.register (não registerWithEmail direto) ao criar conta', async () => {
      await renderWithPlugins(LoginView)

      const authStore = useAuthStore()
      const registerSpy = vi.spyOn(authStore, 'register').mockResolvedValue()

      await user.click(screen.getByTestId('toggle-auth-mode'))
      await user.type(screen.getByLabelText('E-mail'), 'new@test.com')
      await user.type(screen.getByLabelText('Senha'), 'StrongPass1!')
      await user.click(screen.getByRole('button', { name: /criar conta/i }))

      expect(registerSpy).toHaveBeenCalledWith('new@test.com', 'StrongPass1!')
    })

    it('exibe erro de email em uso ao cadastrar', async () => {
      await renderWithPlugins(LoginView)

      const authStore = useAuthStore()
      vi.spyOn(authStore, 'register').mockRejectedValue(new Error('auth/email-already-in-use'))
      authStore.$patch({ error: 'Este e-mail já está em uso.' })

      await user.click(screen.getByTestId('toggle-auth-mode'))
      await user.type(screen.getByLabelText('E-mail'), 'existing@test.com')
      await user.type(screen.getByLabelText('Senha'), 'pass123')
      await user.click(screen.getByRole('button', { name: /criar conta/i }))

      await waitFor(() => {
        expect(screen.getByText('Este e-mail já está em uso.')).toBeInTheDocument()
      })
    })

    it('limpa o error ao alternar o modo', async () => {
      await renderWithPlugins(LoginView)

      const authStore = useAuthStore()
      authStore.$patch({ error: 'Erro anterior' })

      await user.click(screen.getByTestId('toggle-auth-mode'))

      expect(authStore.error).toBeNull()
    })
  })

  // --- Visibilidade da senha ---
  describe('toggle de visibilidade da senha', () => {
    it('revela a senha ao clicar no ícone', async () => {
      await renderWithPlugins(LoginView)

      const passwordInput = screen.getByLabelText('Senha')
      expect(passwordInput).toHaveAttribute('type', 'password')

      const toggleBtn = screen.getByLabelText('Mostrar senha')
      await user.click(toggleBtn)

      expect(passwordInput).toHaveAttribute('type', 'text')
    })

    it('volta a ocultar ao clicar novamente', async () => {
      await renderWithPlugins(LoginView)

      const toggleBtn = screen.getByLabelText('Mostrar senha')
      await user.click(toggleBtn) // mostra
      await user.click(screen.getByLabelText('Ocultar senha')) // oculta

      expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')
    })
  })

  // --- Dark mode ---
  describe('botão de tema', () => {
    it('renderiza o botão de toggle de tema com aria-label correto', async () => {
      await renderWithPlugins(LoginView)
      expect(screen.getByLabelText(/ativar modo/i)).toBeInTheDocument()
    })
  })
})
