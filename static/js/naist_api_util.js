const initSelector = function () {
    var current_date = new Date();
    var current_year = current_date.getFullYear();
    var oldest_year = 2010;

    /* セレクタのoptionを最新年からoldest_yar年まで作る */
    $('.year_list').each(function () {
        for (var year = current_year; year >= oldest_year; year--) {
            $(this).append('<option value="' + year + '">' + year + '</option>');
        }
    });

    $('#year_start').val(current_year - 2); /* (最新年-2)年から表示 */
}

const setParam = function () {
    var year_start = $('#year_start').val();
    var year_end = $('#year_end').val();
    var category_select = $('#category_select').val();
    $('input[name="gyoseki_start"]').val(year_start);
    $('input[name="gyoseki_end"]').val(year_end);
    $('input[name="kubun"]').val(category_select);
    $('input[name="chair"]').val("ソフトウェア工学");
    $('input[name="output"]').val("json");
}

const showLoad = function () {
    /* 業績リストのロード画面，業績リストを空文字にしてloadingエリアを表示 */
    $('#search_result_area').hide();
    $('#search_result_list').html('');
    $('#loading').show();
}

const hideLoad = function () {
    /* ロード終了したらloadingエリアを非表示にして業績エリアを表示 */
    $('#loading').delay(600).fadeOut(600);    
    $('#search_result_area').show();
}

const gyoseki_search = function () {
    showLoad();
    setParam();
    item_search();
    hideLoad();
}