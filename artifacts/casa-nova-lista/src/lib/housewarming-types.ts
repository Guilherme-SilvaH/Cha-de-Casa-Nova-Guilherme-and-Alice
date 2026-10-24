export type GiftStatus = "available" | "fulfilled";

export interface Gift {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  suggested_price: number | null;
  status: GiftStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GiftInput {
  name: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  suggested_price: number | null;
  sort_order: number;
}

export interface DeliveryAddress {
  postal_code: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  reference: string;
}

export interface SiteSettings {
  id: number;
  hosts: string;
  page_title: string;
  page_subtitle: string;
  intro_text: string;
  about_title: string;
  about_text: string;
  event_date: string | null;
  hero_image_url: string | null;
  about_image_url: string | null;
  delivery_address: DeliveryAddress;
  address_is_public: boolean;
  pix_key: string;
  pix_text: string;
  updated_at: string;
}

export interface PublicSiteSettings
  extends Omit<SiteSettings, "delivery_address" | "address_is_public"> {
  delivery_address: DeliveryAddress | null;
}

export interface AdminSession {
  id: string;
  email: string | null;
  isAdmin: boolean;
}
