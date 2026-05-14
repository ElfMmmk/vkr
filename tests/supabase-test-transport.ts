class NoopWebSocket {
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;
  readonly readyState = this.CLOSED;
  readonly url: string;
  readonly protocol = "";
  onopen: ((this: unknown, ev: Event) => unknown) | null = null;
  onmessage: ((this: unknown, ev: MessageEvent) => unknown) | null = null;
  onclose: ((this: unknown, ev: CloseEvent) => unknown) | null = null;
  onerror: ((this: unknown, ev: Event) => unknown) | null = null;

  constructor(address: string | URL) {
    this.url = String(address);
  }

  close(): void {
    this.onclose?.call(this, new CloseEvent("close"));
  }

  send(): void {
    throw new Error("Realtime is disabled for this Supabase smoke test.");
  }

  addEventListener(): void {
    // The smoke tests use REST/Auth only and never subscribe to Realtime channels.
  }

  removeEventListener(): void {
    // The smoke tests use REST/Auth only and never subscribe to Realtime channels.
  }
}

export const noopRealtimeTransport = NoopWebSocket;
