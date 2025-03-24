const sqlite3 = require('sqlite3').verbose();
const dbBRT = new sqlite3.Database('scientific_database.db');
const dbSubstrate = new sqlite3.Database('substrate_database.db');

module.exports =  {
    dbBRT,
    dbSubstrate
};
