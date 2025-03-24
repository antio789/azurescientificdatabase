
/*adds an event listener on click for all buttons inside the filter ul,
    for the active filters their id (primary key) is retrieved.
    it is stored as fieldId-x, thus 'fieldId-' is first removed before fetching data
when a button is clicked to remove that filter a request for refresh is send to obtain the new list of articles
*/
const anchorElement = document.querySelector(`#search-terms`);
anchorElement.addEventListener('click', function (e) {
    const but = e.target;
    if (but.classList.contains("selection-button")) {
        but.classList.toggle("active");
        const active = document.querySelectorAll('#search-terms .active');
        const activeIds = [];
        for (const activeButton of active) {
            const id = activeButton.id.replace('fieldId-', '');
            activeIds.push(parseInt(id));
        }
        //fetch the corresponding when the filter is a new one added
        if (but.classList.contains("active")) {
            //query and insert new fields

            fetchArticles(parseInt(but.id.replace('fieldId-', '')), but, activeIds);//need to get id.
        } else {
            const label = but.nextElementSibling;
            label.removeChild(label.lastChild);
            console.log(activeIds);
            refreshArticles(activeIds);
        }
    }
})

// fetch id: send the id that needs new children to be displayed,
// target: the button in question, indicating where the children should be added
// activeIds: all the selected filters to fetch the articles.
function fetchArticles(id, target, activeIds) {
    fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldId: id, filters: activeIds })
    })
        .then(response => response.json())
        .then(data => {
            const response = JSON.parse(data);
            //console.log(response);

            //addNewArticles(response.articles, articlelist);
            // Update child fields
            addNewFilters(response.children, target);
            //console.log(target.nextElementSibling);

            addNewArticlesAccordion(response.articles, document.querySelector("#accordionfilter"))
        })
        .catch(err => console.error('Error fetching articles:', err));
};

function refreshArticles(activeIds) {
    fetch('/search/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: activeIds })
    })
        .then(response => response.json())
        .then(data => {
            const response = JSON.parse(data);
            //addNewArticles(response.articles, articlelist);
            addNewArticlesAccordion(response.articles, document.querySelector("#accordionfilter"));
        })
}

function addNewFilters(filters, target) {
    const ul = document.createElement("ul");
    ul.classList.add("list-group");
    for (const obj of filters) {
        const li = document.createElement('li');
        li.classList.add("list-group-item")
        const button = document.createElement('button');
        button.classList.add("selection-button")
        button.id = `fieldId-${obj.id}`
        button.name = `entry-${obj.id}`
        const lab = document.createElement('label');
        lab.for = `fieldId-${obj.id}`;
        lab.innerText = obj.field_name;
        lab.classList.add("text-capitalize");
        li.append(button);
        li.append(lab);
        ul.append(li);
    }
    target.nextElementSibling.append(ul);
}

function addNewArticles(articles, target) {
    while (target.firstChild) {
        target.removeChild(target.lastChild);
    }
    for (const obj of articles) {
        const li = document.createElement('li');
        li.innerText = obj.title;
        for (const author of obj.authors) {
            const p = document.createElement('p');
            console.log(author);
            p.innerHTML = `<b> -${author.first_name}, ${author.last_name}</b>`;
            li.append(p);
        }
        target.append(li);
    }
}

function addNewArticlesAccordion(filters, target) {
    while (target.firstChild) {
        target.removeChild(target.lastChild);
    }
    const div2 = document.createElement("div");
    div2.classList.add("accordion-item"); //<div class="accordion-item">
    for (const obj of filters) {

        const h2 = document.createElement("h2");
        h2.classList.add("accordion-header");   //<h2 class="accordion-header"></h2>
        const a = document.createElement("a");
        a.classList.add("btn", "btn-secondary");
        a.setAttribute("href", `https://doi.org/${obj.doi}`);
        a.setAttribute("role", "button");
        a.innerText = "go to article"; //<a class="btn btn-primary" href="#" role="button">Link</a>
        const but = document.createElement("button");
        but.classList.add("accordion-button", "collapsed");
        but.setAttribute('type', 'button');
        but.setAttribute('data-bs-toggle', 'collapse');
        but.setAttribute('data-bs-target', `#articleId-${obj.id}`);
        but.setAttribute("aria-expanded", "false");
        but.setAttribute("aria-controls", `articleId-${obj.id}`)  //<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#fieldId-<%= obj.id %>" aria-expanded="" aria-controls="fieldId-<%= obj.id %>">
        but.innerHTML = `${obj.title} <br/> Publication Year: ${obj.publication_year}`;

        //for identification in filtering context by date
        div2.classList.add(`pubYear:${obj.publication_year}`)

        const divcoll = document.createElement("div");
        divcoll.id = `articleId-${obj.id}`;
        divcoll.classList.add("accordion-collapse", "collapse") //<div id="fieldId-<%= obj.id %>" class="accordion-collapse collapse">

        const divchild = document.createElement("div");
        divchild.classList.add("accordion-body");
        divchild.innerText = obj.abstract;

        for (const author of obj.authors) {
            const p = document.createElement('p');
            console.log(author);
            p.innerHTML = `<b> -${author.first_name}, ${author.last_name}</b> <a class="btn btn-outline-success" href="https://orcid.org/${author.orcid}" role="button">Orcid</a>
`;
            p.classList.add("mt-2")
            divchild.append(p);
        }

        h2.appendChild(but);
        a.classList.add("ms-2");
        but.appendChild(a);
        div2.appendChild(h2);
        divcoll.appendChild(divchild);
        div2.appendChild(divcoll);
    }
    target.appendChild(div2);
}


