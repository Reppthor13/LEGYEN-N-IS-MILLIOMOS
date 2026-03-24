import * as net from './network.js';

const rewards = {
    0: 0,
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
    }

    async onHelpRequest(e) {
        const helpType = e.detail.type;

        if (!helpType) return;

        const response = await net.send('/api/help?type=' + helpType);

        console.log(response);
    }

    connectedCallback() {
        if (this._built) return;
        this.build();
    }

    build() {
        this.innerHTML = `
            <div>Legyen ön is milliomos</div>

            <div class="game-content">
                <div id="rewards"></div>

                <div>
                    <div class="main">
                        <div id="kerdesText"></div>
                        <div id="valaszSpace"></div>
                    </div>

                    <div id="toolbar"></div>
                </div>
            </div>
        `;

        const e = this._elements;

        e.questionText = this.querySelector('#kerdesText');
        e.answersContainer = this.querySelector('#valaszSpace');
        e.toolbar = this.querySelector('#toolbar');

        e.rewardsSidebar = this.querySelector('#rewards');
        this.renderRewards();

        this.fillToolbar();

        this.addEventListener('answer-send', this.sendAnswer);
        this.addEventListener('help-request', this.onHelpRequest);

        this._built = true;
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

        button.addEventListener('click', () => {
            if (this._helpRequested) {
                return;
            }

            this._helpRequested = true;

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
        if (!this._built) return;

        const toolbar = this._elements.toolbar;

        if (!toolbar) return;

        toolbar.textContent = '';

        const abortButton = document.createElement('button');
        abortButton.textContent = 'Játék megszakítása';

        abortButton.addEventListener('click', () => {
            abortButton.dispatchEvent(new CustomEvent('abort-request'));
        });

        toolbar.appendChild(abortButton);

        for (const { text, helpType } of [
            { text: 'Telefon', helpType: 'tflon' },
            { text: 'Közönség', helpType: 'kozonsek' },
            { text: 'Felezés', helpType: 505050 }
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
        return Boolean(this._currentData?.result?.ended);
    }

    endGame() {}

    async next() {
        const response = await net.send('/api/game');

        const { success, result } = response;

        if (!success || !result) {
            this.reset();
            return;
        }

        this._currentData = result;

        if (this.hasEnded()) {
            return this.endGame();
        }

        this._helpRequested = false;

        this.update();
    }

    reset() {
        window.location.href = '/'; // főolal ahol a játék van -> újratöltés
    }

    update() {
        if (!this._built) return;

        this._elements.questionText.textContent = this._currentData.question;
        this.listAnswers();
        this.highlightCurrentReward();
    }

    createAnswerButton(text, aid) {
        const button = document.createElement('button');

        button.textContent = text;

        button.addEventListener('click', () => {
            button.dispatchEvent(
                new CustomEvent('answer-send', {
                    detail: {
                        aid
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

        for (const { valasz, aid } of answers) {
            answersContainer.appendChild(this.createAnswerButton(valasz, aid));
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

        this._pending = true;
        this.toggleAnswerButtons(true);

        const button = e.currentTarget;

        try {
            const formData = new FormData();
            formData.append('aid', aid);

            const response = await net.send('/api/game', { method: 'POST', body: formData });

            const { success, result } = response;

            if (!success) {
                this.onError();
            }

            this.highlightAnswerResult(button, result.success);
        } catch (error) {
            console.error('An error occured while processing your answer.');
        } finally {
            this._pending = false;
            this.toggleAnswerButtons(false);
        }
    }
}

window.customElements.define('game-container', GameContainer);
