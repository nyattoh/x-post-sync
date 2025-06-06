# X Posts Sync for Obsidian

X（旧Twitter）の自分の投稿とリツイートをObsidianのVaultに同期するプラグインです。

## 機能

- 🐦 X（Twitter）の自分の投稿とリツイートを自動取得
- 📁 YYYY/MM/DD形式のフォルダ構造で整理
- 📊 月次使用量の追跡と表示（Free tier: 100 reads/月）
- ⏰ Rate limit対応と適切なエラーハンドリング
- 🔄 自動同期（設定可能な間隔）
- 🎯 リボンアイコンから手動同期も可能

## 必要条件

- Obsidian デスクトップ版 1.8.x以上
- X Developer Account（無料）
- Bearer Token（App-only認証用）

## インストール

### Obsidianから直接インストール（準備中）
1. Obsidianの設定 → コミュニティプラグイン
2. 「X Posts Sync」を検索
3. インストール → 有効化

### 手動インストール
1. リリースページから`main.js`、`manifest.json`をダウンロード
2. Vaultの`.obsidian/plugins/x-posts-sync/`フォルダに配置
3. Obsidianを再起動し、設定でプラグインを有効化

## 設定

1. **Bearer Token**: X Developer Portalから取得
   - [X Developer Portal](https://developer.x.com/)でアプリを作成
   - Keys and Tokensセクションから Bearer Token を取得

2. **Username**: @を除いたユーザー名（例: `elonmusk`）

3. **Interval**: 自動同期の間隔（分単位、デフォルト: 60分）

## 使用方法

1. 設定でBearer TokenとUsernameを入力
2. リボンアイコンをクリックするか、自動同期を待つ
3. ステータスバーで同期状況を確認
   - `✅ 5 (23/100)`: 5件同期成功、今月23件使用済み
   - `⏰ Rate limit`: 15分待機が必要
   - `❌ 月次制限到達`: 翌月まで待機

## X API制限について

### Free Tier制限
- **読み取り**: 100リクエスト/月
- **投稿**: 500件/月（このプラグインでは使用しません）
- **Rate limit**: 15分間での制限あり

### 制限への対応
- 月次使用量の自動追跡
- 月が変わると自動的にリセット
- Rate limit時は適切な待機時間を表示

## トラブルシューティング

### "Rate limit exceeded" エラー
- 15分待ってから再試行してください
- または月次制限（100 reads）に到達している可能性があります

### "User ID not found" エラー
- ユーザー名が正しいか確認してください
- @マークは不要です

### "Invalid authentication credentials" エラー
- Bearer Tokenが正しいか確認してください
- X Developer Portalで新しいトークンを生成してみてください

## 技術仕様

- X API v2（OAuth 2.0 Application-Only認証）
- Fallback: Syndication API（ユーザーID取得用）
- TypeScript実装
- Vitest使用のテストスイート

## ライセンス

MIT License

## 貢献

プルリクエストは歓迎します。大きな変更の場合は、まずIssueを作成して変更内容を議論してください。

## 作者

- [nyattoh](https://github.com/nyattoh)

## 謝辞

- Obsidian開発チーム
- X API提供元