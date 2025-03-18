import * as React from "react"

export const SidebarRefreshContext = React.createContext<{
  refreshTrigger: number;
  triggerRefresh: () => void;
}>({
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

export function useSidebarRefresh() {
  const context = React.useContext(SidebarRefreshContext);
  if (!context) {
    throw new Error('useSidebarRefresh must be used within a SidebarRefreshProvider');
  }
  return context;
} 