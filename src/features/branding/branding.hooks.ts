import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteBrandingAsset,
  getPublicBranding,
  updateBrandingName,
  uploadBrandingAsset,
} from '@/features/branding/branding.service';
import type {
  BrandingAssetKind,
  UpdateBrandingNamePayload,
} from '@/features/branding/branding.types';
import { resolveBranding } from '@/features/branding/branding.utils';
import { isApiError } from '@/lib/api/api-error';

export const brandingKeys = {
  all: ['branding'] as const,
};

/** Only retries on 5xx responses, up to twice — never on 4xx or network errors. */
function brandingRetry(failureCount: number, error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.statusCode >= 500 && failureCount < 2;
}

/**
 * The single source of branding data for the whole app — Sidebar, Home,
 * Login, document title/favicon and the Personalização page itself all
 * call this same hook, sharing one cached query (no duplicate requests).
 * Public endpoint: works before login, and `branding` always returns a
 * fully-resolved, ready-to-render value (never `undefined`) even while
 * loading or if the request fails — see `resolveBranding()`.
 */
export function useBranding() {
  const query = useQuery({
    queryKey: brandingKeys.all,
    queryFn: ({ signal }) => getPublicBranding(signal),
    staleTime: 5 * 60_000,
    retry: brandingRetry,
  });

  return { ...query, branding: resolveBranding(query.data) };
}

/**
 * There is only one real read endpoint (`GET /branding`, public) — no
 * separate "admin" branding query exists on the backend. Every mutation
 * below invalidates this same key, which is what keeps the Sidebar/Home/
 * Login/Personalização page all in sync immediately after a change, with
 * no `window.location.reload()`.
 */
function invalidateBranding(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: brandingKeys.all });
}

export function useUpdateBrandingName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateBrandingNamePayload) => updateBrandingName(payload),
    onSuccess: () => invalidateBranding(queryClient),
  });
}

function useUploadBrandingAsset(kind: BrandingAssetKind) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadBrandingAsset(kind, file),
    retry: false,
    onSuccess: () => invalidateBranding(queryClient),
  });
}

function useDeleteBrandingAsset(kind: BrandingAssetKind) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteBrandingAsset(kind),
    retry: false,
    onSuccess: () => invalidateBranding(queryClient),
  });
}

export const useUploadBrandingLogo = () => useUploadBrandingAsset('logo');
export const useUploadBrandingFavicon = () => useUploadBrandingAsset('favicon');
export const useUploadBrandingImage = () => useUploadBrandingAsset('brandImage');

export const useDeleteBrandingLogo = () => useDeleteBrandingAsset('logo');
export const useDeleteBrandingFavicon = () => useDeleteBrandingAsset('favicon');
export const useDeleteBrandingImage = () => useDeleteBrandingAsset('brandImage');
