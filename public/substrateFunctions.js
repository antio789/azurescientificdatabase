/*adds an event listener on click for all buttons inside the filter ul,
    for the active filters their id (primary key) is retrieved.
    it is stored as fieldId-x, thus 'fieldId-' is first removed before fetching data
when a button is clicked to remove that filter a request for refresh is send to obtain the new list of articles
*/

const PretreatmentSelection = document.querySelector(`#pretreatment_categories`);
const ReactorSelection = document.querySelector(`#reactor_categories`);
const substrateElement = document.querySelector(`#substrate_categories`);
const exportbutton = document.querySelector(`#exportbutton`);
const researchContainer = document.querySelector(`#research_radio`);

const filterType = Object.freeze({
    PRETREATMENT: "pretreatment",
    REACTOR: "reactor"
});

const fieldContainer = Object.freeze({
    PRETREATMENT: "pretreatment_categories",
    REACTOR: "reactor_categories"
})

const researchRadios = Object.freeze({
    pretreatment: "pretreatment_radio",
    reactor: "reactor_radio"
})

document.querySelectorAll('.accordion-button a').forEach(function (button) {
    button.addEventListener('click', function (e) {
        e.stopPropagation();
    })
});

researchContainer.addEventListener('click', function (e) {
    const react = document.querySelector("#accordion_reactor");
    const pret = document.querySelector("#accordion_pretreatment");
    if (document.getElementById(researchRadios.pretreatment).checked) {
        //target.style = "display: none;"
        //article.target.removeAttribute("style");
        react.style = "display: none;"
        pret.removeAttribute("style");
    } else if (document.getElementById(researchRadios.reactor).checked) {
        pret.style = "display: none;"
        react.removeAttribute("style");
    }
});

exportbutton.addEventListener('click', async function (e) {
    const filters = document.querySelectorAll('#pretreatment_categories .active');
    const substrate = document.querySelectorAll('#substrate_categories .active');
    const fieldIds = [];
    const substrateIds = [];
    for (const activeButton of filters) {
        const id = activeButton.id.replace('fieldId-', '');
        fieldIds.push(parseInt(id));
    }
    for (const activeButton of substrate) {
        const id = activeButton.id.replace('fieldId-', '');
        substrateIds.push(parseInt(id));
    }
    fetch('/substrate/export', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({filters: fieldIds, substrate: substrateIds})
    })
        .then(async response => {
            console.log(response);
            const blob = await response.blob();

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'customers.csv';
            link.click();
            setTimeout(() => URL.revokeObjectURL(link.href), 0)
        })
});

PretreatmentSelection.addEventListener('click', function (e) {

    updateArticleFilters(e, fieldContainer.PRETREATMENT, filterType.PRETREATMENT);
});

ReactorSelection.addEventListener('click', function (e) {

    updateArticleFilters(e, fieldContainer.REACTOR, filterType.REACTOR);
});

function updateArticleFilters(filter, filterContainerId, type) {
    const but = filter.target;
    if (but.classList.contains("selection-button")) {
        but.classList.toggle("active");
        const active = document.querySelectorAll(`#${filterContainerId} .active`);
        const substrate = document.querySelectorAll('#substrate_categories .active');
        const activeIds = [];
        const substrateIds = [];
        for (const activeButton of active) {
            const id = activeButton.id.replace('fieldId-', '');
            activeIds.push(parseInt(id));
        }
        for (const activeButton of substrate) {
            const id = activeButton.id.replace('fieldId-', '');
            substrateIds.push(parseInt(id));
        }
        //fetch the corresponding when the filter is a new one added
        if (but.classList.contains("active")) {
            //query and insert new fields
            fetchArticles(parseInt(but.id.replace('fieldId-', '')), but, activeIds, substrateIds, type);//need to get id.
        } else { //refresh when filter is removed
            const label = but.nextElementSibling;
            label.removeChild(label.lastChild);
            console.log(activeIds);
            refreshArticles(activeIds, substrateIds, type);
        }
    }
}

substrateElement.addEventListener('click', function (e) {
    const but = e.target;
    if (but.classList.contains("selection-button")) {
        but.classList.toggle("active");
        const activeSubstrate = document.querySelectorAll('#substrate_categories .active');
        const reactor = document.querySelectorAll('#reactor_categories .active');
        const pretreat = document.querySelectorAll('#pretreatment_categories .active');
        let fields = pretreat;
        let type = filterType.PRETREATMENT;
        if (document.getElementById(researchRadios.reactor).checked) {
            fields = reactor;
            type = filterType.REACTOR;
        }
        const activeIds = [];
        const fieldsIds = [];
        for (const activeButton of activeSubstrate) {
            const id = activeButton.id.replace('fieldId-', '');
            activeIds.push(parseInt(id));
        }
        for (const field of fields) {
            const id = field.id.replace('fieldId-', '');
            fieldsIds.push(parseInt(id));
        }
        //fetch the corresponding when the filter is a new one added
        if (but.classList.contains("active")) {
            //query and insert new fields

            fetchArticles(0, but, fieldsIds, activeIds, type);//need to get id.
        } else {
            refreshArticles(fieldsIds, activeIds, type);
        }
    }
})


