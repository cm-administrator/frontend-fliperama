// src/api/services/useCustomerService.ts
// ADIÇÃO: findAll (GET /customers) e enableDisable (PATCH /customers/{id}/enable-disable/{active})

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { resolveErrorMessage } from "../utils/resolveErrorMessage";
import type { MutationOptions, QueryOptions } from "../types";
import { advertisementApi } from "../clients/advertisementApi";
import { queryClient } from "../../app/provider/TanStackQueryProvider";
import type {
  CustomerApiDTO,
  CustomerIndicatorsApiDTO,
  SocialLinkApiDTO,
} from "../../api/dtos/customer";
import type { ApiPaginatedResponse } from "../dtos/shared";

/**
 * Endpoints (CustomerController):
 * POST   /customers
 * GET    /customers/{id}
 * PUT    /customers/{id}
 * DELETE /customers/{id}
 * GET    /customers?search=&page=&size=&sort=
 * PATCH  /customers/{id}/enable-disable/{active}
 * POST   /customers/{customerId}/social-links
 * DELETE /customers/{customerId}/social-links/{linkId}
 * GET    /customers/{customerId}/indicators
 */

// ====== Types (requests) ======

export interface GetCustomersFilter {
  search?: string;
  page?: number;
  size?: number;
  sort?: Array<{ by: string; direction: "asc" | "desc" }>;
}

export interface CreateCustomerRequest {
  name: string;
  phone?: string;
}

export interface UpdateCustomerRequest extends CreateCustomerRequest {
  id: number;
}

export interface AddCustomerSocialLinkRequest {
  customerId: number;
  type?: string;
  url: string;
}

export interface RemoveCustomerSocialLinkRequest {
  customerId: number;
  linkId: number;
}

// ====== Create ======

const createCustomer = async (
  payload: CreateCustomerRequest,
): Promise<CustomerApiDTO> => {
  const { data } = await advertisementApi.post("/customers", payload);
  return data;
};

export const useCreateCustomer = (
  options?: MutationOptions<CustomerApiDTO, CreateCustomerRequest>,
) => {
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });

      if (options?.showToast !== false) {
        const message =
          typeof options?.successMessage === "function"
            ? options.successMessage(data, variables)
            : options?.successMessage || "Cliente criado com sucesso";
        toast.success(message);
      }

      options?.onSuccess?.(data, variables);
    },
    onError: (error) => {
      if (options?.showToast !== false) {
        toast.error(
          resolveErrorMessage({
            error,
            fallbackMessage: options?.errorMessage || "Erro ao criar cliente",
          }),
        );
      }
      options?.onError?.(error);
    },
  });
};

// ====== Find all (paged) ======

const buildSortParam = (
  sort?: Array<{ by: string; direction: "asc" | "desc" }>,
) => {
  if (!sort?.length) return undefined;
  // Spring Pageable: sort=field,asc&sort=field2,desc
  return sort.map((s) => `${s.by},${s.direction}`);
};

const getCustomers = async (
  filter?: GetCustomersFilter,
): Promise<ApiPaginatedResponse<CustomerApiDTO>> => {
  const params: Record<string, any> = {};

  if (filter?.search?.trim()) params.search = filter.search.trim();
  if (filter?.page != null) params.page = filter.page;
  if (filter?.size != null) params.size = filter.size;

  const sortParam = buildSortParam(filter?.sort);
  if (sortParam) params.sort = sortParam;

  const { data } = await advertisementApi.get("/customers", { params });
  return data;
};

export const useGetCustomers = (
  filter?: GetCustomersFilter,
  options?: QueryOptions<ApiPaginatedResponse<CustomerApiDTO>>,
) => {
  return useQuery({
    queryKey: ["customers", filter ?? {}],
    queryFn: () => getCustomers(filter),
    ...options,
  });
};

// ====== Get by id ======

const getCustomerById = async (id: number): Promise<CustomerApiDTO> => {
  const { data } = await advertisementApi.get(`/customers/${id}`);
  return data;
};

export const useGetCustomerById = (
  id?: number,
  options?: QueryOptions<CustomerApiDTO>,
) => {
  const enabled = !!id && (options?.enabled ?? true);
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => getCustomerById(id!),
    ...options,
    enabled,
  });
};

// ====== Update ======

const updateCustomer = async (
  payload: UpdateCustomerRequest,
): Promise<CustomerApiDTO> => {
  const { id, ...body } = payload;
  const { data } = await advertisementApi.put(`/customers/${id}`, body);
  return data;
};

export const useUpdateCustomer = (
  options?: MutationOptions<CustomerApiDTO, UpdateCustomerRequest>,
) => {
  return useMutation({
    mutationFn: updateCustomer,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", variables.id] });

      if (options?.showToast !== false) {
        const message =
          typeof options?.successMessage === "function"
            ? options.successMessage(data, variables)
            : options?.successMessage || "Cliente atualizado com sucesso";
        toast.success(message);
      }

      options?.onSuccess?.(data, variables);
    },
    onError: (error) => {
      if (options?.showToast !== false) {
        toast.error(
          resolveErrorMessage({
            error,
            fallbackMessage:
              options?.errorMessage || "Erro ao atualizar cliente",
          }),
        );
      }
      options?.onError?.(error);
    },
  });
};

