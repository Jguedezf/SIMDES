// Next.js muestra este fallback mientras se resuelve el nuevo árbol de
// Server Components tras cambiar el rango de fechas (router.push a
// ?rango=... o ?desde=...&hasta=...). Sin esto, la pantalla se queda con
// las etiquetas y datos del rango ANTERIOR visibles hasta que llega la
// respuesta — con el round-trip real de producción (más lento que en
// local) eso se veía como una mezcla incoherente entre lo que el usuario
// acababa de elegir y lo que todavía estaba en pantalla (parte del
// problema reportado el 13/09 sobre el selector de rango).
export default function CargandoReportes() {
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-8 w-56 bg-brand-surface rounded-lg mb-6" />
        <div className="tarjeta-vidrio p-5 mb-6 h-40" />
        <div className="tarjeta-vidrio p-5 mb-6 h-72" />
        <div className="tarjeta-vidrio p-5 mb-6 h-32" />
        <div className="tarjeta-vidrio p-5 h-48" />
      </div>
    </main>
  )
}
