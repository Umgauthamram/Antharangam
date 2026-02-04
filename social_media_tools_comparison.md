# Social Media Scraping Tools: Market Comparison & Cost Analysis

This document provides a comparative analysis between **Antharangam** (your custom local intelligence harvesting system) and the top commercial social media scraping platforms in the market for 2025.

---

## 1. Market Competitor Analysis

### A. Bright Data (formerly Luminati)
**The Enterprise Heavyweight**
Bright Data is the industry standard for large-scale enterprise data collection, known for its massive residential proxy network (72M+ IPs).

*   **Cost Model**: Premium Consumption-Based.
    *   **Pay-As-You-Go**: ~$3 per 1,000 requests (Web Unlocker).
    *   **Commitment Plans**: Starts at **$500/month**.
    *   **Data Usage**: Charged per GB bandwidth (e.g., $8-$15/GB for residential proxies).
*   **What you pay for**: 
    *   **Unblocking Success**: They handle all CAPTCHAs, IP bans, and headers. You just get the HTML/JSON.
    *   **Compliance**: Full GDPR/CCPA compliance tools.
    *   **Infrastructure**: No servers to manage; fully cloud-based.

### B. Apify
**The Modular Platform**
Apify is a cloud platform where you run pre-built "Actors" (scripts) for specific platforms (Instagram Scraper, TikTok Scraper, etc.).

*   **Cost Model**: Resource Unit (CU) + Monthly Subscription.
    *   **Starter Plan**: **$49/month** (includes $49 credits).
    *   **Scale Plan**: **$499/month**.
    *   **Compute Units (CU)**: RAM + CPU usage per second. Heavy scraping consumes credits fast.
*   **What you pay for**: 
    *   **Pre-built Scrapers**: You don't write code; you just rent a maintainer's script.
    *   **Maintenance**: If Instagram changes its CSS, the Actor maintainer fixes it (usually).
    *   **Cloud Storage**: Data is stored and accessible via API.

### C. ScraperAPI
**The Proxy API Wrapper**
ScraperAPI focuses purely on handling the proxy/browser rotation layer. You supply the URL, they return the HTML.

*   **Cost Model**: Credit-Based / Tiered.
    *   **Hobby**: **$49/month** (100k credits).
    *   **Business**: **$299/month** (3M credits).
    *   **Premium features**: "Hard" sites (like Google/LinkedIn) cost 10-25 credits *per request*.
*   **What you pay for**: 
    *   **IP Rotation**: Automatic rotation of millions of proxies.
    *   **Anti-Bot Evasion**: Headers and TLS fingerprinting handling.

---

## 2. Antharangam (Custom In-House Solution)
**The Sovereign Intelligence Engine**
Antharangam is a self-hosted, customized intelligence system that runs generic scrapers (Puppeteer) enhanced by local AI/Logic.

*   **Cost Model**: Infrastructure + Maintenance (time).
*   **Direct Costs**:
    *   **Software**: **$0** (Open Source / Custom Code).
    *   **Per-Record Cost**: **$0** (Unlimited scraping within hardware limits).
    *   **AI Analysis**: **$0** (Currently using Local Rules-Based logic).
*   **Hidden/Indirect Costs**:
    *   **Server/VPS**: ~$20-$50/month (e.g., AWS EC2, DigitalOcean) for 24/7 scraping.
    *   **Proxies**: **CRITICAL COST**. To match Bright Data's reliability, you would need to buy a residential proxy pool (e.g., Smartproxy, IPRoyal @ ~$10/GB).
    *   **Maintenance**: High. You must fix the code manually when Twitter/Facebook updates their UI.

---

## 3. Comparison Cost Table

| Feature / Cost Factor | **Antharangam** (In-House) | **Bright Data** (Enterprise) | **Apify** (Cloud Platform) | **ScraperAPI** (Proxy Service) |
| :--- | :--- | :--- | :--- | :--- |
| **Monthly Subscription** | **$0** (Free Software) | **$500+** (Commitment) | **$49 - $499** | **$49 - $299** |
| **Cost Per Request** | **$0.00** | ~$0.003 - $0.01 | Variable (Compute Time) | ~$0.0005 - $0.012 |
| **Data Bandwidth** | Server Cost (Cheap) | Expensive ($15/GB+) | Included in CU | Included in Credits |
| **Proxy Cost** | **$0 - $50/mo** (User managed) | Included | Included | Included |
| **Setup Difficulty** | High (Coding required) | Low (API calls) | Low (UI based) | Medium (API integration) |
| **Maintenance** | **High** (You fix bugs) | Zero (Managed) | Low (Maintainers fix) | Zero (Managed layer) |
| **Custom AI Analysis** | **Unlimited (Local)** | Not Included | Not Included | Not Included |
| **Scalability** | Limited by Hardware | Unlimited | High | Unlimited |

---

## 4. Key Takeaways

### Why Others Charge So Much
1.  **IP Reputation**: They own millions of residential IPs. If you scrape too fast on Antharangam using a single server IP, you **will** get blocked by Twitter/Facebook immediately. Competitors rotate IPs to avoid this.
2.  **Cat-and-Mouse Game**: Social media giants pay engineers to block scrapers. Competitors pay engineers to bypass those blocks 24/7. With Antharangam, **you** are that engineer.

### The Antharangam Advantage
*   **Sovereignty**: Data never leaves your system.
*   **Deep Customization**: You have deeply integrated risk scoring and "Magic Search" that no generic tool offers.
*   **Cost Efficiency**: For targeted, specific investigations (e.g., 50-100 profiles/day), Antharangam is virtually free. It only becomes expensive (time-wise) if you try to scrape millions of records.

### Recommendation
For the current scope (targeted intelligence gathering), **Antharangam is far superior in cost-to-value**.
*   **Suggestion**: If you face improved blocking from target sites, integrate a cheap **Proxy Service** (like ScraperAPI or Smartproxy) *into* Antharangam as a plugin, rather than replacing the whole system. This gives you the best of both worlds: cheap custom software with professional unblocking capabilities.
