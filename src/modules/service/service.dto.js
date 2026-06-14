export function toServiceDTO(service) {
  return {
    id: service.id,
    name: service.name,
    icon: service.icon,
    category: service.category,
    description: service.description ?? "",
    basePrice: service.basePrice ?? 0,
    durationLabel: service.durationLabel ?? "",
    estimatedDurationMinutes: service.estimatedDurationMinutes ?? null,
    active: Boolean(service.active),
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}
