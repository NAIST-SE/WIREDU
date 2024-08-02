

function get_datafile(filename) {
  if (filename == "ollvm") {
    return "output_ollvm.json";
  } else {
    return "output_clipy.json";
  }
}


//  d3.v3: d3.xhr(f

var svgWidth = 1000;
var svgHeight = 750;
var x_scale_domain = svgWidth / 8;
var y_scale_domain = svgHeight / 12;
var x_graph_domain = svgWidth - x_scale_domain * 2;
var y_graph_domain = svgHeight - y_scale_domain * 2;
// リポジトリごとの識別子を保存するリスト
var y_axis_labelset = [];
var y_axis_labelcount = [];
var fix_count_dict = {};
var x_rate, y_rate, radius_rate;
// 時間の範囲を保存する変数
var x_axis_lowerscale;
var x_axis_higherscale;

var dataset = [];
var repository_num;
var original_repository;

class CommitInfo {
  constructor(x_axis_data, y_axis_data, radius, label, commitid, is_fix) {
    /*
    this.x_raw_data = x_raw_data;
    this.y_raw_data = y_raw_data;
    */
    this.x_axis_data = x_axis_data;
    this.y_axis_data = y_axis_data;
    this.radius = radius;
    this.label = label;
    this.commitid = commitid;
    this.is_fix = is_fix;
  }
}

const start = document.form.start;
const end = document.form.end;
const button = document.form.button;
const datasetSelect = document.dataset.selector;

//start.addEventListener("change", () => {
//  console.log("start:" + start.value);
//});
//end.addEventListener("change", () => {
//  console.log("end:" + end.value);
//});
button.addEventListener("click", () => {
  //console.log("button clicked");
  d3.select("#myGraph").selectAll("*").remove();
  draw_scatterplot(datasetSelect.value);
});

const radio = document.radioform
radio.addEventListener("change", () =>{
	//console.log("radio button changed")
	draw_scatterplot(datasetSelect.value);
})

