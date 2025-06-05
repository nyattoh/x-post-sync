export interface XSyncSettings {
    bearerToken: string;    // App-only Bearer Token
    username: string;   // @ を除くハンドル
    cachedUserId: string;   // 取得済み ID
    interval: number;   // 自動同期間隔（分）
}

export const DEFAULT_SETTINGS: XSyncSettings = {
    bearerToken: "",
    username: "",
    cachedUserId: "",
    interval: 60
};
