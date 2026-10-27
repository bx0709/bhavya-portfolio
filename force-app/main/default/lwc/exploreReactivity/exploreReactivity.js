import { LightningElement } from 'lwc';

export default class ExploreReactivity extends LightningElement {

    message = 'HELLO';

    renderedCallback(){
        console.log('renderedCallback invoked');
    }

    handleClick(){
        this.message = 'Good Morning';
    }
}