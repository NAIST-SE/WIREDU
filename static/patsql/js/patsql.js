var targetURL = "https://rw9v95han2.execute-api.us-east-2.amazonaws.com"

var inputTables = [];
var outputTable;
var lastAjaxRequest;

function deleteRow(r) {
  $(r.parentNode.parentNode).remove();
  synthesize();
}

var constTypesHtml =
  "<select class='observe'>" +
  "  <option value='Str'>Str Type</option>" +
  "  <option value='Int'>Int Type</option>" +
  "  <option value='Dbl'>Dbl Type</option>" +
  "  <option value='Date'>Date Type</option>" +
  "</select>";

function addEmptyConstRow() {
  var html =
    "<tr>" +
    "  <td>" + constTypesHtml + "</td>" +
    "  <td><input class='observe myinput' type='text' placeholder='Value'></td>" +
    "  <td>" +
    "    <button type='button' onclick='deleteRow(this)'>x</button>" +
    "  </td>" +
    "</tr>";
  $("#const-table").append(html);
}

function addConstRow(type, value) {
  var html =
    "<tr class='byfilter'>" +
    "  <td>" + constTypesHtml.replace("'" + type + "'", "'" + type + "' selected") + "</td>" +
    "  <td><input class='observe myinput' type='text' placeholder='Value' value='" + value + "'></td>" +
    "  <td>" +
    "    <button type='button' onclick='deleteRow(this)'>x</button>" +
    "  </td>" +
    "</tr>";
  $("#const-table").append(html);
}

function addInputTable() {
  var index = inputTables.length + 1;

  // set visiblity of a delete button
  if (index > 1) {
    $("#delete-itbl-btn").css("visibility", "visible");
  }

  var newTblId = "i-table-" + index;
  var newFormId = "i-name-" + index;
  var defaultText = "InTable" + index;

  var html =
    '<div class="input_table">' +
    '  <div class="table">' +
    '    <div class="input-title-bar" id="i-title-bar-' + index + '" > ' +
    '      <span style="font-weight: bold; color: white; padding-right: 10px">INPUT</span>' +
    '      <input type="text" class="i-name myinput" value="' + defaultText + '" id="' + newFormId + '">' +
    '    </div>' +
    '    <div id="' + newTblId + '"></div>' +
    '  </div>' +
    '</div>';

  $("#input_tables").append(html);
  insertBlankTable('input', newTblId);
}

function deleteInputTable() {
  var index = inputTables.length;
  if (index == 1) {
    return;// skip if there is only one input table.
  }

  // set visiblity of a delete button
  if (index == 2) {
    $("#delete-itbl-btn").css("visibility", "hidden");
  }

  var tblId = "#i-table-" + index;
  $(tblId).parent().parent().remove();
  inputTables.pop();
}

function adjustTableView() {
  // !! adjustElementsSize is an undocumented function  !!
  outputTable.table.view.wt.wtOverlays.adjustElementsSize();
  for (var i = 0; i < inputTables.length; i++) {
    inputTables[i].table.view.wt.wtOverlays.adjustElementsSize();
  }
}

function adjustWidth() {
  adjustTableView();

  var necessaryWidth = $("#left_area").outerWidth() + $("#center_area").outerWidth();
  $("body").css("min-width", (20 + necessaryWidth + 20) + "px");

  //　adjust title bar width
  var oWidth = $($("#o-table").children()[1]).width();
  $("#o-title-bar").css("width", (oWidth - 40 /* cancel padding */) + "px");
  $("#o-title-bar").parent().css("width", oWidth + "px");

  inputs = $("#input_tables").children();
  for (var i = 1; i <= inputs.length; i++) {
    var tblId = "#i-table-" + i
    var barId = "#i-title-bar-" + i;
    var iWidth = $($(tblId).children()[1]).width();
    $(barId).css("width", (iWidth - 40 /* cancel padding */) + "px");
    $(barId).parent().css("width", iWidth + "px");
  }
}

function clearFilterCondition(table) {
  var filters = table.getPlugin("filters");
  filters.clearConditions();
  filters.filter();
}

function validateCellTypeString(type) {
  return type == "Str" || type == "Int" || type == "Dbl" || type == "Date";
}

function validateIntStr(val) {
  if (!val)
    return false;
  if (val == "null" || val == "NULL")
    return true;

  var regex = /^-?\d+$/g;
  var found = val.toString().match(regex);
  return (found) ? true : false;
}

