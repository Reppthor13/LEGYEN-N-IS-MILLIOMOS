const express = require('express');
const router = express.Router();
const database = require('../sql/database.js');
const { upload, createResponse, authenticate, authenticate2 } = require('../common.js');
const fs = require('fs/promises');
const { checkSchema, validationResult } = require('express-validator');
const validator = require('../validator/session.js');

router.post(
    '/',
    authenticate2,
    upload.none(),
    checkSchema(validator.POST),
    async (request, response) => {
        const errors = validationResult(request);

        if (!errors.isEmpty())
            return response.status(400).json(createResponse(false, null, errors.array()[0].msg));

        try {
            const result = await database.loginuser(request);
            response.status(200).json(createResponse(true, result, 'Sikeres bejelentkezés'));
        } catch (error) {
            console.log(error);
            if (error?.code == 'LEKSZUSZ') {
                return response
                    .status(400)
                    .json(createResponse(false, null, 'A felhasználó nem létezik'));
            }
            if (error?.code == 'LAMPARKINI') {
                return response
                    .status(400)
                    .json(createResponse(false, null, 'Hibás adatok'));
            }
            response
                .status(500)
                .json(createResponse(false, null, 'Hiba történt a bejelentkezés közben'));
        }
    }
);

router.delete('/', authenticate, async (request, response) => {
    database.logoutuser(request, response);
});

module.exports = router;
