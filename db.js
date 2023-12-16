    const mysql = require('mysql2');

    const db = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'express_learing_project',
    });

    module.exports = db;
