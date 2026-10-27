# Portfolio AI Assistant (Agentforce + Slack) - Implementation Guide

This project scaffolds an AI-powered portfolio assistant that:
- Answers questions about your Salesforce experience (seeded from a Static Resource KB)
- Sends you a Slack DM when a visitor submits a contact form

Contents created:
- Static Resource knowledge base: `force-app/main/default/staticresources/portfolio_kb.json`
- Invocable Apex (Slack DM): `force-app/main/default/classes/PortfolioSlackMessenger.cls` (+ test)
- External Credential + Named Credential for Slack OAuth:
  - `force-app/main/default/externalCredentials/Slack_EC.externalCredential-meta.xml`
  - `force-app/main/default/namedCredentials/Slack_NC.namedCredential-meta.xml`
- Permission Set to grant access: `force-app/main/default/permissionsets/PortfolioAssistant.permissionset-meta.xml`
- LWC UI widget: `force-app/main/default/lwc/portfolioAssistant/*`

Next steps to run locally (scratch org) and deploy:
1) Authenticate to your DevHub and create a scratch org:
   - sf org login web --set-default-dev-hub
   - sf org create scratch --definition-file config/project-scratch-def.json --set-default --duration-days 7 --wait 10
2) Push metadata:
   - sf project deploy start --source-dir force-app
3) Assign permission set:
   - sf org assign permset --name PortfolioAssistant
4) Add the `Portfolio Assistant` LWC to a Lightning App page or Home page in the org (via App Builder) and preview.

Slack OAuth setup (External Credentials + Named Credential):
1) Create a Slack app at https://api.slack.com/apps
2) Configure OAuth & Permissions:
   - Redirect URL: copy your Salesforce OAuth callback (replace value in `redirect_uri` parameter in External Credential or complete via UI)
   - Scopes (minimum for posting): chat:write, im:write, users:read
3) Install the app to your workspace to obtain access tokens (External Credentials manages token flow).
4) In Salesforce:
   - Open Setup → Named Credentials → External Credentials
   - Create/update `Slack External Credential (Slack_EC)` with your Slack Client ID/Secret and Redirect URI
   - Ensure principal is configured and authenticated (Named Principal)
   - Create `Slack_NC` Named Credential pointed to https://slack.com/api and reference External Credential `Slack_EC`
5) In Slack, choose a DM target:
   - For direct user DM: obtain your Slack user ID (format UXXXXXXXX) or a channel ID (CXXXXXXXX, GXXXXXXXX)
6) Replace placeholders:
   - In Apex and LWC, replace 'DUMMY_TARGET_REPLACE_ME' with your Slack user/channel ID.

Agentforce wiring (intents + action):
While the LWC currently uses simple client-side responses, you can connect the agent as follows:
- Create an Agent in Agentforce Agent Builder (e.g., PortfolioAssistant) with:
  - Persona/system prompt:
    “You are Bhavya’s AI Portfolio Assistant. You are grounded in the provided knowledge base (portfolio_kb.json). You answer concisely about Bhavya’s background, projects, and technologies. When a user asks to contact, collect name, email, and message, then invoke SendSlackDM with those fields and page URL. Avoid hallucinations; if unknown, ask to clarify.”
  - Knowledge Source:
    - Upload the contents of `portfolio_kb.json` or serve the same JSON content via Static Resource integration supported by Agentforce (if using a custom integration surface).
  - Intents:
    - ask_about_me: match queries like “Who is Bhavya?” RESPONSE: use About/persona and skills sections.
    - list_projects: match “projects”, “portfolio” RESPONSE: summarize projects array.
    - list_technologies: match “tech”, “stack” RESPONSE: summarize skills.ui/languages/integration/devops.
    - request_contact: match “contact”, “reach out”, “DM” ACTION: invoke SendSlackDM(name, email, message, sourceUrl).
  - Action contract (SendSlackDM):
    - Inputs: name (String), email (String), message (String), sourceUrl (String)
    - Behavior: Call Apex invocable class PortfolioSlackMessenger via Flow or Apex action surface.
- Optional Flow:
  - Create a screenless autolaunched flow “Portfolio_SendSlackDM”
  - Add an Apex action element referencing PortfolioSlackMessenger.send
  - Map inputs (name, email, message, sourceUrl) to the Apex request collection (one entry)
  - Return Slack ts/channel to the agent for confirmation

Testing:
- LWC chat should render and respond to quick prompts
- Submitting Contact with all fields triggers invocable callout (will fail until Slack OAuth + target are configured)
- Apex tests: run
  - sf apex run test --tests PortfolioSlackMessengerTest --code-coverage --result-format human --wait 10

Notes
- All URLs/IDs are placeholders; never commit secrets. Use Named/External Credentials for OAuth.
- The code uses with sharing and no DML/SOQL loops. No hard-coded org data.
- You can expand the KB by editing `portfolio_kb.json`. Consider moving to a document store or Agentforce-managed source later.
- For Experience Cloud or external embedding, this LWC can be added to site pages. For pure external websites, consider rendering via Experience Cloud or custom micro-frontend that talks to the Agentforce endpoint.

Troubleshooting
- Permission set XML: externalCredentialPrincipalAccesses element order matters (enabled must be a child)
- Slack 401/403: verify scopes, install app to workspace, ensure Named Credential principal is authenticated
- Mixed content/CORS: keep all callouts through Named Credential domain https://slack.com/api
- LWC errors on callout: ensure a permission set assigns Apex class access and user has permission to External Credential principal