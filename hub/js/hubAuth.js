(function(dynCore) {
    dynCore.declare('hub.hubAuth', dynCore.require('lib.centralAuth'), function(modules) {
        var centralAuth = modules.lib.centralAuth;

        var $signOut = $('.signOut');
        $signOut.find('a').on('click', function() {
            centralAuth.google.signOut();
        });
        centralAuth.google.on('signIn', function(info) {
            $signOut.show().find('span').first().text(info.name);
        }).on('signOut', function() {
            $signOut.hide();
        });
        $('.appNav .top-bar-right').append(centralAuth.google.makeButton());
        centralAuth.google.init();
    });
})(window.dynCore);