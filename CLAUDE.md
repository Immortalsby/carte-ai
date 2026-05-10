@AGENTS.md

# Coding Standards

## No browser alert()
Never use `window.alert()`, `alert()`, `confirm()`, or `prompt()`. Always use the toast system (`useToast` from `@/components/ui/Toast`) for user notifications. For confirmations, use a custom modal or inline UI instead of `window.confirm()`.

## API cost awareness
Before making calls to paid external APIs (OpenAI, Gemini, etc.), always inform the user which API will be used and the estimated cost. Never trigger paid API calls automatically without user confirmation. Free APIs (Pollinations, Pixabay) do not require confirmation but should respect rate limits.
