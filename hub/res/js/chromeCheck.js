(function() {
    if (!
        ((window.chrome &&
        window.navigator.vendor === 'Google Inc.' &&
        window.navigator.userAgent.indexOf("Edge") === -1 &&
        window.navigator.userAgent.indexOf("OPR") === -1) ||
        window.navigator.userAgent.match("CriOS"))) {
        $('.appNav').after(
            $('<p/>', {
                text: 'This site was created for and tested in Google Chrome and may behave strangely in other browsers.',
                class: 'text-center',
                style: 'margin-bottom:0;'
            }).on('click', function() {
                $(this).remove();
            })
        );
    }
})();