# Bhavya Gulati — Salesforce Developer Portfolio

A Salesforce DX project powering a public Experience Cloud portfolio site.

**Live site:** https://orgfarm-2f1a2a70ae-dev-ed.develop.my.site.com/portfolio/

---

## What's in this project

### Lightning Web Components

| Component | Purpose |
|-----------|---------|
| `bhavyaPortfolio` | Main single-page portfolio — Hero, Skills, Experience, Awards, Community, Blog teaser, Education, Contact |
| `portfolioNav` | Shared nav bar used across portfolio and blog pages |
| `blogList` | Blog index page — lists all published `Blog_Post__c` records |
| `blogPost` | Blog detail page — renders a single post by slug |

### Apex Classes

| Class | Purpose |
|-------|---------|
| `PortfolioDataController` | `@AuraEnabled(cacheable=true)` methods for `bhavyaPortfolio` — fetches all `Portfolio_Data__c` sections and last sync time |
| `PortfolioSyncService` | REST endpoint (`/portfolio/sync`) called by Google Apps Script to upsert portfolio content into `Portfolio_Data__c` |
| `BlogController` | `@AuraEnabled(cacheable=true)` methods for blog components — returns published `Blog_Post__c` records |
| `BlogControllerTest` | Apex test for `BlogController` |

### Custom Objects

- **`Portfolio_Data__c`** — stores portfolio content as JSON blobs keyed by section (`hero`, `skills`, `experience`, `awards`, `community`, `certifications`, `contact`). Populated by the Google Docs sync.
- **`Blog_Post__c`** — stores blog posts with fields: Title, Slug, Content, Summary, Tags, Published Date, Status, Featured Image URL.

### Other Metadata

- `permissionsets/PortfolioAssistant` — grants `BlogController` Apex access for Experience Cloud guest users
- `config/project-scratch-def.json` — scratch org definition

---

## How data gets into the site

`Portfolio_Data__c` records are synced from a Google Doc via a Google Apps Script that POSTs JSON to the `PortfolioSyncService` REST endpoint. The `bhavyaPortfolio` LWC fetches these records at runtime; if no data is found it falls back to hardcoded defaults embedded in the component.

---

## Deploy to a scratch org

```bash
# 1. Authenticate and create a scratch org
sf org login web --set-default-dev-hub
sf org create scratch --definition-file config/project-scratch-def.json --set-default --duration-days 7 --wait 10

# 2. Push source
sf project deploy start --source-dir force-app

# 3. Assign permission set
sf org assign permset --name PortfolioAssistant

# 4. Open the org
sf org open
```

Then add `bhavyaPortfolio` to a page in Experience Builder (or an App Builder home page) to preview it.

---

## Tech stack

- Salesforce Experience Cloud (LWR runtime)
- Lightning Web Components
- Apex (cacheable wire adapters, REST resource)
- SOQL — `Portfolio_Data__c`, `Blog_Post__c`
- Google Apps Script (external sync trigger, not in this repo)
