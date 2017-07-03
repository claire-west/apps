(function(dynCore, hashNav) {
    dynCore.css('myAnimeList', '/hub/res/css/myAnimeList.css');

    dynCore.when(dynCore.html('myAnimeList'),
        dynCore.loadTemplate('ajaxLoader', '/shared/html/ajaxLoader.html'),
        dynCore.require([
            'hashNav.js',
            'xml.js',
            'ajaxLoader.js',
            'ajaxError.js'
        ], '/shared/js/')
    ).done(function(modules) {
        hashNav.appInit(init(modules));
    });

    function init(modules) {
        var myAnimeList = {
            title: 'myAnimeList',
            favicon: 'https://myanimelist.cdn-dena.com/images/faviconv5.ico',
            list: [],

            signInOut: function() {
                myAnimeList.lists = [];
                if ($('#app-myAnimeList').is(':visible')) {
                    hashNav.rehash();
                }
            },

            nav: {
                list: function(user) {
                    console.log('here')
                    modules.xml.ajax('https://jikan.me/api/user_list/' + user + '/anime');
                }
            }
        };

        modules.centralAuth.google.on('signIn', myAnimeList.signInOut);
        modules.centralAuth.google.on('signOut', myAnimeList.signInOut);

        hashNav.bindNavApp(function(app, section, args) {
            if (app === 'myAnimeList') {
                if (!section) {
                    window.location.replace('#myAnimeList-list');
                }
            }
        });

        hashNav.bindNavSection(function(app, section, args) {
            if (app === 'myAnimeList' && section) {

                var $actions = $('#app-myAnimeList .sectionNav .top-bar-right .input-group').hide();
                $actions.filter('.input-group[data-section=\'' + section + '\']').show();

                if (myAnimeList.nav[section]) {
                    myAnimeList.nav[section].apply(this, args);
                }
            }
        });

        return myAnimeList;
    }
})(window.dynCore, window.hashNav);