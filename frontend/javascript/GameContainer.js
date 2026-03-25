import * as net from './network.js';
import {isLoggedIn} from "./common.js";

const rewards = {
    1: 10000,
    2: 20000,
    3: 50000,
    4: 100000,
    5: 250000,
    6: 500000,
    7: 750000,
    8: 1000000,
    9: 1500000,
    10: 2000000,
    11: 5000000,
    12: 10000000,
    13: 15000000,
    14: 25000000,
    15: 50000000
};

export default class GameContainer extends HTMLElement {
    constructor() {
        super();

        this._built = false;
        this._elements = {};
        this._currentData = {};
        this._url = '/api/game';
        this._pending = false;
        this._helpRequested = false;
        this.sendAnswer = this.sendAnswer.bind(this);
        this.onHelpRequest = this.onHelpRequest.bind(this);
        this.onAbortRequest = this.onAbortRequest.bind(this);
        this.startGame = this.startGame.bind(this);
        this.startNewGame = this.startNewGame.bind(this);
    }

    toggleUsedHelpButtons() {
        const available = this?._currentData?.availableHelps;

        if (!available) {
            return;
        }

        for (const key of Object.keys(available)) {
            // if (available[key] > 0) {
            //     const button = this.querySelector(`#${key}`);

            //     if (!button) continue;

            //     button.disabled = false;

            //     continue;
            // }

            if (available[key] < 1) {
                const button = this.querySelector(`#${key}`);

                if (button) {
                    button.disabled = true;
                }
            }
        }
    }

    toggleAllHelpButtons(disabled) {
        const buttons = Array.from(this.querySelectorAll('.help-button'));

        for (const button of buttons) {
            button.disabled = disabled;
        }
    }

    async onHelpRequest(e) {
        if (this._helpRequested) {
            return;
        }

        this.toggleAllHelpButtons(true);

        const helpType = e.detail.type;

        if (!helpType) return;

        const response = await net.send('/api/help?type=' + helpType);

        console.log(helpType, response);

        const { success, result } = response;

        if (!success) {
            this._helpRequested = false;

            this.toggleAllHelpButtons(false);

            return;
        }

        switch (helpType) {
            case 'mobile':
                this.showPhoneHelp(result);
                break;
            case 'crowd':
                this.showCrowdHelp(result);
                break;
            case 'halve':
                this.showHalveHelp(result);
                break;
            default:
                console.warn('Invalid help type.');
                break;
        }
    }

    showPhoneHelp(result) {
        this._elements.help.textContent = 'A telefonba ezt mondták: ' + result.valasz;
    }

    showCrowdHelp(result) {
        if (!result.other) return;

        for (const item of result.other) {
            const button = this.querySelector(`#_${item.id}`);

            if (!button) continue;

            const h2 = button.querySelector('h2');

            if (!h2) continue;

            h2.textContent += ` ${parseInt(Number(item.vote) * 100)} szavazat`;
        }
    }

    showHalveHelp(_) {
        this.next();
    }

    async onAbortRequest(e) {
        this.toggleAnswerButtons(true);

        const response = await net.send('/api/game?action=abort');

        const { success, result } = response;

        if (!success || !result) {
            this.toggleAnswerButtons(false);
            return;
        }

        if (success) {
            this._currentData = result;
            this.endGame();
        }
    }

    async connectedCallback() {
        if (this._built) return;
        await this.build();
    }

