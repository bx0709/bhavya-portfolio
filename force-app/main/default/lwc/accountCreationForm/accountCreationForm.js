import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getIndustryOptions from '@salesforce/apex/AccountCreationFormController.getIndustryOptions';
import createAccount from '@salesforce/apex/AccountCreationFormController.createAccount';

export default class AccountCreationForm extends LightningElement {
    accountName = '';
    phone = '';
    industry = '';
    annualRevenue = null;
    isLoading = false;

    // ─── Wire ────────────────────────────────────────────────────────────────

    @wire(getIndustryOptions)
    wiredIndustryOptions;

    get industryOptions() {
        const none = [{ label: '--None--', value: '' }];
        return this.wiredIndustryOptions?.data
            ? [...none, ...this.wiredIndustryOptions.data]
            : none;
    }

    // ─── Field change handlers ────────────────────────────────────────────────

    handleNameChange(event) {
        this.accountName = event.detail.value;
        this._clearValidity('accountName');
    }

    handlePhoneChange(event) {
        this.phone = event.detail.value;
    }

    handleIndustryChange(event) {
        this.industry = event.detail.value;
    }

    handleRevenueChange(event) {
        this.annualRevenue = event.detail.value;
        this._clearValidity('annualRevenue');
    }

    // ─── Validation ───────────────────────────────────────────────────────────

    _validate() {
        // Run built-in constraint validation (required, type, etc.)
        const allValid = [
            ...this.template.querySelectorAll('lightning-input'),
            ...this.template.querySelectorAll('lightning-combobox'),
        ].reduce((acc, el) => {
            el.reportValidity();
            return acc && el.checkValidity();
        }, true);

        if (!allValid) return false;

        // Account Name must not be blank (belt-and-suspenders beyond `required`)
        if (!this.accountName?.trim()) {
            this._setValidity('accountName', 'Account Name is required.');
            return false;
        }

        // Annual Revenue must be positive if provided
        const revenue = Number(this.annualRevenue);
        if (this.annualRevenue !== null && this.annualRevenue !== '' && revenue <= 0) {
            this._setValidity('annualRevenue', 'Annual Revenue must be a positive number.');
            return false;
        }

        return true;
    }

    _setValidity(dataId, message) {
        const el = this.template.querySelector(`[data-id="${dataId}"]`);
        if (el) {
            el.setCustomValidity(message);
            el.reportValidity();
        }
    }

    _clearValidity(dataId) {
        const el = this.template.querySelector(`[data-id="${dataId}"]`);
        if (el?.setCustomValidity) {
            el.setCustomValidity('');
        }
    }

    // ─── Save / Clear ─────────────────────────────────────────────────────────

    async handleSave() {
        if (!this._validate()) return;

        this.isLoading = true;
        try {
            const result = await createAccount({
                name: this.accountName.trim(),
                phone: this.phone || null,
                industry: this.industry || null,
                annualRevenue: this.annualRevenue !== null && this.annualRevenue !== ''
                    ? Number(this.annualRevenue)
                    : null,
            });

            this._showToast('Success', `Account "${result.Name}" was created successfully.`, 'success');
            this._resetForm();
        } catch (error) {
            const msg = error?.body?.message ?? 'An unexpected error occurred. Please try again.';
            this._showToast('Error Creating Account', msg, 'error');
        } finally {
            this.isLoading = false;
        }
    }

    handleClear() {
        this._resetForm();
    }

    // ─── Utilities ────────────────────────────────────────────────────────────

    _resetForm() {
        this.accountName = '';
        this.phone = '';
        this.industry = '';
        this.annualRevenue = null;

        // Clear any lingering custom validity messages
        [
            ...this.template.querySelectorAll('lightning-input'),
            ...this.template.querySelectorAll('lightning-combobox'),
        ].forEach(el => {
            if (el.setCustomValidity) el.setCustomValidity('');
        });
    }

    _showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}