(function() {
    var loadedModules = [];
    var templates = {};

    var paths = {};
    var getPath = function(title) {
        var path;
        if (title.endsWith('.js')) {
            path = title;
        } else {
            path = paths[title] || ('res/js/' + title + '.js');
        }
        return path;
    };

    window.dynCore = {
        path: function(title, path) {
            paths[title] = path;
        },
        js: function(title) {
            var path = getPath(title);
            if (loadedModules.indexOf(path) > -1) {
                console.log('Module at ' + path + ' already loaded.');
                return $.when();
            }
            return $.getScript(path)
                .done(function() {
                    loadedModules.push(path);
                }).fail(function(resp, e) {
                    console.error('Unable to load module.', resp, e);
                }
            );
        },
        require: function(titles, prefix) {
            if (titles &&
                !Array.isArray(titles)) {
                titles = [titles];
            }

            if (!Array.isArray(titles)) {
                return $.when();
            }

            var pending = [];
            for (var i = 0; i < titles.length; i++) {
                if (prefix) {
                    titles[i] = prefix + titles[i];
                }
                pending.push(this.js(titles[i]));
            }

            return $.when.apply(this, pending);
        },
        html: function(title, path) {
            var promise = $.Deferred();

            $('#app-' + title).load(path || (title + '.html'), function(resp, status) {
                if (status === 'success') {
                    promise.resolve(resp);
                } else {
                    console.error('Unable to load ' + (path || (title + '.html')));
                    promise.reject(resp);
                }
            });

            return promise;
        },
        iframe: function(app, url) {
            return window.dynCore.require('../shared/js/iframeScaling.js').then(function() {
                $element = $('<iframe/>', {
                    src: url,
                    frameborder: 0,
                    scrolling: 'no',
                    width: '100%'
                }).on('load', function() { window.scaleIframe(this, true); });

                $('#app-' + app).append($element);

                return $.Deferred().resolve($element).promise();
            });
        },
        loadTemplate: function(name, path) {
            if (!name) {
                return $.when();
            }

            if (typeof(name) !== 'object') {
                var obj = {};
                obj[name] = path;
                name = obj;
            }

            var promises = [];

            for (var key in name) {
                if (templates[key]) {
                    promises.push($.when());
                }
                promises.push(
                    $.get(name[key] || (key + '.html')).done(function(resp){
                        templates[key] = $(resp);
                    })
                );
            }

            return $.when.apply(this, promises);
        },
        makeFragment: function(name, args) {
            if (!args) {
                return templates[name].clone();
            }

            if (!Array.isArray(args)) {
                args = [args];
            }

            var result = [];

            for (var i = 0; args && i < args.length; i++) {
                var element = templates[name].clone()[0];

                for (var selector in args[i]) {
                    var props = args[i][selector];
                    var innerElement = $(element).find(selector);
                    for (var prop in props) {
                        if (prop === 'text') {
                            innerElement.text(props[prop]);
                        } else {
                            innerElement.prop(prop, props[prop]);
                        }
                    }
                }

                result.push(element);
            }
            
            return result;
        },
        css: function(app, paths) {
            if (!Array.isArray(paths)) {
                paths = [paths];
            }

            for (var i = 0; i < paths.length; i++) {
                $('head').append(
                    $('<link/>', {
                        href: paths[i],
                        rel: 'stylesheet',
                        'data-app': app
                    })
                );
            }
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