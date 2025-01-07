authorHTML = `<div class="input-group mb-3 mt-3">
                    <span class="input-group-text">Email</span>
                    <input type="email" class="form-control" id="InputEmail1" aria-describedby="emailHelp"
                        placeholder="name@ftz.czu.cz">
                </div>
                <div class="input-group mb-3" id="authors">
                    <span class="input-group-text">Author name</span>
                    <input type="text" aria-label="First name" class="form-control" placeholder="First Name">
                    <input type="text" aria-label="Last name" class="form-control" placeholder="Last Name">
                </div>
                <div class="input-group mb-3" id="authors">
                    <span class="input-group-text">Orcid</span>
                    <input type="number" aria-label="Orcid number" class="form-control" placeholder="Orcid id">
                </div>`;
/*adds an event listener on click for all buttons inside the filter ul, for the active filters their id primary key is retrieved.
it is stored as fieldId-x, thus 'fieldId-' is first removed before fetching data
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

        if (but.classList.contains("active")) {
            //query and insert new fields

            fetchArticles(parseInt(but.id.replace('fieldId-', '')), but, activeIds);//need to get id.
        } else {
            const label = but.nextElementSibling;
            label.removeChild(label.lastChild);
            //console.log(activeIds);
        }
    }
    else if (but.classList.contains("addFieldButton")) {
        addNewEmptyField(but);
    }
})

function fetchArticles(id, target, activeIds) {
    fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldId: id, filters: activeIds })
    })
        .then(response => response.json())
        .then(data => {
            const response = JSON.parse(data);
            console.log(response);
            // Update the article list
            //addNewArticles(response.articles, articlelist);
            // Update child fields
            addNewFilters(response, target);
            //console.log(target.nextElementSibling);
        })
        .catch(err => console.error('Error fetching articles:', err));
};

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
        li.append(button);
        li.append(lab);
        ul.append(li);
    }
    const addButton = document.createElement('button');
    addButton.classList.add("addFieldButton", "innerbutton", "btn", "btn-secondary");
    addButton.innerText = "Add SubField";
    ul.append(addButton);
    target.nextElementSibling.append(ul);
}

/*
adding new filter elements based on the position
*/
function addNewEmptyField(target) {
    list = target.parentElement;



    if (!target.classList.contains("innerbutton")) {
        list.innerHTML = `<input type="text" class="form-control m-2" placeholder="insert the name the category">
                        <button class="addFieldButton btn btn-secondary ms-5 innerbutton">Add SubField</button>
                        `;
        const li = document.createElement('li');
        li.classList.add("list-group-item");
        li.innerHTML = `<button class="addFieldButton btn btn-secondary">Add New Field</button>`;
        list.parentElement.append(li);
    } else {
        const ul = document.createElement("ul");
        ul.classList.add("list-group");
        const li = document.createElement('li');
        li.classList.add("list-group-item");
        li.innerHTML = `<input type="text" class="form-control m-2" placeholder="insert the name the category">
                        <button class="addFieldButton btn btn-secondary ms-5 innerbutton">Add Sub Field</button>
                        `;
        ul.append(li);
        list.insertBefore(ul, target);
    }

}

/*
adding new authors to the submittion form
*/
const Authorbutton = document.querySelector(`#authors`);
Authorbutton.addEventListener('click', function (e) {
    const but = e.target;
    if (but.classList.contains("addauthor")) {
        const div = document.createElement('div');
        div.classList.add("border-top", "border-1", "border-secondary")
        div.innerHTML = authorHTML;
        but.parentElement.insertBefore(div, but);
    }
})

