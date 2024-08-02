const initSelector = function () {
    var current_date = new Date();
    var current_year = current_date.getFullYear();
    var oldest_year = 2010;

    $('.year_list').each(function () {
        for (var year = current_year; year >= oldest_year; year--) {
            $(this).append('<option value="' + year + '">' + year + '</option>');
        }
    });

    $('#year_start').val(current_year - 2); 
    $('#year_end').val(current_year);
}

const setParam = function () {
    var year_start = $('#year_start').val();
    var year_end = $('#year_end').val();
    var category_select = $('#category_select').val();
    $('input[name="gyoseki_start"]').val(year_start);
    $('input[name="gyoseki_end"]').val(year_end);
    $('input[name="kubun"]').val(category_select);
    $('input[name="chair"]').val($('input[name="chair"]').val() === "Software Engineering" ? "Software Engineering" : "ソフトウェア工学");
    $('input[name="output"]').val("json");
}

const showLoad = function () {
    $('#search_result_area').hide();
    $('#search_result_list').html('');
    $('#loading').show();
}

const hideLoad = function () {
    $('#loading').delay(600).fadeOut(600);    
    $('#search_result_area').show();
}

const gyoseki_search = function () {
    showLoad();
    setParam();
    item_search();
}

const item_search = function () {
    const url = "//api-research.naist.jp/api/search";
    const params = {
        output: $("input[name='output']").val(),
        gyoseki_start: $("input[name='gyoseki_start']").val(),
        gyoseki_end: $("input[name='gyoseki_end']").val(),
        kubun: $("input[name='kubun']").val(),
        chair: $("input[name='chair']").val()
    };

    $.ajax({
        type: 'GET',
        url: url,
        data: params,
        dataType: 'json',
        success: function(data) {
            hideLoad();
            result_set_json(data);
        },
        error: function(data) {
            console.log(data);
            alert("通信エラーが発生しました.\nCommunication error occurred");
        }
    });
}

const result_set_json = function(json) {
    var html = "";
    var pager_html = "";
    
    if (json.list_item && json.list_item.items && json.list_item.items.length > 0) {
        var items = json.list_item.items;
        
        items.forEach(function(detail, index) {
            if (index === 0) {
                var key_year = detail['dc:year'];
                var category_id = detail['dc:category']['@id'];
                html += "<h2 class='api_h2'>" + detail['dc:year'] + "年</h2>";
                html += "<h3 class='api_h3'>" + detail['dc:category']['@value'] + "</h3>";
                html += "<table class='api_result'>";
            } else {
                if (key_year !== detail['dc:year']) {
                    key_year = detail['dc:year'];
                    category_id = detail['dc:category']['@id'];
                    html += "</table>";
                    html += "<h2 class='api_h2'>" + detail['dc:year'] + "年</h2>";
                    html += "<h3 class='api_h3'>" + detail['dc:category']['@value'] + "</h3>";
                    html += "<table class='api_result'>";
                } else if (category_id !== detail['dc:category']['@id']) {
                    category_id = detail['dc:category']['@id'];
                    html += "</table>";
                    html += "<h3 class='api_h3'>" + detail['dc:category']['@value'] + "</h3>";
                    html += "<table class='api_result'>";
                }
            }
            html += "<tr><td>";
            html += detail['dc:creator'].map(c => c['@name']).join(', ') + ", ";
            html += '"' + detail['dc:title']['@value'] + '", ';
            html += detail['prism:sourceName']['@value'] + ", ";
            if (detail['prism:sourceName2']) {
                html += detail['prism:sourceName2']['@value'] + ", ";
            }
            html += detail['dc:publisher']['@value'] + ", ";
            if (detail['prism:volume']) {
                html += "vol." + detail['prism:volume'] + ", ";
            }
            if (detail['prism:number']) {
                html += "no." + detail['prism:number'] + ", ";
            }
            if (detail['prism:startingPage'] && detail['prism:endingPage']) {
                html += "pp" + detail['prism:startingPage'] + "-" + detail['prism:endingPage'] + ", ";
            } else if (detail['prism:startingPage']) {
                html += "pp" + detail['prism:startingPage'] + ", ";
            } else if (detail['prism:endingPage']) {
                html += "pp" + detail['prism:endingPage'] + ", ";
            }
            if (detail['prism:place']) {
                html += detail['prism:place'] + ", ";
            }
            if (detail['prism:publicationDate']) {
                html += formatPublicationDate(detail['prism:publicationDate']) + ", ";
            }
            if (detail['prism:doi']) {
                html += '<a href="http://doi.org/' + detail['prism:doi'] + '" target="_blank">doi:' + detail['prism:doi'] + '</a>, ';
            }
            if (detail['dc:repositoryHandle']) {
                html += '<a href="' + detail['dc:repositoryHandle'] + '" target="_blank">naistar</a>';
            }
            html += "</td></tr>";
        });

        html += "</table>";
    } else {
        html += "<table class='api_result'><tr><td style='border: 1px solid #333;'>検索結果がありません\nNo search results found</td></tr></table>";
    }

    $("#search_result_list").html(html);
    $(".search_result_pager").html(pager_html);
}

const formatPublicationDate = function(dateStr) {
    var date_ar = dateStr.split("/");
    var month_list = { '1': 'Jan', '2': 'Feb', '3': 'Mar', '4': 'Apr', '5': 'May', '6': 'Jun', '7': 'Jul', '8': 'Aug', '9': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' };
    var dstr = "";
    if (date_ar.length === 3) {
        dstr = date_ar[2] + " " + month_list[date_ar[1]] + ". " + date_ar[0];
    } else if (date_ar.length === 2) {
        dstr = month_list[date_ar[1]] + ". " + date_ar[0];
    } else if (date_ar.length === 1) {
        dstr = date_ar[0];
    }
    return dstr;
}

$(document).ready(function() {
    initSelector();
    setParam();
    gyoseki_search();
});
