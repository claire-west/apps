(function() {
    window.dynCore.declare('hubAuth',
        window.dynCore.require('../shared/js/centralAuth.js')
    ).done(function(modules) {
        var $signOut = $('.signOut');
        $signOut.find('a').on('click', function() {
            modules.centralAuth.google.signOut();
        })
        modules.centralAuth.google.on('signIn', function(info) {
            $signOut.show().find('span').first().text(info.name);
        }).on('signOut', function() {
            $signOut.hide();
        });
        $('.appNav .top-bar-right').append(modules.centralAuth.google.makeButton());
        modules.centralAuth.google.init();
    });
})();