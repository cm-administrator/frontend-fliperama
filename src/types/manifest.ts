export type ManifestAsset = {
  id?: number;
  path: string;
  orderIndex: number | null;
  durationSeconds: number;
};

export type ManifestItem = {
  advertisementId: number;
  name: string;
  type: "IMAGE" | "VIDEO";
  active: boolean;
  videoUrl?: string;
  videoDurationSeconds?: number;
  assets: ManifestAsset[];
};

export type ManifestFile = {
  date: string;
  items: ManifestItem[];
};

export type ManifestItemInput = {
  name: string;
  type: "IMAGE" | "VIDEO";
  active: boolean;
  videoUrl?: string;
  videoDurationSeconds?: number;
  images: Array<{
    id?: number;
    path: string;
    orderIndex: number;
    durationSeconds: number;
  }>;
};