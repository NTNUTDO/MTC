// initialize data-array	
var data = [];
var tmp;
var ticks = 0;
var masterRunning = false;
var masterEnd = false;
var subTime = [];
var startTime;
var getTime = false;
var itemNum = 0;
var module = 0;
var isMobile = isMobile();
var counts = {
    '7-0': 0, '7-1': 0, '7-2': 0, '7-3': 0, '7-4': 0, '7-5': 0, '7-6': 0, '7-9': 0, '8-0': 0, '8-1': 0, '8-2': 0, '8-3': 0, '8-4': 0, '8-5': 0, '8-6': 0, '8-9': 0, '3-4': 0, '3-7': 0, '3-9': 0
};
var lastNumber = null;
function isMobile() {
    try {
        document.createEvent("TouchEvent"); return true;
    } catch (e) {
        return false;
    }
}
var btninptDiv = document.getElementById("divButtons");
var groupColor = ["btn-outline-primary", "btn-outline-success", "btn-outline-danger"]

var FIAS_mdl = ["接納學生的情感", "稱讚或鼓勵", "接受或利用學生的想法", "問問題", "講述", "指示", "批評學生或維護權威", "學生被動發言", "學生主動發言", "安靜或混亂"];
var TPI_mdl = ["教師主動發言", "教師被動發言", "學生主動發言", "學生被動發言", "安靜", "吵雜", "其他干擾"];
var CLIL_mdl = [["教師中文發言", "教師英文發言", "教師混用語言", "非語言教學行為"], ["學生中文發言", "學生英文發言", "學生混用語言", "非語言學習行為"], ["安靜", "吵雜", "其他干擾"]];
var DL_mdl = [["教師導學—講述", "教師導學—提問", "教師導學—回答", "教師走動巡視"], ["組內共學", "組間互學", "學生自學"], ["安靜", "吵雜", "其他干擾"]];
var MODULES = [];

MODULES.push(FIAS_mdl);
MODULES.push(TPI_mdl);
MODULES.push(CLIL_mdl);
MODULES.push(DL_mdl);

// Original timer by Leon Williams @
// https://stackoverflow.com/questions/29971898/how-to-create-an-accurate-timer-in-javascript
/**
 * Self-adjusting interval to account for drifting
 * 
 * @param {function} workFunc  Callback containing the work to be done
 *                             for each interval
 * @param {int}      interval  Interval speed (in milliseconds) - This 
 * @param {function} errorFunc (Optional) Callback to run if the drift
 *                             exceeds interval
 */
function AdjustingInterval(workFunc, interval, errorFunc) {
    var that = this;
    var expected, timeout;
    this.interval = interval;

    this.start = function () {
        expected = Date.now() + this.interval;
        timeout = setTimeout(step, this.interval);
    }

    this.stop = function () {
        clearTimeout(timeout);
    }

    this.clear = function () {

    }

    function step() {
        var drift = Date.now() - expected;
        if (drift > that.interval) {
            // You could have some default stuff here too...
            if (errorFunc) errorFunc();
        }
        workFunc();
        expected += that.interval;
        timeout = setTimeout(step, Math.max(0, that.interval - drift));
    }
}

// Define the work to be done
var doWork = function () {
    ++ticks;// time goes up
    var minutes = Math.floor(ticks / 60);
    var seconds = ticks - (60 * minutes);
    if (seconds.toString().length < 2) { seconds = '0' + seconds.toString() }
    if (minutes.toString().length < 2) { minutes = '0' + minutes.toString() }
    document.getElementById("MasterTime").innerHTML = minutes + ':' + seconds;
};

// Define what to do if something goes wrong
var doError = function () {
    console.warn('The drift exceeded the interval.');
};

// (The third argument is optional)
var ticker = new AdjustingInterval(doWork, 1000, doError);


