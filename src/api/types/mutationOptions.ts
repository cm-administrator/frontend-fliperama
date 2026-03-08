/**
 * Opções para customizar mensagens, toasts e callbacks de uma mutation.
 */
export interface MutationOptions<TData = unknown, TVariables = unknown> {
  /**
   * Mensagem de sucesso customizada.
   */
  successMessage?: string | ((data: TData, variables: TVariables) => string);

  /**
   * Mensagem de erro customizada.
   */
  errorMessage?: string;

  /**
   * Define se deve exibir toast (padrão: true).
   */
  showToast?: boolean;

  /**
   * Callback executado em caso de sucesso.
   */
  onSuccess?: (data: TData, variables: TVariables) => void;

  /**
   * Callback executado em caso de erro.
   */
  onError?: (error: Error) => void;
}
