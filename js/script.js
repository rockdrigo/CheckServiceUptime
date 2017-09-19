var startDate = "";
var endDate = "";
var disponibility;
var mtbf = 0;
var mttf = 0;
var mttr = 0;
var time=0;
var timeUP = 0;
var lastTimeUP = 0;
var timeDown = 0;
var errors = 0;
var isError = 0;
var host;
var port;
var timeout;
var duration;
var interval;

var successRequests = 0;
var errorRequests = 0;
var totalRequests = 0;
var keepGoing;
var keepGoingTimeOut;
var checkConnectionTimeOut;
var data;
var chart;
function checkConnection(host, port, timeout) {
    /*make sure you host a helloWorld HTML page in the following URL, so that requests are succeeded with 200 status code*/
    $.ajax({
        url: 'status.php',
        type: 'POST',
        data: jQuery.param({host: host, port: port, timeout: timeout}),
        dataType: 'json',
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        success: function (response) {
            if (response.status.localeCompare("ok") === 0) {
                addSuccess();
            } else {
                addError();
            }
        },
        error: function (response) {
            addError();
        }
    });
}

$(document).ready(function () {

    startChart();

    $('#beginTest').click(function () {

        cleanResults();
        host = $('#hostname').val().replace("http://", "").replace("https://", "");
        port = $('#port').val();
        interval = $('#interval').val();
        timeout = $('#timeout').val();
        duration = $('#duration').val();
        if (host != "" && port != "" && interval != "" && timeout != "" && duration != "") {
            $(this).button('loading');
            var duration_converted = Number(duration) * 60 * 1000;
            var interval_converted = Number(interval) * 1000;

            startDate = new Date();

            $('#startDate').append(startDate.toLocaleString().replace(",", ""));

            keepGoing = true;
            keepGoingTimeOut = setTimeout(function () {
                keepGoing = false;

                endDate = new Date();
                if (isError != 0) {
                    timeDown = timeDown + (endDate.getTime() - isError);
                    isError = 0;
                }

                updateVars();

                createResultsFile();
                $('#beginTest').button('reset');
            }, duration_converted);
            function f() {
                if (keepGoing) {
                    checkConnectionTimeOut = checkConnection(host, port, timeout);
                    setTimeout(f, interval_converted);
                }
            }

            f();
        } else {
            $('#alerts').append("<div class='alert alert-danger alert-dismissable'><a href='#' class='close' data-dismiss='alert' aria-label='close'>×</a><strong>Danger!</strong>Please fill all the inputs</div>");
        }
    });

    $('#resetTest').click(function () {

        keepGoing = false;
        if (keepGoingTimeOut != null) {
            clearTimeout(keepGoingTimeOut);
        }
        if (checkConnectionTimeOut != null) {
            clearTimeout(checkConnectionTimeOut);
        }
        $('#beginTest').button('reset');
        cleanResults();
    });


});


function cleanResults() {
    var startDate = document.getElementById("startDate");
    var requests_number = document.getElementById("requests_number");
    var success_rate = document.getElementById("success_rate");
    var mtbf_element = document.getElementById("mtbf");
    var errors_element = document.getElementById("errors");
    var files_badge_element = document.getElementById("files_badge");

    cleanElement(startDate);
    cleanElement(requests_number);
    cleanElement(success_rate);
    cleanElement(mtbf_element);
    cleanElement(errors_element);
    cleanElement(files_badge_element);
    $('#files_tab').addClass('disabled');
    requests = 0;
    successRequests = 0;
    errorRequests = 0;
    totalRequests = 0;
    errors = 0;
    isError = 0;
    mttf = 0;
    mttr = 0;
    time=0;
    timeUP = 0;
    lastTimeUP = 0;
    timeDown = 0;
    beginData();
    clearChart();
}

function updateVars() {
    var requests_number = document.getElementById("requests_number");
    var success_rate = document.getElementById("success_rate");
    var mtbf_element = document.getElementById("mtbf");
    var errors_element = document.getElementById("errors");

    updateElement(requests_number, totalRequests);

    timeUP = time - timeDown;

    calculateMttf();
    calculateMttr();
    calculateMtbf();
    calculateDisponibility();
    updateElement(mtbf_element, (Math.ceil(mtbf*1000)/1000));
    updateElement(success_rate, Math.ceil(disponibility*100)/100);

    updateElement(errors_element, errors);
}

function updateElement(element, text) {
    cleanElement(element);
    var textNode = document.createTextNode(text);
    element.appendChild(textNode)
}

function cleanElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function addSuccess() {
    totalRequests++;
    var date = new Date();
    time = (date.getTime()-startDate.getTime());
    successRequests++;
    if (isError != 0) {
        timeDown = timeDown + (date.getTime() - isError);
        isError = 0;
    }
    updateVars();
    var results = $('#results');
    data = data + Math.floor(date.getTime()/1000) + ";UP \n";
    addPointToChart(date,1,null);
}
function addError() {
    totalRequests++;
    var date = new Date();
    time = (date.getTime()-startDate.getTime());

    if (isError === 0) {
        isError = date.getTime();
        errors++;
    } else {
        timeDown = timeDown + (date.getTime() - isError);
        isError = date.getTime();
    }
    errorRequests++;
    updateVars();
    var results = $('#results');
    data = data + Math.floor(date.getTime()/1000) + ";DOWN \n";
    addPointToChart(date,0,"red");
}

function createResultsFile() {

    var str = "StartDate;EndDate;Params;TotalRequests;Disponibility; MTBF \n";
    str = str + Math.round(startDate.getTime()/1000) + ";" + Math.round(endDate.getTime()/1000) + ";" + interval + "/" + port + "/" + host + "/" + timeout + "/" + duration + ";" + totalRequests + ";";
    str= str + (Math.ceil(disponibility*100)/100) + ";" + (Math.ceil(mtbf*1000)/1000);

    createDownloadLink("#results_file1", str, "results1.csv");
    createDownloadLink("#results_file2", data, "results2.csv");
    $('#files_badge').append('2');
    $('#files_tab').removeClass('disabled');
}

function createDownloadLink(anchorSelector, str, fileName) {
    var csv = 'data:text/csv;charset=utf-8,' + str;

    var url = encodeURI(csv);
    $(anchorSelector).attr("href", url);
    $(anchorSelector).attr("download", fileName);
    $(anchorSelector).click();
}

function calculateMttf() {
    var hoursUP = convertMilisecondsToHours(timeUP)
    mttf = 1/(errors/hoursUP);
}
function calculateMttr() {
    var hoursDown = convertMilisecondsToHours(timeDown)
    mttr = (hoursDown/errors);
}

function calculateMtbf() {
    mtbf = mttf + mttr;
}

function calculateDisponibility() {
    disponibility = (mttf/mtbf)*100;

}

function convertMilisecondsToHours(date){
    var hours = (date/1000)/3600
    return hours;
}

function beginData() {
    data = "date;status \n";
}

function startChart(){
    chart = new CanvasJS.Chart("chartContainer", {
        title: {
            text: "Requests"
        },
        axisY: {
            includeZero: false,
        },
        data: [
            {
                type: "stepLine",
                dataPoints: [

                ]
            }

        ]
    });
    chart.render();
}
function clearChart(){
    chart.data[0].dataPoints.length=0;
    chart.render();
}
function addPointToChart(x_value,y_value,color){
    if(color===null) {
        chart.data[0].dataPoints.push({x: x_value, y: y_value});
    }else{
        chart.data[0].dataPoints.push({x: x_value, y: y_value, lineColor:"red"});
    }
    chart.render();

}

