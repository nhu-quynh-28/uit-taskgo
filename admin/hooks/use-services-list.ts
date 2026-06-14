import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  createServiceForAdmin,
  deleteServiceForAdmin,
  fetchServicesForAdmin,
  updateServiceForAdmin,
  type ServiceFormInput,
} from "@/lib/api/services";
import type { Service } from "@/lib/mock-data";

export type { ServiceFormInput };

export function useServicesList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchServicesForAdmin();
      setServices(rows);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load services";
      setError(message);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleActive = useCallback(async (service: Service) => {
    const updated = await updateServiceForAdmin(service.id, { active: !service.active });
    setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    return updated;
  }, []);

  const createService = useCallback(async (input: ServiceFormInput) => {
    const created = await createServiceForAdmin(input);
    setServices((prev) => [...prev, created]);
    return created;
  }, []);

  const saveService = useCallback(async (service: Service) => {
    const updated = await updateServiceForAdmin(service.id, {
      name: service.name,
      icon: service.icon,
      category: service.category,
      description: service.description,
      basePrice: service.price,
      active: service.active,
    });
    setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    return updated;
  }, []);

  const deleteService = useCallback(async (id: string) => {
    await deleteServiceForAdmin(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    services,
    loading,
    error,
    reload: load,
    toggleActive,
    createService,
    saveService,
    deleteService,
  };
}
