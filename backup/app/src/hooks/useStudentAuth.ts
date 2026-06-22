import { trpc } from "@/providers/trpc";
import { useCallback, useMemo } from "react";

export function useStudentAuth() {
  const utils = trpc.useUtils();

  const {
    data: student,
    isLoading,
  } = trpc.studentAuth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logout = useCallback(() => {
    localStorage.removeItem("student_token");
    utils.invalidate();
    window.location.reload();
  }, [utils]);

  return useMemo(
    () => ({
      student: student ?? null,
      isAuthenticated: !!student,
      isLoading,
      logout,
    }),
    [student, isLoading, logout]
  );
}
