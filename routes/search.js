const express = require('express');
const router = express.Router();

const { getMainFields,getChild,getArticles,getArticlesWithAuthors } = require('../models/articles.js');

/* GET users listing. */
router.get('/', async (req, res, next) => {
  const param = await getMainFields();
  res.render('search', { fields: param });
});

//called when a new filter is applied to update articles and filter context
//fieldId: the filter that requires its children
//filters: all the active filters
router.post('/', async (req, res) => {
  try {
    const parent = req.body.fieldId;
    //console.log(req);
    const Children = await getChild(parent);//
    //const Articles = await getArticles(...req.body.filters);
    const art2 = await getArticlesWithAuthors(...req.body.filters);
    //console.log(art2);
    //console.log(Articles);
    const resData = {
      children: Children,
      articles: art2
    }
    res.json(JSON.stringify(resData));
  } catch (e) {
    console.log(e);
  }
});

//called everytime a filter has been removed to update the articles list
router.post('/refresh', async (req, res) => {
  const Articles = await getArticlesWithAuthors(...req.body.filters);
  //console.log(Articles);
  res.json(JSON.stringify({ articles: Articles }))
})

module.exports = router;
