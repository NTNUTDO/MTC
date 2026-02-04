var timelineColors = ["#15bef0", "#e5053a", "#fcd116", "#5bbf21", "#3a75c4", "#e63375", "#eda075", "#00b08c", "#9258c8", "#8c0032", "#fca311", "#009e60"];

function clearTimeline() {
    if (document.getElementById("canvas") == null) { return; }
    node = document.getElementById("divTimeline");
    removed = document.getElementById("canvas");
    node.removeChild(removed);
}

function leading0(tmp) {
    if (tmp < 10) { return "0" + parseInt(tmp); }
    else { return parseInt(tmp); }
}

function sec2time(tmp) {
    var mins = Math.floor(tmp / 60);
    var secs = tmp - 60 * mins;
    return leading0(mins) + ":" + leading0(secs);
}

function createTimeline() {
    if (document.getElementById("canvas") != null) { if (!confirm('Create new timeline?')) return; }
    else if (ticks == 0) { alert('There is no data!'); return; }

    clearTimeline();

    var numOfButtons = itemNum; // get the number of buttons

    var labels = [];
    if (module <= 1) {
        labels = Array.from(MODULES[module]);
    } else {
        labels = [].concat.apply([], MODULES[module]);
    }
    console.log(labels);

    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    canvas.id = "canvas";
    document.getElementById("divTimeline").appendChild(canvas);

    // Draw grid, 20px for 1 minute, --> plotWidth + labels and totals
    // canvas width
    var textLength = 0;
    for (var i = 0; i < numOfButtons; i++) {
        var txt = labels[i];
        if (ctx.measureText(txt).width > textLength) {
            textLength = ctx.measureText(txt).width;
        }
    }

    var plotWidth; // this from lenght of time
    plotWidth = Math.ceil(ticks / 60) * 20; //20 pixel per min(60sec)
    var canvasWidth = plotWidth + textLength * 2 + 100;	// add room for totals and then some
    canvas.width = canvasWidth;

    // canvas height
    var topMargin = 50;
    var plotHeight = 80 * numOfButtons;
    var canvasHeight = plotHeight + 2 * topMargin;	// add margin and space for ticks
    canvas.height = canvasHeight;

    var plotStart = textLength + 50; // where the plot starts (x), labels to the left

    // postion for labels
    var height = 50; // height of the horizontal bars
    var pos = [];
    for (var pp = 0; pp < numOfButtons; pp++) {
        //var step = 20;
        pos.push(pp * plotHeight / numOfButtons + height * 0.5 + topMargin);
    }

    // draw white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black"; // drawcolor back to black

    //document.body.appendChild(canvas);

    // axes
    ctx.moveTo(plotStart, plotHeight + topMargin);
    ctx.lineTo(plotStart + plotWidth, plotHeight + topMargin);
    ctx.stroke();

    ctx.moveTo(plotStart, plotHeight + topMargin);
    ctx.lineTo(plotStart, topMargin);
    ctx.stroke();

    // Y-ticks and labels
    for (var i = 0; i < numOfButtons; i++) {
        var txt = labels[i];
        ctx.font = '12px sans-serif';
        ctx.fillText(txt, plotStart - (ctx.measureText(txt).width + 10), pos[i] + height / 2 + 5);
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000000";
        // Draw a tick mark 12px long (-6 to 6)
        ctx.moveTo(plotStart - 6, pos[i] + height / 2);
        ctx.lineTo(plotStart + 6, pos[i] + height / 2);
        ctx.stroke();
    }

    // axes labels
    ctx.font = '12px sans-serif';
    ctx.fillText('Items Name', textLength, topMargin - 10);
    ctx.font = '12px sans-serif';
    ctx.fillText('Mins', plotStart + plotWidth, plotHeight + topMargin + 25);


    // X-ticks and labels
    ctx.font = '12px sans-serif';
    ctx.fillText(startTime, plotStart - 15, plotHeight + topMargin + 25);
    for (var i = 0; i <= plotWidth / 20; i++) {//every 1 min, x-ticks mark
        ctx.beginPath(); //?
        ctx.lineWidth = 1;
        // Draw a tick mark 6px long (-3 to 3)
        ctx.setLineDash([]);
        ctx.strokeStyle = "#000000";
        ctx.moveTo(plotStart + 20 * i, plotHeight + topMargin);
        ctx.lineTo(plotStart + 20 * i, plotHeight + topMargin + 10);
        ctx.stroke();
        // Draw gridlines
        if (i > 0 && i % 5 == 0) {//every 5 min, solid gridlines
            ctx.beginPath();
            ctx.strokeStyle = "#8c8c8c";
            ctx.moveTo(plotStart + 20 * i, plotHeight + topMargin - 2);
            ctx.lineTo(plotStart + 20 * i, topMargin);
            ctx.stroke();
            ctx.font = '12px sans-serif';
            ctx.fillText(i, plotStart + 20 * i - 5, plotHeight + topMargin + 25);
        }
        else if (i > 0) {//every 1 min, dashlines
            ctx.beginPath();
            ctx.setLineDash([2, 2]);
            ctx.strokeStyle = "#cccccc";
            ctx.moveTo(plotStart + 20 * i, plotHeight + topMargin - 2);
            ctx.lineTo(plotStart + 20 * i, topMargin);
            ctx.stroke();
        }
    }
    //draw logo 
    var imgObject;
    imgObject = document.getElementById("logo");
    ctx.drawImage(imgObject, canvasWidth - 50, 5, 50, 18);


    // Clear canvas!
    //canvas.style.visibility = "visible";
    var totals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    var start, stop, len;
    for (var i = 0; i < numOfButtons; i++) {
        for (var j = 1; j < data[i * 2].length; j++) {
            start = data[i * 2][j];
            stop = data[i * 2 + 1][j];
            len = stop - start;
            totals[i] += len;
            ctx.fillStyle = timelineColors[i];
            ctx.fillRect(plotStart + start / 3, pos[i], len / 3, height); // /3 to scale 20px for 1 minute
        }
        ctx.fillStyle = "Black"
        ctx.font = '12px sans-serif';
        ctx.fillText(sec2time(totals[i]), plotStart + plotWidth + 20, pos[i] + height / 2 + 2.5);
    }

    // autoscroll to the bottom of the page to show the timeline
    window.scrollTo(0, document.body.scrollHeight);
}

function saveTimeline() {
    // check if canvas exists and if not create it
    if (!document.getElementById("canvas")) {
        createTimeline();
    }

    var link = document.createElement("a");
    link.setAttribute('download', moduleName[module] + "_" + document.getElementById("filename").value + "_Timeline.png");
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    link.remove();
}