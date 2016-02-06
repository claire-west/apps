(function(dynCore, hashNav) {
    dynCore.css('youtube', '/hub/css/youtube.css');

    dynCore.when(dynCore.html('youtube'),
        dynCore.loadTemplate('ajaxLoader', '/shared/html/ajaxLoader.html'),
        dynCore.js('https://apis.google.com/js/client.js'),
        dynCore.require([
            'hashNav',
            'centralAuth',
            'ajaxLoader',
            'ajaxError',
            'isMobile'
        ], 'lib')
    ).done(function(modules) {
        hashNav.appInit(init(modules));
        modules.lib.centralAuth.google.on('signIn', function(info) {
            gapi.auth.authorize({
                client_id: '747138068474-uflnaifip3j1t0qbldd2rrojajodvlgu.apps.googleusercontent.com',
                scope: 'https://www.googleapis.com/auth/youtube',
                immediate: true
            }, handleAuth);
        });
    });

    function handleAuth(authresult) {
        if (authresult && !authresult.error) {
            gapi.client.load('youtube', 'v3', function() {
                window.location.replace('#youtube-subscriptions');
            });
        } else {
            $('#app-youtube .linkAccount').off('click').on('click', function() {
                gapi.auth.authorize({
                    client_id: '747138068474-uflnaifip3j1t0qbldd2rrojajodvlgu.apps.googleusercontent.com',
                    scope: 'https://www.googleapis.com/auth/youtube',
                    immediate: false
                }, handleAuth);
            });
            window.location.replace('#youtube-link');
        }
    }

    function init(modules) {
        var youtube = {
            title: 'youtube',
            favicon: null
        }

        return youtube;
    }
})(window.dynCore, window.hashNav);