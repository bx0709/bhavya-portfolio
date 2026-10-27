/**
 * PortfolioSyncService
 * REST endpoint for portfolio data synchronization.
 * Called by Google Apps Script to sync portfolio data from Google Docs.
 */
@RestResource(urlMapping='/portfolio/sync')
global with sharing class PortfolioSyncService {

    @HttpPost
    global static SyncResponse doPost() {
        RestRequest  req  = RestContext.request;
        RestResponse res  = RestContext.response;

        SyncResponse response = new SyncResponse();
        try {
            String body = req.requestBody.toString();
            SyncPayload payload = (SyncPayload) JSON.deserialize(body, SyncPayload.class);

            if (payload == null || payload.sections == null || payload.sections.isEmpty()) {
                res.statusCode = 400;
                response.success = false;
                response.message = 'No sections provided in payload.';
                return response;
            }

            List<Portfolio_Data__c> toUpsert = new List<Portfolio_Data__c>();
            for (SectionItem item : payload.sections) {
                if (String.isBlank(item.section) || String.isBlank(item.content)) continue;
                toUpsert.add(new Portfolio_Data__c(
                    Name           = item.section,
                    Section__c     = item.section,
                    Content_JSON__c= item.content,
                    Last_Synced__c = DateTime.now(),
                    Sync_Status__c = 'Success',
                    Error_Message__c = null
                ));
            }

            if (!toUpsert.isEmpty()) {
                upsert toUpsert Name;
            }

            response.success        = true;
            response.message        = 'Synced ' + toUpsert.size() + ' section(s) successfully.';
            response.syncedAt       = DateTime.now().format();
            response.sectionsCount  = toUpsert.size();
            res.statusCode          = 200;

        } catch (Exception e) {
            res.statusCode      = 500;
            response.success    = false;
            response.message    = e.getMessage();
            // Log error on all sections
            logSyncError(e.getMessage());
        }
        return response;
    }

    private static void logSyncError(String msg) {
        try {
            List<Portfolio_Data__c> all = [SELECT Id FROM Portfolio_Data__c LIMIT 50];
            for (Portfolio_Data__c pd : all) {
                pd.Sync_Status__c    = 'Error';
                pd.Error_Message__c  = msg;
            }
            if (!all.isEmpty()) update all;
        } catch (Exception ex) { /* swallow */ }
    }

    // ─── INNER CLASSES ──────────────────────────────────────────────────────────

    global class SyncPayload {
        global List<SectionItem> sections;
    }

    global class SectionItem {
        global String section;
        global String content;
    }

    global class SyncResponse {
        global Boolean  success;
        global String   message;
        global String   syncedAt;
        global Integer  sectionsCount;
    }
}