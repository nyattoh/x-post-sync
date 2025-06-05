import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, XPostSyncSettings, XPostSyncSettingTab } from './settings';
import { formatPost } from './core';

export default class XPostSyncPlugin extends Plugin {
  settings: XPostSyncSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: 'format-post',
      name: 'Format Sample Post',
      callback: () => {
        const result = formatPost({ author: 'Alice', text: 'Hello' });
        console.log(result);
      }
    });

    this.addSettingTab(new XPostSyncSettingTab(this.app, this));
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
