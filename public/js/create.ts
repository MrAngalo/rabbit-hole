// alert("SUBSCRIBE TECH WITH ONKAR ON YOUTUBE !");
jQuery(function() {
    var apikey = "LIVDSRZULELA";
    $('.tenor-load').each(function(i, img) {
        var gif_id = $(img).attr('gif-id');
        var url = "https://g.tenor.com/v1/gifs?ids=" + gif_id +
        "&key=" + apikey + "&limit=" + 1;
        
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var a = JSON.parse(this.responseText);
                var src = a["results"][0]["media"][0]["gif"]["url"];
                $(img).attr('src', src);
            }
        }
        
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    });
    
    var lmt = 30;
    $(".text").keyup(function() {
        $(".searched_content").empty();
        var s = $(".text").val();
        var url = "https://g.tenor.com/v1/search?q=" + s +
            "&key=" + apikey + "&limit=" + lmt;
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var a = JSON.parse(this.responseText);
                var i = 0;
                while (i < a['results'].length) {
                    var src = a["results"][i]["media"][0]["nanogif"]["url"];
                    var id = a['results'][i]['id'];
                    var img = $('<img />')
                    .addClass('pic')
                    .attr('src', src)
                    .attr('gif-id', id)
                    .on('click', function(e) {
                        $('#tenor_gif').val($(this).attr('gif-id')+"").trigger('keyup');
                    });
                    $(".searched_content").append(img);
                    i++;
                }
            }
        };
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    }).trigger('keyup');

    $('#tenor_gif').keyup(function (e) {
        var s = $(this).val();
        var url = "https://g.tenor.com/v1/gifs?ids=" + s +
            "&key=" + apikey;
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var a = JSON.parse(this.responseText);
                var src = '/img/no-gift.png';
                if (a['results'].length != 0) {
                    src = a['results'][0]['media'][0]['gif']['url'];
                }
                $('.preview-gif').attr('src', src)
            }
        }
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    }).trigger('keyup');
});