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
var counts = {};
var lastNumber = null;
var group_1 = null;
var group_2 = null;
let getZipButton;    // 新增對 getAllFileZip 的引用

// --- 初始化函數 (在 DOMContentLoaded 事件中調用) ---
document.addEventListener('DOMContentLoaded', function () {
    getZipButton = document.getElementById('getAllFileZip');
    if (!getZipButton) {
        console.error("錯誤：找不到 ID 為 'getAllFileZip' 的元素。");
    }
    if (getZipButton) {
        getZipButton.addEventListener('click', downloadZipFile);
    }
});
function isMobile() {
    try {
        document.createEvent("TouchEvent"); return true;
    } catch (e) {
        return false;
    }
}
var btninptDiv = document.getElementById("divButtons");
var groupColor = ["btn-outline-primary", "btn-outline-success", "btn-outline-danger"]

var MODULES = [
    ["1.接納學生的情感", "2.稱讚或鼓勵", "3.接受或利用學生的想法", "4.問問題", "5.講述", "6.指示", "7.批評學生或維護權威", "8.學生被動發言", "9.學生主動發言", "0.安靜或混亂"],//FIAS
    ["1.教師主動教學", "2.教師被動教學", "3.學生主動學習", "4.學生被動學習", "5.安靜", "6.吵雜", "7.其他"],//TPI
    [["1.教師A語言發言", "2.教師B語言發言", "3.非語言教學行為", "4.教師非教學行為"], ["5.學生A語言發言", "6.學生B語言發言", "7.非語言學習行為", "8.學生非學習行為"], ["9.其它"]],//LUBT
    [["1.教師導學-講述", "2.教師導學-提問", "3.教師導學-回饋或檢視", "4.教師非教學行為"], ["5.組內共學", "6.組間互學", "7.學生自學", "8.學生非學習行為"], ["9.其它"]]//FLSRL
];
var moduleName = ["FIAS", "TPI", "LUBT", "FLSRL"];

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
    ++ticks;
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
    if (module !== 1) {
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
    var check = document.getElementById(idx).checked;
    if (check) {
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
    } else if (module === 2) {
        const currentNum = idx;
        if (check) {
            return;
        }
        if (currentNum <= 3) {
            if ($("input[name='1']:checked").length > 0) {
                lastNumber = parseInt($("input[name='1']:checked")[0].value, 10);
            } else {
                return;
            }
        } else if (3 < currentNum <= 7) {
            if ($("input[name='0']:checked").length > 0) {
                lastNumber = parseInt($("input[name='0']:checked")[0].value, 10);
            } else {
                return;
            }
        } else {
            return;
        }
        const key = `${lastNumber}-${currentNum}`;
        if (counts[key] !== undefined) {
            counts[key]++;
        }
    } else if (module === 3) {
        const currentNum = idx;
        if (currentNum === 8) {
            return;
        } else if (currentNum <= 3) {
            if (group_1 === currentNum) {
                group_1 = null;
            } else {
                group_1 = currentNum;
            }
        } else if (3 < currentNum <= 7) {
            if (group_2 === currentNum) {
                group_2 = null;
            } else {
                group_2 = currentNum;
            }
        }
        if (group_1 !== null && group_2 !== null) {
            var key_1 = `${group_1}+${group_2}`;
            var key_2 = `${group_2}+${group_1}`;
            if (counts[key_1] !== undefined) {
                counts[key_1]++;
            } else if (counts[key_2] !== undefined) {
                counts[key_2]++;
            }
        }
    }
}
//main flow control
function flowStartPause() {
    if (masterRunning) {
        flowPause();
    } else {
        if (!getTime) {
            flowStart();
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

    switch (module.toString()) {
        case '0': //FIAS
            counts = {
                '7-0': 0, '7-1': 0, '7-2': 0, '7-3': 0, '7-4': 0, '7-5': 0, '7-6': 0, '7-9': 0, '8-0': 0, '8-1': 0, '8-2': 0, '8-3': 0, '8-4': 0, '8-5': 0, '8-6': 0, '8-9': 0, '3-4': 0, '3-7': 0, '3-9': 0
            };
            break;
        case '2': //LUBT
            counts = {
                '0-4': 0, '0-5': 0, '0-6': 0, '0-7': 0, '1-4': 0, '1-5': 0, '1-6': 0, '1-7': 0, '4-0': 0, '4-1': 0, '4-2': 0, '4-3': 0, '5-0': 0, '5-1': 0, '5-2': 0, '5-3': 0
            };
            break;
        case '3': //FLSRL
            counts = {
                '0+4': 0, '0+5': 0, '0+6': 0, '0+7': 0, '1+4': 0, '1+5': 0, '1+6': 0, '1+7': 0, '2+4': 0, '2+5': 0, '2+6': 0, '2+7': 0, '3+4': 0, '3+5': 0, '3+6': 0, '3+7': 0
            };
            break;
    }

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
            subTime[preIdx[i]] += ticks - data[preIdx[i] * 2][data[preIdx[i] * 2].length - 1];
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
            subTime[preIdx[i]] += ticks - data[preIdx[i] * 2][data[preIdx[i] * 2].length - 1];
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
    group_1 = null;
    group_2 = null;
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

window.addEventListener("online", function (event) {
    event.stopPropagation();
    console.log("網路已重新連線，但不會自動刷新頁面");
});

function subArrSum(arr, start, end) {
    if (end == arr.length) {
        end = -1;
    }
    return arr.slice(start - 1, end).reduce((accumulator, currentValue) => accumulator + currentValue, 0);
}

/**
 * 將二進位字串轉換為 ArrayBuffer。
 * 這對於將 XLSX.write() 輸出的二進位字串轉換為 Blob 是必要的。
 * @param {string} s 二進位字串
 * @returns {ArrayBuffer}
 */
function s2ab(s) {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i = 0; i < s.length; i++) {
        view[i] = s.charCodeAt(i) & 0xFF;
    }
    return buf;
}

/**
 * 淨化檔案名稱或分頁名稱，移除特殊字元並限制長度。
 * @param {string} name 原始名稱字串
 * @param {number} maxLength 字串允許的最大長度
 * @returns {string} 淨化後的名稱
 */
function sanitizeName(name, maxLength) {
    // 移除不適合作為檔案名稱或分頁名稱的特殊字元。
    const sanitized = name.replace(/[\/\\:*?"<>|]/g, '_');
    // 限制字串長度
    return sanitized.substring(0, maxLength);
}

/**
 * 處理記錄資料，並將其轉換為 XLSX 格式的 Blob。
 * @returns {Blob} 包含記錄資料的 XLSX Blob
 */
function recordDataProcess() {
    // 原始程式碼中用來處理資料的部分
    var dataT = transpose(data);

    // 使用 XLSX 函式庫建立工作表和工作簿
    var ws = XLSX.utils.aoa_to_sheet(dataT);
    var wb = XLSX.utils.book_new();

    // 設置分頁名稱，並進行防錯處理
    const sheetName = sanitizeName("Records", 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // 將工作簿寫入二進位字串，並轉換為 Blob
    var excelBinary = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    var blob = new Blob([s2ab(excelBinary)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    return blob;
}

function getRecordData() {
    // 呼叫新的處理函式來獲取 Blob
    const recordsBlob = recordDataProcess();
    // 建立檔案名稱，並進行防錯處理
    const fileName = `${moduleName[module]}_${sanitizeName(filename, 200)}_Record.xlsx`;
    // 呼叫 download 函式來下載 Blob
    download(recordsBlob, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

function getVarData() {
    // 呼叫變異量分析處理函式來獲取 Blob
    const varAnalysisBlob = variableAnalysis();
    // 建立檔案名稱，並進行防錯處理
    const fileName = `${moduleName[module]}_${sanitizeName(filename, 200)}_VariableAnalysis.xlsx`;
    // 呼叫 download 函式來下載 Blob
    download(varAnalysisBlob, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

function getFreqData() {
    // 呼叫頻率分析處理函式來獲取 Blob
    const freqAnalysisBlob = frequencyAnalysis();
    // 建立檔案名稱，並進行防錯處理
    const fileName = `${moduleName[module]}_${sanitizeName(filename, 200)}_FrequencyAnalysis.xlsx`;
    // 呼叫 download 函式來下載 Blob
    download(freqAnalysisBlob, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

function variableAnalysis() {
    var symbles = [
        ["TT", "PT", (ticks >= 3000 ? "i/d ratio" : "I/D ratio"), "SC", "TRR", "TQR", "PIR"],
        ["TT", "PT", "PS", "PC", "TIR", "PIR", "TRR", "PRR"],
        ["TT", "PT", "TA", "PA", "TB", "PB"],
        ["TT", "PT", "PI", "Pintra", "Pinter", "PD"]
    ];
    var variables = [
        ["教師話語比率", "學生話語比率", "教師間接影響與直接影響的比率", "安靜或混亂的比率", "教師話語—學生驅動比率", "教師發問比率", "學生話語—學生主動比率"],//FIAS
        ["教師教學比率", "學生學習比率", "安靜比率", "吵雜比率", "教師教學—教師主動比率", "學生學習—學生主動比率", "教師教學—教師被動比率", "學生學習—學生被動比率"],//TPI
        ["教師話語比率", "學生話語比率", "教師話語—教師A語言比率", "學生話語—學生A語言比率", "教師話語—教師B語言比率", "學生話語—學生B語言比率"],//LUBT
        ["教師話語比率", "學生話語比率", "教師促學比率", "組內共學比率", "組間互學比率", "學生自學比率"]//FLSRL
    ];
    results = [];
    switch (module.toString()) {
        case '0': //FIAS
            results.push(subArrSum(subTime, 1, 7) === 0 ? 0 : Math.round((subArrSum(subTime, 1, 7) / subArrSum(subTime, 1, 10)) * 1000) / 10);
            results.push(subArrSum(subTime, 8, 9) === 0 ? 0 : Math.round(((subArrSum(subTime, 8, 9)) / subArrSum(subTime, 1, 10)) * 1000) / 10);
            results.push(Math.round(ticks >= 3000 ? ((subArrSum(subTime, 1, 3) / subArrSum(subTime, 6, 7)) * 1000) : ((subArrSum(subTime, 1, 4) / subArrSum(subTime, 5, 7)) * 1000)) / 10);
            results.push(subTime[9] === 0 ? 0 : Math.round((subTime[9] / subArrSum(subTime, 1, 10)) * 1000) / 10);
            results.push(subArrSum(subTime, 1, 3) === 0 ? 0 : Math.round((subArrSum(subTime, 1, 3) / (subArrSum(subTime, 1, 3) + subArrSum(subTime, 6, 7))) * 1000) / 10);
            results.push(subTime[3] === 0 ? 0 : Math.round((subTime[3] / (subArrSum(subTime, 4, 5))) * 1000) / 10);
            results.push(subTime[8] === 0 ? 0 : Math.round((subTime[8] / (subArrSum(subTime, 8, 9))) * 1000) / 10);
            break;

        case '1': //TPI
            results.push(subArrSum(subTime, 1, 2) === 0 ? 0 : Math.round((subArrSum(subTime, 1, 2) / subArrSum(subTime, 1, 7)) * 1000) / 10);
            results.push(subArrSum(subTime, 3, 4) === 0 ? 0 : Math.round((subArrSum(subTime, 3, 4) / subArrSum(subTime, 1, 7)) * 1000) / 10);
            results.push(subTime[4] === 0 ? 0 : Math.round((subTime[4] / subArrSum(subTime, 1, 7)) * 1000) / 10);
            results.push(subTime[5] === 0 ? 0 : Math.round((subTime[5] / subArrSum(subTime, 1, 7)) * 1000) / 10);
            results.push(subTime[0] === 0 ? 0 : Math.round((subTime[0] / (subArrSum(subTime, 1, 2))) * 1000) / 10);
            results.push(subTime[2] === 0 ? 0 : Math.round((subTime[2] / (subArrSum(subTime, 3, 4))) * 1000) / 10);
            results.push(subTime[1] === 0 ? 0 : Math.round((subTime[1] / (subArrSum(subTime, 1, 2))) * 1000) / 10);
            results.push(subTime[3] === 0 ? 0 : Math.round((subTime[3] / (subArrSum(subTime, 3, 4))) * 1000) / 10);
            break;

        case '2': //LUBT
            results.push(subArrSum(subTime, 1, 2) === 0 ? 0 : Math.round((subArrSum(subTime, 1, 2) / subArrSum(subTime, 1, 9)) * 1000) / 10);
            results.push(subArrSum(subTime, 5, 6) === 0 ? 0 : Math.round((subArrSum(subTime, 5, 6) / subArrSum(subTime, 1, 9)) * 1000) / 10);
            results.push(subTime[0] === 0 ? 0 : Math.round((subTime[0] / subArrSum(subTime, 1, 2)) * 1000) / 10);
            results.push(subTime[4] === 0 ? 0 : Math.round((subTime[4] / subArrSum(subTime, 5, 6)) * 1000) / 10);
            results.push(subTime[1] === 0 ? 0 : Math.round((subTime[1] / subArrSum(subTime, 1, 2)) * 1000) / 10);
            results.push(subTime[5] === 0 ? 0 : Math.round((subTime[5] / subArrSum(subTime, 5, 6)) * 1000) / 10);
            break;

        case '3': //FLSRL
            results.push(subArrSum(subTime, 1, 3) === 0 ? 0 : Math.round((subArrSum(subTime, 1, 3) / subArrSum(subTime, 1, 9)) * 1000) / 10);
            results.push(subArrSum(subTime, 5, 7) === 0 ? 0 : Math.round((subArrSum(subTime, 5, 7) / subArrSum(subTime, 1, 9)) * 1000) / 10);
            results.push(subArrSum(subTime, 1, 3) === 0 ? 0 : Math.round((subArrSum(subTime, 1, 3) / subArrSum(subTime, 1, 9)) * 1000) / 10);
            results.push(subTime[4] === 0 ? 0 : Math.round((subTime[4] / subArrSum(subTime, 1, 9)) * 1000) / 10);
            results.push(subTime[5] === 0 ? 0 : Math.round((subTime[5] / subArrSum(subTime, 1, 9)) * 1000) / 10);
            results.push(subTime[6] === 0 ? 0 : Math.round((subTime[6] / subArrSum(subTime, 1, 9)) * 1000) / 10);
            break;

    }
    var data = [
        ["變異量(variable)", "縮寫記號(symbol)", "計算結果(%)"]
    ];

    for (var i = 0; i < symbles[module].length; i++) {
        let resultValue = results[i];

        // 判斷結果是否為 Infinity, -Infinity 或 NaN
        if (!Number.isFinite(resultValue)) {
            // 如果是，將其轉換為 Excel 可以接受的字串
            resultValue = 'devide by zero';
        }

        data.push([`${i + 1}.${variables[module][i]}`, symbles[module][i], resultValue]);
    }

    // 使用 XLSX 函式庫建立工作表和工作簿
    var ws = XLSX.utils.aoa_to_sheet(data);
    var wb = XLSX.utils.book_new();

    // 設置分頁名稱，並進行防錯處理
    const sheetName = sanitizeName("VariableAnalysis", 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // 將工作簿寫入二進位字串，並轉換為 Blob
    var excelBinary = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    return new Blob([s2ab(excelBinary)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function frequencyAnalysis() {
    var actCombination = [["學生被動發言後接納學生的情感", "學生被動發言後稱讚或鼓勵", "學生被動發言後接受或利用學生的想法", "學生被動發言後問問題", "學生被動發言後講述", "學生被動發言後指示", "學生被動發言後批評學生或維護權威", "學生被動發言後安靜或混亂", "學生主動發言後接納學生的情感", "學生主動發言後稱讚或鼓勵", "學生主動發言後接受或利用學生的想法", "學生主動發言後問問題", "學生主動發言後講述", "學生主動發言後指示", "學生主動發言後批評學生或維護權威", "學生主動發言後安靜或混亂", "教師問問題後講述", "教師問問題後學生被動發言", "教師問問題後安靜或混亂"], [''], ['教師A語言發言後學生A語言發言', '教師A語言發言後學生B語言發言', '教師A語言發言後學生非語言學習行為', '教師A語言發言後學生非學習行為', '教師B語言發言後學生A語言發言', '教師B語言發言後學生B語言發言', '教師B語言發言後學生非語言學習行為', '教師B語言發言後學生非學習行為', '學生A語言發言後教師A語言發言', '學生A語言發言後教師B語言發言', '學生A語言發言後教師非語言教學行為', '學生A語言發言後教師非教學行為', '學生B語言發言後教師A語言發言', '學生B語言發言後教師B語言發言', '學生B語言發言後教師非語言教學行為', '學生B語言發言後教師非教學行為'], ['教師導學—講述+組內共學', '教師導學—講述+組間互學', '教師導學—講述+學生自學', '教師導學—講述+學生非學習行為', '教師導學—提問+組內共學', '教師導學—提問+組間互學', '教師導學—提問+學生自學', '教師導學—提問+學生非學習行為', '教師導學—回饋或檢視+組內共學', '教師導學—回饋或檢視+組間互學', '教師導學—回饋或檢視+學生自學', '教師導學—回饋或檢視+學生非學習行為', '教師非教學行為+組內互學', '教師非教學行為+組間互學', '教師非教學行為+學生自學', '教師非教學行為+學生非學習行為']];
    var numCombination = [['8->1', '8->2', '8->3', '8->4', '8->5', '8->6', '8->7', '8->0', '9->1', '9->2', '9->3', '9->4', '9->5', '9->6', '9->7', '9->0', '4->5', '4->8', '4->0'], [''], ['1->5', '1->6', '1->7', '1->8', '2->5', '2->6', '2->7', '2->8', '5->1', '5->2', '5->3', '5->4', '6->1', '6->2', '6->3', '6->4'], ['1+5', '1+6', '1+7', '1+8', '2+5', '2+6', '2+7', '2+8', '3+5', '3+6', '3+7', '3+8', '4+5', '4+6', '4+7', '4+8']];

    var data = [
        ["行為組合", "按鈕組合", "次數"]
    ];
    var idx = 0;
    for (let k in counts) {
        data.push([`${idx + 1}.${actCombination[module][idx]}`, numCombination[module][idx], counts[k]]);
        idx++;
    }

    // 使用 XLSX 函式庫建立工作表和工作簿
    var ws = XLSX.utils.aoa_to_sheet(data);
    var wb = XLSX.utils.book_new();

    // 設置分頁名稱，並進行防錯處理
    const sheetName = sanitizeName("FrequencyAnalysis", 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // 將工作簿寫入二進位字串，並轉換為 Blob
    var excelBinary = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    return new Blob([s2ab(excelBinary)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function download(content, fileName, mimeType) {
    var a = document.createElement('a');
    mimeType = mimeType || 'application/octet-stream';

    if (navigator.msSaveBlob) { // IE10
        // `content` 現在已是 Blob，直接傳入即可
        navigator.msSaveBlob(content, fileName);
    } else if (URL && 'download' in a) { // HTML5 A[download]
        // `content` 現在已是 Blob，直接從 Blob 建立 URL
        a.href = URL.createObjectURL(content);
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            // 釋放 URL 資源以避免記憶體洩漏
            URL.revokeObjectURL(a.href);
        }, 100);
    } else {
        // Fallback 方法，需要將 Blob 讀取為 Data URL
        // 這裡需要使用 FileReader 來處理 Blob
        console.warn("瀏覽器不支援 Blob 下載，嘗試使用 FileReader。");
        const reader = new FileReader();
        reader.onload = function (e) {
            location.href = e.target.result;
        };
        reader.readAsDataURL(content);
    }
}

async function downloadZipFile() {
    // 檢查必要的函式庫是否已載入
    if (typeof JSZip === 'undefined') {
        console.error("JSZip 庫未載入。");
        alert("壓縮檔案功能需要 JSZip 庫，請檢查網絡或 HTML 文件。");
        return;
    }

    if (typeof XLSX === 'undefined') {
        console.error("XLSX 庫未載入。");
        alert("壓縮檔案功能需要XLSX 庫，請檢查網絡或 HTML 文件。");
        return;
    }

    const zip = new JSZip();

    // 取得並淨化使用者輸入的檔案名稱
    const rawFilename = document.getElementById("filename")?.value || new Date().toLocaleDateString();
    // 使用新的共用函式來處理檔名，確保沒有特殊字元且長度符合規範
    const filenameValue = sanitizeName(rawFilename, 200);
    const zipFilename = `MTC_${filenameValue}_AllFileZip.zip`;

    // 1. 添加 Records XLSX
    try {
        // **重點變更：直接呼叫 recordDataProcess() 獲取 Blob**
        const recordsBlob = recordDataProcess();
        zip.file(`${moduleName[module]}_${filenameValue}_Record.xlsx`, recordsBlob);
        console.log("Records XLSX 添加到 Zip。");
    } catch (error) {
        console.warn("生成 Records XLSX 失敗，將跳過此檔案:", error);
    }

    // 2. 添加 Timeline PNG (此部分不變)
    let timelineCanvas = document.getElementById("canvas");
    if (!timelineCanvas) {
        createTimeline();
        timelineCanvas = document.getElementById("canvas");
    }
    if (timelineCanvas) {
        try {
            const timelineBlob = await new Promise(resolve => timelineCanvas.toBlob(resolve, 'image/png'));
            zip.file(`${moduleName[module]}_${filenameValue}_Timeline.png`, timelineBlob);
            console.log("Timeline PNG 添加到 Zip。");
        } catch (error) {
            console.warn("獲取 Timeline Canvas 失敗，將跳過此檔案:", error);
        }
    } else {
        console.warn("Timeline Canvas (ID: 'canvas') 未找到，將跳過此檔案。");
    }

    // 3. 添加 VariableAnalysis XLSX
    try {
        // **重點變更：直接呼叫 variableAnalysis() 獲取 Blob**
        const varAnalysisBlob = variableAnalysis();
        zip.file(`${moduleName[module]}_${filenameValue}_VariableAnalysis.xlsx`, varAnalysisBlob);
        console.log("VariableAnalysis XLSX 添加到 Zip。");
    } catch (error) {
        console.warn("生成 VariableAnalysis XLSX 失敗，將跳過此檔案:", error);
    }

    // 4. 添加 FrequencyAnalysis XLSX
    if (module !== 1) { // TPI (module 1) does not have frequency analysis
        try {
            // **重點變更：直接呼叫 frequencyAnalysis() 獲取 Blob**
            const freqAnalysisBlob = frequencyAnalysis();
            zip.file(`${moduleName[module]}_${filenameValue}_FrequencyAnalysis.xlsx`, freqAnalysisBlob);
            console.log("FrequencyAnalysis XLSX 添加到 Zip。");
        } catch (error) {
            console.warn("生成 FrequencyAnalysis XLSX 失敗，將跳過此檔案:", error);
        }
    }

    // 生成並下載 ZIP 文件
    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            // 使用 FileSaver.js 進行下載
            if (typeof saveAs === 'function') {
                saveAs(content, zipFilename);
                console.log("所有文件壓縮並下載成功！");
            } else {
                console.error("FileSaver.js 庫未載入。請確認您的 HTML 文件中是否正確引入了 FileSaver.js。");
                alert("下載 ZIP 檔案需要 FileSaver.js 庫。");
            }
        })
        .catch(function (error) {
            console.error("生成 ZIP 文件失敗:", error);
            alert("壓縮並下載檔案失敗！");
        });
}