const express = require('express');
const router = express.Router();
const database = require('../sql/database.js');
const { upload, createResponse, authenticate } = require('../common.js');
const { help } = require('../game.js');
// cont = display.flex

router.get('/', authenticate, async (request, response) => {
    if (!request.session.game) {
        return response.status(400).json(createResponse(false, null, 'Játék nem fut'));
    }

    const type = request.query.type;

    try {
        const result = await help(request, type);
        request.session.game.processingHelp = false;
        response.status(200).json(createResponse(true, result, 'Segicsg lkérv'));
    } catch (error) {
        console.log(error);

        let message = 'Lehervadt a végpont';

        if (error.code === 'NOHELPREMAINING') {
            message = 'elfogyot';
        }

        if (error.code === 'USED') {
            message = 'mr kértél segítséget';
        }

        response.status(500).json(createResponse(false, null, message));
    }
});

module.exports = router;
