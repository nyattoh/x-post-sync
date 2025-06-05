import { Plugin, App, requestUrl, PluginSettingTab, Setting, Notice } from "obsidian";
import { fetchUserId, fetchTweets, tweetToMarkdown } from "./core";
import type { XSyncSettings } from "./settings";
import { DEFAULT_SETTINGS } from "./settings";

export default class XPostsSync extends Plugin {
  settings!: XSyncSettings;
  status!: HTMLElement;

  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.addSettingTab(new Tab(this.app, this));
    this.addRibbonIcon("bookmark-star", "Sync My Posts", () => this.sync());
    this.status = this.addStatusBarItem();
    this.status.setText("XPostsSync ⏳ init");
    setTimeout(() => this.sync(), 2000);
    this.registerInterval(window.setInterval(() => this.sync(), this.settings.interval * 60000));
  }

  async onunload() {
    await this.sync();
    this.status.setText("XPostsSync 🛑 off");
  }

  async sync() {
    const { bearerToken, username } = this.settings;
    if (!bearerToken || !username) {
      this.status.setText("XPostsSync ⚠ 未設定");
      return;
    }
    try {
      if (!this.settings.cachedUserId) {
        this.settings.cachedUserId = await fetchUserId(username, requestUrl, bearerToken);
        await this.saveData(this.settings);
      }
      const tweets = await fetchTweets(this.settings.cachedUserId, bearerToken, requestUrl);
      let n = 0;
      const a = this.app.vault.adapter;
      for (const t of tweets) {
        const dir = `${t.created_at.slice(0, 10).replace(/-/g, "/")}/`;
        const path = `${dir}${t.id}.md`;
        if (await a.exists(path)) continue;
        await a.mkdir(dir).catch(() => {});
        await a.write(path, tweetToMarkdown(t));
        n++;
      }
      this.status.setText(`XPostsSync ✅ ${n}`);
    } catch (e: any) {
      console.error(e);
      new Notice("XPostsSync error: " + e.message);
      this.status.setText("XPostsSync ❌ error");
    }
  }
}

class Tab extends PluginSettingTab {
  plugin: XPostsSync;
  constructor(app: App, plugin: XPostsSync) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display(): void {
    const c = this.containerEl;
    c.empty();
    c.createEl("h3", { text: "X Posts Sync" });
    new Setting(c)
      .setName("Bearer Token")
      .addText(t => t
        .setValue(this.plugin.settings.bearerToken)
        .onChange(async v => {
          this.plugin.settings.bearerToken = v.trim();
          await this.plugin.saveData(this.plugin.settings);
        })
      );
    new Setting(c)
      .setName("Username (@無し)")
      .addText(t => t
        .setValue(this.plugin.settings.username)
        .onChange(async v => {
          this.plugin.settings.username = v.trim();
          this.plugin.settings.cachedUserId = "";
          await this.plugin.saveData(this.plugin.settings);
        })
      );
    new Setting(c)
      .setName("Interval (min)")
      .addText(t => t
        .setValue(String(this.plugin.settings.interval))
        .onChange(async v => {
          this.plugin.settings.interval = parseInt(v) || 60;
          await this.plugin.saveData(this.plugin.settings);
        })
      );
  }
}