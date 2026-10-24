import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { getSupabase } from "./supabase";
import type {
  AdminSession,
  DeliveryAddress,
  Gift,
  GiftInput,
  GiftStatus,
  PublicSiteSettings,
  SiteSettings,
} from "./housewarming-types";

const queryKeys = {
  publicSettings: ["housewarming", "public-settings"] as const,
  publicGifts: ["housewarming", "public-gifts"] as const,
  adminSettings: ["housewarming", "admin-settings"] as const,
  adminGifts: ["housewarming", "admin-gifts"] as const,
  adminSession: ["housewarming", "admin-session"] as const,
};

function throwIfError(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchPublicSettings(): Promise<PublicSiteSettings | null> {
  const { data, error } = await getSupabase().rpc("get_public_site_settings");
  throwIfError(error);
  return (data as PublicSiteSettings | null) ?? null;
}

export async function fetchPublicGifts(): Promise<Gift[]> {
  const { data, error } = await getSupabase()
    .from("gifts")
    .select("*")
    .eq("status", "available")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  throwIfError(error);
  return (data ?? []) as Gift[];
}

export async function fetchAdminGifts(): Promise<Gift[]> {
  const { data, error } = await getSupabase()
    .from("gifts")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  throwIfError(error);
  return (data ?? []) as Gift[];
}

export async function fetchAdminSettings(): Promise<SiteSettings> {
  const { data, error } = await getSupabase()
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();
  throwIfError(error);
  return data as SiteSettings;
}

export async function signInAdmin(email: string, password: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  throwIfError(error);
}

export async function signOutAdmin(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  throwIfError(error);
}

export async function fetchAdminSession(): Promise<AdminSession | null> {
  const client = getSupabase();
  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession();
  throwIfError(sessionError);
  const user = session?.user ?? null;
  if (!user) return null;

  const { data: admin, error } = await client
    .from("admin_users")
    .select("email")
    .eq("email", user.email?.trim().toLowerCase() ?? "")
    .maybeSingle();
  throwIfError(error);

  return {
    id: user.id,
    email: user.email ?? null,
    isAdmin: Boolean(admin),
  };
}

export async function saveGift(input: GiftInput, id?: string): Promise<Gift> {
  const client = getSupabase();
  if (id) {
    const { data, error } = await client
      .from("gifts")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    throwIfError(error);
    return data as Gift;
  }
  const { data, error } = await client
    .from("gifts")
    .insert(input)
    .select("*")
    .single();
  throwIfError(error);
  return data as Gift;
}

export async function deleteGift(id: string): Promise<void> {
  const { error } = await getSupabase().from("gifts").delete().eq("id", id);
  throwIfError(error);
}

export async function setGiftStatus(
  id: string,
  status: GiftStatus,
): Promise<Gift> {
  const { data, error } = await getSupabase()
    .from("gifts")
    .update({ status, purchased_by_guest: false })
    .eq("id", id)
    .select("*")
    .single();
  throwIfError(error);
  return data as Gift;
}

export async function markGiftPurchased(id: string): Promise<boolean> {
  const { data, error } = await getSupabase().rpc("mark_gift_purchased", {
    p_gift_id: id,
  });
  throwIfError(error);
  return data === true;
}

export async function saveSiteSettings(
  input: Partial<Omit<SiteSettings, "id" | "updated_at">> & {
    delivery_address?: DeliveryAddress;
  },
): Promise<SiteSettings> {
  const { data, error } = await getSupabase()
    .from("site_settings")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("*")
    .single();
  throwIfError(error);
  return data as SiteSettings;
}

export async function uploadGiftPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Escolha um arquivo de imagem.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }
  const client = getSupabase();
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage
    .from("gift-photos")
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
  throwIfError(error);
  return client.storage.from("gift-photos").getPublicUrl(path).data.publicUrl;
}

export function usePublicSettings() {
  return useQuery({
    queryKey: queryKeys.publicSettings,
    queryFn: fetchPublicSettings,
    retry: 1,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function usePublicGifts() {
  return useQuery({
    queryKey: queryKeys.publicGifts,
    queryFn: fetchPublicGifts,
    retry: 1,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useAdminGifts(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminGifts,
    queryFn: fetchAdminGifts,
    enabled,
    retry: 1,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useAdminSettings(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminSettings,
    queryFn: fetchAdminSettings,
    enabled,
    retry: 1,
  });
}

export function useAdminSession() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminSession });
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  const result = useQuery({
    queryKey: queryKeys.adminSession,
    queryFn: fetchAdminSession,
    retry: 1,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
  return result;
}

export function useSignInAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signInAdmin(email, password),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminSession });
    },
  });
}

export function useSignOutAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signOutAdmin,
    onSuccess: async () => {
      queryClient.clear();
    },
  });
}

export function useSaveGift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { input: GiftInput; id?: string }) =>
      saveGift(variables.input, variables.id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminGifts }),
        queryClient.invalidateQueries({ queryKey: queryKeys.publicGifts }),
      ]);
    },
  });
}

export function useDeleteGift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGift,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminGifts }),
        queryClient.invalidateQueries({ queryKey: queryKeys.publicGifts }),
      ]);
    },
  });
}

export function useSetGiftStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: GiftStatus }) =>
      setGiftStatus(id, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminGifts }),
        queryClient.invalidateQueries({ queryKey: queryKeys.publicGifts }),
      ]);
    },
  });
}

export function useMarkGiftPurchased() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markGiftPurchased,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminGifts }),
        queryClient.invalidateQueries({ queryKey: queryKeys.publicGifts }),
      ]);
    },
  });
}

export function useSaveSiteSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveSiteSettings,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminSettings }),
        queryClient.invalidateQueries({ queryKey: queryKeys.publicSettings }),
      ]);
    },
  });
}

export function useUploadGiftPhoto() {
  return useMutation({ mutationFn: uploadGiftPhoto });
}
