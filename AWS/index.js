require('dotenv').config();
const mysql = require('mysql2');
const {google} = require('googleapis');
const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets'
});
const { database } = require('./keys');
const conexion = mysql.createConnection({
    host: database.host,
    user: database.user,
    password: database.password,
    port: database.port,
    database: database.database
});

exports.handler = async function (event) {
    const promise = new Promise(async function() {
        const spreadsheetId = process.env.SPREADSHEET_ID;
    const client = await auth.getClient();
    const googleSheet = google.sheets({ version: 'v4', auth: client });
    const request = (await googleSheet.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: `${process.env.ID_HOJA_LISTA}!A2:A`
    })).data
    for (let i = 0; i < request.values.length; i++) {
        var sql = `INSERT INTO ${process.env.TABLE_NAME} (name)
        SELECT * FROM (SELECT '${request.values[i]}' AS name) AS tmp
        WHERE NOT EXISTS (
            SELECT name FROM ${process.env.TABLE_NAME} WHERE name = '${request.values[i]}'
        ) LIMIT 1`
        conexion.query(sql, function (err, resultado) {
            if (err) throw err;
            console.log(resultado);
        });
    }
    await finalizarEjecucion();
    async function finalizarEjecucion() {
        conexion.end()
    }
    });
    return promise
};