    async build() {
        this.innerHTML = `
            <center><h1>Legyen ön is milliomos</h1></center>

            <button id="startGameButton" class="gomba">Játék indítása</button>
            <button id="startNewGameButton" class="gomba" hidden>Új játék</button>

            <div id="endScreen"></div>

            <div class="game-content">
                <div id="rewards"></div>

                <div id="main-container">
                    <div class="main">
                        <div id="kerdesSpace">
                            <h2 id="kerdesText"></h2>
                        </div>
                        <div class="row text-center" id="valaszSpace"></div>
                    </div>

                    <div id="toolbar"></div>
                </div>

                <div id="help"></div>
            </div>
        `;

        const e = this._elements;

        e.endScreen = this.querySelector('#endScreen');
        e.questionText = this.querySelector('#kerdesText');
        e.answersContainer = this.querySelector('#valaszSpace');
        e.toolbar = this.querySelector('#toolbar');
        e.startGameButton = this.querySelector('#startGameButton');
        e.startNewGameButton = this.querySelector('#startNewGameButton');
        e.help = this.querySelector('#help');

        e.startGameButton.addEventListener('click', this.startGame);
        e.startNewGameButton.addEventListener('click', this.startNewGame);

        e.rewardsSidebar = this.querySelector('#rewards');

        this.addEventListener('answer-send', this.sendAnswer);
        this.addEventListener('help-request', this.onHelpRequest);
        this.addEventListener('abort-request', this.onAbortRequest);

        await this.init();

        this._built = true;
    }

    async init() {
        const response = await net.send('/api/game/hasongoinggame');

        const { success, result } = response;

        if (!success || !result) {
            return;
        }

        if (result.inprogress) {
            this._elements.startGameButton.textContent = 'Játék folytatása';
        } else if (!result.inprogress) {
            this._elements.startGameButton.textContent = 'Játék indítása';
        }
    }

    createRewardEntry(text) {
        const div = document.createElement('div');
        div.id = '_' + text;
        div.textContent = text;
        return div;
    }

    renderRewards() {
        const rewardsSidebar = this._elements.rewardsSidebar;

        if (!rewardsSidebar) {
            return;
        }

        rewardsSidebar.textContent = '';

        this._elements.rewardEntries = {};

        for (const level of Object.keys(rewards)) {
            const text = rewards[level];
            const entry = rewardsSidebar.appendChild(this.createRewardEntry(text));
            this._elements.rewardEntries[String(text)] = entry;
        }
    }

    createHelpButton(text, helpType) {
        const button = document.createElement('button');
        button.textContent = text;
        button.classList.add('help-button');
        button.id = helpType;

        button.addEventListener('click', () => {
            button.dispatchEvent(
                new CustomEvent('help-request', {
                    detail: {
                        type: helpType
                    },
                    bubbles: true,
                    composed: true
                })
            );
        });

        return button;
    }

    fillToolbar() {
        const toolbar = this._elements.toolbar;

        if (!toolbar) return;

        toolbar.textContent = '';

        const abortButton = document.createElement('button');
        abortButton.textContent = 'Játék megszakítása';

        abortButton.addEventListener('click', () => {
            abortButton.dispatchEvent(
                new CustomEvent('abort-request', {
                    bubbles: true,
                    composed: true
                })
            );
        });

        toolbar.appendChild(abortButton);

        for (const { text, helpType } of [
            { text: 'Telefon', helpType: 'mobile' },
            { text: 'Közönség', helpType: 'crowd' },
            { text: 'Felezés', helpType: 'halve' }
        ]) {
            toolbar.appendChild(this.createHelpButton(text, helpType));
        }
    }

    highlightCurrentReward() {
        const currentReward = this._currentData.currentReward;

        if (!currentReward) return;
        if (!this._elements.rewardEntries) return;

        const rewardEntry = this._elements.rewardEntries[String(currentReward)];

        for (const rewardEntry of Object.values(this._elements.rewardEntries)) {
            rewardEntry?.classList?.remove('highlighted');
        }

        rewardEntry?.classList?.add('highlighted');
    }

    hasEnded() {
        return Boolean(this._currentData?.ended);
    }

    startNewGame() {
        this._elements.startNewGameButton.hidden = true;
        this.renderRewards();
        this.fillToolbar();
        this.next('/api/game?action=start');
    }

    startGame() {
        this._elements.startGameButton.hidden = true;
        this.renderRewards();
        this.fillToolbar();
        this.next('/api/game?action=start');
    }

