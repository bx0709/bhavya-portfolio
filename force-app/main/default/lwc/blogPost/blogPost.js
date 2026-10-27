import { LightningElement, wire } from 'lwc';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
import getPostBySlug from '@salesforce/apex/BlogController.getPostBySlug';

export default class BlogPost extends NavigationMixin(LightningElement) {
    slug;
    post;
    error;
    isLoading = true;
    notFound = false;

    @wire(CurrentPageReference)
    getPageReference(pageRef) {
        const newSlug = pageRef && pageRef.state ? pageRef.state.slug : undefined;
        if (newSlug && newSlug !== this.slug) {
            this.slug = newSlug;
            this.loadPost();
        }
    }

    loadPost() {
        this.isLoading = true;
        this.notFound = false;
        getPostBySlug({ slug: this.slug })
            .then((result) => {
                this.isLoading = false;
                if (result) {
                    this.post = result;
                    this.error = undefined;
                } else {
                    this.post = undefined;
                    this.notFound = true;
                }
            })
            .catch((error) => {
                this.isLoading = false;
                this.error = error;
                this.post = undefined;
            });
    }

    get hasPost() {
        return !!this.post;
    }

    get hasError() {
        return !!this.error;
    }

    handleBack(event) {
        event.preventDefault();
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: { name: 'blogList__c' }
        });
    }
}