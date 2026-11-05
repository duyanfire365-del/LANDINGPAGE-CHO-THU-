# Kinh nghiệm tìm MBKD

Public menu/list `/kinh-nghiem-tim-mbkd`; detail `/kinh-nghiem-tim-mbkd/<slug>`. A dedicated section of the existing article CMS, with optional industry: general, cafe, food, spa, office, retail, warehouse, other. The list offers a customer-facing industry filter. Existing articles default to `section=news` and remain in Tin tức Hot. Public feeds and detail routes enforce their section and published status, with the same draft/archive/cover privacy as news.

Admins can create, edit, draft, publish, feature, hide, archive and restore using the toolbar on the page or `/admin` → Khách hàng / Công cụ → Tin tức / Kinh nghiệm MBKD. Select **Mục bài viết** and **Ngành hàng**. Changing section moves the public URL to the selected section; saved-link feedback and list links use the new path. The `/admin` editor lists both sections; each inline page lists only its section.

The existing owner-only Telegram bot also accepts:

```text
#kinhnghiemmbkd
Kinh nghiệm chọn mặt bằng mở quán cà phê
Ngành: Cà phê

Nội dung anh đã soạn…
Nguồn: https://example.com/nguon-tham-khao
```

Can replace hashtag with **Kinh nghiệm tìm MBKD** or `/kinhnghiemmbkd`. `/nhapkinhnghiemmbkd` saves a draft. Industry is optional; defaults to general. It accepts the visible Vietnamese industry labels or stable keys cafe/food/spa/office/retail/warehouse/other. Invalid industries return an explicit error. One photo can carry the article in its caption. Copy is preserved; no AI rewriting. Existing news markers continue to target news. Both section markers in one message produce help rather than publishing ambiguously. Original-message edits retain section and industry when labels/metadata are omitted. Reply `/gotintuc` to either section's receipt to archive. Owner/webhook secret checks, immutable source identity, duplicate/out-of-order protection and manual-edit protections are reused.

Apply `database/migrations/20261105_mbkd_experience.sql` before deploying; additive columns/defaults/checks/indexes only, no RLS/grant changes or demo rows. Uses the existing repository SQL migration + Supabase apply_migration workflow (local Supabase CLI unavailable). Existing 12 Vercel API handlers are reused; new detail rewrite targets property handler. Static menu defaults are updated alongside the normal navigation so the layout editor also offers the new entry.

Checks: `npm run check`, `node tests/mbkd-experience.mjs`, `node tests/news.mjs`, `node tests/news-labels.mjs`, `node tests/news-ui.mjs`, `node tests/telegram-flexible-customers.mjs`. Fake DB/Telegram only; browser includes manual category/industry selection, filter changes, separated public feeds/details, mobile layout and guest isolation. No production articles/messages are seeded.
