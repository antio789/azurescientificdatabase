const numerical = `<div class="input-group">
                    <span class="input-group-text">Result</span>
                    <input type="text" class="form-control" aria-describedby="result"
                        placeholder="Result Name:ex methane">
                    <input type="text" class="form-control" aria-describedby="unit" placeholder="unit:ex ml/gVS">
                    <input type="text" class="form-control" aria-describedby="category"
                        placeholder="Result Category:ex anaerobic digestion">
                </div>
                <div class="input-group">
                    <input type="text" class="form-control" aria-describedby="result" placeholder="value">
                    <input type="text" class="form-control" aria-describedby="result" placeholder="unit: ex ml/gVS">
                    <select class="form-select" aria-label="Default select example">
                        <option selected>Open this select menu</option>
                        <option value="1">value</option>
                        <option value="2">std</option>
                        <option value="3">min</option>
                        <option value="4">max</option>
                    </select>
                    <input type="number" class="form-control" aria-describedby="p-value"
                        placeholder="optional: p-value">
                    <button class="addnewvalue btn btn-secondary">Add new datapoint</button>
                </div>
            `;
const bool = `<div class="input-group mb-3">
                    <span class="input-group-text">Result</span>
                    <input type="text" class="form-control" aria-describedby="result"
                        placeholder="Result Name:ex methane">
                    <select class="form-select" aria-label="Default select example">
                        <option selected>Yes/No</option>
                        <option value="1">Yes</option>
                        <option value="2">No</option>
                    </select>
                    <input type="number" class="form-control" aria-describedby="p-value"
                        placeholder="optional: p-value">
                    <input type="text" class="form-control" aria-describedby="category"
                        placeholder="Result Category:ex anaerobic digestion">
                </div>`;
const text = `<div class="input-group">
                    <span class="input-group-text">Result</span>
                    <input type="text" class="form-control" aria-describedby="result"
                        placeholder="Result Name:ex methane">
                    <input type="text" class="form-control" aria-describedby="category"
                        placeholder="Result Category:ex anaerobic digestion">
                    <textarea class="form-control" aria-label="result description"
                        placeholder="Result Description"></textarea>
                </div>`;

const newData = document.querySelector(`#addresult`);
newData.addEventListener('click', function (e) {

    const valuetype = document.querySelector(`#valueselection`);
    const resultdiv = document.querySelector('#results');
    const selectionblock = document.querySelector('#newvalueselection');

    const but = e.target;
    const sect = document.createElement('section');
    sect.classList.add("mb-3");
    console.log(valuetype.value)
    if (valuetype.value === "1") {
        sect.innerHTML = numerical;
    } else if (valuetype.value === "2") {
        sect.innerHTML = bool;
    } else if (valuetype.value === "3") {
        sect.innerHTML = text;
    } else {
        sect.innerHTML = numerical;
    }
    resultdiv.insertBefore(sect, selectionblock);
})