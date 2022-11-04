jQuery(function () {
    var apikey = "LIVDSRZULELA";
    $('.tenor-load').each(function (i, img) {
        var gif_id = $(img).attr('gif-id');
        var url = "https://g.tenor.com/v1/gifs?ids=" + gif_id +
            "&key=" + apikey + "&limit=" + 1;
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var a = JSON.parse(this.responseText);
                var src = a["results"][0]["media"][0]["gif"]["url"];
                $(img).attr('src', src);
            }
        };
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    });
});
