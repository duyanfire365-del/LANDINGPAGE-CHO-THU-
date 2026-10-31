# Apify → private scanned sources

- Set `APIFY_TOKEN` as a Production Secret and deploy. Only Actor Read/List runs and Storages Read are required. This integration never starts Actors or changes schedules.
- Admin → Cổng nguồn quét Web & FB → Kết nối tự động Apify:
  1. Kiểm tra kết nối verifies the supported Actor, one successful run and dataset read. It binds ingestion to that Actor and run owner, in private notification_log.
  2. Nhập lượt quét gần nhất ingests the latest existing successful run. It does not scrape again. The strict Hanoi/direct-owner/contact policy applies; failed criteria stay in review.
  3. Cấu hình webhook returns the exact request URL and Headers template. In Apify Actor → Integrations, create HTTP webhook on ACTOR.RUN.SUCCEEDED, paste URL/headers, retain default payload.
- Endpoint: POST /api/workspace?apify-hook=1. Header X-Apify-Webhook-Key is a purpose-specific HMAC derived from the server API token, not the API token itself. Never put APIFY_TOKEN in client code, URL, webhook body or header settings. Do not share screenshots of webhook headers.
- Only the supported `dami_studio/facebook-groups-scraper` Actor is allowed. Foreign Actor/account runs and unfinished runs are rejected using Apify's run metadata, not caller-provided dataset URLs or data.
- Requests use the fixed https://api.apify.com/v2 origin, Bearer auth, no redirects and bounded JSON responses. No arbitrary URL fetch is accepted.
- Private ledger kind apify-sync:v1 is keyed by run ID. Duplicate completed delivery returns success without importing again. Pages are checkpointed; transient failure can retry from saved offset. Concurrent workers are rejected under a two-minute stale lease, with DB CAS fencing. If a page partly persists before a failure, stable source IDs prevent duplicate leads on retry; the added count can undercount that partial page.
- HTTP success is sent only on full completion. Partial or failed webhook processing returns non-2xx so Apify retries. Admin can explicitly retry a recorded run. Do not mark webhook configured until a real event succeeds.
- Match/Telegram routines are queued after a completed new import only when the existing MATCH_BOTS_ENABLED flag is enabled. No bot configuration is changed here.
- No schedule is enabled by this change. Configure one in Apify only after confirming receipt of a real successful run and checking usage limits.
- Rotating APIFY_TOKEN invalidates the connection fingerprint and webhook HMAC. Recheck the connection and update Apify webhook Headers template.
- Dataset reads can consume a small amount of provider platform usage; no paid Actor run is started by checking or importing an existing result.
- This does not enable a third-party Actor's missing full-comment feature. Comments can be processed only when the provider supplies them.
