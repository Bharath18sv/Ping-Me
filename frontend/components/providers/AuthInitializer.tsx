"use client";

import { useEffect } from "react";

import { useAppDispatch } from "@/store";
import { fetchMeThunk, initializationSkipped } from "@/features/auth.slice";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      dispatch(initializationSkipped());
      return;
    }

    void dispatch(fetchMeThunk());
  }, [dispatch]);

  return children;
}
