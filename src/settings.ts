export interface XSyncSettings {
  bearerToken: string;
  username: string;
  cachedUserId: string;
  interval: number;
  monthlyRequestCount: number;
  lastResetDate: string;
}

export const DEFAULT_SETTINGS: XSyncSettings = {
  bearerToken: "",
  username: "",
  cachedUserId: "",
  interval: 60,
  monthlyRequestCount: 0,
  lastResetDate: ""
};

export function checkMonthlyReset(settings: XSyncSettings): boolean {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
  
  if (settings.lastResetDate !== currentMonth) {
    settings.monthlyRequestCount = 0;
    settings.lastResetDate = currentMonth;
    return true; // Reset occurred
  }
  return false; // No reset needed
}