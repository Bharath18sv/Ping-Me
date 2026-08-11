"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store";
import { fetchMeThunk } from "@/features/auth.slice";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(fetchMeThunk());
  }, [dispatch]);

  return children;
}
