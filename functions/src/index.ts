// functions/src/index.ts
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'

initializeApp()

export const notifyOnCriticalError = onDocumentCreated('error_logs/{docId}', async (event) => {
  const data = event.data?.data()
  if (!data || data.severity !== 'critical') return

  const db = getFirestore()

  // Deduplicação: ignora fingerprints repetidos na última hora
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recent = await db
    .collection('error_notifications_sent')
    .where('fingerprint', '==', data.fingerprint)
    .where('sentAt', '>', oneHourAgo)
    .limit(1)
    .get()

  if (!recent.empty) return

  await db.collection('error_notifications_sent').add({
    fingerprint: data.fingerprint,
    sentAt: new Date(),
  })

  // Escreve na coleção "mail" — lida pela Extension "Trigger Email"
  await db.collection('mail').add({
    to: process.env.ALERT_EMAIL ?? 'voce@exemplo.com',
    message: {
      subject: `[CRÍTICO] ${String(data.message).slice(0, 80)}`,
      html: `
          <h2>Erro crítico detectado</h2>
          <p><b>Mensagem:</b> ${data.message}</p>
          <p><b>Rota:</b> ${data.route ?? '—'}</p>
          <p><b>Usuário:</b> ${data.userEmail ?? 'anônimo'}</p>
          <p><b>Browser:</b> ${(data.meta as Record<string, unknown>)?.userAgent ?? '—'}</p>
          <pre style="font-size:12px">${String(data.stack ?? '').slice(0, 1000)}</pre>
        `,
    },
  })
})
