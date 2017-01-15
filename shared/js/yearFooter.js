(function() {
    $('<footer/>')
        .appendTo($('.off-canvas-content'))
        .load('../shared/html/yearFooter.html',
            function(resp, status) {
            if (status === 'success') {
                $("#year").text(new Date().getFullYear());
            } else {
                console.error('Unable to load yearFooter.html');
            }
        }
    );
})();