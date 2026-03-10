const BetterSqlite = require('better-sqlite3');
const dbBRT = new BetterSqlite('scientific_database.db', {verbose: console.log, readonly: true});
const dbSubstrate = new BetterSqlite('substrateclassification.db', {verbose: console.log, readonly: true});


module.exports = {
    dbBRT,
    dbSubstrate: dbSubstrate
};
