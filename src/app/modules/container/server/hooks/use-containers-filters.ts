"use client";

import { useState } from "react";
import { UseContainersParams } from "./use-containers";

export function useContainersFilters() {
  const [filters, setFiltersState] = useState<UseContainersParams>({
    page: 1,
    per_page: 20,
  });

  function setFilters(next: Partial<UseContainersParams>) {
    setFiltersState((prev) => ({
      ...prev,
      ...next,
      page: 1, 
    }));
  }

  function setPage(page: number) {
    setFiltersState((prev) => ({
      ...prev,
      page,
    }));
  }

  return {
    filters,
    setFilters,
    setPage,
  };
}
