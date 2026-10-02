import { useSyncExternalStore } from "react";

// Below this width the layout switches to its phone version (Tailwind's `md` is 768).
const MOBILE_BREAKPOINT = 768;
const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

const subscribe = (onChange: () => void) => {
  const mediaQuery = window.matchMedia(query);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
};

/** True on a phone-sized screen. False on the server, then correct as soon as it is in the browser. */
export const useIsMobile = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