// ====== Enable / Disable (PATCH) ======

export interface EnableDisableCustomerRequest {
  id: number;
  active: boolean;
}

const enableDisableCustomer = async (
  payload: EnableDisableCustomerRequest,
): Promise<void> => {
  await advertisementApi.patch(
    `/customers/${payload.id}/enable-disable/${payload.active}`,
  );
};

export const useEnableDisableCustomer = (
  options?: MutationOptions<void, EnableDisableCustomerRequest>,
) => {
  return useMutation({
    mutationFn: enableDisableCustomer,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", variables.id] });

      if (options?.showToast !== false) {
        const message =
          typeof options?.successMessage === "function"
            ? options.successMessage(data, variables)
            : options?.successMessage ||
              (variables.active
                ? "Cliente ativado com sucesso"
                : "Cliente desativado com sucesso");
        toast.success(message);
      }

      options?.onSuccess?.(data, variables);
    },
    onError: (error) => {
      if (options?.showToast !== false) {
        toast.error(
          resolveErrorMessage({
            error,
            fallbackMessage:
              options?.errorMessage || "Erro ao atualizar status do cliente",
          }),
        );
      }
      options?.onError?.(error);
    },
  });
};

// ====== Delete ======

export interface DeleteCustomerRequest {
  id: number;
}

const deleteCustomer = async (
  payload: DeleteCustomerRequest,
): Promise<void> => {
  await advertisementApi.delete(`/customers/${payload.id}`);
};

export const useDeleteCustomer = (
  options?: MutationOptions<void, DeleteCustomerRequest>,
) => {
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", variables.id] });

      if (options?.showToast !== false) {
        const message =
          typeof options?.successMessage === "function"
            ? options.successMessage(data, variables)
            : options?.successMessage || "Cliente removido com sucesso";
        toast.success(message);
      }

      options?.onSuccess?.(data, variables);
    },
    onError: (error) => {
      if (options?.showToast !== false) {
        toast.error(
          resolveErrorMessage({
            error,
            fallbackMessage: options?.errorMessage || "Erro ao remover cliente",
          }),
        );
      }
      options?.onError?.(error);
    },
  });
};

// ====== Social links ======

const addCustomerSocialLink = async (
  payload: AddCustomerSocialLinkRequest,
): Promise<SocialLinkApiDTO> => {
  const { customerId, ...body } = payload;
  const { data } = await advertisementApi.post(
    `/customers/${customerId}/social-links`,
    body,
  );
  return data;
};

export const useAddCustomerSocialLink = (
  options?: MutationOptions<SocialLinkApiDTO, AddCustomerSocialLinkRequest>,
) => {
  return useMutation({
    mutationFn: addCustomerSocialLink,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["customer", variables.customerId],
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });

      if (options?.showToast !== false) {
        const message =
          typeof options?.successMessage === "function"
            ? options.successMessage(data, variables)
            : options?.successMessage || "Rede social adicionada com sucesso";
        toast.success(message);
      }

      options?.onSuccess?.(data, variables);
    },
    onError: (error) => {
      if (options?.showToast !== false) {
        toast.error(
          resolveErrorMessage({
            error,
            fallbackMessage:
              options?.errorMessage || "Erro ao adicionar rede social",
          }),
        );
      }
      options?.onError?.(error);
    },
  });
};

const removeCustomerSocialLink = async (
  payload: RemoveCustomerSocialLinkRequest,
): Promise<void> => {
  await advertisementApi.delete(
    `/customers/${payload.customerId}/social-links/${payload.linkId}`,
  );
};

export const useRemoveCustomerSocialLink = (
  options?: MutationOptions<void, RemoveCustomerSocialLinkRequest>,
) => {
  return useMutation({
    mutationFn: removeCustomerSocialLink,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["customer", variables.customerId],
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });

      if (options?.showToast !== false) {
        const message =
          typeof options?.successMessage === "function"
            ? options.successMessage(data, variables)
            : options?.successMessage || "Rede social removida com sucesso";
        toast.success(message);
      }

      options?.onSuccess?.(data, variables);
    },
    onError: (error) => {
      if (options?.showToast !== false) {
        toast.error(
          resolveErrorMessage({
            error,
            fallbackMessage:
              options?.errorMessage || "Erro ao remover rede social",
          }),
        );
      }
      options?.onError?.(error);
    },
  });
};

// ====== Indicators ======

const getCustomerIndicators = async (
  customerId: number,
): Promise<CustomerIndicatorsApiDTO> => {
  const { data } = await advertisementApi.get(
    `/customers/${customerId}/indicators`,
  );
  return data;
};

export const useGetCustomerIndicators = (
  customerId?: number,
  options?: QueryOptions<CustomerIndicatorsApiDTO>,
) => {
  const enabled = !!customerId && (options?.enabled ?? true);
  return useQuery({
    queryKey: ["customerIndicators", customerId],
    queryFn: () => getCustomerIndicators(customerId!),
    ...options,
    enabled,
  });
};
