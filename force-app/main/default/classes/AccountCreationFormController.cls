public with sharing class AccountCreationFormController {

    // ─── Picklist options ──────────────────────────────────────────────────────

    /**
     * Returns active Industry picklist values for the combobox.
     * Cacheable so the wire adapter can cache responses client-side.
     */
    @AuraEnabled(cacheable=true)
    public static List<IndustryOption> getIndustryOptions() {
        List<IndustryOption> options = new List<IndustryOption>();
        for (Schema.PicklistEntry entry : Account.Industry.getDescribe().getPicklistValues()) {
            if (entry.isActive()) {
                options.add(new IndustryOption(entry.getLabel(), entry.getValue()));
            }
        }
        return options;
    }

    // ─── Account creation ──────────────────────────────────────────────────────

    /**
     * Inserts a new Account and returns the saved record (Id + Name).
     * Server-side validation mirrors client-side rules so the API is safe
     * when called directly (e.g. from tests or external integrations).
     *
     * @param name          Account Name (required, non-blank)
     * @param phone         Phone (optional)
     * @param industry      Industry picklist value (optional)
     * @param annualRevenue Annual Revenue — must be positive if supplied
     * @return              Newly created Account with Id and Name populated
     */
    @AuraEnabled
    public static Account createAccount(
        String  name,
        String  phone,
        String  industry,
        Decimal annualRevenue
    ) {
        try {
            if (String.isBlank(name)) {
                throw ahe('Account Name is required.');
            }
            if (annualRevenue != null && annualRevenue <= 0) {
                throw ahe('Annual Revenue must be a positive number.');
            }

            Account acc = new Account(
                Name          = name.trim(),
                Phone         = phone,
                Industry      = industry,
                AnnualRevenue = annualRevenue
            );

            // Strip fields the running user cannot create (field-level security)
            SObjectAccessDecision decision = Security.stripInaccessible(
                AccessType.CREATABLE,
                new List<Account>{ acc }
            );
            insert decision.getRecords();

            Id newId = decision.getRecords()[0].Id;
            return [SELECT Id, Name FROM Account WHERE Id = :newId WITH SECURITY_ENFORCED LIMIT 1];

        } catch (AuraHandledException e) {
            throw e;
        } catch (DmlException e) {
            throw ahe(e.getDmlMessage(0));
        } catch (Exception e) {
            throw ahe(e.getMessage());
        }
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /**
     * AuraHandledException.getMessage() returns "Script-thrown exception" in
     * Apex test context unless setMessage() is called explicitly. This helper
     * ensures both the LWC-facing body and the Apex-catchable message are set
     * to the same string, making the exception fully testable.
     */
    @TestVisible
    private static AuraHandledException ahe(String message) {
        AuraHandledException e = new AuraHandledException(message);
        e.setMessage(message);
        return e;
    }

    // ─── Inner wrapper ─────────────────────────────────────────────────────────

    public class IndustryOption {
        @AuraEnabled public String label;
        @AuraEnabled public String value;

        public IndustryOption(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }
}