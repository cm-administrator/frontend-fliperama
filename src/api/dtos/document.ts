export interface DocumentApiDTO {
  id?: number;
  name: string;
  size: number;
  contentType: string;
  document: string; // binary data
}

export interface DocumentMetadataApiDTO {
  id: number;
  name: string;
  size: number;
  contentType: string;
}
export type DocumentApiCreateDTO = {
  imageUrl?: string;
  displaySeconds: number;
  orderIndex: number;
  image?: File; 
};