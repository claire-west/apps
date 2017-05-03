(function() {
    rp.equalize = function() {
        var rows = $("#rpContent div.rpRow").get();
        for (var i = 0; i < rows.length; i++) {
            var children = $(rows[i]).children().get();
            var maxHeight = children.reduce(function(a, b) {
                var height = $(b).height();
                if (height > a) {
                    return height;
                }
                return a;
            }, 0);
            for (var j = 0; j < children.length; j++) {
                var $col = $(children[j]);
                var height = $col.height();
                if (height < maxHeight) {
                    $col.css("margin-top", (maxHeight - height) / 32 + "rem");
                }
            }
        }
    }
})();