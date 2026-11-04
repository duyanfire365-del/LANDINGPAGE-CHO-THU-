# Tin tức Hot

Public menu `/tin-tuc-hot` lists published articles, featured first and then newest. Each article has its own server-rendered `/tin-tuc-hot/<slug>` URL, metadata, title, excerpt, optional cover, full plain text content and optional source attribution. Draft and archived article/cover URLs return 404 publicly. Empty feed has an explicit empty state; no demo articles are seeded.

## Manual posting

Log into `/admin` → **Khách hàng / Công cụ** → **Tin tức Hot**. Add a title and content, optional excerpt, HTTPS source link, featured flag and one JPG/PNG/WebP cover (up to 2 MB). Choose **Lưu nháp / ẩn bài**, **Đăng công khai**, or **Gỡ bài**. Gỡ retains the article for future editing/republication. Editing uses an immutable URL and optimistic revision checks; a stale editor must reopen the latest article before saving. Public plain text rendering escapes HTML and preserves paragraph breaks.

## Telegram

The existing private owner conversation in source/customer/linked bots accepts:

```text
/tintuc Tiêu đề bài viết
Tóm tắt: Dòng tóm tắt tùy chọn
Nội dung chi tiết bài viết…

Đoạn tiếp theo…
Nguồn: https://example.com/bai-goc
```

`/tintuc` publishes immediately; `/nhaptintuc` uses the same format but saves privately as draft. Put the command/title/content into the caption to attach one photo as cover. Send a single photo rather than an album. An empty command replies with help. Edit the original message (keeping the command) to replace title/content/status, preserving the article ID/URL. Reply to the bot's news receipt with `/gotintuc` to archive. Bot replies distinguish published (with URL), draft, archived, validation failure and temporary failure.

Existing webhook secret and private owner checks run first. Commands are intercepted **before** BĐS/customer ingestion in both webhook entry points. Source identity uses bot + owner chat + original message ID. Duplicate/out-of-order updates cannot duplicate or resurrect an article, and compare-and-swap retries handle simultaneous edits. After a website edit, further Telegram edits are rejected explicitly to prevent overwriting manual changes; continue editing in the admin panel. Ordinary BĐS/customer messages continue through their existing routes. Telegram download is restricted to Telegram's file endpoint with a 2 MB streaming limit. Images are decoded and converted to static WebP before saving.

## Requests through this ChatGPT conversation

The user can provide the article title/content, source, optional image and an explicit instruction to save a draft or publish. The connected project tools can save to the same `news_articles` storage; this is an operator workflow in this authorized conversation, not a generic public ChatGPT account integration or an unauthenticated posting endpoint. Do not invent or publish articles without supplied/approved content. Before reporting success, read the saved row back; for published articles verify its public URL. Respect the same validation, image conversion and revision rules as `lib/news.mjs`. Prefer a draft if no publication state was specified. Do not place credentials or Telegram origin metadata in public content.

## Storage and deployment

Apply the additive `database/migrations/20261104_hot_news.sql` through Supabase migration tooling before deploying. The local Supabase CLI is unavailable in the execution workspace, so this follows the repository's existing checked-in SQL migration workflow and the authenticated Supabase `apply_migration` tool. No other table is modified. The table has RLS and no anon/authenticated grants; all writes use the existing server admin guard or verified Telegram owner. Public APIs select an explicit projection without revision/origin/cover payload. Covers are served only while their article is published; draft previews require admin authentication. Images are bounded to 450 KB WebP / 650 KB JSONB; article text to 50,000 characters. No public bucket is introduced.

Reuses catalog/workspace/property/files handlers to remain within the existing 12 Vercel function slots. The article route is rewritten to the existing property handler. Local `server.mjs` supports the same route.

Verification: `npm run check`, `node tests/news.mjs`, and `node tests/news-ui.mjs` (Playwright/Chromium). Tests fake Supabase/Telegram; do not send test messages or seed production articles.
