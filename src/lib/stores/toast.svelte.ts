// Lightweight toast store (Svelte 5 runes). Supports an optional action (e.g. Undo).

export interface ToastAction {
  label: string;
  run: () => void | Promise<void>;
}
export interface Toast {
  id: number;
  message: string;
  action?: ToastAction;
}

class ToastStore {
  items = $state<Toast[]>([]);
  private seq = 0;

  show(message: string, opts: { action?: ToastAction; duration?: number } = {}) {
    const id = ++this.seq;
    this.items = [...this.items, { id, message, action: opts.action }];
    const duration = opts.duration ?? (opts.action ? 6000 : 3000);
    setTimeout(() => this.dismiss(id), duration);
    return id;
  }

  dismiss(id: number) {
    this.items = this.items.filter((t) => t.id !== id);
  }

  async runAction(t: Toast) {
    this.dismiss(t.id);
    await t.action?.run();
  }
}

export const toasts = new ToastStore();
