(function() {
    window.scaleIframe = function(element, maintain) {
        element.style.height = element.contentWindow.document.body.scrollHeight + 'px';

        if (maintain) {
            setTimeout(function() {
                window.scaleIframe(element, maintain);
            }, 100);
        }
    };
})();

