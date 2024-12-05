var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/search', async (req, res, next) => {
  const param = await getMainFields();
  res.render('search', { fields: param });
});

module.exports = router;
