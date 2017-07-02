(function() {
    window.dynCore.declare('delayedAction', dynCore.require('/shared/js/isMobile.js'), function(modules) {
        var timeouts = {};
        var delay = 200;
        if (modules.isMobile()) {
            delay = 300;
        }

        return function(fn, id) {
            // id is optional to avoid conflicting delays, though that'll probably never happen...
            // undefined is not a valid object key, but null is, so use that for the shared timeout
            if (typeof(id) === 'undefined') {
                id = null;
            }
            clearTimeout(timeouts[id]);
            timeouts[id] = setTimeout(fn, delay);
        };
    });
})();