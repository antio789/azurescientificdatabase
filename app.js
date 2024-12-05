const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('scientific_database.db');
const bodyParser = require('body-parser');

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var searchrouter = require('./routes/search');

var app = express();

//sqlite data fetching functions

//get the main fields (fields with no parent)
function getMainFields() {
  return new Promise(function (resolve, reject) {
    db.serialize(() => {
      db.all("select id, field_name from fields where fields.id not in (select child from fields_tree);", (err, rows) => {
        if (err) { return reject(err); }
        resolve(rows);
      });
    })
  })
}
//get child from a parent id
function getChild(id) {
  const parentrow = parseInt(id);
  //console.log(id);
  if (!id) { throw new Error("id is not a number") }
  return new Promise(function (resolve, reject) {
    db.serialize(() => {
      db.all(`select id,field_name from fields where id in (select child from fields_tree where parent = ${id});`, (err, rows) => {
        if (err) { return reject(err); }
        resolve(rows);
      });
    })
  })
}
//get articles from a selection of parameters
function getArticles(...ids) {
  const idArray = ids;
  return new Promise(function (resolve, reject) {
    db.serialize(() => {
      db.all(`SELECT id,title,abstract,doi from Articles where id in (SELECT article_content.article_id from article_content where tech_id in (${idArray}) group by article_id having count(distinct tech_id) = ${idArray.length});`,
        (err, rows) => {
          if (err) { return reject(err); }
          resolve(rows);
        });
    })
  })
}
//each cannot be used, because it doesnt wait for the database to finish before resolving
//get articles from a selection of parameters, add the authors to each article
async function getArticlesWithAuthors(...ids) {
  const Articles = await getArticles(...ids);
  for (const art of Articles) {
    const authors = await getAuthors(art.id);
    art.authors = authors;
  }
  //console.log(Articles);
  return Articles;
}
//get authors from article id
function getAuthors(id) {
  return new Promise(function (resolve, reject) {
    if (!id || Number.isNaN(id)) { reject("not a valid number") }
    db.serialize(() => {
      db.all(`Select first_name, last_name,orcid from authors where id in (select author_id from article_authors where article_id=${id});`,
        (err, rows) => {
          if (err) { return reject(err); }
          resolve(rows);
        });
    })
  })
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.use('/', indexRouter);
//app.use('/search', searchrouter);

app.get('/search', async (req, res) => {
  const param = await getMainFields();
  res.render('search', { fields: param });
});


//called when a new filter is applied to update articles and filter context
app.post('/search', async (req, res) => {
  try {
    const parent = req.body.fieldId;
    //console.log(req);
    const Children = await getChild(parent);//array
    const Articles = await getArticles(...req.body.filters);
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
app.post('/refresh', async (req, res) => {
  const Articles = await getArticlesWithAuthors(...req.body.filters);
  //console.log(Articles);
  res.json(JSON.stringify({ articles: Articles }))
})


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
