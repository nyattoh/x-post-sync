import { App, PluginSettingTab, Setting } from 'obsidian';

export interface XPostSyncSettings {
  apiKey: string;
}

export const DEFAULT_SETTINGS: XPostSyncSettings = {
  apiKey: ''
};

export class XPostSyncSettingTab extends PluginSettingTab {
  plugin: any;

  constructor(app: App, plugin: any) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('API Key')
      .setDesc('Key used to authenticate with X API.')
      .addText(text =>
        text
          .setPlaceholder('Enter API key')
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
