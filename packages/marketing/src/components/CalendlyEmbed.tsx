import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

// ── Calendly global type ──────────────────────────────────────────────────────

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (opts: {
        url:           string;
        parentElement: HTMLElement;
        prefill?:      { name?: string; email?: string };
        utm?:          Record<string, string>;
      }) => void;
    };
  }
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface CalendlyScheduledEvent {
  event:   'calendly.event_scheduled';
  payload: {
    event:   { uri: string };
    invitee: { uri: string };
  };
}

interface Props {
  url:              string;
  prefill:          { name: string; email: string };
  onEventScheduled: (event: CalendlyScheduledEvent) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CalendlyEmbed({ url, prefill, onEventScheduled }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep a stable ref to the callback so the effect never needs to re-run
  // when the parent re-renders and produces a new function reference.
  const callbackRef = useRef(onEventScheduled);
  callbackRef.current = onEventScheduled;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any prior widget instance on url/prefill change
    container.innerHTML = '';

    if (window.Calendly) {
      window.Calendly.initInlineWidget({
        url,
        parentElement: container,
        prefill: {
          name:  prefill.name,
          email: prefill.email,
        },
      });
    } else {
      // window.Calendly missing (e.g. blocked by ad blocker) — render a link fallback
      container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;
                    flex-direction:column;gap:12px;color:#3A6491;font-family:Inter,sans-serif;">
          <p style="font-size:14px;margin:0;">Calendar could not load.</p>
          <a href="${url}" target="_blank" rel="noopener noreferrer"
             style="font-size:14px;font-weight:600;color:#D4AF37;text-decoration:underline;">
            Open scheduling page →
          </a>
        </div>`;
    }

    function handleMessage(e: MessageEvent) {
      const data = e.data as { event?: string } | null;
      if (data?.event === 'calendly.event_scheduled') {
        callbackRef.current(data as CalendlyScheduledEvent);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  // onEventScheduled intentionally excluded — handled via callbackRef above
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, prefill.name, prefill.email]);

  return (
    <div className="relative w-full">
      {/* Loading shimmer — sits behind the Calendly iframe and disappears once it loads */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center
                   gap-3 bg-navy-50 rounded-lg border border-navy-100"
        aria-hidden="true"
      >
        <Loader2 size={24} className="animate-spin text-gold-500" />
        <p className="text-sm text-blue-gray">Loading calendar…</p>
      </div>

      {/* Calendly mounts its iframe here */}
      <div
        ref={containerRef}
        className="relative z-10 w-full"
        style={{ minWidth: '320px', height: '700px' }}
      />
    </div>
  );
}
