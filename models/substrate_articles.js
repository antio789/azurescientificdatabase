const {dbSubstrate} = require('./database');
const db = dbSubstrate;

const filterType = Object.freeze({
    PRETREATMENT: "pretreatment",
    REACTOR: "reactor"
});

//get the fields that do not have a parent considered as the starting point for filtering
function getPretreatmentMainFields() {
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            db.all("select id, name from pretreatment_fields where pretreatment_fields.id not in (select child from pretreatment_field_tree);", (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        })
    })
}

function getReactorMainFields() {
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            db.all("select id, name from reactors where reactors.id not in (select child from reactor_tree);", (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        })
    })
}

//get articles based on filters [fieldIds,categoryIds],
//works by selecting all (and only those) articles that have all the selected filters
// (where field_id in ids "placeholders") => select all articles that have these fields
// 2. group by article_ids, then for each article_id count the number of fields => For each `article_id` group, the query calculates the number of distinct `field_id` values within that group. The `DISTINCT field_id` ensures that duplicate `field_id` entries in the same group are only counted once.
// HAVING(COUNT...) = id.length: articles that have the numbers of field required, filters out the articles that are missing a filter
function getArticles(fieldIds, categoryIds, type = filterType.PRETREATMENT) {
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            const fieldPlaceholders = fieldIds.map(() => '?').join(', ');
            const substratePlaceholders = categoryIds.map(() => '?').join(', ');
            const table = type === filterType.PRETREATMENT ? "article_pretreatment" : "article_reactor";
            //console.log(table);
            let basequery = `SELECT id, title, abstract, doi, publication_year
                             from Articles
                             where id in (SELECT ${table}.article_id
                                          from ${table}
                                          where field_id in (${fieldPlaceholders})
                                          group by article_id
                                          having count(distinct field_id) = ?)`;
            const queryParams = [...fieldIds, fieldIds.length];
            let substrateQuery = `AND id IN(
                    SELECT article_content.article_id 
                    FROM article_content 
                    WHERE category_id IN (${substratePlaceholders}) 
                    GROUP BY article_id 
                    HAVING COUNT(DISTINCT category_id) = ?
                )`;
            if (categoryIds && categoryIds.length > 0) {
                basequery += substrateQuery;
                queryParams.push(...categoryIds, categoryIds.length);
            }
            db.all(basequery, queryParams,
                (err, rows) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(rows);
                });
        })
    })
}


//from a 'parent' field retrieves all of its children (where parent =?)
function getChild(id, type = filterType.PRETREATMENT) {
    //console.log(id);
    if (!id) {
        throw new Error("id is not a number")
    }
    const table_tree = type === filterType.PRETREATMENT ? "pretreatment_field_tree" : "reactor_tree";
    const table = type === filterType.PRETREATMENT ? "pretreatment_fields" : "reactors";
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            db.all(`select id, name
                    from ${table}
                    where id in (select child from ${table_tree} where parent = ?);`, [id], (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        })
    })
}


function getSubstrate_categories() {
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            db.all(`select id, name
                    from substrate_category`, (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        })
    })
}

function getArticleResults(article_ID) {
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            db.all(`SELECT substrate_category.name as category,
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
                             LEFT JOIN substrate_category ON substrate_category.id = article_content.category_id
                             LEFT JOIN pretreatment_fields AS precat ON precat.id = article_content.precat_id
                             LEFT JOIN pretreatment_fields AS pretype ON pretype.id = article_content.pretype_id
                    where article_id = ?`, [article_ID], (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        })
    })
}

async function getArticlesInfo(fieldIds, categoryIds) {
    const articles = await getArticles(fieldIds, categoryIds, filterType.PRETREATMENT).catch(err => {
        throw new Error(`Error at getting articles`, {cause: err})
    });
    //layout of articles: [{...},{...}]
    let articlesInfo = [];
    for (const art of articles) {
        const results = await getArticleResults(art.id).catch(err => {
            throw new Error(`Error at getting articles supplementary info`, {cause: err})
        });
        delete art.id;
        //layout of results: [{...},{...}]
        for (let item of results) {
            articlesInfo.push({...art, ...item});
        }
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
    getPretreatmentMainFields,
    getReactorMainFields,
    getChild,
    getArticles,
    getSubstrate_categories,
    getarticlesinfo: getArticlesInfo,
    filterType
};

