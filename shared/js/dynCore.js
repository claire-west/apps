(function() {
    var paths = {};
    window.dynCore = {
        path: function(title, path) {
            paths[title] = path;
        },
        js: function(title) {
            var path;
            if (title.endsWith('.js')) {
                path = title;
            } else {
                path = paths[title] || ('res/js/' + title + '.js');
            }
            return $.getScript(path).fail(function(e) {
                console.error('Unable to load module', e);
            });
        },
        html: function(title, success, error) {
            $('#app-' + title).load(title + '.html', function(resp, status) {
                if (status === 'success') {
                    success.call(this);
                } else {
                    console.error('Unable to load html');
                    error.call(this);
                }
            });
        },
        css: function(app, path) {
            $('head').append(
                $('<link/>', {
                    href: path,
                    rel: 'stylesheet',
                    'data-app': app
                })
            );
        },
        favicon: function(filepath) {
            $('#favicon').remove();
            $('head').append(
                $('<link/>', {
                    id: 'favicon',
                    href: filepath || 'http://www.isaac-west.ca/favicon.ico',
                    rel: 'icon'
                })
            );
        }
    };
})();