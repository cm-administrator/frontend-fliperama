import { useEffect, useState } from "react";

/**
 * Retorna um valor que é atualizado apenas após um intervalo desde a última alteração.
 * @param value O valor base a ser atualizado com atraso.
 * @param delay O atraso em milissegundos antes de atualizar o valor. Padrão é 500ms.
 */
export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay ?? 500);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}
