import { useMutation } from "@tanstack/react-query";
import { advertisementApi } from "../clients/advertisementApi";
import type { UserProfileApiDTO } from "../dtos/user";

export interface LoginRequest {
  login: string;
  password: string;
}
export const login = async (
  payload: LoginRequest,
): Promise<UserProfileApiDTO> => {
  const { data } = await advertisementApi.post("/auth/login", payload);
  return data;
};
export const useLogin = () => useMutation({ mutationFn: login });

export const logout = async (): Promise<void> =>
  await advertisementApi.post("/auth/logout");
export const useLogout = () => useMutation({ mutationFn: logout });

export const getUserProfile = async (): Promise<UserProfileApiDTO> => {
  const { data } = await advertisementApi.get("/user/me");
  return data;
};
export const useGetUserProfile = () =>
  useMutation({ mutationFn: getUserProfile });
