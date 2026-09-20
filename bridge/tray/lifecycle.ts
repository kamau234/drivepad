export function createTrayLifecycle() {
  return {
    isVisible: false,
    show() {
      this.isVisible = true;
      return this.isVisible;
    },
    hide() {
      this.isVisible = false;
      return this.isVisible;
    },
    toggle() {
      this.isVisible = !this.isVisible;
      return this.isVisible;
    },
    getState() {
      return { visible: this.isVisible };
    }
  };
}

export type BridgeTrayLifecycle = ReturnType<typeof createTrayLifecycle>;
