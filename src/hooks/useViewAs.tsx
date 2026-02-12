import { createContext, useContext, useState, ReactNode } from "react";

export type ViewAsRole = "admin" | "provider" | "traveler";

interface ViewAsContextType {
  viewAs: ViewAsRole;
  setViewAs: (role: ViewAsRole) => void;
  isViewingAs: boolean;
}

const STORAGE_KEY = "denied-view-as-role";
const ViewAsContext = createContext<ViewAsContextType | undefined>(undefined);

const getInitialRole = (): ViewAsRole => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "admin" || stored === "provider" || stored === "traveler") return stored;
  } catch {}
  return "admin";
};

export const ViewAsProvider = ({ children }: { children: ReactNode }) => {
  const [viewAs, setViewAsState] = useState<ViewAsRole>(getInitialRole);

  const setViewAs = (role: ViewAsRole) => {
    setViewAsState(role);
    try { localStorage.setItem(STORAGE_KEY, role); } catch {}
  };

  return (
    <ViewAsContext.Provider value={{ viewAs, setViewAs, isViewingAs: viewAs !== "admin" }}>
      {children}
    </ViewAsContext.Provider>
  );
};

export const useViewAs = () => {
  const context = useContext(ViewAsContext);
  if (!context) {
    return { viewAs: "traveler" as ViewAsRole, setViewAs: () => {}, isViewingAs: false };
  }
  return context;
};
