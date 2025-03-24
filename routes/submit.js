const express = require('express');
const {getMainFields} = require("../models/articles");
const router = express.Router();

router.get('/submit', async (req, res) => {
    const param = await getMainFields();
    res.render('input_forms', { fields: param });
});

router.post('/submit', async (req, res) => {
    try {
        const parent = req.body.fieldId;
        //console.log(req);
        const Children = await getChild(parent);//array
        //console.log(art2);
        console.log(Children);
        res.json(JSON.stringify(Children));
    } catch (e) {
        console.log(e);
    }
});
module.exports = router;