function validateDblStr(val) {
  if (!val)
    return false;
  if (val == "null" || val == "NULL")
    return true;

  var regex = /^-?\d+\.?\d*$/g;
  var found = val.toString().match(regex);
  return (found) ? true : false;
}

function validateDateStr(val) {
  if (!val)
    return false;
  if (val == "null" || val == "NULL")
    return true;

  var date = new Date(val);
  return (date.valueOf()) ? true : false;
}

function validateCell(type, val) {
  if (type == "Int") {
    if (!validateIntStr(val)) {
      console.log(val + " is not of Int type.");
      return false;
    }
  } else if (type == "Dbl") {
    if (!validateDblStr(val)) {
      console.log(val + " is not of Dbl type.");
      return false;
    }
  } else if (type == "Date") {
    if (!validateDateStr(val)) {
      console.log(val + " is not of Date type.");
      return false;
    }
  }
  return true;
}

function getInputIdString(index) {
  return "i-table-" + index;
}

function getInputTables() {
  var tbls = [];
  for (var i = 0; i < inputTables.length; i++) {
    var hTable = inputTables[i].table.getData();
    var myTable = handsonTableToMyTable(hTable);
    if (!myTable) {
      return null;
    }
    var name = $("#i-name-" + (i + 1)).val();
    myTable.name = name;
    tbls.push(myTable);
  }
  return tbls;
}

function getOutputTable() {
  var hTable = outputTable.table.getData();
  var myTable = handsonTableToMyTable(hTable);
  if (!myTable) {
    return null;
  }
  return myTable;
}

function getConstants() {
  var ret = [];

  var e = document.getElementById("const-table");
  var rows = e.rows;
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var exType = r.cells[0].children[0].value.trim();
    var exVal = r.cells[1].children[0].value.trim();
    if (exVal) {
      if (!validateCell(exType, exVal))
        return null;

      ret.push({
        type: exType,
        value: exVal
      });
    }
  }

  return ret;
}

function registerInputTable(tableId, newTable) {
  var added = {
    "id": tableId,
    "table": newTable,
  };

  for (var i = 0; i < inputTables.length; i++) {
    if (tableId == inputTables[i].id) {
      inputTables[i] = added;
      return
    }
  }
  // if the name doesn't exist
  inputTables.push(added);
}

function registerOutputTable(tableId, outTable) {
  outputTable = {
    "id": tableId,
    "table": outTable,
  };
}

function handsonTableToMyTable(hTable) {
  var header = hTable[0];
  var cols = [];
  for (var i = 0; i < header.length; i++) {
    var head = header[i];
    // if a header row has no types, skip it now.
    if (!head || head.indexOf(":") < 0) {
      console.log("Header is invalid.");
      return null;
    }
    var strs = head.split(":");
    var type = strs[1];
    if (!validateCellTypeString(type)) {
      console.log("Type name is invalid.");
      return null;
    }
    cols.push({
      "name": strs[0],
      "type": type,
    });
  }

  var rows = [];
  for (var i = 1; i < hTable.length; i++) {
    var row = hTable[i];
    for (var k = 0; k < row.length; k++) {
      if (!row[k])
        return null; // empty cell is not allowed.
      if (!validateCell(cols[k].type, row[k]))
        return null;
    }
    rows.push(row);
  }

  return {
    "cols": cols,
    "rows": rows
  };
}

function myTableToHandsonTable(tableObj) {
  var hTable = [];

  // convert a header
  var header = tableObj.cols;
  var headerRow = [];
  for (var i = 0; i < header.length; i++) {
    var name = header[i].name;
    var type = header[i].type;
    headerRow.push(name + ":" + type);
  }
  hTable.push(headerRow);

  // convert rows, just appending
  hTable = hTable.concat(tableObj.rows);

  return hTable;
}

function requestSynth() {
  adjustWidth();
  synthesize();
}

