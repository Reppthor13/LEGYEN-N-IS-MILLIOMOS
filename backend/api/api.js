const express = require('express');
const router = express.Router();
const database = require('../sql/database.js');
const users = require('./users.js');
const sessions = require('./sessions.js');
const game = require('./game.js');
const fs = require('fs/promises');

//!Endpoints:
//?GET /api/test
router.get('/test', (request, response) => {
    response.status(200).json({
        message: 'Ez a végpont működik.'
    });
});

//?GET /api/testsql
router.get('/testsql', async (request, response) => {
    try {
        const selectall = await database.selectall();
        response.status(200).json({
            message: 'Ez a végpont működik.',
            results: selectall
        });
    } catch (error) {
        response.status(500).json({
            message: 'Ez a végpont nem működik.'
        });
    }
});

router.use('/users', users);
router.use('/sessions', sessions);
router.use('/game', game);

module.exports = router;
