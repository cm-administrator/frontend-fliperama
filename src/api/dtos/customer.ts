// src/types/customer.ts
// Ajuste os campos conforme seu response real (principalmente SocialLink e Indicators)

export interface SocialLinkApiDTO {
  id: number;
  type?: string;
  url: string;
}

export interface CustomerApiDTO {
  id: number;
  name: string;
  phone?: string;
  socialLinks?: SocialLinkApiDTO[] | null;
}

export interface CustomerIndicatorsApiDTO {
  // não foi enviado o DTO; deixe compatível com o backend real
  totalActiveAdsSeconds?: number;
  totalActiveAdsCount?: number;
}