//disables the second year filter input when an option is selected that only requires one input.
const yearSelection = document.querySelector("#yearSelect");
yearSelection.addEventListener('click', function (e) {
    const selector = e.target;
    if (selector.nodeName === "OPTION") {
        yearfield2 = document.querySelector("#yearFilter");
        if (selector.hasAttribute("value")) {

            yearfield2.disabled = true;
        }
        else {
            yearfield2.disabled = false;
        }
    }
})

//when the button is pressed filter the articles shown according to the year selected.
const yearFilterButton = document.querySelector("#yearFilterButton");
yearFilterButton.addEventListener('click', function (e) {
    console.log("click");
    const value = yearSelection.value;
    if (value === "From - To") {
        startyear = yearSelection.nextElementSibling;//first year to filter
        endyear = startyear.nextElementSibling;//last year to filter
        for (const article of Articlelist()) {
            if (article.year < parseInt(startyear.value) || article.year > parseInt(endyear.value)) {
                article.target.style = "display: none;"
            }
            else {
                article.target.removeAttribute("style");
            }
        }
    } else {
        year = parseInt(yearSelection.nextElementSibling.value);//year to filter
        filtertype = parseInt(yearSelection.value);//filter type
        for (const article of Articlelist()) {
            if (filtertype === 1 && article.year < year) {
                article.target.style = "display: none;"
            } else if (filtertype === 2 && article.year > year) {
                article.target.style = "display: none;"
            } else if (filtertype === 3 && article.year !== year) {
                article.target.style = "display: none;"
            }
            else {
                article.target.removeAttribute("style");
            }
        }
    }
})

function Articlelist() {
    const articles = document.querySelector('#accordionfilter');
    const articlesarray = []
    for (const element of articles.childNodes) {
        for (const entry of element.classList.entries()) {
            const classname = entry[1].toString();
            if (classname.includes("pubYear:")) {
                const year = parseInt(classname.replace("pubYear:", ""));
                const output = {
                    year: year,
                    target: element,
                };
                articlesarray.push(output);
            }
        }
    }
    return articlesarray;
}


/* work in progress trying to improve the looks of the filter table;/ used accordion for articles instead. section refersh to old list method
 <section>
                    <h2>articles output</h2>
                    <ul id="articles"></ul>
                </section>

const accord = document.querySelector("#accordionfilter");
accord.addEventListener("click", function (e) {
    const but = e.target;
    if (but.classList.contains('accordion-button')) {
        const active = document.querySelectorAll('.accordion-button');
        const activeIds = [];
        for (const activeButton of active) {
            if (!activeButton.classList.contains("collapsed")) {
                const id = activeButton.id.replace("fieldId-", "");
                activeIds.push(parseInt(id));
            }
        }
        if (!but.classList.contains("collapsed")) {
            console.log(but.id);
            console.log(but.id.replace('fieldId-', ''));
            fetchArticles2(parseInt(but.id.replace('fieldId-', '')), but, activeIds);
        } else {
            console.log(but.parentElement.nextElementSibling.children[0]);
            const accordionBody = but.parentElement.nextElementSibling.children[0];
            while (accordionBody.firstChild) {
                accordionBody.removeChild(accordionBody.lastChild);
            }
            //refreshArticles2(activeIds);
        }
    }
})

function fetchArticles2(id, target, activeIds) {
    fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldId: id, filters: activeIds })
    })
        .then(response => response.json())
        .then(data => {
            const response = JSON.parse(data);
            console.log(response);
            // Update the article list
            const articlelist = document.querySelector("#articles");
            //addNewArticles(response.articles, articlelist);
            // Update child fields
            addNewFilters2(response.children, target);
            //console.log(target.nextElementSibling);
        })
        .catch(err => console.error('Error fetching articles:', err));
};

function addNewFilters2(filters, target) {
    const div = document.createElement("div");
    div.classList.add("accordion");
    for (const obj of filters) {
        const div2 = document.createElement("div");
        div2.classList.add("accordion-item"); //<div class="accordion-item">

        const h2 = document.createElement("h2");
        h2.classList.add("accordion-header");   //<h2 class="accordion-header"></h2>

        const but = document.createElement("button");
        but.classList.add("accordion-button", "collapsed");
        but.setAttribute('type', 'button');
        but.setAttribute('data-bs-toggle', 'collapse');
        but.setAttribute('data-bs-target', `#fieldId-${obj.id}`);
        but.setAttribute("aria-expanded", "");
        but.setAttribute("aria-controls", `fieldId-${obj.id}`)  //<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#fieldId-<%= obj.id %>" aria-expanded="" aria-controls="fieldId-<%= obj.id %>">
        but.innerText = obj.field_name;

        const divcoll = document.createElement("div");
        divcoll.id = `fieldId-${obj.id}`;
        divcoll.classList.add("accordion-collapse", "collapse") //<div id="fieldId-<%= obj.id %>" class="accordion-collapse collapse">

        const divchild = document.createElement("div");
        divchild.classList.add("accordion-body");

        h2.appendChild(but);
        div2.appendChild(h2);
        divcoll.appendChild(divchild);
        div2.appendChild(divcoll);
        div.appendChild(div2);
    }
    target.parentElement.nextElementSibling.appendChild(div);

}
    
EJS content
<div class="accordion" id="accordionfilter">
        <h2>search querries</h2>
        <% for(const obj of fields){ %>
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button id="fieldId-<%= obj.id %>" class="accordion-button collapsed" type="button"
                        data-bs-toggle="collapse" data-bs-target="#coll-fieldId-<%= obj.id %>" aria-expanded=""
                        aria-controls="coll-fieldId-<%= obj.id %>">
                        <%= obj.field_name %>
                    </button>
                </h2>
                <div id="coll-fieldId-<%= obj.id %>" class="accordion-collapse collapse">
                    <div class="accordion-body">
                    </div>
                </div>
            </div>
            <% } %>
    </div>

*/