function insertBlankTable(typeIO, fid) {
  var initTable = [
    ["id:Str", "price:Int", "date:Date", "type:Str", "c1:Str", "c2:Str", "c3:Str", "c4:Str", "c5:Str", "c6:Str"],
    ["001", "110", "2020/06/01", "T", "A1", "B2", "C2", "X", "Y", "Z"],
    ["002", "590", "2020/06/02", "T", "A2", "B2", "C4", "X", "Y", "Z"],
    ["003", "250", "2020/06/06", "T", "A2", "B5", "C5", "X", "Y", "Z"],
    ["001", "130", "2020/06/06", "T", "A3", "B4", "C5", "X", "Y", "Z"],
    ["002", "600", "2020/06/09", "T", "A2", "B4", "C3", "X", "Y", "Z"],
    ["002", "580", "2020/06/10", "T", "A1", "B3", "C2", "X", "Y", "Z"],
    ["003", "230", "2020/06/10", "T", "A3", "B4", "C2", "X", "Y", "Z"],
  ];

  var container = document.getElementById(fid);
  var newTable = new Handsontable(container, {
    data: JSON.parse(JSON.stringify(initTable)),
    rowHeaders: function (i) {
      return (i == 0) ? "HEAD" : i;
    },
    colHeaders: function (col) {
      return '';
    },
    filters: true,
    dropdownMenu: true,
    contextMenu: true,
    bindRowsWithHeaders: "strict",
    manualRowMove: true,
    manualColumnMove: true,
    licenseKey: "fad57-815b5-5e245-04b2e-2ac16",
    afterContextMenuHide: adjustWidth,
    afterDropdownMenuHide: adjustWidth,
    afterCreateCol: adjustWidth,
    afterChange: function (_, source) {
      if (source == "loadData") {
        return;
      }
      requestSynth();
    },
    afterPaste: requestSynth,
    afterUndo: requestSynth,
    afterRedo: requestSynth,
    afterRemoveCol: requestSynth,
    afterRemoveRow: requestSynth,
    afterColumnMove: requestSynth,
    afterRowMove: requestSynth,
    afterFilter: function (conds) {
      var id = fid;
      if (id != "o-table")
        return;

      $("#const-table tr:not(.byfilter)").filter(function (_, tr) {
        return $(tr).find("input").val() == "";
      }).remove();
      $("tr").remove(".byfilter")
      for (var i = 0; i < conds.length; i++) {
        var args = conds[i].conditions[0].args;
        for (var j = 0; j < args.length; j++) {
          var ags = args[j];

          // load type
          var type;
          for (var k = 0; k < ags.length; k++) {
            var ag = ags[k];
            if (ag && ag.indexOf(":") >= 0) {
              var type = ag.split(":")[1];
              break;
            }
          }

          // load values
          for (var k = 0; k < ags.length; k++) {
            var ag = ags[k];
            if (ag && ag.indexOf(":") >= 0) {
              continue;
            }
            addConstRow(type, ag);
          }
        }
      }
      requestSynth();
    }
  });

  if (typeIO == 'input') {
    registerInputTable(fid, newTable);
  } else {
    registerOutputTable(fid, newTable);
  }
}

function showSpinner() {
  var spinner = "<div style=\"text-align: center; margin: 10px;\">"
    + "<div  class=\"spinner-border\" role=\"status\">"
    + "<span class=\"sr-only\"></span>"
    + "</div></div>";
  $('#output-query').html(spinner);
}

function showTimeout() {
  var message = "<pre style=\"text-align: center\">Timeout (20 seconds)</pre>";
  $('#output-query').html(message);
}

function showNetworkError() {
  var message = "<pre style=\"text-align: center\">"
    + "Network error happened. <br>Check your connection to the server."
    + "</pre>";
  $('#output-query').html(message);
}

function processOutput(data) {
  var query = data.trim();
  $('#output-query').html("<pre class='q1'><code class='sql'>" + query + "</code></pre>");
  $('pre code').each(function (i, block) {
    hljs.highlightBlock(block);
  });
}

function animateOutputQueryArea() {
  $("#output-query").css("opacity", 0);
  $("#output-query").animate({
    "opacity": 1,
    "background-color": "#DCF7DE",
    "border-color": "#DCF7DE",
  }, 500);
  $("#output-query").animate({
    "background-color": "white",
    "border-color": "silver",
  }, 400);
}

function collectSendData() {
  var itbls = getInputTables();
  var otbl = getOutputTable();
  var consts = getConstants();
  if (!itbls || !otbl || !consts)
    return null;

  var example = {
    input_tables: itbls,
    output_table: otbl,
  };
  return {
    examples: [example],
    options: {
      externalConst: consts,
    }
  };
}

