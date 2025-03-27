const express = require('express');
const router = express.Router();
const ObjectsToCsv = require('objects-to-csv');

const {
    getMainFields,
    getChild,
    getArticles,
    getSubstrate_categories, getarticlesinfo
} = require('../models/substrate_articles');

router.get('/', async (req, res, next) => {
    const param = await getMainFields();
    const substrate = await getSubstrate_categories();
    console.log(param);
    res.render('substrate', {fields: param, substrate: substrate});
});

router.post('/', async (req, res) => {
    try {
        const parent = req.body.fieldId;
        //console.log(req);
        const Children = parent !== 0 ? await getChild(parent) : null;//
        const articles = await getArticles(req.body.filters, req.body.substrate).catch(err => {
            throw new Error(`Error at updating articles`, {cause: err})
        });
        //console.log(art2);
        //console.log(Articles);
        const resData = {
            ...(parent !== 0 && {children: Children}),
            articles: articles
        }
        res.json(JSON.stringify(resData));
    } catch (e) {
        console.log(e);
    }
});

//called everytime a filter has been removed to update the articles list
router.post('/refresh', async (req, res) => {
    const Articles = await getArticles(req.body.filters, req.body.substrate).catch(err => {
        throw new Error(`Error at refreshing articles`, {cause: err})
    });
    //console.log(Articles);
    res.json(JSON.stringify({articles: Articles}))
})

router.post('/export', async (req, res) => {
    const Articles = await getarticlesinfo(req.body.filters, req.body.substrate).catch(err => {
        throw new Error(`Error at exporting articles`, {cause: err})
    });
    //console.log(Articles);
    const csv = await new ObjectsToCsv(Articles).toString();
    res.attachment('substrate.csv').send(csv);
})


module.exports = router;