const express = require('express');
const router = express.Router();
const database = require('../sql/database.js');
const {upload} = require('../common.js')
const fs = require('fs/promises');

router.post('/', upload.none(), async (request, response) => {

})

module.exports = router;

