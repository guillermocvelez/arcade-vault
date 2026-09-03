// Detecta si el dispositivo tiene un puntero "grueso" (dedo / touch) vía
// `matchMedia("(pointer: coarse)")`. Arranca en `false` para ser SSR-safe y se
// resuelve en `onMounted`, suscribiéndose a los cambios (p. ej. emulador de
// DevTools que se activa/desactiva). Sin toggle manual — ver spec 10.
export function useCoarsePointer() {
  const coarse = ref(false);

  onMounted(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(pointer: coarse)");
    coarse.value = mql.matches;

    const onChange = (e: MediaQueryListEvent) => {
      coarse.value = e.matches;
    };
    mql.addEventListener("change", onChange);
    onUnmounted(() => mql.removeEventListener("change", onChange));
  });

  return coarse;
}
