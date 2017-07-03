(function(dynCore, hashNav) {
    dynCore.css('home', '/hub/res/css/home.css');

    dynCore.when(dynCore.html('home'), dynCore.require('/shared/js/isMobile.js')).done(function(modules) {
        hashNav.appInit(init(modules));
    });

    function init(modules) {
        var home = {
            title: 'home',
            favicon: null
        };

        hashNav.bindNavApp(function(app, section, args) {
            if (app === 'home') {
                //
            }
        });

        dynCore.require('/shared/js/xml.js').done(function() {
            dynCore.modules().xml.ajax('http://services.odata.org/OData/OData.svc/$metadata')
        });

        return home;
    }
})(window.dynCore, window.hashNav);