function draw_scatterplot(dataset_name) {
  d3.json(get_datafile(dataset_name)).then((data) => {
    d3.select("#myGraph").selectAll("*").remove();
    //var x_axis_labelset = []
    dataset = [];
    //y_axis_labelset = [];
    y_axis_labelset = [];
    y_axis_labelcount = [];
    fix_count_dict = {};
    x_axis_lowerscale = new Date();
    x_axis_higherscale = new Date(1900, 1, 1, 0, 0);



    // 更新数の大小を識別するための変数
    var radius_lowerscale = 1e8;
    var radius_higherscale = 0;
    /*
    var x_axis_dataset = []
    var y_axis_dataset = []
    var radius_dataset = []
    var label_dataset = []
    */
    // データの読み込み
    commit_list = data.commitList;
    for (var i = 0; i < commit_list.length; i++) {
      var commit = commit_list[i];

      var commit_date = commit.date;
      if (commit_date == undefined) {
        commit_date = commit.d;
      }
      var date = str2date(commit_date);

      // 日付フィルタリング
      var start_date = str2date(start.value);
      var end_date = str2date(end.value);
      var is_print = true;
      if (start_date != "Invalid Date" && start_date > date) {
        is_print = false;
      }
      if (end_date != "Invalid Date" && end_date < date) {
        is_print = false;
      }
      if (!is_print) {
        continue;
      }

      var repositoryid = commit.packageid;
      if (repositoryid == undefined) repositoryid = commit.p;

      // Count commits
      var label_index = y_axis_labelset.indexOf(repositoryid);
      if (label_index == -1) {
        y_axis_labelset.push(repositoryid);
        y_axis_labelcount.push(0);
      }
      y_axis_labelcount[label_index]++;

      // Count fix commits
      var label = commit.message;
      if (label == undefined) label = commit.m;

      var is_fix = is_fixcommit(label);

      if (!(repositoryid in fix_count_dict)) {
        fix_count_dict[repositoryid] = 0;
        // console.log(Object.keys(fix_count_dict))
      }
      if (is_fix) {
        fix_count_dict[repositoryid]++;
      }
      else if (radio.fix_only.checked) {
        continue;
      }


      if (date < x_axis_lowerscale) {
        x_axis_lowerscale = date;
      }
      if (date > x_axis_higherscale) {
        x_axis_higherscale = date;
      }



      // diffline[0]は削除された行数，[1]は追加された行数
      var radius = 1;
      var lines = commit.diffLines;
      if (lines == undefined) lines = commit.l;
      // Workaround: たまに配列の配列になっているバグがあるため：
      if (lines != null && lines.length == 2 && Number.isInteger(lines[1])) {
        radius = lines[1];
      }
      // 最小値・最大値を記録する
      if (radius < radius_lowerscale) {
        radius_lowerscale = radius;
      }
      if (radius > radius_higherscale) {
        radius_higherscale = radius;
      }

      var commitid = commit.commitid;
      if (commitid == undefined) commitid = commit.c;
      /*
        x_axis_dataset.push(date)
        y_axis_dataset.push(repositoryid)
        radius_dataset.push(diffline_num)
        label_dataset.push(label)
        */
      // Add a commit to the dataset to be visualized
      dataset.push(
        new CommitInfo(date, repositoryid, radius, label, commitid, is_fix)
      );
    }

    //function calc_data() {
    // とりあえず，時間がないのでバブルソート．言っても数はないので何とかなりそう
    // 0 番目はメインリポジトリなので並べ替え対象外。
    // labelcount の数（＝コミット数）で上位から。
    for (var i = 1; i < y_axis_labelset.length - 1; i++) {
      for (var j = i + 1; j < y_axis_labelset.length; j++) {
        if (y_axis_labelcount[i] < y_axis_labelcount[j]) {
          temp_count = y_axis_labelcount[i];
          y_axis_labelcount[i] = y_axis_labelcount[j];
          y_axis_labelcount[j] = temp_count;

          temp_label = y_axis_labelset[i];
          y_axis_labelset[i] = y_axis_labelset[j];
          y_axis_labelset[j] = temp_label;
        }
      }
    }

    y_axis_labelset = y_axis_labelset.slice(0, 11);

    //console.log(y_axis_labelset);

    /*
  function convertMap(obj){
    let strMap = new Map();
    for(let k of strMap.keys(obj)){
      strMap.set(k, obj[k])
    }
  }
  */
    urlmap = data.urlMap;
    repository_num = y_axis_labelset.length;

    x_rate = x_graph_domain / (x_axis_higherscale - x_axis_lowerscale);
    y_rate = y_graph_domain / y_axis_labelset.length;
    radius_rate = y_rate / (radius_higherscale - radius_lowerscale);
    //}
    //function draw_scatterplot() {
    // 散布図を描画
    var circleElements = d3
      .select("#myGraph")
      .selectAll("circle")
      .data(dataset)
      .enter()
      .append("circle")
      .attr("class", "mark")
      .attr("cx", function (d, i) {
        //return (d.x_axis_data - x_axis_lowerscale) * x_rate + x_scale_domain
        var period = ((d.x_axis_data - x_axis_lowerscale) /
          (x_axis_higherscale - x_axis_lowerscale)) *
          (x_graph_domain - x_scale_domain); // / (24 * 60 * 60* 1000)

        //console.log("period: " + period)
        return period + x_scale_domain;
        //return period;
      })
      .attr("cy", function (d, i) {
        var repository_index = y_axis_labelset.indexOf(d.y_axis_data);
        var y = ((repository_index + 0.5) / repository_num) *
          (y_graph_domain - y_scale_domain) +
          y_scale_domain;
        return y;
        //return y_axis_labelset.indexOf(d.y_axis_data);
      })
      .attr("r", function (d, i) {
        var repository_index = y_axis_labelset.indexOf(d.y_axis_data);
        if (repository_index == -1) {
          return 0;
        }
        if (d.radius == 0) {
          return 0;
        }
        var digit = Math.ceil(Math.log10(d.radius /*+ 5*/));
        var rad = Math.max(3, Math.min(20, Math.pow(1.5, digit)));
        if (Number.isNaN(rad)) {
          console.log(d);
        }
        return rad;
        //return Math.max(3, Math.pow(2, digit));
        //return (d.radius-radius_lowerscale + 1) * radius_rate / 2
        //return Math.log(Math.exp(d.radius - radius_lowerscale + 1) * radius_rate);
      })
      /*
      .style("visibility", function (d, i) {
        if (input_str != null && d.message.indexOf(input_str) != 0) {
          return "hidden";
        }
        return "visible";
      })
      */
      .style("fill", function (d, i) {
        if (d.is_fix) {
          return "blue";
        } else {
          return "green";
        }
      });
    //}
    // yyyy-mm-dd 的な文字列をdate型に変換する
    function str2date(str) {
      let pattern = /[\/\.\-]/;
      var datestr_set = str.split(pattern);
      var year = Number(datestr_set[0]);
      var month = Number(datestr_set[1]);
      var day = Number(datestr_set[2]);
      var date = new Date(year, month, day);
      return date;
    }

    // 軸ラベルの表示
    //function draw_scale() {
    // この辺がちょっと怪しい?
    /*
    var y_scale = d3.scale.linear()
        .domain([0, y_axis_labelset.length - 1])
        .range([y_scale_domain, y_graph_domain])
    */
    /*
    var y_scale = d3.scale
      .linear()
      .domain([0, y_axis_labelset.length - 1])
      .range([y_scale_domain, svgHeight])
    */
    var y_scale = d3.scaleBand()
      //.domain(y_axis_labelset)
      .domain(d3.range(repository_num))
      //.range([y_scale_domain, y_graph_domain])
      //.rangeRoundBands([0, svgHeight])
      .rangeRound([y_scale_domain, y_graph_domain]);
    d3.select("#myGraph")
      .append("g")
      .attr("class", "axis")
      .attr("transform", "translate(" + x_scale_domain + ", " + 0 + ")")
      .call(
        d3.axisLeft(y_scale)
          .ticks(repository_num)
          .tickFormat(function (d, i) {
            username = y_axis_labelset[d];
            fix_num = fix_count_dict[username];
            //console.log(username + "," + url)
            return username + "(" + fix_num + ")";
          })
      );

    function openLink(d) { window.open(urlmap[y_axis_labelset[d]]); }
    d3.select("#myGraph")
      .append("g")
      .attr("class", "axis")
      .attr("transform", "translate(" + x_graph_domain + "," + 0 + ")")
      .call(
        d3.axisRight(y_scale)
          .ticks(y_axis_labelset)
          .tickFormat(function (d, i) {
            return urlmap[y_axis_labelset[d]];
          })
      ).selectAll("text").on('click', openLink);

    //     d3.select('#yaxis')
    //        .selectAll('.tick.major')
    //        .on('click',openLink)
    var x_scale = d3.scaleLinear()
      .domain([x_axis_lowerscale, x_axis_higherscale])
      .range([x_scale_domain, x_graph_domain]);

    var years = x_axis_higherscale;
    var x_scale = d3.scaleTime()
      .domain([x_axis_lowerscale, x_axis_higherscale])
      .range([x_scale_domain, x_graph_domain]);
    d3.select("#myGraph")
      .append("g")
      .attr("class", "axis")
      .attr("transform", "translate(" + 0 + ", " + y_scale_domain + ")")
      .call(d3.axisTop(x_scale));

    var grid = d3.select("#myGraph").append("g");
    var passed_year = (x_axis_higherscale - x_axis_lowerscale) / (365 * 24 * 60 * 60 * 1000);
    var passed_quarter_year = passed_year * 4;
    //var passed_quarter_year = passed_year * 12
    //console.log(passed_year)
    var range_x = d3.range(
      x_scale_domain,
      x_graph_domain,
      x_graph_domain / passed_quarter_year
    );
    var range_y = d3.range(
      //y_scale_domain + y_graph_domain / repository_num,
      y_scale_domain,
      y_graph_domain,
      (y_graph_domain - y_scale_domain) / repository_num
    );
    //console.log(range_x);
    //console.log(range_y);
    grid
      .selectAll("line.y")
      .data(range_y)
      .enter()
      .append("line")
      .attr("class", "grid")
      .attr("x1", x_scale_domain)
      .attr("y1", function (d, i) {
        return d + (y_graph_domain - y_scale_domain) / repository_num / 2;
      })
      .attr("x2", x_graph_domain)
      .attr("y2", function (d, i) {
        return d + (y_graph_domain - y_scale_domain) / repository_num / 2;
      });
    grid
      .selectAll("line.x")
      .data(range_x)
      .enter()
      .append("line")
      .attr("class", "grid")
      .attr("x1", function (d, i) {
        return d + x_graph_domain / passed_quarter_year / 2;
      })
      .attr("y1", y_scale_domain)
      //.attr("y1", 0)
      .attr("x2", function (d, i) {
        return d + x_graph_domain / passed_quarter_year / 2;
      })
      .attr("y2", y_graph_domain);
    //}
    var tooltip = d3.select("body").append("div").attr("class", "tip");

    circleElements
      .on("mouseover", function (d) {
        var x = parseInt((d.x_axis_data - x_axis_lowerscale) * x_rate);
        var y = parseInt(
          (y_axis_labelset.indexOf(d.y_axis_data) + 0.5) * y_rate +
          y_scale_domain
        );
        //var message = d.x_axis_data
        // var message = d.y_axis_data
        var message = d.label;
        // var message = "add lines: " + d.radius.toString()
        var pos = d3.select(this).node().getBoundingClientRect();
        tooltip
          .style("left", `${pos['x'] + 30}px`) //(d3.mouse(this)[0]+30) + "px")
          .style("top", `${(window.pageYOffset + pos['y'] - 30)}px`) //(d3.mouse(this)[1]-30) + "px")
          .style("visibility", "visible")
          .text(message);
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
      });
    circleElements.on("click", function (d) {
      var url = urlmap[d.y_axis_data] + "/commit/" + d.commitid;
      window.open(url, "_blank");
    });

    function is_fixcommit(message) {
      var num_pattern = /[#♯＃][0-9]+/i;
      var fix_identifier_list = ["FIX", "ERROR", "BUG", "ISSUE"];
      if (num_pattern.test(message)) {
        for (let fix_identifier of fix_identifier_list) {
          if (message.toUpperCase().indexOf(fix_identifier) != -1) {
            // console.log(fix_identifier + ": " + message)
            return true;
          }
        }
      }
      return false;
    }
  });
}

// Initial Load
draw_scatterplot(datasetSelect.value);


