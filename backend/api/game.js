const express = require('express');
const router = express.Router();
const database = require('../sql/database.js');
const { upload, createResponse, authenticate } = require('../common.js');
const fs = require('fs/promises');
const { checkSchema, validationResult } = require('express-validator');
const { start, next, check, finish, save } = require('../game.js');

router.get('/', authenticate, async (request, response) => {
    try {
        if (!request.session.game || request?.query?.action === 'start') {
            start(request);
        }

        if (!request.session.game.inprogress) {
            finish(request);
            return response.status(200).json(await save(request, response));
        }

        const result = await next(request);

        response
            .status(200)
            .json(createResponse(true, result, 'Következő kérdés sikeresen lekérve'));
    } catch (error) {
        console.log(error);
        response.status(500).json(createResponse(false, null, 'Hiba történt a játék során'));
    }
});

router.post('/', authenticate, upload.none(), async (request, response) => {
    if (!request.body.aid) {
        return response.status(400).json(createResponse(false, null, 'Hibás kérés'));
    }

    try {
        await check(request);
        response.status(200).json(createResponse(true, null, 'Válasz sikeresen feldolgozva'));
    } catch (error) {
        console.log(error);
        response.status(500).json(createResponse(false, null, 'Hiba történt a játék során'));
    }
});

module.exports = router;