//control btn generation
function btnGen() {
    module = parseInt(document.getElementById("module").value);
    if (module == 0) {
        if ($(".dropdown-item[onclick='getFreqData()']").hasClass("d-none")) {
            $(".dropdown-item[onclick='getFreqData()']").removeClass("d-none");
        }
    } else {
        if (!$(".dropdown-item[onclick='getFreqData()']").hasClass("d-none")) {
            $(".dropdown-item[onclick='getFreqData()']").addClass("d-none");
        }
    }
    clearButtonDiv(); // clear current buttons before creating new buttons
    if (module <= 1) {//module:FIAS,TPI
        itemNum = MODULES[module].length;
        for (var i = 0; i < itemNum; i++)
            addButton(MODULES[module][i], 0, i);
    } else {//module:CLIL,DL
        itemNum = 0;
        for (var i = 0; i < MODULES[module].length; i++) {//i:group
            for (var j = 0; j < MODULES[module][i].length; j++)
                addButton(MODULES[module][i][j], i, itemNum++);
        }
    }
}
// Add button
function addButton(btnName, gupName, btnNum) {
    var inpt = document.createElement("input");
    var lbl = document.createElement("label");
    var id = btnNum;

    inpt.type = "radio";
    inpt.className = "btn-check";
    inpt.name = gupName;
    inpt.id = id;
    inpt.value = btnNum;
    inpt.autocomplete = "off";

    lbl.className = "btn btn-lg fs-3 py-xl-4 py-md-3 py-2 " + groupColor[gupName] + " col-10 col-sm-10 col-md-5 d-flex align-items-center justify-content-center disabled" + (isMobile ? " mobile-device" : "");
    lbl.setAttribute("for", id);
    lbl.addEventListener("click", timeStamp, false);

    lbl.innerHTML = btnName;
    btninptDiv.appendChild(inpt);
    btninptDiv.appendChild(lbl);
}
//btn action
var preIdx = [-1, -1, -1];
function timeStamp(event) {
    var idx = event.target.htmlFor;
    var group = document.getElementById(idx).name;
    if (document.getElementById(idx).checked) {
        $("#" + idx).prop("checked", false);
        event.preventDefault();
        data[idx * 2 + 1].push(ticks);
        subTime[idx] += ticks - data[idx * 2][data[idx * 2].length - 1];
        preIdx[group] = -1;
    } else {
        if (preIdx[group] >= 0) {
            data[preIdx[group] * 2 + 1].push(ticks);
            subTime[preIdx[group]] += ticks - data[preIdx[group] * 2][data[preIdx[group] * 2].length - 1];
            preIdx[group] = -1;
        }
        data[idx * 2].push(ticks);
        preIdx[group] = idx;
    }
    if (module === 0) {
        const currentNum = idx;
        if (lastNumber === '3' || lastNumber === '7' || lastNumber === '8') {
            const key = `${lastNumber}-${currentNum}`;
            if (counts[key] !== undefined) {
                counts[key]++;
            }
        }
        lastNumber = currentNum;
    }
}
//main flow control
function flowStartPause() {
    if (masterRunning) {
        flowPause();
    } else {
        if (!getTime) {
            flowStart()
        };
        flowResume();
    }
}
function flowStopReset() {
    if (masterEnd) {
        flowReset();
    } else {
        flowStop();
    }
}
function flowStart() {
    //data prepare
    var time = new Date();
    var h = time.getHours() < 10 ? "0" + time.getHours() : time.getHours();
    var m = time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes();
    startTime = h + ":" + m;
    getTime = true;

    if (module <= 1) {//module:FIAS,TPI
        for (var i = 0; i < MODULES[module].length; i++) {
            data.push(['start ' + MODULES[module][i]]);
            data.push(['stop ' + MODULES[module][i]]);
            subTime.push(0);
        }
    } else {//module:CLIL,DL
        for (var i = 0; i < MODULES[module].length; i++) {//i:group
            for (var j = 0; j < MODULES[module][i].length; j++) {
                data.push(['start ' + MODULES[module][i][j]]);
                data.push(['stop ' + MODULES[module][i][j]]);
                subTime.push(0);
            }
        }
    }

    //flow control
    //UI states
    var btnSR = document.getElementById("flowStpRst");
    btnSR.classList.remove("btn-danger", "disabled");
    btnSR.classList.add("btn-warning");
    btnSR.innerHTML = "Stop";
    $("#setting").addClass('d-none');
}
function flowPause() {
    //data process
    for (var i = 0; i < preIdx.length; i++) {
        if (preIdx[i] >= 0) {
            data[preIdx[i] * 2 + 1].push(ticks);
            $("#" + preIdx[i]).prop("checked", false);
            preIdx[i] = -1;
        }
    }

    //flow control
    ticker.stop();
    masterRunning = false;

    //UI states
    var btnSP = document.getElementById("flowStrPas");
    btnSP.classList.replace("btn-success", "btn-primary");
    btnSP.innerHTML = "Resume";
    $("#divButtons label").addClass("disabled");
}
function flowResume() {
    //data process
    //flow control
    ticker.start();
    masterRunning = true;

    //UI states
    var btnSP = document.getElementById("flowStrPas");
    btnSP.classList.replace("btn-primary", "btn-success");
    btnSP.innerHTML = "Pause";
    $("#divButtons label").removeClass("disabled");
}
function flowStop() {
    //data process
    for (var i = 0; i < preIdx.length; i++) {
        if (preIdx[i] >= 0) {
            data[preIdx[i] * 2 + 1].push(ticks);
            $("#" + preIdx[i]).prop("checked", false);
            preIdx[i] = -1;
        }
    }

    //flow control
    ticker.stop();
    masterRunning = false;
    masterEnd = true;

    //UI states
    var btnSP = document.getElementById("flowStrPas");
    var btnSR = document.getElementById("flowStpRst");
    btnSP.classList.add("disabled");

    btnSR.classList.remove("btn-warning");
    btnSR.classList.add("btn-danger");
    btnSR.innerHTML = "Reset";

    if (!$("#divButtons label").hasClass("disabled")) {
        $("#divButtons label").addClass("disabled");
    }
    $("#divOperate button").removeClass("disabled");
}
function flowReset() {
    //data process
    preIdx = [-1, -1, -1];
    data = [];
    results = [];
    subTime = [];
    ticks = 0;
    module = 0;
    document.getElementById('module').getElementsByTagName('option')[0].selected = 'selected';
    lastNumber = null;
    for (let key in counts) {
        if (counts.hasOwnProperty(key)) {
            counts[key] = 0;
        }
    }

    //flow control
    getTime = false;
    masterRunning = false;
    masterEnd = false;
    //UI states
    var btnSP = document.getElementById("flowStrPas");
    var btnSR = document.getElementById("flowStpRst");
    btnSP.innerHTML = "Start";
    btnSP.setAttribute("class", "btn btn-primary btn-lg px-4 fs-2");
    btnSR.setAttribute("class", "btn btn-danger btn-lg px-4 fs-2 disabled");
    document.getElementById("MasterTime").innerHTML = "00:00";
    btnGen();
    $("#setting").removeClass('d-none');
    if (!$("#divOperate button").hasClass("disabled")) {
        $("#divOperate button").addClass("disabled");
    }
    clearTimeline();
}

