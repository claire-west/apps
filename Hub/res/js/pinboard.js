(function() {
    window.dynCore.css('pinboard', 'res/css/pinboard.css');

    $.when(window.dynCore.html('pinboard'),
        window.dynCore.require([
            'hashNav.js',
            'centralAuth.js'
        ], '../shared/js/')
    ).done(function() {
        window.hashNav.appInit('pinboard', init());
    });

    function init() {
        var pinboard = {
            favicon: null,

            api: {

            },

            refresh: {

            },

            nav: {
                load: function(publicOrPrivate) {
                    if (!publicOrPrivate) {
                        window.location.replace('#pinboard-load/public');
                    } else {
                        $('.publicOrPrivate').val(publicOrPrivate);
                        $('.public, .private').addClass('show-for-medium');
                        $('.' + publicOrPrivate).removeClass('show-for-medium');
                    }
                }
            }
        };

        $('.publicOrPrivate').on('change', function() {
            window.location.hash = '#pinboard-load/' + $(this).val();
        });

        window.hashNav.bindNavApp(function(app, section, args) {
            if (app === 'pinboard') {
                if (!section) {
                    window.location.replace('#pinboard-load/public');
                }
            }
        });

        window.hashNav.bindNavSection(function(app, section, args) {
            if (app === 'pinboard') {
                if (pinboard.nav[section]) {
                    pinboard.nav[section].apply(this, args);
                }
            }
        });

        return pinboard;
    }
})();