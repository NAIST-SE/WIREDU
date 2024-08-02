function activateLangConfig() {
    var lang = sessionStorage.getItem("lang")
    if (lang == "jpn") {
        $(":lang(en)").hide()
        $(":lang(jpn)").show()
        return
    }
    // default case
    $(":lang(jpn)").hide()
    $(":lang(en)").show()
}

function getParameterByName(name) {
    var url = window.location.href
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function initWhenLoaded() {
    if ("null" == sessionStorage.getItem("lang")) {
        // default value: en
        sessionStorage.setItem("lang", "en")
    }
    // load language from URL
    var lang = getParameterByName("lang")
    if (lang != null) {
        sessionStorage.setItem("lang", lang)
    }
    activateLangConfig()
}

initWhenLoaded()
