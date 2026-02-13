const express = require('express');
const router = express.Router();
const ObjectsToCsv = require('objects-to-csv');
const fs = require('fs');

const {
    getPretreatmentMainFields,
    getReactorMainFields,
    getChild,
    getArticles,
    getSubstrate_categories, getarticlesinfo
} = require('../models/substrate_articles');
const {join} = require("node:path");


router.get('/', async (req, res) => {
    const param = await getPretreatmentMainFields();
    const reactors = await getReactorMainFields();
    const substrate = await getSubstrate_categories();
    console.log(param);
    res.render('substrate', {fields: param, substrate: substrate, reactors: reactors});
});

router.post('/', async (req, res) => {
    try {
        const parent = req.body.fieldId;
        //console.log(req);
        const Children = parent !== 0 ? await getChild(parent, req.body.filtertype) : null;//
        const articles = await getArticles(req.body.filters, req.body.substrate, req.body.filtertype).catch(err => {
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
    const Articles = await getArticles(req.body.filters, req.body.substrate, req.body.filtertype).catch(err => {
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

router.get('/download', rateLimitDownload, (req, res) => {
    const filePath = join(__dirname, '../Downloads/Biogas_visualisation.pbix');
    const fileStream = fs.createReadStream(filePath);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="Biogas_visualisation.pbix"');

    fileStream.pipe(res);

    fileStream.on('error', (err) => {
        console.error('File error:', err);
        res.status(500).send('Error downloading file');
    });
});

//basic setup to limit downloads, at some point update to a real solution
function rateLimitDownload(req, res, next) {
    const clientIP = req.ip; // req.headers['x-forwarded-for'] -proxy check mdn for usage
    const cooldownMs = 1500;
    if (downloadTracking.has(clientIP)) {
        return res.status(429).send('Too many requests. Please wait before downloading again.');
    }
    const cleanupTimer = setTimeout(() => {
        downloadTracking.delete(clientIP);
    }, cooldownMs);
    downloadTracking.set(clientIP, cleanupTimer);
    next();
}

const downloadTracking = new Map();


module.exports = router;