const express = require('express');
const router = express.Router();
const database = require('../sql/database.js');
const users = require('./users.js');
const sessions = require('./sessions.js');
const game = require('./game.js');
const help = require('./help.js');
const fs = require('fs/promises');

router.use(express.json());

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

//admin kerdes
router.post("/mentes", (req, res) => {
    const { kerdes, jo, rossz1, rossz2, rossz3, nehezseg } = req.body;

    const sqlKerdes = `
        INSERT INTO kerdesek (kerdes, nehezseg)
        VALUES (?, ?)
    `;

    db.query(sqlKerdes, [kerdes, nehezseg], (err, result) => {
        if (err) {
            console.error(err);
            return res.json({ success: false });
        }

        const kerdesId = result.insertId;

        const valaszok = [
            [jo, kerdesId, 1],
            [rossz1, kerdesId, 0],
            [rossz2, kerdesId, 0],
            [rossz3, kerdesId, 0]
        ];

        db.query(
            "INSERT INTO valaszok (valasz, kid, helyes) VALUES ?",
            [valaszok],
            (err2) => {
                if (err2) {
                    console.error(err2);
                    return res.json({ success: false });
                }

                res.json({ success: true });
            }
        );
    });
});

router.use('/users', users);
router.use('/sessions', sessions);
router.use('/game', game);
router.use('/help', help);

module.exports = router;
