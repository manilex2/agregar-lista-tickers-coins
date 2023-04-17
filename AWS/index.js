require('dotenv').config();
const mysql = require('mysql2/promise');
const {google} = require('googleapis');
const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets'
});
const { database } = require('./keys');

exports.handler = async function (event) {
    const promise = new Promise(async function() {
        const conexion = await mysql.createConnection({
            host: database.host,
            user: database.user,
            password: database.password,
            port: database.port,
            database: database.database
        });
        const spreadsheetId = process.env.SPREADSHEET_ID;
        const client = await auth.getClient();
        const googleSheet = google.sheets({ version: 'v4', auth: client });
        const request = (await googleSheet.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: `${process.env.ID_HOJA_LISTA}!A2:A`
        })).data
        let dataArray = [];
        for (let i = 0; i < request.values.length; i++) {
            const element = request.values[i][0];
            dataArray.push({
                name: element
            });
        }
        const values = dataArray.map((row) => [row.name]);
        var sql = `DELETE FROM ${process.env.TABLE_NAME}`;
        var sql2 = `ALTER TABLE ${process.env.TABLE_NAME} AUTO_INCREMENT = 1`;
        var sql3 = `INSERT INTO ${process.env.TABLE_NAME} (name) VALUES ${Array(values.length).fill("(?)").join(", ")}`;
        await conexion.execute(sql);
        await conexion.execute(sql2);
        await conexion.execute(sql3, values.flat());
    });
    return promise
};