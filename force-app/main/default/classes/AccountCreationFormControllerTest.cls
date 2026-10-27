@IsTest
private class AccountCreationFormControllerTest {

    // ─── Positive: single account with all fields ──────────────────────────────

    @IsTest
    static void testCreateAccountAllFields() {
        Test.startTest();
        Account result = AccountCreationFormController.createAccount(
            'Acme Corp', '415-555-0100', 'Technology', 1500000.00
        );
        Test.stopTest();

        Assert.isNotNull(result.Id, 'Should return a record with an Id');
        Assert.areEqual('Acme Corp', result.Name, 'Name should match');

        Account saved = [
            SELECT Id, Name, Phone, Industry, AnnualRevenue
            FROM Account
            WHERE Id = :result.Id
        ];
        Assert.areEqual('415-555-0100', saved.Phone,         'Phone should be saved');
        Assert.areEqual('Technology',   saved.Industry,      'Industry should be saved');
        Assert.areEqual(1500000.00,     saved.AnnualRevenue, 'Annual Revenue should be saved');
    }

    // ─── Positive: only required field ────────────────────────────────────────

    @IsTest
    static void testCreateAccountMinimalFields() {
        Test.startTest();
        Account result = AccountCreationFormController.createAccount(
            'Minimal Corp', null, null, null
        );
        Test.stopTest();

        Assert.isNotNull(result.Id);
        Assert.areEqual('Minimal Corp', result.Name);

        Account saved = [SELECT Phone, Industry, AnnualRevenue FROM Account WHERE Id = :result.Id];
        Assert.isNull(saved.Phone,         'Phone should be null');
        Assert.isNull(saved.Industry,      'Industry should be null');
        Assert.isNull(saved.AnnualRevenue, 'Annual Revenue should be null');
    }

    // ─── Positive: name with leading/trailing whitespace is trimmed ────────────

    @IsTest
    static void testCreateAccountTrimsName() {
        Test.startTest();
        Account result = AccountCreationFormController.createAccount(
            '  Trimmed Corp  ', null, null, null
        );
        Test.stopTest();

        Assert.areEqual('Trimmed Corp', result.Name, 'Name should be trimmed');
    }

    // ─── Positive: picklist options are returned ───────────────────────────────

    @IsTest
    static void testGetIndustryOptions() {
        Test.startTest();
        List<AccountCreationFormController.IndustryOption> options =
            AccountCreationFormController.getIndustryOptions();
        Test.stopTest();

        Assert.isNotNull(options, 'Options list must not be null');
        Assert.isFalse(options.isEmpty(), 'Account Industry picklist should have entries');

        AccountCreationFormController.IndustryOption first = options[0];
        Assert.isNotNull(first.label, 'Each option must have a label');
        Assert.isNotNull(first.value, 'Each option must have a value');
    }

    // ─── Bulk: 50 sequential creates stay within governor limits ──────────────

    @IsTest
    static void testCreateAccountBulk() {
        Integer count = 50;

        Test.startTest();
        for (Integer i = 0; i < count; i++) {
            AccountCreationFormController.createAccount(
                'Bulk Account ' + i,
                '555-' + String.valueOf(i).leftPad(7, '0'),
                'Technology',
                10000.00 * (i + 1)
            );
        }
        Test.stopTest();

        Assert.areEqual(count, [SELECT COUNT() FROM Account],
            'All ' + count + ' accounts should have been created');
    }

    // ─── Negative: blank name ─────────────────────────────────────────────────

    @IsTest
    static void testCreateAccountBlankNameThrows() {
        try {
            Test.startTest();
            AccountCreationFormController.createAccount('', null, null, null);
            Test.stopTest();
            Assert.fail('Expected AuraHandledException for blank name');
        } catch (AuraHandledException e) {
            Assert.areEqual('Account Name is required.', e.getMessage());
        }
    }

    // ─── Negative: null name ──────────────────────────────────────────────────

    @IsTest
    static void testCreateAccountNullNameThrows() {
        try {
            Test.startTest();
            AccountCreationFormController.createAccount(null, null, null, null);
            Test.stopTest();
            Assert.fail('Expected AuraHandledException for null name');
        } catch (AuraHandledException e) {
            Assert.areEqual('Account Name is required.', e.getMessage());
        }
    }

    // ─── Negative: whitespace-only name ───────────────────────────────────────

    @IsTest
    static void testCreateAccountWhitespaceNameThrows() {
        try {
            Test.startTest();
            AccountCreationFormController.createAccount('   ', null, null, null);
            Test.stopTest();
            Assert.fail('Expected AuraHandledException for whitespace name');
        } catch (AuraHandledException e) {
            Assert.areEqual('Account Name is required.', e.getMessage());
        }
    }

    // ─── Negative: negative annual revenue ───────────────────────────────────

    @IsTest
    static void testCreateAccountNegativeRevenueThrows() {
        try {
            Test.startTest();
            AccountCreationFormController.createAccount('Valid Name', null, null, -500.00);
            Test.stopTest();
            Assert.fail('Expected AuraHandledException for negative revenue');
        } catch (AuraHandledException e) {
            Assert.areEqual('Annual Revenue must be a positive number.', e.getMessage());
        }
    }

    // ─── Negative: zero annual revenue ────────────────────────────────────────

    @IsTest
    static void testCreateAccountZeroRevenueThrows() {
        try {
            Test.startTest();
            AccountCreationFormController.createAccount('Valid Name', null, null, 0);
            Test.stopTest();
            Assert.fail('Expected AuraHandledException for zero revenue');
        } catch (AuraHandledException e) {
            Assert.areEqual('Annual Revenue must be a positive number.', e.getMessage());
        }
    }

    // ─── Negative: no record created on failure ───────────────────────────────

    @IsTest
    static void testNoRecordCreatedOnValidationFailure() {
        try {
            AccountCreationFormController.createAccount(null, '555-1234', 'Technology', 5000.00);
        } catch (AuraHandledException e) {
            // Expected
        }
        Assert.areEqual(0, [SELECT COUNT() FROM Account],
            'No Account should be inserted when validation fails');
    }
}