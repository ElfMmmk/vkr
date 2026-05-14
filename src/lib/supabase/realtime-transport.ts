class NoopRealtimeWebSocket {
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
    this.onclose?.call(this, { type: "close" } as CloseEvent);
  }

  send(): void {
    throw new Error("Realtime transport is disabled for this server client.");
  }

  addEventListener(): void {
    // Server-side app code uses Supabase REST/Auth/Storage only.
  }

  removeEventListener(): void {
    // Server-side app code uses Supabase REST/Auth/Storage only.
  }
}

export const noopRealtimeTransport = NoopRealtimeWebSocket;
