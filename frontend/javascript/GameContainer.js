export default class GameContainer extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {}
}

window.customElements.define('game-container', GameContainer);
