const database = require('./sql/database.js');

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

function start(request) {
    request.session.game = {
        inprogress: true,
        difficulty: 1,
        reward: 0,
        qid: null,
        answered: false,
        aborted: false,
        usedHelp: false,
        currentReward: 0,
        answers: null,
        availableHelps: {
            mopile: 1,
            authience: 1,
            fitfycent: 1
        }
    };
}

async function next(request) {
    if (!request.session.game) {
        throw new Error('A játék nincs elindítva');
    }

    const game = request.session.game;
    let question;

    if (game.qid && !game.answered) {
        question = await database.selectquestion(game.qid);
    } else {
        question = await database.randomquestion(request);

        game.qid = question.id;
        game.answered = false;
    }

    let answers;

    console.log('GAME.ANSWERS: ', game.answers);

    if (game.answers) {
        answers = game.answers;
    } else {
        answers = await database.selectanswers(question.id);
    }

    return {
        currentReward: game.currentReward,
        question,
        answers,
        level: game.difficulty
    };
}

async function check(request) {
    const game = request.session.game;

    if (!game || !game.inprogress) {
        throw new Error('A játék nem aktív');
    }

    game.answered = true;

    const correct = await database.checkanswer(request);

    if (!correct) {
        game.inprogress = false;
        finish(request);
        return false;
    }

    if (game.difficulty === 15) {
        game.inprogress = false;
        finish(request);
        return true;
    }

    game.answers = null;
    game.currentReward = rewards[game.difficulty];
    game.difficulty++;
    game.qid = null;
    game.usedHelp = false;

    return true;
}

function abort(request) {
    const game = request.session.game;

    game.aborted = true;
    game.inprogress = false;

    finish(request);
}

function finish(request) {
    const game = request.session.game;
    let level = game.difficulty;

    if (game.aborted) {
        if (game.answered) {
            game.reward = rewards[level];
        } else {
            level -= 1;
            if (level < 0) level = 0;
            game.reward = rewards[level];
        }
        return;
    }

    let reward = 0;

    if (level === 15) reward = rewards[15];
    else if (level >= 10) reward = rewards[10];
    else if (level >= 5) reward = rewards[5];

    game.reward = reward;
}

async function save(request) {
    const game = request.session.game;

    await database.savegame(request);

    const result = {
        success: true,
        result: {
            ended: true,
            reward: game.reward
        }
    };

    if (game.aborted) {
        result.message = 'A játék sikeresen megszakítva!';
    } else {
        result.message = 'A játék véget ért';
    }

    return result;
}

async function help(request, type) {
    console.log(type);
    if (request.session.game.usedHelp) throw { code: 'USED' };

    const game = request.session.game;
    const answers = await database._selectanswers(request.session.game.qid);

    for (const answer of answers) {
        if (answer.helyes === 1) {
            correct = {
                id: answer.id,
                valasz: answer.valasz
            };
            break;
        }
    }

    const onlystat = request.query.onlystat;

    if (type === 'tflon') {
        if (game.availableHelps.mopile <= 0) {
            throw { code: 'NOHELPREMAINING' };
        }

        // if (onlystat) {
        //     return {
        //         remaining: request.session.game
        //     }
        // }

        game.availableHelps.mopile -= 1;

        const random = answers[Math.floor(Math.random() * answers.length)];
        const possible = [correct, random];
        const guess = possible[Math.floor(Math.random() * possible.length)];

        return {
            id: guess.id,
            valasz: guess.valasz
        };
    } else if (type === 'kozonsek') {
        if (game.availableHelps.authience <= 0) {
            throw { code: 'NOHELPREMAINING' };
        }

        game.availableHelps.authience -= 1;

        const rands = Array.from({ length: 4 }, () => Math.random().toFixed(2));

        let max_i = 0;

        for (let i = 0; i < rands.length; i++) {
            if (rands[i] > rands[max_i]) {
                max_i = i;
            }
        }

        const all = [];

        for (const index in rands) {
            all.push({
                id: answers[index].id,
                valasz: answers[index].valasz,
                vote: rands[index]
            });
        }

        return {
            suggested: {
                id: answers[max_i].id,
                valasz: answers[max_i].valasz
            },
            other: all
        };
    } else if (type === '505050') {
        if (game.availableHelps.fitfycent <= 0) {
            throw { code: 'NOHELPREMAINING' };
        }

        game.availableHelps.fitfycent -= 1;

        let j = Math.floor(Math.random() * answers.length);

        while (answers[j].helyes != '0') {
            j = Math.floor(Math.random() * answers.length);
        }

        const possible = [
            correct,
            {
                id: answers[j].id,
                valasz: answers[j].valasz
            }
        ];

        request.session.game.answers = possible;
        console.log('ÁTÁLLÍTVA ERRE: ', possible);
        console.log('ÚJ ÉRTÉK: ', request.session.game.answers);

        return;

        return {
            possible
        };
    } else {
        throw {};
    }
}

module.exports = {
    start,
    next,
    check,
    abort,
    finish,
    save,
    help
};
