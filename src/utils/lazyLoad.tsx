import { lazy, Suspense, ComponentType } from "react";

/**
 * Lazy loading utilities for code splitting
 */

// Lazy load components
export const LazyCalendar = lazy(() => import("../components/Calendar"));
export const LazyEventModal = lazy(() => import("../components/EventModal"));
export const LazyMapEditor = lazy(() => import("../components/MapEditor"));
export const LazyZoneEditor = lazy(() => import("../components/ZoneEditor"));
export const LazyObjectPlacementPanel = lazy(
  () => import("../components/ObjectPlacementPanel")
);
export const LazySettingsModal = lazy(
  () => import("../components/SettingsModal")
);
export const LazyNotificationPanel = lazy(
  () => import("../components/NotificationPanel")
);
export const LazyWhiteboard = lazy(() => import("../components/Whiteboard"));

/**
 * Loading fallback component
 */
export const LoadingFallback = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      color: "#9ca3af",
    }}
  >
    Loading...
  </div>
);

/**
 * HOC for lazy loading with Suspense
 */
export const withLazyLoad = <P extends object>(
  Component: ComponentType<P>
) => {
  return (props: P) => (
    <Suspense fallback={<LoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
};

