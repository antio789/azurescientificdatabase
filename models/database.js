const BetterSqlite = require('better-sqlite3');
const dbBRT = new BetterSqlite('scientific_database.db', {verbose: console.log, readonly: true});
const dbbiogas = new BetterSqlite('biogasclassification_130326.db', {readonly: true});


module.exports = {
    dbBRT,
    DBbiogas: dbbiogas
};