    endGame() {
        this._elements.startGameButton.hidden = true;
        this._elements.startNewGameButton.hidden = false;
        this._elements.questionText.textContent = '';
        this._elements.answersContainer.textContent = '';
        this._elements.rewardsSidebar.textContent = '';
        this._elements.toolbar.textContent = '';
        this._elements.endScreen.textContent =
            'Nyeremény: ' + this._currentData?.reward + ' forint';
    }

    async next(url = '/api/game') {
        if (!isLoggedIn()) {
            window.location.href = "/auth";
        }

        this._elements.endScreen.textContent = '';
        this._elements.help.textContent = '';

        const response = await net.send(url);

        const { success, result } = response;

        if (!success || !result) {
            this.reset();
            return;
        }

        this._currentData = result;

        if (this.hasEnded()) {
            return this.endGame();
        }

        this._helpRequested = this._currentData.usedHelp;

        if (!this._helpRequested) {
            this.toggleAllHelpButtons(false);
        } else {
            this.toggleAllHelpButtons(true);
        }

        this.toggleUsedHelpButtons();

        this.update();
    }

    reset() {
        window.location.href = '/'; // főolal ahol a játék van -> újratöltés
    }

    update() {
        if (!this._built) return;

        console.log(this._currentData.question);
        this._elements.questionText.textContent = this._currentData.question.kerdes;
        this.listAnswers();
        this.highlightCurrentReward();
    }

    createAnswerButton(text, aid) {
        const button = document.createElement('button');
        const h2 = document.createElement('h2');

        button.id = '_' + aid;
        h2.textContent = text;
        button.classList.add('valasz');
        h2.classList.add('valaszText');
        button.appendChild(h2);

        button.addEventListener('click', () => {
            button.dispatchEvent(
                new CustomEvent('answer-send', {
                    detail: {
                        aid,
                        button
                    },
                    bubbles: true,
                    composed: true
                })
            );
        });

        return button;
    }

    listAnswers() {
        if (!this._built) {
            return;
        }

        const answersContainer = this._elements.answersContainer;
        const answers = this._currentData.answers;

        answersContainer.textContent = '';

        if (!Array.isArray(answers)) {
            console.error('Unable to display answers.');
            return;
        }

        for (const { valasz, id } of answers) {
            answersContainer.appendChild(this.createAnswerButton(valasz, id));
        }
    }

    toggleAnswerButtons(disabled) {
        if (!this._built) return;

        const buttons = Array.from(this.querySelectorAll('answer-button'));

        for (const button of buttons) {
            button.disabled = disabled;
        }
    }

    highlightAnswerResult(button, success) {
        if (success) {
            button.style.backgroundColor = 'green';
        } else {
            button.style.backgroundColor = 'red';
        }

        setTimeout(() => {
            button.style.backgroundColor = 'transparent';
            this.next();
        }, 2000);
    }

    onError() {
        this.innerHTML = '';
        window.location.href = "/"
    }

    async sendAnswer(e) {
        if (this._pending) {
            console.warn('A response for a sent answer is already pending, this one is ignored.');
            return;
        }

        const aid = e.detail?.aid;

        if (!aid) {
            console.error('Unable to send answer. No id is provided.');
            return;
        }

        const button = e.detail?.button;

        if (!button) {
            return;
        }

        this._pending = true;
        this.toggleAnswerButtons(true);

        try {
            const formData = new FormData();
            formData.append('aid', aid);

            const response = await net.send('/api/game', { method: 'POST', body: formData });

            const { success, result } = response;

            if (!success) {
                this.onError();
                return;
            }

            this.highlightAnswerResult(button, result.success);
        } catch (error) {
            console.error(error);
            console.error('An error occured while processing your answer.');
        } finally {
            this._pending = false;
            this.toggleAnswerButtons(false);
        }
    }
}

window.customElements.define('game-container', GameContainer);
