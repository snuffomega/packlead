import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { fetchCatalog } from './api';
import type { CardSet, Product } from './types';
import { useAsync } from './useAsync';

interface CatalogValue {
  sets: CardSet[];
  products: Product[];
  setById: (id: string) => CardSet | undefined;
  productById: (id: string) => Product | undefined;
  loading: boolean;
  error: string | null;
}

const CatalogContext = createContext<CatalogValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { data, loading, error } = useAsync(fetchCatalog, []);
  const value = useMemo<CatalogValue>(() => {
    const sets = data?.sets ?? [];
    const products = data?.products ?? [];
    const setMap = new Map(sets.map((s) => [s.id, s]));
    const productMap = new Map(products.map((p) => [p.id, p]));
    return {
      sets,
      products,
      setById: (id) => setMap.get(id),
      productById: (id) => productMap.get(id),
      loading,
      error,
    };
  }, [data, loading, error]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider');
  return ctx;
}
