(function(dynCore, hashNav) {
    dynCore.css('randomTables', '/hub/css/randomTables.css');

    dynCore.when(dynCore.html('randomTables'),
        dynCore.require([
            'hashNav',
            'centralAuth',
            'ajaxLoader',
            'ajaxError',
            'actuallyRandom',
            'uuid'
        ], 'lib'),
        dynCore.require('https://cdnjs.cloudflare.com/ajax/libs/seedrandom/2.4.3/seedrandom.min.js')
    ).done(function(modules) {
        hashNav.appInit(init(modules));
    });

    function init(modules) {
        var randomTables = {
            title: 'randomTables',
            favicon: null,

            api: {

            },

            load: {

            },

            nav: {

            }
        }

        modules.lib.centralAuth.google.on('signIn', function(info) {

        });

        modules.lib.centralAuth.google.on('signOut', function() {

        });

        hashNav.bindNavApp(function(app, section, args) {
            if (app === 'randomTables') {
                if (!section) {
                    // window.location.replace('#randomTables-');
                }
            }
        });

        hashNav.bindNavSection(function(app, section, args) {
            if (app === 'randomTables') {
                if (randomTables.nav[section]) {
                    randomTables.nav[section].apply(this, args);
                }
            }
        });

        return randomTables;
    }
})(window.dynCore, window.hashNav);