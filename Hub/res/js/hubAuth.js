(function() {
    var $signOut = $('.signOut');
    $signOut.find('a').on('click', function() {
        window.centralAuth.google.signOut();
    })
    window.centralAuth.google.on('signIn', function(info) {
        $signOut.show().find('span').first().text(info.name);
    }).on('signOut', function() {
        $signOut.hide();
    });
    $('.top-bar-right').append(window.centralAuth.google.makeButton());
    window.centralAuth.google.init();
})();