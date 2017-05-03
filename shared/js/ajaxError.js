(function() {
    window.dynCore.declare('ajaxError',
        window.dynCore.loadTemplate('ajaxError', '/shared/html/ajaxError.html'),
        function() {
            return function($container, fnRetry) {
                var $elements = $container.find('*').filter(':visible').hide();
                $container.prepend(
                    window.dynCore.makeFragment('ajaxError', {
                        '.ajaxRetry': {
                            on: [
                                {
                                    event: 'click',
                                    fn: function() {
                                        $(this).parent().remove();
                                        $elements.show();
                                    }
                                },
                                {
                                    event: 'click',
                                    fn: fnRetry
                                }
                            ]
                        }
                    })
                );
            };
        }
    );
})();