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
        aborted: false,
        inprogess: true,
        difficulty: 0,
        reward: 0,
        qid: null
    };
}

async function next(request) {
    let question;

    if (request.session.qid) {
        question = await database.selectquestion(request);
    } else {
        question = await database.randomquestion(request);
    }

    const answers = await database.selectanswers(question.id);

    return {
        question,
        answers
    };
}

async function check(request) {
    const correct = await database.checkanswer(request);

    if (!correct || (correct && request.session.game.difficulty === 15)) {
        request.session.game.inprogess = false;
    } else request.session.game.difficulty++;
}

function abort(request) {
    request.session.game.aborted = true;
    request.session.game.inprogess = false;
}

// prettier-ignore
function finish(request, response) {
    const game  = request.session.game,
          level = game.difficulty;

    if (game.aborted) {
        return (game.reward = rewards[level]);
    }

    let reward = 0;

    if (level === 15) reward = rewards[15];
    else if (level >= 10) reward = rewards[10];
    else if (level >= 5) reward = rewards[5];

    request.session.game.reward = reward;
}

async function save() {
    await database.savegame(request);

    const game = request.session.game;
    const result = {
        sucess: true,
        result: {
            reward: request.session.game.reward
        }
    };

    if (game.aborted) {
        result.message = 'A játék sikeresen megszakítva!';
        return result;
    }

    result.message = 'A játék véget ért';
    return result;
}

module.exports = { start, next, check, abort, finish, save };
