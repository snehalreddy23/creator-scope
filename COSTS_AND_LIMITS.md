# CreatorScope — Costs, Quotas, and Provider Limits

This document provides a transparent, verified breakdown of pricing, credit consumption, platform quotas, and legal/commercial limitations for **CreatorScope**.

---

## 1. Instagram Data Source: GramScraper Investigation

### Current Verified Status & Availability
- **Service Name:** GramScraper
- **Official Portal:** [gramscraper.com](https://gramscraper.com)
- **Architecture:** Commercial hosted REST API proxy for Instagram public data extraction.
- **Maintenance:** Actively maintained with REST endpoints returning JSON payloads.
- **Authentication:** Bearer token authentication via HTTP header:
  ```http
  Authorization: Bearer gs_xxxxxxxxxxxxxxxx
  ```

### Free Tier, Quotas & Pricing Structure
- **Free Tier:** Offers **100 free credits** upon signing up without requiring a credit card.
- **Credit Consumption Model:**
  - Standard user profile lookup (`/user/by/username`): **1 credit**.
  - Media retrieval by username (`/user/medias/by/username`): **2–3 credits** (higher cost because it resolves numeric ID upstream).
  - Paginated media chunk query (`/user/medias/chunk?user_id=...`): **1 credit**.
  - Typical complete profile analysis cost in CreatorScope: **3–4 credits per creator audit**.
- **Paid Packs:**
  - Pay-as-you-go credit packs (no mandatory recurring monthly fee).
  - Starter pack: ~$29 for ~15,400 credits (~3,800 full creator analyses).
  - Mid pack: ~$99 for ~70,000 credits.
  - Scale pack: ~$300 for ~320,000 credits.
- **What happens when quota is exhausted?**
  - GramScraper returns HTTP `429 Too Many Requests` or `402 Payment Required`.
  - CreatorScope detects this status code and returns an actionable `ProviderRateLimitError` explaining that credits or rate limits were reached.

### Legal, Terms of Service & Commercial SaaS Suitability
> [!WARNING] Important Commercial & Legal Disclaimers
1. **Instagram / Meta Terms of Service:** Meta’s Terms explicitly prohibit automated data collection and scraping without prior written authorization.
2. **Third-Party Scraping Risk:** Services like GramScraper operate as third-party scraping networks using rotating residential proxies. They are **not** official Meta Business Partners.
3. **Platform Volatility:** Scrapers can occasionally experience partial downtime or degraded response times when Meta updates its front-end bundle or rate-limiting algorithms.
4. **Commercial SaaS Consideration:** If packaging CreatorScope as a commercial product for enterprise clients, note that resale of scraped data carries platform risk. Official Meta Graph API is required for verified commercial partnership, but Meta Graph API **only** permits analyzing accounts that have granted direct OAuth authorization.

---

## 2. Data Provider Comparison & Alternatives

| Provider | Free Tier / Trial | Cost at Scale | Public Profile Access? | Private Insights (Reach/Saves)? | Risk Profile |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CreatorScope Mock Provider** | **100% Free forever** | $0 | Yes (Deterministic realistic dataset) | Clearly labeled as sample | **Zero risk** (Offline/Dev) |
| **GramScraper API** | 100 free credits | ~$29 for ~15.4k credits | Yes (Any public creator) | No (Public data only) | Medium (Third-party scraper) |
| **Official Instagram Graph API** | Free (Meta developer) | $0 infrastructure | **No** (Only authenticated accounts) | **Yes** (Reach, impressions, demographics) | Zero risk (Official Meta API) |
| **Apify Instagram Scraper** | $5 free tier monthly | Pay-per-usage ($49/mo+) | Yes | No | Medium |
| **RapidAPI Instagram Scrapers** | 50-100 free requests/mo | $10 - $50/mo | Yes | No | Medium |

---

## 3. Hosting & Infrastructure Costs (Vercel-First)

### Frontend Hosting: Vercel
- **Plan:** Vercel Hobby (Free Tier).
- **Inclusions:**
  - Unlimited preview deployments.
  - 100 GB bandwidth / month.
  - Continuous integration via GitHub.
  - Automatic SSL / HTTPS.
- **Risk of Charges:** **$0** (Vercel Hobby plan does not automatically charge for bandwidth overages; it halts or alerts).

### Backend Hosting Options
1. **Render (Free Tier):**
   - Free Web Service for FastAPI.
   - Limitation: Spins down (sleeps) after 15 minutes of inactivity. First request takes ~30-50s to wake up.
2. **Railway / Fly.io:**
   - Free trial credits / low-tier pay-as-you-go (~$5/mo).
3. **Vercel Serverless (Full-Stack on Vercel):**
   - Can run Python ASGI apps via serverless function configuration (`vercel.json`).
   - Limitation: 10s execution timeout on Hobby tier (requires caching long upstream scraper requests).

### Database & Persistence
- **Default in CreatorScope:** Built-in **SQLite** (`creatorscope.db`).
  - Cost: **$0.00**. Completely self-contained, zero dependencies, no credentials required.
- **Optional Supabase (PostgreSQL):**
  - Free Tier: 500 MB database, 50,000 monthly active users.
  - Limitation: Free projects pause after 1 week of inactivity.

---

## 4. How to Run Without Spending Any Money

By default, CreatorScope is pre-configured to run with:
```bash
INSTAGRAM_PROVIDER=mock
```
In mock mode:
- All analytics algorithms, median calculations, engagement formulas, CSV exports, comparison tables, and charts run at 100% capacity.
- Zero network requests are made to third-party paid APIs.
- Zero risk of unexpected credit consumption or billings.

To test live data with GramScraper’s 100 free trial credits:
1. Register for an account at [gramscraper.com](https://gramscraper.com) to receive an API key.
2. Set in `.env`:
   ```bash
   INSTAGRAM_PROVIDER=gramscraper
   GRAMSCRAPER_API_KEY=gs_your_trial_key
   ```
3. CreatorScope will use your 100 free credits and respect rate limits.
