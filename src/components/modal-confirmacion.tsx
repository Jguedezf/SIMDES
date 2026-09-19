'use client'

import { createPortal } from 'react-dom'

type Props = {
  abierto: boolean
  titulo: string
  descripcion: string
  textoConfirmar?: string
  peligroso?: boolean
  cargando?: boolean
  onConfirmar: () => void
  // Si se omite, el modal queda en modo informativo: un solo botón, sin
  // "Cancelar" — para confirmar algo que ya ocurrió (ej. "Punto reubicado"),
  // no para pedir permiso antes de una acción.
  onCancelar?: () => void
}

// Diálogo modal reutilizable para acciones que necesitan confirmación
// explícita (eliminar, cambiar contraseña, resolver alerta) — punto 8 del
// feedback de Johanna del 12/09: ninguna acción crítica se ejecutaba directo.
export default function ModalConfirmacion({
  abierto, titulo, descripcion, textoConfirmar = 'Confirmar', peligroso, cargando, onConfirmar, onCancelar,
}: Props) {
  if (!abierto || typeof document === 'undefined') return null

  // Se monta en <body> para escapar del contexto de apilamiento del contenedor
  // (p. ej. el mapa de Leaflet, cuyos paneles tienen z-index 400+ y taparían el modal).
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={cargando ? undefined : (onCancelar ?? onConfirmar)} />
      <div className="modal-entrada relative w-full max-w-sm tarjeta-vidrio p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-foreground mb-2">{titulo}</h2>
        <p className="text-sm text-brand-muted mb-6">{descripcion}</p>
        <div className="flex justify-end gap-2">
          {onCancelar && (
            <button
              type="button"
              onClick={onCancelar}
              disabled={cargando}
              className="boton-pill text-sm font-medium text-brand-muted hover:text-foreground px-5 py-2 transition disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={onConfirmar}
            disabled={cargando}
            className={`boton-pill text-sm font-semibold px-5 py-2 disabled:opacity-50 ${
              peligroso
                ? 'bg-brand-coral text-white hover:brightness-110'
                : 'bg-brand-emerald text-brand-bg hover:brightness-110'
            }`}
          >
            {cargando ? 'Procesando...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
