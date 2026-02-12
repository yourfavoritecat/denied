import { createContext, useContext, useState, ReactNode } from "react";

export type ViewAsRole = "admin" | "provider" | "traveler";

interface ViewAsContextType {
  viewAs: ViewAsRole;
  setViewAs: (role: ViewAsRole) => void;
  isViewingAs: boolean; // true when admin is impersonating a non-admin role
}

const ViewAsContext = createContext<ViewAsContextType | undefined>(undefined);

export const ViewAsProvider = ({ children }: { children: ReactNode }) => {
  const [viewAs, setViewAs] = useState<ViewAsRole>("admin");

  return (
    <ViewAsContext.Provider value={{ viewAs, setViewAs, isViewingAs: viewAs !== "admin" }}>
      {children}
    </ViewAsContext.Provider>
  );
};

export const useViewAs = () => {
  const context = useContext(ViewAsContext);
  if (!context) {
    // Return a safe default for non-admin contexts
    return { viewAs: "traveler" as ViewAsRole, setViewAs: () => {}, isViewingAs: false };
  }
  return context;
};
