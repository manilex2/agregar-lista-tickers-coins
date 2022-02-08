require('dotenv').config();
const morgan = require('morgan');
const express = require('express');
const mysql = require('mysql2');
const {google} = require('googleapis');
const app = express();
const PUERTO = 4200;
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

app.use(morgan('dev'));

app.get('/', async (req, res) => {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const client = await auth.getClient();
    const googleSheet = google.sheets({ version: 'v4', auth: client });
    const request = (await googleSheet.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: `${process.env.ID_HOJA_LISTA}!A2:A`
    })).data
    const sql = `INSERT INTO ${process.env.TABLE_NAME} (name) VALUES ?`
    conexion.query(sql, [request.values], function (err, resultado) {
        if (err) throw err;
        console.log(resultado);
        conexion.end();
    });
    res.send('OK');
});

app.listen(process.env.PORT || PUERTO, () => {
    console.log(`Escuchando en puerto ${process.env.PORT || PUERTO}`);
});