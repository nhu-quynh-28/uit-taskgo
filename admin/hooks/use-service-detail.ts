import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  fetchServiceDetailForAdmin,
  fetchServicesForAdmin,
  updateServiceForAdmin,
} from "@/lib/api/services";
import type { Service } from "@/lib/mock-data";

export type ServiceDetailForm = {
  name: string;
  category: string;
  price: number;
  active: boolean;
  description: string;
  duration: string;
};

export function useServiceDetail(serviceId: string) {
  const [service, setService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setNotFound(false);
      setService(null);

      if (!serviceId?.trim()) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const [detail, list] = await Promise.all([
          fetchServiceDetailForAdmin(serviceId),
          fetchServicesForAdmin().catch(() => [] as Service[]),
        ]);
        if (cancelled) return;
        setService(detail);
        setServices(list.length > 0 ? list : [detail]);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 404 || err.code === "NOT_FOUND")) {
          setNotFound(true);
          return;
        }
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to load service";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  const saveService = useCallback(
    async (patch: Pick<Service, "name" | "category" | "price" | "active" | "description"> & {
      duration?: string;
    }) => {
      if (!service) return null;
      const durationMinutes = patch.duration ? Number(patch.duration) : undefined;
      const updated = await updateServiceForAdmin(service.id, {
        name: patch.name,
        category: patch.category,
        description: patch.description,
        basePrice: patch.price,
        active: patch.active,
        estimatedDurationMinutes:
          durationMinutes !== undefined && !Number.isNaN(durationMinutes)
            ? durationMinutes
            : undefined,
      });
      setService(updated);
      setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      return updated;
    },
    [service],
  );

  return {
    service,
    services,
    loading,
    error,
    notFound,
    saveService,
  };
}

export function serviceToDetailForm(svc: Service, duration = "60"): ServiceDetailForm {
  return {
    name: svc.name,
    category: svc.category,
    price: svc.price,
    active: svc.active,
    description: svc.description,
    duration,
  };
}
