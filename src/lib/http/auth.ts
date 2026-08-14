export interface HttpAuthAdapter {
  getToken(): string | null;
  onUnauthorized?(): void;
}

let authAdapter: HttpAuthAdapter | undefined;

export function configureHttpAuth(adapter?: HttpAuthAdapter): void {
  authAdapter = adapter;
}

export function getHttpAuthAdapter(): HttpAuthAdapter | undefined {
  return authAdapter;
}
