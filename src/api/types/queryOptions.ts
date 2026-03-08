import type { UseQueryOptions } from "@tanstack/react-query";

export type QueryOptions<TData = unknown> = Omit<
  UseQueryOptions<TData>,
  "queryKey"
>;
