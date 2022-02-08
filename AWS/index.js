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
        const sql = 'INSERT INTO coinslist (ticker) VALUES ?'
        conexion.query(sql, [request.values], function (err, resultado) {
            if (err) throw err;
            console.log(resultado);
            conexion.end();
        });
    });
    return promise
};