function transpose(inputArray) {
    // find length of longest inner array
    var len = 0;
    for (ii = 0; ii < inputArray.length; ii++) {
        var inputLen = inputArray[ii].length;
        if (inputLen > len) { len = inputLen };
    }
    // if inner arrays length less than longest, add necessary nulls
    for (ii = 0; ii < inputArray.length; ii++) {
        var diff = len - inputArray[ii].length;
        if (diff > 0) {
            for (jj = 0; jj < diff; jj++) { inputArray[ii].push(null) }
        }
    }
    // return transposed array
    return inputArray[0].map((col, c) => inputArray.map((row, r) => inputArray[r][c]));
}

// Saving data as csv-file, default filename is current date 
var filename = new Date().toLocaleDateString();
document.getElementById("filename").value = filename;

function getRecordData() {
    var dataT = transpose(data);
    var csvContent = '';
    dataT.forEach(function (infoArray, index) {
        dataString = infoArray.join(',');
        csvContent += index < dataT.length ? dataString + '\n' : dataString;
    });
    download(csvContent, filename + '.csv', 'text/csv;encoding:utf-8');
}
function getVarData() {
    var tmpFilename = filename + "_VariableAnalysis.csv";
    download(variableAnalysis(), tmpFilename, 'text/csv;encoding:utf-8');
}
function getFreqData() {
    var tmpFilename = filename + "_FrequencyAnalysis.csv";
    download(frequencyAnalysis(), tmpFilename, 'text/csv;encoding:utf-8');
}
function variableAnalysis() {
    var symbles = [
        ["TT", "PT", (ticks >= 3000 ? "i/d ratio" : "I/D ratio"), "SC", "TRR", "TQR", "PIR"],
        ["TT", "PT", "PS", "PC", "TIR", "PIR", "TRR", "PRR"],
        ["TT", "PT", "PS", "PC", "TE", "PE", "TC", "PC", "TB", "PB"],
        ["TT", "PT", "PS", "PC", "PI", "Pintra", "Pinter", "PD"]
    ];
    var variables = [
        ["教師話語比率", "學生話語比率", "教師間接影響與直接影響的比率", "安靜或混亂的比率", "教師話語—學生驅動比率", "教師發問比率", "學生話語—學生主動比率"],
        ["教師話語比率", "學生話語比率", "安靜比率", "吵雜比率", "教師話語—教師主動比率", "學生話語—學生主動比率", "教師話語—教師被動比率", "學生話語—學生被動比率"],
        ["教師話語比率", "學生話語比率", "安靜比率", "吵雜比率", "教師話語—教師英語比率", "學生話語—學生英語比率", "教師話語—教師中文比率", "學生話語—學生中文比率", "教師話語—教師中英混用比率", "學生話語—學生中英混用比率"],
        ["教師話語比率", "學生話語比率", "安靜比率", "吵雜比率", "教師促學比率", "組內共學比率", "組間互學比率", "學生自學比率"]
    ];
    results = [];
    switch (module.toString()) {
        case '0': //FIAS
            results.push(Math.round((subArrSum(subTime, 1, 7) / subArrSum(subTime, 1, 10)) * 1000) / 10);
            results.push(Math.round(((subArrSum(subTime, 8, 9)) / subArrSum(subTime, 1, 10)) * 1000) / 10);
            results.push(Math.round(ticks >= 3000 ? ((subArrSum(subTime, 1, 3) / subArrSum(subTime, 6, 7)) * 1000) : ((subArrSum(subTime, 1, 4) / subArrSum(subTime, 5, 7)) * 1000)) / 10);
            results.push(Math.round((subTime[9] / subArrSum(subTime, 1, 10)) * 1000) / 10);
            results.push(Math.round((subArrSum(subTime, 1, 3) / (subArrSum(subTime, 1, 3) + subArrSum(subTime, 6, 7))) * 1000) / 10);
            results.push(Math.round((subTime[3] / (subArrSum(subTime, 4, 5))) * 1000) / 10);
            results.push(Math.round((subTime[8] / (subArrSum(subTime, 8, 9))) * 1000) / 10);
            break;

        case '1': //TPI
            results.push(Math.round(((subArrSum(subTime, 1, 2)) / subArrSum(subTime, 1, 7)) * 1000) / 10);
            results.push(Math.round(((subArrSum(subTime, 3, 4)) / subArrSum(subTime, 1, 7)) * 1000) / 10);
            results.push(Math.round((subTime[4] / subArrSum(subTime, 1, 7)) * 1000) / 10);
            results.push(Math.round((subTime[5] / subArrSum(subTime, 1, 7)) * 1000) / 10);
            results.push(Math.round((subTime[0] / (subArrSum(subTime, 1, 2))) * 1000) / 10);
            results.push(Math.round((subTime[2] / (subArrSum(subTime, 3, 4))) * 1000) / 10);
            results.push(Math.round((subTime[1] / (subArrSum(subTime, 1, 2))) * 1000) / 10);
            results.push(Math.round((subTime[3] / (subArrSum(subTime, 3, 4))) * 1000) / 10);
            break;

        case '2': //CLIL
            results.push(Math.round((subArrSum(subTime, 1, 3) / subArrSum(subTime, 1, 11)) * 1000) / 10);
            results.push(Math.round((subArrSum(subTime, 5, 7) / subArrSum(subTime, 1, 11)) * 1000) / 10);
            results.push(Math.round((subTime[8] / subArrSum(subTime, 1, 11)) * 1000) / 10);
            results.push(Math.round((subTime[9] / subArrSum(subTime, 1, 11)) * 1000) / 10);
            results.push(Math.round((subTime[1] / subArrSum(subTime, 1, 3)) * 1000) / 10);
            results.push(Math.round((subTime[5] / subArrSum(subTime, 5, 7)) * 1000) / 10);
            results.push(Math.round((subTime[0] / subArrSum(subTime, 1, 3)) * 1000) / 10);
            results.push(Math.round((subTime[4] / subArrSum(subTime, 5, 7)) * 1000) / 10);
            results.push(Math.round((subTime[2] / subArrSum(subTime, 1, 3)) * 1000) / 10);
            results.push(Math.round((subTime[6] / subArrSum(subTime, 5, 7)) * 1000) / 10);
            break;

        case '3': //DL
            results.push(Math.round((subArrSum(subTime, 1, 3) / subArrSum(subTime, 1, 10)) * 1000) / 10);
            results.push(Math.round((subArrSum(subTime, 5, 7) / subArrSum(subTime, 1, 10)) * 1000) / 10);
            results.push(Math.round((subTime[7] / subArrSum(subTime, 1, 10)) * 1000) / 10);
            results.push(Math.round((subTime[8] / subArrSum(subTime, 1, 10)) * 1000) / 10);
            results.push(Math.round((subArrSum(subTime, 1, 3) / subArrSum(subTime, 1, 10)) * 1000) / 10);
            results.push(Math.round((subTime[4] / subArrSum(subTime, 1, 10)) * 1000) / 10);
            results.push(Math.round((subTime[5] / subArrSum(subTime, 1, 10)) * 1000) / 10);
            results.push(Math.round((subTime[6] / subArrSum(subTime, 1, 10)) * 1000) / 10);
            break;

    }
    var csvContent = "變異量(variable),縮寫記號(symbol),計算結果(%)\n";
    for (var i = 0; i < symbles[module].length; i++) {
        csvContent += i + 1 + "." + variables[module][i] + "," + symbles[module][i] + "," + results[i] + ", \n";
    }
    return csvContent;
}
function frequencyAnalysis() {
    var csvContent = "行為組合,按鈕組合,次數\n";
    var actCombination = ["學生被動發言後接納學生的情感", "學生被動發言後稱讚或鼓勵", "學生被動發言後接受或利用學生的想法", "學生被動發言後問問題", "學生被動發言後講述", "學生被動發言後指示", "學生被動發言後批評學生或維護權威", "學生被動發言後安靜或混亂", "學生主動發言後接納學生的情感", "學生主動發言後稱讚或鼓勵", "學生主動發言後接受或利用學生的想法", "學生主動發言後問問題", "學生主動發言後講述", "學生主動發言後指示", "學生主動發言後批評學生或維護權威", "學生主動發言後安靜或混亂", "教師問問題後講述", "教師問問題後學生被動發言", "教師問問題後安靜或混亂"];
    var numCombination = ['8->1', '8->2', '8->3', '8->4', '8->5', '8->6', '8->7', '8->10', '9->1', '9->2', '9->3', '9->4', '9->5', '9->6', '9->7', '9->10', '4->5', '4->8', '4->10'];
    var idx = 0;
    for (let k in counts) {
        csvContent += idx + 1 + "." + actCombination[idx] + "," + numCombination[idx] + "," + counts[k] + ", \n";
        idx++;
    };
    return csvContent;
}

