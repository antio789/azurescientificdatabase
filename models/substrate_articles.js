const {DBbiogas} = require('./database');
const db = DBbiogas;

const filterType = Object.freeze({
    PRETREATMENT: "pretreatment",
    REACTOR: "reactor",
    CO2: "co2"
});

const TemperatureFields = Object.freeze([
    {id: "p", name: "Psychrophilic"},
    {id: "m", name: "Mesophilic"},
    {id: "t", name: "Thermophilic"},
    {id: "ht", name: "HyperThermophylic"}
]);

function newEntry(name, display, hasSubstrate, table, mainFilter, query) {
    return {
        name: name,
        display_name: display,
        hasSubstrate: hasSubstrate,
        table: table,
        filters: mainFilter,
        SQLquery: query
    };
}

const filterConfig = {
    pretreatment: newEntry("pretreatment", "Pretreatments", true, "article_pretreatment", getPretreatmentMainFields,
        getArticleQuery),
    reactor: newEntry("reactor", "Reactors", true, "article_reactor", getReactorMainFields,
        getArticleQuery),
    temp: newEntry("temp", "Temperature", false, "article_temp", () => TemperatureFields,
        getTemperatureQuery),
    co2: newEntry("co2", "CO₂ Fields", false, "article_co2", getco2MainFields,
        getArticleQuery),
    h2s: newEntry("h2s", "H₂S Fields", false, "article_h2s", geth2sMainFields,
        getArticleQuery)
};

//get the fields that do not have a parent considered as the starting point for filtering

function getPretreatmentMainFields() {
    const stmt = db.prepare("select id, name from pretreatment_fields where pretreatment_fields.id not in (select child from pretreatment_fields_tree);")
    return stmt.all();
}

function getReactorMainFields() {
    const stmt = db.prepare("select id, name from reactor_fields where reactor_fields.id not in (select child from reactor_fields_tree);");
    return stmt.all();
}

function geth2sMainFields() {
    const stmt = db.prepare("select id, field_name as name from h2s_fields where field_parent = -1;");
    return stmt.all();
}

function getco2MainFields() {
    const stmt = db.prepare("select id, field_name as name from co2_fields where field_parent = -1;");
    return stmt.all();
}

function getFilterMainFields() {
    const filters = [];
    for (const key in filterConfig) {
        const config = filterConfig[key];
        filters.push({
            name: config.name,
            display_name: config.display_name,
            hasSubstrate: config.hasSubstrate,
            filters: config.filters()
        });
    }
    return filters;
}


// Function to construct the query snippet for temperature
function getArticleQuery(fieldIds, table) {
    const fieldPlaceholders = fieldIds.map(() => '?').join(', ');
    let baseQuery = `
        SELECT id, title, abstract, doi, publication_year
        FROM Articles
        WHERE id IN (SELECT ${table}.article_id
                     FROM ${table}
                     WHERE field_id IN (${fieldPlaceholders})
                     GROUP BY article_id
                     HAVING COUNT(DISTINCT field_id) = ${fieldIds.length})`;
    return {
        SQLquery: baseQuery,
        params: [...fieldIds]
    };
}

function getTemperatureQuery(fieldIds, table) {
    console.log(fieldIds, table, " PARAMETERS INSIDE TEMPQUERY");
    const conditions = fieldIds.length > 0
        ? fieldIds.map(id => `${id} = 1`).join(' OR ')
        : '1=0';
    let baseQuery = `
        SELECT id, title, abstract, doi, publication_year
        FROM Articles
        WHERE id IN (SELECT article_id
                     FROM ${table}
                     WHERE ${conditions})`;
    return {
        SQLquery: baseQuery,
        params: []
    };
}

function getSubstrateQuery(SubstrateID, Params) {
    const substratePlaceholders = SubstrateID.map(() => '?').join(', ');
    const substrateQuery = `AND id IN(
                    SELECT article_content.article_id 
                    FROM article_content 
                    WHERE category_id IN (${substratePlaceholders}) 
                    GROUP BY article_id 
                    HAVING COUNT(DISTINCT category_id) = ?
                )`;
    return {
        SQLquery: substrateQuery,
        params: Params.push(...SubstrateIDs, SubstrateIDs.length)
    };
}


