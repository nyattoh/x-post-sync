console.log("XPostsSync: main.ts SCRIPT EXECUTION STARTED");

import {
    Plugin, App, requestUrl, PluginSettingTab, Setting, Notice
} from "obsidian";
import { fetchUserId, fetchTweets, tweetToMarkdown } from "./core";
import type { XSyncSettings } from "./settings";
import { DEFAULT_SETTINGS } from "./settings";

export default class XPostsSync extends Plugin {
    settings!: XSyncSettings;
    status!: HTMLElement;

    async onload() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        /* UI */
        this.addSettingTab(new Tab(this.app, this));
        this.addRibbonIcon("bookmark-star", "Sync My Posts", () => this.sync());
        this.addCommand({
            id: "sync-my-posts",
            name: "Sync My Posts",
            callback: () => this.sync(),
        });
        this.status = this.addStatusBarItem();
        this.status.setText("XPostsSync ⏳ init");

        setTimeout(() => this.sync(), 2000);
        this.registerInterval(
            window.setInterval(() => this.sync(), this.settings.interval * 60000)
        );
    }
    async onunload() {
        await this.sync();
        this.status.setText("XPostsSync 🛑 off");
    }

    /* ---------- 同期オーケストレーション ---------- */
    async sync() {
        const { bearerToken, username } = this.settings;
        console.log("XPostsSync: sync() called. Bearer Token present:", !!bearerToken, "Username present:", !!username);

        if (!bearerToken || !username) {
            this.status.setText("XPostsSync ⚠ 未設定");
            console.log("XPostsSync: Settings not configured, sync aborted.");
            return;
        }
        try {
            if (!this.settings.cachedUserId) {
                console.log("XPostsSync: cachedUserId not found. Attempting to fetch UserId for username:", username);
                this.settings.cachedUserId = await fetchUserId(username, requestUrl);
                console.log("XPostsSync: UserId fetched and cached:", this.settings.cachedUserId);
                await this.saveData(this.settings);
            }
            const tweets = await fetchTweets(
                this.settings.cachedUserId,
                bearerToken,
                requestUrl
            );

            let newCount = 0;
            const adapter = this.app.vault.adapter;
            for (const t of tweets) {
                const dir = `${t.created_at.slice(0, 10).replace(/-/g, "/")}/`;
                const path = `${dir}${t.id}.md`;
                if (await adapter.exists(path)) continue;
                await adapter.mkdir(dir).catch(() => { });
                await adapter.write(path, tweetToMarkdown(t));
                newCount++;
            }
            this.status.setText(`XPostsSync ✅ ${newCount}`);
        } catch (e: any) {
            console.error("XPostsSync: Error in sync function:", e);
            new Notice("XPostsSync error: " + e.message);
            this.status.setText("XPostsSync ❌ error");
        }
    }
}

/* ---------- Setting Tab ---------- */
class Tab extends PluginSettingTab {
    plugin: XPostsSync;
    constructor(app: App, plugin: XPostsSync) { super(app, plugin); this.plugin = plugin; }
    display(): void {
        const c = this.containerEl; c.empty();
        c.createEl("h3", { text: "X Posts Sync Settings" });

        new Setting(c)
            .setName("Bearer Token")
            .setDesc("Dev Portal → Keys & Tokens → OAuth2 → Bearer Token")
            .addText(t => t.setValue(this.plugin.settings.bearerToken)
                .onChange(async v => { this.plugin.settings.bearerToken = v.trim(); await this.plugin.saveData(this.plugin.settings); }));

        new Setting(c)
            .setName("ユーザ名 (ハンドル)")
            .setDesc("@ を付けず入力（ID は自動取得）")
            .addText(t => t.setValue(this.plugin.settings.username)
                .onChange(async v => {
                    this.plugin.settings.username = v.trim();
                    this.plugin.settings.cachedUserId = "";
                    await this.plugin.saveData(this.plugin.settings);
                }));

        new Setting(c)
            .setName("自動同期間隔（分）")
            .addText(t => t.setValue(String(this.plugin.settings.interval))
                .onChange(async v => {
                    this.plugin.settings.interval = parseInt(v) || 60;
                    await this.plugin.saveData(this.plugin.settings);
                }));
    }
}
