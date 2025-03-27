const {dbSubstrate} = require('./database');
const db = dbSubstrate;


//get the fields that do not have a parent considered as the starting point for filtering
function getMainFields() {
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            db.all("select id, name from fields where fields.id not in (select child from field_tree);", (err, rows) => {
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
function getArticles(fieldIds, categoryIds) {
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            const fieldPlaceholders = fieldIds.map(() => '?').join(', ');
            const substratePlaceholders = categoryIds.map(() => '?').join(', ');
            let basequery = `SELECT id, title, abstract, doi, publication_year
                             from Articles
                             where id in (SELECT article_pretreatment.article_id
                                          from article_pretreatment
                                          where field_id in (${fieldPlaceholders})
                                          group by article_id
                                          having count(distinct field_id) = ?)`;
            const queryParams = [...fieldIds, fieldIds.length];
            let substratequery = `AND id IN(
                    SELECT article_content.article_id 
                    FROM article_content 
                    WHERE category_id IN (${substratePlaceholders}) 
                    GROUP BY article_id 
                    HAVING COUNT(DISTINCT category_id) = ?
                )`;
            if (categoryIds && categoryIds.length > 0) {
                basequery += substratequery;
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
function getChild(id) {
    //console.log(id);
    if (!id) {
        throw new Error("id is not a number")
    }
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            db.all(`select id, name
                    from fields
                    where id in (select child from field_tree where parent = ?);`, [id], (err, rows) => {
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
                           "substrate type"        as type,
                           "substrate name"        as name,
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
    const articles = await getArticles(fieldIds, categoryIds).catch(err => {
        throw new Error(`Error at getting articles`, {cause: err})
    });
    //layout of articles: [{...},{...}]
    let articlesInfo = [...articles];
    for (const art of articles) {

        const results = await getArticleResults(art.id).catch(err => {
            throw new Error(`Error at getting articles supplementary info`, {cause: err})
        });
        //layout of results: [{...},{...}]
        console.log(results.length);

        for (let item = 0; item < results.length; item++) {
            const index = articlesInfo.findIndex(row => row.id === art.id);
            if (item === 0) {
                for (const prop in results) {
                    articlesInfo[prop].prop = results[item].prop;
                }
                articlesInfo[index].substrates = results[item];
                //delete articlesInfo[index].id;
            } else {
                let artCopy = {...art};
                for (const prop in results) {
                    artCopy[prop].prop = results[item].prop;
                }
                articlesInfo.splice(index + 1, 0, artCopy);//cannot modify articles inside its for loop
            }
        }
    }
    for (const art of articlesInfo) {
        delete art.id;
    }
    return articlesInfo;
}


//to do getsubstratecategory()
// get substrate
module.exports = {
    getMainFields,
    getChild,
    getArticles,
    getSubstrate_categories,
    getarticlesinfo: getArticlesInfo
};

