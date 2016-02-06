(function(dynCore) {
    dynCore.when(
        dynCore.require('hub.appHub'),
        dynCore.require('lib', [
            'centralAuth',
            'cors',
            'globalModel',
            'random'
        ])
    ).done(function(modules, appHub, centralAuth, cors, globalModel, random) {
        var url = dynCore.getResource('node');

        appHub('swn', {
            model: {
                toSector: function(e, seed) {
                    window.location.hash = '#swn-sector/' + seed;
                }
            },

            onInit: function() {
                var self = this;
                this.model.onReseed = function() {
                    random.uuid().done(function(seed) {
                        self.model._set('seed', seed);
                    });
                };
                this.model.onReseed();
            },

            onNav: {

            },

            onChangeSection: function(to, from) {
                if (to !== 'sector') {
                    this.model._set('sectionMenu', []);
                }
            },

            onNavTo: function(app, section) {

            },

            onExit: function(app, section) {

            },

            onSignIn: function(info) {

            },

            onSignOut: function() {

            }
        });
    });
})(window.dynCore);