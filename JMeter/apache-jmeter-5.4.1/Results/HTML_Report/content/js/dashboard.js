/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 0.0, "KoPercent": 100.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.0, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, "RANDOM ARTICLE"], "isController": true}, {"data": [0.0, 500, 1500, "https://wikipedia.org/"], "isController": false}, {"data": [0.0, 500, 1500, "https://en.wikipedia.org/"], "isController": false}, {"data": [0.0, 500, 1500, "ENGLISH"], "isController": true}, {"data": [0.0, 500, 1500, "https://en.wikipedia.org/w/index.php?title=Hugh_Eyton-Jones&action=edit"], "isController": false}, {"data": [0.0, 500, 1500, "https://en.wikipedia.org/wiki/Special:Random"], "isController": false}, {"data": [0.0, 500, 1500, "EDIT"], "isController": true}, {"data": [0.0, 500, 1500, "https://en.wikipedia.org/api/rest_v1/page/summary/Fem_(magazine)"], "isController": false}, {"data": [0.0, 500, 1500, "LAUNCH"], "isController": true}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 5, 5, 100.0, 42178.6, 42122, 42284, 42169.0, 42284.0, 42284.0, 42284.0, 0.017198797460081593, 0.0505416223797632, 0.0], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["RANDOM ARTICLE", 1, 1, 100.0, 42127.0, 42127, 42127, 42127.0, 42127.0, 42127.0, 42127.0, 0.02373774538894296, 0.0697991712559641, 0.0], "isController": true}, {"data": ["https://wikipedia.org/", 1, 1, 100.0, 42191.0, 42191, 42191, 42191.0, 42191.0, 42191.0, 42191.0, 0.023701737337346828, 0.06948497606124529, 0.0], "isController": false}, {"data": ["https://en.wikipedia.org/", 1, 1, 100.0, 42284.0, 42284, 42284, 42284.0, 42284.0, 42284.0, 42284.0, 0.023649607416516887, 0.06954000774524643, 0.0], "isController": false}, {"data": ["ENGLISH", 1, 1, 100.0, 84453.0, 84453, 84453, 84453.0, 84453.0, 84453.0, 84453.0, 0.011840905592459712, 0.06963470066190662, 0.0], "isController": true}, {"data": ["https://en.wikipedia.org/w/index.php?title=Hugh_Eyton-Jones&action=edit", 1, 1, 100.0, 42122.0, 42122, 42122, 42122.0, 42122.0, 42122.0, 42122.0, 0.02374056312615735, 0.06980745661412088, 0.0], "isController": false}, {"data": ["https://en.wikipedia.org/wiki/Special:Random", 1, 1, 100.0, 42127.0, 42127, 42127, 42127.0, 42127.0, 42127.0, 42127.0, 0.02373774538894296, 0.0697991712559641, 0.0], "isController": false}, {"data": ["EDIT", 1, 1, 100.0, 42122.0, 42122, 42122, 42122.0, 42122.0, 42122.0, 42122.0, 0.02374056312615735, 0.06980745661412088, 0.0], "isController": true}, {"data": ["https://en.wikipedia.org/api/rest_v1/page/summary/Fem_(magazine)", 1, 1, 100.0, 42169.0, 42169, 42169, 42169.0, 42169.0, 42169.0, 42169.0, 0.023714102776921434, 0.06972965181768598, 0.0], "isController": false}, {"data": ["LAUNCH", 1, 1, 100.0, 42191.0, 42191, 42191, 42191.0, 42191.0, 42191.0, 42191.0, 0.023701737337346828, 0.06948497606124529, 0.0], "isController": true}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to en.wikipedia.org:443 [en.wikipedia.org/103.102.166.224, en.wikipedia.org/2001:df2:e500:ed1a:0:0:0:1] failed: Connection timed out: connect", 4, 80.0, 80.0], "isController": false}, {"data": ["Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to wikipedia.org:443 [wikipedia.org/103.102.166.224, wikipedia.org/2001:df2:e500:ed1a:0:0:0:1] failed: Connection timed out: connect", 1, 20.0, 20.0], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 5, 5, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to en.wikipedia.org:443 [en.wikipedia.org/103.102.166.224, en.wikipedia.org/2001:df2:e500:ed1a:0:0:0:1] failed: Connection timed out: connect", 4, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to wikipedia.org:443 [wikipedia.org/103.102.166.224, wikipedia.org/2001:df2:e500:ed1a:0:0:0:1] failed: Connection timed out: connect", 1, null, null, null, null, null, null], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": ["https://wikipedia.org/", 1, 1, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to wikipedia.org:443 [wikipedia.org/103.102.166.224, wikipedia.org/2001:df2:e500:ed1a:0:0:0:1] failed: Connection timed out: connect", 1, null, null, null, null, null, null, null, null], "isController": false}, {"data": ["https://en.wikipedia.org/", 1, 1, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to en.wikipedia.org:443 [en.wikipedia.org/103.102.166.224, en.wikipedia.org/2001:df2:e500:ed1a:0:0:0:1] failed: Connection timed out: connect", 1, null, null, null, null, null, null, null, null], "isController": false}, {"data": [], "isController": false}, {"data": ["https://en.wikipedia.org/w/index.php?title=Hugh_Eyton-Jones&action=edit", 1, 1, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to en.wikipedia.org:443 [en.wikipedia.org/103.102.166.224, en.wikipedia.org/2001:df2:e500:ed1a:0:0:0:1] failed: Connection timed out: connect", 1, null, null, null, null, null, null, null, null], "isController": false}, {"data": ["https://en.wikipedia.org/wiki/Special:Random", 1, 1, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to en.wikipedia.org:443 [en.wikipedia.org/103.102.166.224, en.wikipedia.org/2001:df2:e500:ed1a:0:0:0:1] failed: Connection timed out: connect", 1, null, null, null, null, null, null, null, null], "isController": false}, {"data": [], "isController": false}, {"data": ["https://en.wikipedia.org/api/rest_v1/page/summary/Fem_(magazine)", 1, 1, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to en.wikipedia.org:443 [en.wikipedia.org/103.102.166.224, en.wikipedia.org/2001:df2:e500:ed1a:0:0:0:1] failed: Connection timed out: connect", 1, null, null, null, null, null, null, null, null], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
