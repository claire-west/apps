(function(dynCore) {
    dynCore.when(dynCore.require('lib.fragment')).done(function(modules, fragment) {
        fragment.controller('hub.frag.actionMenu', {
            model: {
                setIcon: function(icon, prev) {
                    var $self = $(this);
                    if (prev) {
                        $self.removeClass(prev);
                    }
                    if (icon) {
                        $self.addClass(icon);
                    }
                }
            },

            onInit: function() {
                this.$fragment.foundation();
            }
        });
    });
})(window.dynCore);