function synthesize() {
  var sendData = collectSendData();
  if (!sendData) {
    return;
  }
  if (lastAjaxRequest) {
    lastAjaxRequest.abort();
  }

  showSpinner();

  let data = {
    "body": JSON.stringify(sendData),
  }

  lastAjaxRequest = $.ajax({
    type: "POST",
    url: targetURL + "/default/sql-synthesis",
    data: JSON.stringify(data),
    contentType: 'application/json; charset=UTF-8',
    dataType: "json",
    success: function (data, status) {
      var currentQuery = $("#output-query").text();
      if (currentQuery != data.body) {
        processOutput(data.body)
        animateOutputQueryArea();
      }
    },
    error: function (_, status) {
      showNetworkError();
    },
  });
}

function saveTextAsFile() {
  var sendData = collectSendData();
  if (!sendData) {
    return;
  }
  var textToSave = JSON.stringify(sendData);
  var textToSaveAsBlob = new Blob([textToSave], { type: "text/plain" });

  saveAs(textToSaveAsBlob);
}

function selectConfigFile() {
  $("input").trigger("click");
}

function setVariablesFromExampleJson(examplesObj) {
  //Load Input Tables
  var loadedInTables = examplesObj.examples[0].input_tables;
  // delete unnecessary tables
  for (var i = inputTables.length; i > loadedInTables.length; i--) {
    deleteInputTable();
  }
  // add necessary tables
  for (var i = inputTables.length; i < loadedInTables.length; i++) {
    addInputTable();
  }
  // load the table contents
  for (var i = 0; i < loadedInTables.length; i++) {
    var loadedTbl = loadedInTables[i];
    // set a table content
    var lTable = myTableToHandsonTable(loadedTbl);
    inputTables[i].table.loadData(lTable);
    // set a table name
    $("#i-name-" + (i + 1)).val(loadedTbl.name);
  }

  //Load Output Table
  var oTable = examplesObj.examples[0].output_table;
  var lOutTable = myTableToHandsonTable(oTable);
  outputTable.table.loadData(lOutTable);

  //Load External Constants	
  var exConsts = examplesObj.options.externalConst;
  $("#const-table").empty();
  for (var i = 0; i < exConsts.length; i++) {
    var type = exConsts[i].type;
    var value = exConsts[i].value;
    addConstRow(type, value);
  }
}

function loadFile() {
  var fileReader = new FileReader();
  fileReader.onload = function (fileLoadedEvent) {
    // clear filter conditions
    clearFilterCondition(outputTable.table);
    for (var i = 0; i < inputTables.length; i++) {
      clearFilterCondition(inputTables[i].table);
    }

    var textFromFileLoaded = fileLoadedEvent.target.result;
    var examplesObj = JSON.parse(textFromFileLoaded);

    setVariablesFromExampleJson(examplesObj);
    requestSynth();
  };

  var fileToLoad = document.getElementById("fileToLoad").files[0];
  fileReader.readAsText(fileToLoad, "UTF-8");
}

function loadTemplete(kind) {
  var example;
  if (kind == "init") {
    example = templetes.init;
  } else if (kind == "where") {
    example = templetes.where;
  } else if (kind == "join") {
    example = templetes.join;
  } else if (kind == "group") {
    example = templetes.gorupby;
  } else if (kind == "subquery") {
    example = templetes.subquery;
  } else if (kind == "window") {
    example = templetes.window;
  } else if (kind == "motivating") {
    example = templetes.motivating;
  } else {
    console.log("illegal templete: " + kind);
    return
  }
  setVariablesFromExampleJson(example);
  requestSynth();
}

function copyQuery() {
  var copyText = $("#output-query").text();

  var dummy = $("<textarea>");
  $("body").append(dummy);
  dummy.val(copyText)
  dummy.select();
  var bool = document.execCommand("copy");
  dummy.remove();

  if (bool) {
    $("#myTooltip").html("Copied!");
  }
}

function copyQueryOut() {
  $("#myTooltip").html("Copy?");
}

$(document).on('click', '.close', function () {
  $(this).parent().remove();
});

$(document).on("change paste", ".observe", function () {
  synthesize();
});

$(document).on("change paste", ".i-name", function () {
  synthesize();
});

$(window).on("load resize", function () {
  adjustWidth();
});

$("#left_area").on("resize", function () {
  adjustWidth();
});

$("#template_en").on("change", function () {
  var val = $("#template_en").val();
  loadTemplete(val);
});

$("#template_jpn").on("change", function () {
  var val = $("#template_jpn").val();
  loadTemplete(val);
});

function initWhneLoaded() {
  addInputTable();

  addEmptyConstRow();

  insertBlankTable("output", "o-table");

  adjustWidth();

  synthesize();
}
initWhneLoaded();
