const {dbBRT} = require('./database');

//get the fields that do not have a parent considered as the starting point for filtering
function getMainFields() {
    return dbBRT.prepare("select id, field_name from fields where fields.id not in (select child from fields_tree);").all();
}

//from a 'parent' field retrieves all of its children (where parent =?)
function getChild(id) {
    if (!id) {
        throw new Error("id is not a number")
    }
    return dbBRT.prepare("select id, field_name from fields where fields.id not in (select child from fields_tree);").all([id])
}

//get articles based on filters [ids],
//works by selecting all (and only those) articles that have all the selected filters
// (where tech_id in ids "placeholders") => select all articles that have these fields
// 2. group by article_ids, then for each article_id count the number of fields => For each `article_id` group, the query calculates the number of distinct `field_id` values within that group. The `DISTINCT field_id` ensures that duplicate `field_id` entries in the same group are only counted once.
// HAVING(COUNT...) = id.length: articles that have the numbers of field required, filters out the articles that are missing a filter
function getArticles(...ids) {
    const idArray = ids;
    const placeholders = idArray.map(() => '?').join(', ');
    const stmt = dbBRT.prepare(`SELECT id, title, abstract, doi, publication_year
                                from Articles
                                where id in (SELECT article_content.article_id
                                             from article_content
                                             where tech_id in (${placeholders})
                                             group by article_id
                                             having count(distinct tech_id) = ?);`);
    return stmt.all([...idArray, idArray.length]);
}


//ids: the active filters
// get articles from a selection of parameters, add the authors to each article
function getArticlesWithAuthors(...ids) {
    const Articles = getArticles(...ids);
    for (const art of Articles) {
        art.authors = getAuthors(art.id);
    }
    return Articles;
}

//get authors from article id
function getAuthors(id) {
    if (!id || isNaN(id)) {
        throw new Error("not a valid number");
    }
    const stmt = dbBRT.prepare(`Select first_name, last_name, orcid
                                from authors
                                where id in (select author_id from article_authors where article_id = ?);`);
    return stmt.all([id]);
}

module.exports = {
    getMainFields,
    getChild,
    getArticles,
    getArticlesWithAuthors,
};
