(function() {
    $.when(window.hashNav.getPending('dynform'),
        window.dynCore.require('../shared/js/centralAuth.js')
    ).done(function(rpWindow) {
        window.hashNav.appInit('dynform', init(rpWindow));
    });

    function init(rpWindow) {
        var core = rpWindow.rp.core;

        if (window.centralAuth.google.info) {
            core.auth = window.centralAuth.google.info;
        } else if (core.auth) {
            window.centralAuth.google.info = core.auth;
        }

        var signIn = function(info) {
            core.auth = info;
            core.cancel();
            rpWindow.$('.g-signin2').hide();
            rpWindow.$('#signOut').show().find('span').first().text(info.name);
        };

        rpWindow.signIn = core.signIn = function(googleUser) {
            window.centralAuth.google.signIn(googleUser).done(function(info) {
                signIn(info);
            });
        };

        window.centralAuth.google.on('signIn', function(info) {
            signIn(info);
        });

        var signOut = function() {
            delete core.auth;
            rpWindow.$('#signOut').hide();
            rpWindow.$('.g-signin2').show();
        };

        core.signOut = function() {
            window.centralAuth.google.signOut().then(function() {
                signOut();
            })
        };

        window.centralAuth.google.on('signOut', function() {
            signOut();
        });

        rpWindow.$('#signOut a').off('click').on('click', core.signOut);
        
        return rpWindow;
    }
})();