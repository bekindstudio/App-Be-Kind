import React from "react";
import { useAuthStore } from "@/hooks/use-auth-store";
import { setAuthTokenGetter } from "@workspace/api-client-react/custom-fetch";
import { useGetMe } from "@workspace/api-client-react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);

  React.useEffect(() => {
    setAuthTokenGetter(() => useAuthStore.getState().token);
  }, []);

  const { data: user, isLoading } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  return <>{children}</>;
}
