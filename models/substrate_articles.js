import {dbSubstrate} from "./db";
const db= dbSubstrate;

//get the fields that do not have a parent considered as the starting point for filtering
function getMainFields() {
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            db.all("select id, name from fields where fields.id not in (select child from field_tree);", (err, rows) => {
                if (err) { return reject(err); }
                resolve(rows);
            });
        })
    })
}

//get articles based on filters [ids],
//works by selecting all (and only those) articles that have all the selected filters
// (where tech_id in ids "placeholders") => select all articles that have these fields
// 2. group by article_ids, then for each article_id count the number of fields => For each `article_id` group, the query calculates the number of distinct `field_id` values within that group. The `DISTINCT field_id` ensures that duplicate `field_id` entries in the same group are only counted once.
// HAVING(COUNT...) = id.length: articles that have the numbers of field required, filters out the articles that are missing a filter
function getArticles(...ids) {
    const idArray = ids;
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            const placeholders = idArray.map(() => '?').join(', ');
            db.all(`SELECT id,title,abstract,doi,publication_year from Articles where id in (SELECT article_content.article_id from article_content where field_id in (${placeholders}) group by article_id having count(distinct field_id) = ?);`,[...idArray,idArray.length],
                (err, rows) => {
                    if (err) { return reject(err); }
                    resolve(rows);
                });
        })
    })
}

//from a 'parent' field retrieves all of its children (where parent =?)
function getChild(id) {
    const parentrow = parseInt(id);
    //console.log(id);
    if (!id) { throw new Error("id is not a number") }
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            db.all(`select id,name from fields where id in (select child from field_tree where parent = ?);`,[id] ,(err, rows) => {
                if (err) { return reject(err); }
                resolve(rows);
            });
        })
    })
}


function getSubstrate_categories() {
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            db.all(`select id,name from substrate_category` ,(err, rows) => {
                if (err) { return reject(err); }
                resolve(rows);
            });
        })
    })
}

function getSubstrateNames(category_id) {
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            db.all(`select id,name from substrate_name where substrate_name.parent_id = ?`,[category_id] ,(err, rows) => {
                if (err) { return reject(err); }
                resolve(rows);
            });
        })
    })
}

function getSubstrateTypes(substrate_id) {
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            db.all(`select id,name from substrate_type where substrate_type.parent_id = ?`,[substrate_id] ,(err, rows) => {
                if (err) { return reject(err); }
                resolve(rows);
            });
        })
    })
}
//get the substrate category, name and type for an article from article_substrate
function getArticleSubstrates(article_id) {
    return new Promise(function (resolve, reject) {
        db.serialize(() => {
            db.all(`SELECT
                           substrate_category.name AS category,
                           substrate_name.name AS name,
                           substrate_type.name AS type
                       FROM
                           article_substrate
                               LEFT JOIN substrate_category ON article_substrate.category_id = substrate_category.id
                               LEFT JOIN substrate_name ON article_substrate.name_id = substrate_name.id
                               LEFT JOIN substrate_type ON article_substrate.type_id = substrate_type.id
                       WHERE
                           article_substrate.article_id = ?`,
                [article_id] ,(err, rows) => {
                if (err) { return reject(err); }
                resolve(rows);
            });
        })
    })
}
//to do getsubstratecategory()
// get substrate
