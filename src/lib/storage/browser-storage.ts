export interface BrowserStorage<T extends string = string> {
  get(): T | null;
  set(value: T): void;
  remove(): void;
}

/**
 * 创建带内存降级的 localStorage 适配器。
 *
 * SSR、隐私模式或浏览器禁用存储时不会抛错；浏览器允许存储时仍会跨会话持久化。
 */
export function createBrowserStorage<T extends string = string>(key: string): BrowserStorage<T> {
  let memoryValue: T | null = null;

  return {
    get() {
      if (typeof window === "undefined") return null;
      try {
        return (window.localStorage.getItem(key) as T | null) ?? memoryValue;
      } catch {
        return memoryValue;
      }
    },
    set(value) {
      if (typeof window === "undefined") return;
      memoryValue = value;
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // 内存值可保证当前页面生命周期内继续工作。
      }
    },
    remove() {
      if (typeof window === "undefined") return;
      memoryValue = null;
      try {
        window.localStorage.removeItem(key);
      } catch {
        // localStorage 不可用时，清理内存值即可。
      }
    },
  };
}
