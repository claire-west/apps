(function(dynCore) {
    dynCore.when(dynCore.require([ 'hub.appHub', 'lib.isMobile' ])).done(function(modules, appHub) {
        appHub('home', {
            onInit: function() {
                $('#offCanvas').foundation('open');
            },

            onNavTo: function(app, section) {
                $('#offCanvas').foundation('open');
            }
        });
    });
})(window.dynCore);