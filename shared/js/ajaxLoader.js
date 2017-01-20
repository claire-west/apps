(function() {
    window.dynCore.declare('ajaxLoader',
        window.dynCore.loadTemplate('ajaxLoader', '../shared/html/ajaxLoader.html'),
        function() {
            return function(promise, $container) {
                var $elements = $container.find('*').filter(':visible').hide();
                var $ajaxLoader = window.dynCore.makeFragment('ajaxLoader').prependTo($container);
                return promise.always(function() {
                    $ajaxLoader.remove();
                    $elements.show();
                });
            };
        }
    );
})();