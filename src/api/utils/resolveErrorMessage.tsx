import { AxiosError } from "axios";

interface ResolveErrorMessageParams {
  error: unknown;
  fallbackMessage?: string;
}

/**
 * Função genérica que tenta extrair uma mensagem de erro a partir de um erro desconhecido.
 * @param ResolveErrorMessageParams Objeto contendo o erro e uma mensagem de fallback opcional.
 * @returns A mensagem de erro extraída ou a mensagem de fallback.
 */
export const resolveErrorMessage = ({ error, fallbackMessage }: ResolveErrorMessageParams) => {
  let message: string | string[] | undefined;

  if (error instanceof AxiosError) {
    message = error.response?.data?.message;
  }

  if (error instanceof Error) {
    message = error.message;
  }

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return message || fallbackMessage || "Ocorreu um erro inesperado";
};
