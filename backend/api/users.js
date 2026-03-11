const express = require('express');
const router = express.Router();
const database = require('../sql/database.js');
const { upload, createResponse, authenticate } = require('../common.js');
const fs = require('fs/promises');
const { checkSchema, validationResult } = require('express-validator');
const validator = require('../validator/user.js');

router.post('/', upload.none(), checkSchema(validator.POST), async (request, response) => {
    const errors = validationResult(request);

    if (!errors.isEmpty())
        return response.status(400).json(createResponse(false, null, errors.array()[0].msg));

    try {
        await database.createuser(request);
        response.status(200).json(createResponse(true, null, 'Sikeres regisztráció'));
    } catch (error) {
        console.log(error);
        if (error.name === 'SequelizeUniqueConstraintError' || error.code === 'ER_DUP_ENTRY') {
            return response
                .status(400)
                .json(createResponse(false, null, 'Felhsználónév már foglalt!'));
        }
        response
            .status(500)
            .json(createResponse(false, null, 'Hiba történt a regisztráció közben!'));
    }
});

router.delete('/', authenticate, async (request, response) => {
    try {
        const result = await database.deleteuser(request);

        if (result.affectedRows > 0) {
            request.session.destroy((err) => {
                if (err) {
                    return response
                        .status(500)
                        .json(createResponse(false, null, 'Hiba a kijelentkezéskor'));
                }

                response.clearCookie('connect.sid');

                return response
                    .status(200)
                    .json(createResponse(true, null, 'Sikeres profiltörlés'));
            });
        } else {
            return response.status(404).json(createResponse(false, null, 'Nem létezik a profil'));
        }
    } catch (error) {
        return response
            .status(500)
            .json(createResponse(false, null, 'Hiba történt a profiltörlés közben!'));
    }
});

module.exports = router;
