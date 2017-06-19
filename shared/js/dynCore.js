(function() {
    var loadedModules = [];
    var modules = {};
    var templates = {};
    var templateNotified = {};
    var pending = [];

    var paths = {};
    var getPath = function(title) {
        var path;
        if (title.endsWith('.js')) {
            path = title;
        } else {
            path = paths[title] || ('/hub/res/js/' + title + '.js');
        }
        return path;
    };

    var resources = {};

    window.dynCore = {
        setResource: function(key, value) {
            resources[key] = value;
        },
        getResource: function(key) {
            return resources[key] || key;
        },
        path: function(title, path) {
            paths[title] = path;
        },
        module: function(title) {
            return modules[title];
        },
        modules: function() {
            return modules;
        },
        when: function() {
            var promise = $.Deferred();
            $.when.apply(this, arguments).done(function() {
                window.dynCore.resolve().done(function() {
                    promise.resolve(modules);
                });
            });
            return promise;
        },
        js: function(title) {
            var path = getPath(title);
            if (loadedModules.indexOf(path) > -1) {
                console.warn('Module at ' + path + ' already loaded.');
                return $.when();
            }
            return $.getScript(path)
                .done(function() {
                    console.info('Module ' + title + ' loaded.');
                    loadedModules.push(path);
                }).fail(function(resp, e) {
                    console.error('Unable to load module.', resp, e);
                }
            );
        },
        declare: function(title, promises, fnInit) {
            var promise = window.dynCore.pending();

            if (!Array.isArray(promises)) {
                promises = [promises];
            }

            $.when.apply(this, promises).done(function() {
                if (fnInit) {
                    var module = fnInit(modules);
                    if (title && module) {
                        modules[title] = module;
                    }
                }
                promise.resolve(modules);
            }).fail(function() {
                console.error('Failed to load prerequisites for ' + title + '.');
                promise.reject();
            });
            return promise;
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
        pending: function() {
            var promise = $.Deferred();
            pending.push(promise);
            promise.always(function() {
                pending.splice(pending.indexOf(promise));
            });
            return promise;
        },
        resolve: function() {
            return $.when.apply(this, pending);
        },
        html: function(title, path, $container) {
            var promise = $.Deferred();
            $container = $container || $('#app-' + title);

            $container.load(path || ('/hub/' + title + '.html'), function(resp, status) {
                if (status === 'success') {
                    promise.resolve(resp);
                } else {
                    console.error('Unable to load ' + (path || (title + '.html')));
                    promise.reject(resp);
                }
            });

            return promise;
        },
        iframe: function(app, url, $container) {
            $container = $container || $('#app-' + app);
            
            return window.dynCore.require('/shared/js/iframeScaling.js').then(function() {
                $element = $('<iframe/>', {
                    src: url,
                    frameborder: 0,
                    scrolling: 'no',
                    width: '100%'
                }).on('load', function() { modules.scaleIframe(this, true); });

                $container.append($element);

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

            for (let key in name) {
                if (templates[key]) {
                    if (!templateNotified[key]) {
                        console.warn('Template ' + key + ' already loaded.');
                        templateNotified[key] = true;
                    }
                    promises.push($.when());
                    continue;
                }
                promises.push(
                    $.get(name[key] || (key + '.html')).done(function(resp){
                        console.info('Template ' + key + ' loaded.');
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
                    var innerElement;
                    if (selector === '') {
                        innerElement = $(element);
                    } else {
                        innerElement = $(element).find(selector);
                    }
                    for (var prop in props) {
                        if (prop === 'text') {
                            innerElement.text(props[prop]);
                        } else if (prop === 'on') {
                            if (!Array.isArray(props[prop])) {
                                props[prop] = [props[prop]];
                            }

                            for (var i = 0; i < props[prop].length; i++) {
                                var event = props[prop][i];
                                innerElement.on(event.event, event.fn);
                            }
                        } else if (prop === 'style' || prop.split('-')[0] === 'data') {
                            innerElement.attr(prop, props[prop]);
                        } else {
                            innerElement.prop(prop, props[prop]);
                        }
                    }
                }

                result.push(element);
            }
            
            return $(result);
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
            return $.when();
        },
        favicon: function(filepath) {
            $('#favicon').remove();
            $('head').append(
                $('<link/>', {
                    id: 'favicon',
                    href: filepath || window.dynCore.getResource('url') + '/favicon.ico',
                    rel: 'icon'
                })
            );
        }
    };
})();