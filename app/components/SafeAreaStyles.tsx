"use client";

export default function SafeAreaStyles() {
  return (
    <style jsx global>{`
      :root {
        --safe-area-inset-top: env(safe-area-inset-top, 0px);
      }
      @supports (padding-top: env(safe-area-inset-top)) {
        body {
          padding-top: var(--safe-area-inset-top);
          min-height: 100vh;
          min-height: -webkit-fill-available;
        }
        @media all and (display-mode: standalone) {
          body {
            padding-top: calc(var(--safe-area-inset-top) + 1rem);
          }
        }
      }
    `}</style>
  );
}
