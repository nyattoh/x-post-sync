export interface XSyncSettings {
  bearerToken: string;
  username: string;
  cachedUserId: string;
  interval: number;
}

export const DEFAULT_SETTINGS: XSyncSettings = {
  bearerToken: "",
  username: "",
  cachedUserId: "",
  interval: 60
};