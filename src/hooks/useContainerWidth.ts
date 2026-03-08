import { useLayoutEffect, useRef, useState } from "react";

/**
 * Retorna uma ref e a largura do elemento referenciado.
 * A ref deve ser atribuída a um elemento HTML para que a largura possa ser medida.
 */
export function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      setWidth(ref.current.offsetWidth);
    }
  }, []);

  return { ref, width };
}
