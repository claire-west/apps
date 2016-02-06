(function(dynCore) {
    dynCore.when(dynCore.require('lib.fragment')).done(function(modules, fragment) {
        fragment.controller('hub.frag.test', {
            model: {
                text: 'This is from the fragment\'s model!',
                passdown: 'Passed down',
                arr: [
                    'x',
                    'y',
                    'z'
                ]
            },

            onInit: function() {}
        });
    });
})(window.dynCore);