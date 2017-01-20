(function() {
    window.dynCore.declare('twoButtonDialog',
        window.dynCore.loadTemplate('twoButtonDialog', '../shared/html/twoButtonDialog.html'),
        function() {
            return function(title, text, positive, negative) {
                var promise = $.Deferred();

                var args = {
                    h4: {
                        text: title
                    },
                    p: {
                        text: text
                    },
                    '.alert': {
                        text: negative || 'No'
                    },
                    '.primary': {
                        text: positive || 'Yes',
                        on: [{
                            event: 'click',
                            fn: promise.resolve
                        }]
                    }
                };

                var $element = window.dynCore.makeFragment('twoButtonDialog', args).appendTo($('body'));
                $(document).foundation();
                $element.foundation('open');
                $element.on('closed.zf.reveal', promise.reject);
                
                return promise;
            };
        }
    );
})();