const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'lom',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//!SQL Queries
async function selectall() {
    const query = 'SELECT * FROM exampletable;';
    const [rows] = await pool.execute(query);
    return rows;
}

async function createuser(request) {
    const password_hash = await bcrypt.hash(request.body.password, 10);
    const query = 'INSERT INTO users(username, display_name, password_hash) VALUES (?,?,?)';
    const [result] = await pool.execute(query, [
        request.body.username,
        request.body.display_name,
        password_hash
    ]);
    return result;
}

async function deleteuser(request) {
    const query = 'DELETE FROM users WHERE username = ?';
    const [result] = await pool.execute(query, [request.session.user.username]);
    return result;
}

async function loginuser(request) {
    const query = 'SELECT * FROM users WHERE username = ?';
    const [rows] = await pool.execute(query, [request.body.username]);
    if (!rows.length) {
        throw { code: 'LEKSZUSZ' };
    }
    const user = rows[0];
    if (!(await bcrypt.compare(request.body.password, user.password_hash))) {
        throw { code: 'LAMPARKINI' };
    }
    request.session.user = { username: user.username };
    return request.session.user;
}

function logoutuser(request, response) {
    request.session.destroy((err) => {
        if (err) {
            return response.status(500).send('Hiba a kijelentkezéskor');
        }

        response.clearCookie('connect.sid');
        response.status(200).json(createResponse(true, null, 'Sikertes kijelentkzés!'));
    });
}

//!Export
module.exports = {
    selectall,
    createuser,
    deleteuser,
    logoutuser,
    loginuser
};
