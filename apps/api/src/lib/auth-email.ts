import { Resend } from 'resend'
import { env } from '../env.js'
import type { TokenPurpose } from './one-time-tokens.js'

/**
 * Ponto único de envio de e-mails de autenticação (ativação, reset, login-link).
 * Usa Resend (ADR-019). Se RESEND_API_KEY estiver ausente, o link é apenas
 * logado no console — útil em dev e como fallback gracioso.
 * Spec: docs/specs/auth-ativacao.md
 */

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

interface SendAuthEmailInput {
  to: string
  purpose: TokenPurpose
  link: string
  name?: string | null
  tenantName?: string | null
}

interface EmailContent {
  subject: string
  heading: string
  body: string
  cta: string
}

function buildContent(input: SendAuthEmailInput): EmailContent {
  const greeting = input.name ? `Olá, ${input.name}` : 'Olá'
  const rede = input.tenantName ? ` da rede ${input.tenantName}` : ''

  switch (input.purpose) {
    case 'activation':
      return {
        subject: 'Ative sua conta no PostoInsight',
        heading: 'Bem-vindo ao PostoInsight',
        body: `${greeting}, sua conta${rede} está pronta. Defina sua senha para acessar o painel. O link expira em 72 horas.`,
        cta: 'Definir senha e acessar',
      }
    case 'reset':
      return {
        subject: 'Redefinição de senha — PostoInsight',
        heading: 'Redefinir senha',
        body: `${greeting}, recebemos um pedido para redefinir sua senha. O link expira em 60 minutos. Se não foi você, ignore este e-mail.`,
        cta: 'Redefinir senha',
      }
    case 'login':
      return {
        subject: 'Seu link de acesso — PostoInsight',
        heading: 'Entrar no PostoInsight',
        body: `${greeting}, use o link abaixo para entrar sem senha. Ele expira em 15 minutos e só pode ser usado uma vez.`,
        cta: 'Entrar',
      }
  }
}

function renderHtml(c: EmailContent, link: string): string {
  return `<!doctype html>
<html lang="pt-BR"><body style="font-family:system-ui,sans-serif;color:#111;max-width:480px;margin:0 auto;padding:24px">
  <h2 style="color:#0073BB">${c.heading}</h2>
  <p style="font-size:15px;line-height:1.5">${c.body}</p>
  <p style="margin:28px 0">
    <a href="${link}" style="background:#0073BB;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;display:inline-block">${c.cta}</a>
  </p>
  <p style="font-size:12px;color:#666">Se o botão não funcionar, copie e cole este endereço no navegador:<br>${link}</p>
</body></html>`
}

/** Envia (ou loga em dev) um e-mail de autenticação. */
export async function sendAuthEmail(input: SendAuthEmailInput): Promise<void> {
  const content = buildContent(input)

  if (!resend) {
    // eslint-disable-next-line no-console
    console.log(`[auth-email:${input.purpose}] → ${input.to}\n  ${input.link}`)
    return
  }

  await resend.emails.send({
    from:    env.AUTH_EMAIL_FROM,
    to:      input.to,
    subject: content.subject,
    html:    renderHtml(content, input.link),
  })
}
