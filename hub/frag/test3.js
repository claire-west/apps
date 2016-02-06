(function(dynCore) {
    dynCore.when(dynCore.require('lib.fragment')).done(function(modules, fragment) {
        fragment.controller('hub.frag.test3', {
            model: {
                text: 'From the third nested fragment\'s model',
                test3arr: [
                    1,
                    2,
                    3
                ]
            },

            onInit: function() {}
        });
    });
})(window.dynCore);