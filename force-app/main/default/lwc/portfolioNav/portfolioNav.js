import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class PortfolioNav extends NavigationMixin(LightningElement) {

    @api currentPage = 'home';

    handleHome(event) {
        event.preventDefault();
        this._navigateTo('home');
    }

    handleNavPage(event) {
        event.preventDefault();
        const page = event.currentTarget.dataset.page;
        this._navigateTo(page);
    }

    _navigateTo(page) {
        if (page === 'blog') {
            this[NavigationMixin.Navigate]({
                type: 'comm__namedPage',
                attributes: { name: 'blog__c' }
            });
        } else {
            this[NavigationMixin.Navigate]({
                type: 'comm__namedPage',
                attributes: { name: 'Home' }
            });
        }
    }
}
