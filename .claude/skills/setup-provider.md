# /setup-provider — Cấu hình Claude Code Provider

## Mô tả

Cấu hình Claude Code sử dụng custom provider (proxy) thay vì Anthropic trực tiếp.

## File cấu hình

- Global settings: `~/.claude/settings.json`
- Project settings: `.claude/settings.local.json`

## Commands

### 1. Set provider proxy

```json
// ~/.claude/settings.json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://llm.qualo.xyz",
    "ANTHROPIC_AUTH_TOKEN": "<api-key>",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4-6",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-6",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-4-5"
  },
  "model": "claude-opus-4-6",
  "language": "vietnamese",
  "alwaysThinkingEnabled": true
}
```

### 2. Set model

Thêm `"model": "claude-opus-4-6"` hoặc `"claude-sonnet-4-6"` vào settings.json.

### 3. Verify

```bash
# Kiểm tra model đang dùng
# Trong Claude Code session: /model
# Environment info sẽ hiển thị "You are powered by..."
```

## Provider hiện tại

- URL: https://llm.qualo.xyz
- Account: quangthaiwin
- Models available: Opus 4.6, Sonnet 4.6, Haiku 4.5, GPT-5.4 (OpenAI-compatible)
