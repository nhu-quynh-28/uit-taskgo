function coerceDataUriImage(value) {
  if (value == null) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "object") {
    const persist = value.persistUri ?? value.persist_uri;
    const preview = value.previewUri ?? value.preview_uri;
    if (typeof persist === "string" && persist.trim()) return persist.trim();
    if (typeof preview === "string" && preview.trim()) return preview.trim();
  }
  return undefined;
}

function trimOrUndefined(value) {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s.length > 0 ? s : undefined;
}

function isoSubmittedAt(value) {
  if (value == null) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

/**
 * Normalizes users.kyc for API responses (admin detail, profile, list).
 * Returns null when no meaningful KYC fields are present.
 */
export function mapKycDto(kyc) {
  if (!kyc || typeof kyc !== "object") return null;

  const fullName = trimOrUndefined(kyc.fullName);
  const dob = trimOrUndefined(kyc.dob);
  const address = trimOrUndefined(kyc.address);
  const phone = trimOrUndefined(kyc.phone);
  const cccdFront = coerceDataUriImage(kyc.cccdFront);
  const cccdBack = coerceDataUriImage(kyc.cccdBack);
  const submittedAt = isoSubmittedAt(kyc.submittedAt);

  if (!fullName && !dob && !address && !phone && !cccdFront && !cccdBack && !submittedAt) {
    return null;
  }

  return {
    fullName,
    dob,
    address,
    phone,
    cccdFront,
    cccdBack,
    submittedAt,
  };
}
