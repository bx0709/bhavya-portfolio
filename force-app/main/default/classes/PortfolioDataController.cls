/**
 * PortfolioDataController
 * Apex controller for the bhavyaPortfolio LWC.
 *
 * Both methods are cacheable=true — required for Guest User access in Experience Cloud.
 * Uses "without sharing" to allow unauthenticated guest users to view portfolio data.
 * This is safe because portfolio data is public information (resume/CV content).
 * The LWC uses @wire for the initial render (served from platform cache),
 * then immediately calls refreshApex in connectedCallback to bust the cache
 * and fetch whatever Portfolio_Data__c contains post-Google Docs sync.
 */
global without sharing class PortfolioDataController {

    // ─── ALL SECTIONS ────────────────────────────────────────────────────────────
    /**
     * Returns all portfolio sections as { sectionKey -> contentJSON }.
     * cacheable=true (Guest User compatible). Cache is busted by refreshApex on every load.
     */
    @AuraEnabled(cacheable=true)
    public static Map<String, String> getAllSections() {
        Map<String, String> result = new Map<String, String>();
        for (Portfolio_Data__c pd : [
            SELECT Name, Section__c, Content_JSON__c, Last_Synced__c, Sync_Status__c
            FROM Portfolio_Data__c
            WHERE Sync_Status__c = 'Success'
            ORDER BY Section__c ASC
        ]) {
            if (String.isNotBlank(pd.Content_JSON__c)) {
                result.put(pd.Section__c, pd.Content_JSON__c);
            }
        }
        return result;
    }

    // ─── LAST SYNC TIME ──────────────────────────────────────────────────────────
    /**
     * Returns the most recent Last_Synced__c timestamp across all sections.
     * Used for the "Synced from Google Docs · {time}" badge in the UI.
     * cacheable=true (Guest User compatible). Cache is busted by refreshApex on every load.
     */
    @AuraEnabled(cacheable=true)
    public static DateTime getLastSyncTime() {
        List<Portfolio_Data__c> latest = [
            SELECT Last_Synced__c
            FROM Portfolio_Data__c
            ORDER BY Last_Synced__c DESC
            LIMIT 1
        ];
        return latest.isEmpty() ? null : latest[0].Last_Synced__c;
    }

}