function subArrSum(arr, start, end) {
    if (end == arr.length) {
        end = -1;
    }
    return arr.slice(start - 1, end).reduce((accumulator, currentValue) => accumulator + currentValue, 0);
}
// Original function for downloading csv by Arne H. Bitubekk @
// https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
// The download function takes a CSV string, the filename and mimeType as parameters
function download(content, fileName, mimeType) {
    var a = document.createElement('a');
    mimeType = mimeType || 'application/octet-stream';
    if (navigator.msSaveBlob) { // IE10
        navigator.msSaveBlob(new Blob(["\uFEFF" + content], {
            type: mimeType
        }), fileName);
    } else if (URL && 'download' in a) { //html5 A[download]
        a.href = URL.createObjectURL(new Blob(["\uFEFF" + content], {
            type: mimeType
        }));
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
        }, 100);
    } else {
        location.href = 'data:application/octet-stream,' + encodeURIComponent(content); // only this mime type is supported
    }
}

//info modal
function modalControl() {
    // Get the modal
    var modal = document.getElementById('myModal');
    // Get the button that opens the modal
    var btn = document.getElementById("infoButton");
    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];
    // When the user clicks the button, open the modal 
    btn.onclick = function () {
        modal.style.display = "block";
    }
    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        modal.style.display = "none";
    }
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}
function clearButtonDiv() {
    const myNode = document.getElementById("divButtons");
    while (myNode.firstChild) {
        myNode.removeChild(myNode.lastChild);
    }
}
