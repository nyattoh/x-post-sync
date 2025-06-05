# x-post-sync

This Obsidian plugin synchronizes your posts from X (formerly Twitter) into an Obsidian vault.

## Prerequisites

- **Node.js 18+**. Install from [nodejs.org](https://nodejs.org/) or via your package manager.
- **Obsidian 1.4.5 or later** with the ability to load community plugins.
- `npm` or `yarn` for dependency management and building the plugin.

## Building

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the plugin bundle:
   ```bash
   npm run build
   ```
   The compiled files will appear in the `dist/` directory.

## Testing

If tests are provided, run:
```bash
npm test
```
Currently no tests are included, so this command will simply exit.

## Deploying

1. Create a zipped archive containing the `main.js`, `manifest.json`, and any CSS files from the `dist/` folder.
2. In Obsidian, open **Settings → Community plugins** and toggle **Safe mode** off.
3. Choose **Install plugin** and select your zip archive, or copy the `dist/` files into your vault's `.obsidian/plugins/x-post-sync` folder.
4. Reload Obsidian to activate the plugin.

## Configuration

After installing the plugin, open its settings from the Obsidian settings panel. Configure the following options:

- **Bearer token** – Your X API bearer token used to authenticate requests.
- **Username** – The X handle whose posts you want to sync.
- **Interval** – How often (in minutes) to check for new posts.

Save your settings and the plugin will begin periodically pulling posts into your vault.
