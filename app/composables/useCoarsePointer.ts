import type { Ref } from "vue";

/** `true` en dispositivos de puntero grueso (teléfonos, tablets). Arranca en
 *  `false` (SSR-safe) y se re-evalúa en `onMounted` con `matchMedia`, además de
 *  reaccionar a cambios (p. ej. conectar/desconectar un ratón en un híbrido). */
export function useCoarsePointer(): Ref<boolean> {
  const coarse = ref(false);
  let mql: MediaQueryList | null = null;

  const onChange = (e: MediaQueryListEvent): void => {
    coarse.value = e.matches;
  };

  onMounted(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    mql = window.matchMedia("(pointer: coarse)");
    coarse.value = mql.matches;
    mql.addEventListener("change", onChange);
  });

  onUnmounted(() => {
    mql?.removeEventListener("change", onChange);
    mql = null;
  });

  return coarse;
}
