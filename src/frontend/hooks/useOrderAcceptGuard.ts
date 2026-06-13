import { useRef, useState } from "react";

/**
 * Sync + async guard for "Accept job" — prevents double-tap before React re-renders disabled UI.
 */
export function useOrderAcceptGuard(onAccept: () => Promise<void>) {
  const acceptingRef = useRef(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (acceptingRef.current) return;
    acceptingRef.current = true;
    setLoading(true);
    try {
      await onAccept();
    } finally {
      acceptingRef.current = false;
      setLoading(false);
    }
  };

  return {
    handleAccept,
    loading,
    acceptingRef,
    isAcceptDisabled: loading || acceptingRef.current,
  };
}
