// Dirección del webhook de n8n que recibe las lecturas de los contenedores.
// Se puede cambiar sin tocar el código definiendo NEXT_PUBLIC_N8N_WEBHOOK_URL
// (por ejemplo en Vercel); si no existe, se usa la cuenta actual de n8n.
export const N8N_WEBHOOK_LECTURA =
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ?? 'https://simdes-demo.app.n8n.cloud/webhook/lectura-contenedor'
