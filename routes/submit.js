const express = require('express');
const {getMainFields, getChild} = require("../models/articles");
const router = express.Router();

router.get('/submit', (req, res) => {
    const param = getMainFields();
    res.render('input_forms', {fields: param});
});

router.post('/submit', (req, res) => {
    try {
        const parent = req.body.fieldId;
        //console.log(req);
        const Children = getChild(parent);//array
        //console.log(art2);
        res.json(JSON.stringify(Children));
    } catch (e) {
        console.log(e);
    }
});
module.exports = router;