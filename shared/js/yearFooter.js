(function() {
    window.dynCore.declare('yearFooter',
        window.dynCore.loadTemplate('yearFooter', '/shared/html/yearFooter.html'),
        function() {
            return window.dynCore.makeFragment('yearFooter', {
                '.footerYear': {
                    text: new Date().getFullYear()
                }
            }).appendTo($('.off-canvas-content'));
        }
    );
})();