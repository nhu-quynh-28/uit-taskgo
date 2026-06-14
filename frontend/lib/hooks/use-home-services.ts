import { useCallback, useEffect, useMemo, useState } from "react";
import { listServicesRequest } from "@/lib/api/services";
import {
  getCatalogCategories,
  mapApiServices,
  type CatalogService,
} from "@/lib/adapters/catalogAdapter";

export type UseHomeServicesResult = {
  services: CatalogService[];
  categories: ReturnType<typeof getCatalogCategories>;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useHomeServices(): UseHomeServicesResult {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiServices = await listServicesRequest();
      setServices(mapApiServices(apiServices));
    } catch {
      setError("Could not load services");
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(() => getCatalogCategories(services), [services]);

  return { services, categories, loading, error, reload: load };
}
