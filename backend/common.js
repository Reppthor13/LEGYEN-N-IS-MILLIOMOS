const multer = require('multer'); //?npm install multer
const path = require('path');

const storage = multer.diskStorage({
    destination: (request, file, callback) => {
        callback(null, path.join(__dirname, '../uploads'));
    },
    filename: (request, file, callback) => {
        callback(null, Date.now() + '-' + file.originalname); //?egyedi név: dátum - file eredeti neve
    }
});

const upload = multer({ storage });

function createResponse(success, result, message = null) {
    return {
        success,
        result,
        message
    };
}

function authenticate(request, response, next) {
    if (!request.session.user)
        response.status(403).json(createResponse(false, null, 'Bejelentkezés szükséges'));
    else next();
}

function authenticate2(request, response, next) {
    if (!request.session.user) next();
    else
        response
            .status(403)
            .json(createResponse(true, request.session.user, 'Már be vagy jelentkezve!'));
}
module.exports = { upload, createResponse, authenticate, authenticate2 };