// fetch id: send the id that needs new children to be displayed, 0 if ID not necessary
// target: the button in question, indicating where the children(filtering options) should be added
// activeIds: all the selected filters to fetch the articles.
function fetchArticles(id, target, fieldsIds, substrateIds, type = filterType.PRETREATMENT) {
    fetch('/substrate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({fieldId: id, filters: fieldsIds, substrate: substrateIds, filtertype: type})
    })
        .then(response => response.json())
        .then(data => {
            const response = JSON.parse(data);
            //console.log(response);

            //addNewArticles(response.articles, articlelist);
            // Update child fields
            if (id > 0) {
                addNewFilters(response.children, target);
            }
            //console.log(target.nextElementSibling);

            addNewArticlesAccordion(response.articles, document.querySelector("#accordionfilter"))
        })
        .catch(err => console.error('Error fetching articles:', err));
}

//refresh: refresh articles after filter has been removed.
function refreshArticles(fieldIds, substrateIds, type = filterType.PRETREATMENT) {
    fetch('/substrate/refresh', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({filters: fieldIds, substrate: substrateIds, filtertype: type})
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
        lab.innerText = obj.name;
        lab.classList.add("text-capitalize");
        li.append(button);
        li.append(lab);
        ul.append(li);
    }
    target.nextElementSibling.append(ul);
}

function addNewArticlesAccordion(filters, target) {
    target.replaceChildren();


    for (const obj of filters) {
        const articlesBox = document.createElement("div");
        articlesBox.classList.add("accordion-item"); //<div class="accordion-item">
        const h2 = document.createElement("h2");
        h2.classList.add("accordion-header");   //<h2 class="accordion-header"></h2>
        const a = document.createElement("a");
        a.classList.add("btn", "btn-secondary");
        a.setAttribute("href", `https://doi.org/${obj.doi}`);
        a.setAttribute("role", "button");
        a.innerText = "go to article"; //<a class="btn btn-primary" href="#" role="button">Link</a>
        setupAnchor(a);
        const but = document.createElement("button");
        but.classList.add("accordion-button", "collapsed");
        but.setAttribute('type', 'button');
        but.setAttribute('data-bs-toggle', 'collapse');
        but.setAttribute('data-bs-target', `#articleId-${obj.id}`);
        but.setAttribute("aria-expanded", "false");
        but.setAttribute("aria-controls", `articleId-${obj.id}`)  //<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#fieldId-<%= obj.id %>" aria-expanded="" aria-controls="fieldId-<%= obj.id %>">
        but.innerHTML = `${obj.title} <br/> Publication Year: ${obj.publication_year}`;

        //for identification in filtering context by date
        articlesBox.classList.add(`pubYear:${obj.publication_year}`)

        const divcoll = document.createElement("div");
        divcoll.id = `articleId-${obj.id}`;
        divcoll.classList.add("accordion-collapse", "collapse") //<div id="fieldId-<%= obj.id %>" class="accordion-collapse collapse">

        const divchild = document.createElement("div");
        divchild.classList.add("accordion-body");
        divchild.innerText = obj.abstract;

        h2.appendChild(but);
        a.classList.add("ms-2");
        but.appendChild(a);
        articlesBox.appendChild(h2);
        divcoll.appendChild(divchild);
        articlesBox.appendChild(divcoll);
        const p_substrate = document.createElement("p");
        p_substrate.classList.add("mt-2");
        target.appendChild(articlesBox);
    }
    filterArticlesYear();
}

function setupAnchor(a) {
    a.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        const href = a.getAttribute('href');
        window.open(href, '_blank', 'noopener,noreferrer');
    });
}

//disables the second year filter input when an option is selected that only requires one input.
const yearSelection = document.querySelector("#yearSelect");
yearSelection.addEventListener('click', function (e) {
    const selector = e.target;
    let yearfield2;
    if (selector.nodeName === "OPTION") {
        yearfield2 = document.querySelector("#yearFilter");
        yearfield2.disabled = !!selector.hasAttribute("value");
    }
})

//when the button is pressed filter the articles shown according to the year selected.
const yearFilterButton = document.querySelector("#yearFilterButton");
yearFilterButton.addEventListener('click', function (e) {
    filterArticlesYear();
})

function filterArticlesYear() {
    const value = yearSelection.value;
    let year;
    let rangeFormat;
    if (value === "From - To") {
        const startyear = yearSelection.nextElementSibling;//first year to filter
        const endyear = startyear.nextElementSibling;//last year to filter
        for (const article of Articlelist()) {
            if (article.year < parseInt(startyear.value) || article.year > parseInt(endyear.value)) {
                article.target.style = "display: none;"
            } else {
                article.target.removeAttribute("style");
            }
        }
    } else {
        year = parseInt(yearSelection.nextElementSibling.value);//year to filter
        rangeFormat = parseInt(yearSelection.value);//filter type
        for (const article of Articlelist()) {
            if (rangeFormat === 1 && article.year < year) {
                article.target.style = "display: none;"
            } else if (rangeFormat === 2 && article.year > year) {
                article.target.style = "display: none;"
            } else if (rangeFormat === 3 && article.year !== year) {
                article.target.style = "display: none;"
            } else {
                article.target.removeAttribute("style");
            }
        }
    }
}

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


