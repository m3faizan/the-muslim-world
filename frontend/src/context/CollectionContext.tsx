import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { apiFetch } from "@/lib/api";

type CollectionContextType = {
  collectedIds: Set<number>;
  toggle: (siteId: number) => Promise<void>;
  isLoaded: boolean;
};

const CollectionContext = createContext<CollectionContextType>({
  collectedIds: new Set(),
  toggle: async () => {},
  isLoaded: false,
});

export function CollectionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [collectedIds, setCollectedIds] = useState<Set<number>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setCollectedIds(new Set());
      setIsLoaded(false);
      return;
    }
    setIsLoaded(false);
    apiFetch("/api/collections")
      .then((r) => (r.ok ? r.json() : []))
      .then((ids: number[]) => {
        setCollectedIds(new Set(ids));
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, [user]);

  const toggle = useCallback(
    async (siteId: number) => {
      if (!user) return;
      const isSaved = collectedIds.has(siteId);
      setCollectedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.delete(siteId);
        else next.add(siteId);
        return next;
      });
      try {
        const res = await apiFetch(`/api/collections/${siteId}`, {
          method: isSaved ? "DELETE" : "POST",
        });
        if (!res.ok) throw new Error("Failed");
      } catch {
        setCollectedIds((prev) => {
          const next = new Set(prev);
          if (isSaved) next.add(siteId);
          else next.delete(siteId);
          return next;
        });
      }
    },
    [user, collectedIds],
  );

  return (
    <CollectionContext.Provider value={{ collectedIds, toggle, isLoaded }}>
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollection() {
  return useContext(CollectionContext);
}
