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
        aborted: false
    };
}

async function next(request) {
    if (!request.session.game) {
        throw new Error('A játék nincs elindítva');
    }

    const game = request.session.game;
    let question;

    // REFRESH eset
    if (game.qid && !game.answered) {
        question = await database.selectquestion(game.qid);
    }

    // új kérdés
    else {
        question = await database.randomquestion(request);

        game.qid = question.id;
        game.answered = false;
    }

    const answers = await database.selectanswers(question.id);

    return {
        question,
        answers
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

    game.difficulty++;
    game.qid = null;

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

module.exports = {
    start,
    next,
    check,
    abort,
    finish,
    save
};
