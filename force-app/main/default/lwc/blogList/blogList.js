import { LightningElement, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getPublishedPosts from '@salesforce/apex/BlogController.getPublishedPosts';

export default class BlogList extends NavigationMixin(LightningElement) {
    posts = [];
    error;
    isLoading = true;

    @wire(getPublishedPosts)
    wiredPosts({ data, error }) {
        this.isLoading = false;
        if (data) {
            this.posts = data;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.posts = [];
        }
    }

    get hasPosts() {
        return this.posts && this.posts.length > 0;
    }

    get hasError() {
        return !!this.error;
    }

    handlePostClick(event) {
        const slug = event.currentTarget.dataset.slug;
        // Update 'blogDetail' below to match the actual Experience Builder page API name.
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: { name: 'blogDetail__c' },
            state: { slug }
        });
    }
}