import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes CSS condicionalmente e resolve conflitos do Tailwind.
 * Utiliza `clsx` para lógica condicional e `twMerge` para mesclagem.
 * @param classes Valores de classe.
 * @returns String de classes combinadas.
 */
export function mergeClasses(...classes: ClassValue[]): string {
  const combined = clsx(...classes);
  return twMerge(combined);
}
