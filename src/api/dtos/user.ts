import type { DocumentMetadataApiDTO } from "./document";
import type { JobPositionApiDTO } from "./jobPosition";
import type { RoleApiDTO } from "./role";

export interface UserProfileApiDTO {
  id: number;
  name: string;
  email: string;
  active: boolean;
  roles: RoleApiDTO[];
  imageId?: number;
}

export interface UserApiDTO {
  id: number;
  name: string;
  cpf: string;
  email?: string;
  cellphoneCorporate?: string;
  active: boolean;
  login: string;
  jobPosition?: JobPositionApiDTO;
  roles?: RoleApiDTO[];
  perfis?: RoleApiDTO[]; // API tem que ajustar o nome pra "roles"
  image?: DocumentMetadataApiDTO;
}