//get articles based on filters [fieldIds,categoryIds],
//works by selecting all (and only those) articles that have all the selected filters
// (where field_id in ids "placeholders") => select all articles that have these fields
// 2. group by article_ids, then for each article_id count the number of fields => For each `article_id` group, the query calculates the number of distinct `field_id` values within that group. The `DISTINCT field_id` ensures that duplicate `field_id` entries in the same group are only counted once.
// HAVING(COUNT...) = id.length: articles that have the numbers of field required, filters out the articles that are missing a filter
function getArticles(fieldIds, SubstrateIDs, type) {
    const config = filterConfig[type];
    if (!config) {
        throw new Error(`Unknown filter type: ${type}`);
    }
    let info = config.SQLquery(fieldIds, config.table,);
    let sub;
    if (SubstrateIDs && SubstrateIDs.length > 0 && config.hasSubstrate === true) {
        sub = getSubstrateQuery(SubstrateIDs, info.params);
        info.params = sub.params;
        info.SQLquery += sub.SQLquery;
    }
    const stmt = db.prepare(info.SQLquery);
    return stmt.all(info.params);
}


//from a 'parent' field retrieves all of its children (where parent =?)
function getChild(id, type = filterType.PRETREATMENT) {
    if (type === filterConfig.temp.name) return []
    if (!id) {
        throw new Error("id is not a number")
    }
    const config = filterConfig[type];
    if (!config) {
        throw new Error(`Unknown filter type: ${type}`);
    }
    if (type === filterConfig.temp.name) return []
    const table = config.name + "_fields";
    // For co2 and h2s, the parent-child relationship is stored directly in the fields table
    if (type === filterConfig.co2.name || type === filterConfig.h2s.name) {
        const stmt = db.prepare(`select id, field_name as name
                                 from ${table}
                                 where field_parent = ?;`);
        return stmt.all([id]);
    }

    // For pretreatment and reactor, use the separate tree tables
    const table_tree = table + "_tree";
    const stmt = db.prepare(`select id, name
                             from ${table}
                             where id in (select child from ${table_tree} where parent = ?);`);
    return stmt.all([id]);
}


//returns all the substrate categories, this allows to fill in the filters on the page
function getSubstrate_categories() {
    return db.prepare("select id, name from substrate_category").all();
}

function getArticleResults(article_ID) {
    const stmt = db.prepare(`SELECT substrate_category.name as category,
                                    "substrate type"        as "substrate type",
                                    "substrate name"        as "substrate name",
                                    precat.name             as "pretreatment category",
                                    pretype.name            as "pretreatment type",
                                    TS,
                                    VS,
                                    TC,
                                    TN,
                                    "C/N",
                                    cellulose,
                                    "hemi-cellulose",
                                    lignin
                             FROM article_content
                                      LEFT JOIN substrate_category
                                                ON substrate_category.id = article_content.category_id
                                      LEFT JOIN pretreatment_fields AS precat ON precat.id = article_content.precat_id
                                      LEFT JOIN pretreatment_fields AS pretype
                                                ON pretype.id = article_content.pretype_id
                             where article_id = ?`)
    return stmt.all([article_ID]);
}

//used to export the articles' data
function getArticlesInfo(fieldIds, SubstrateIds, type) {
    if (!type) return [];
    const articles = getArticles(fieldIds, SubstrateIds, type);
    //layout of articles: [{...},{...}]
    let articlesInfo = [];
    for (const art of articles) {
        const results = getArticleResults(art.id);
        delete art.id;
        //layout of results: [{...},{...}]
        articlesInfo.push({...art});
    }
    return articlesInfo;
}

/*
async function getArticlePretreatment(article_id) {
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            db.all(`SELECT fields.name
                    from fields
                             inner join article_pretreatment on article_pretreatment.field_id = fields.id
                    where article_id = ?`), [article_id], (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            }
        })
    })
}
 */


//to do getsubstratecategory()
// get substrate
module.exports = {
    getFilterMainFields,
    getChild,
    getArticles,
    getSubstrate_categories,
    getarticlesinfo: getArticlesInfo,
    filterType
};

