(function(dynCore) {
    dynCore.declare('hub.appHub', dynCore.require([
        'lib.hashNav',
        'lib.centralAuth',
        'hub.hubAuth'
    ]), function(modules, hashNav, centralAuth) {
        var apps = {};
        var pending = {};
        var lib = modules.lib;
        var $showOffCanvas = $('.top-bar-left .menu.appMenu .offCanvasShow .menu-icon');

        var appHub = {
            init: function(title, app, $app) {
                dynCore.when(dynCore.require('lib.baseApp')).done(function(modules, baseApp) {
                    baseApp({
                        title: title,
                        namespace: 'hub',
                        app: app,
                        $app: $app || $('#app-' + title)
                    }).done(function(app) {
                        apps[app.title] = app;
                        $(document).foundation();
                        var appPath = app.namespace + '.' + app.title;
                        if (pending[appPath]) {
                            pending[appPath].resolve();
                        }
                        hashNav.rehash(true);
                    });
                });
            },
            loadApp: function(namespace, title) {
                if (typeof(title) === 'undefined') {
                    title = 'hub.' + namespace;
                } else {
                    title = namespace + '.' + title;
                }
                $showOffCanvas.removeClass('menu-icon');
                var promise = pending[title] = this.showLoadingSpinner();
                dynCore.js(title).fail(promise.reject);
            },
            getPending: function(title) {
                return pending[title];
            },
            getApp: function(title) {
                return apps[title];
            },
            showLoadingSpinner: function() {
                $showOffCanvas.removeClass('menu-icon');
                return $.Deferred().always(function() {
                    $showOffCanvas.addClass('menu-icon');
                });
            }
        };

        var register = function(id, args) {
            var $menu = $('.menu.appMenu');

            if (args.category) {
                $menu = $('.menu.appCategory[data-app-category=\'' + args.category + '\']');

                if ($menu.length > 0) {
                    $menu = $menu.find('.menu.vertical.nested');
                } else {
                    $menu = $('<ul/>', {
                        class: 'menu vertical nested'
                    });

                    var categoryArgs = {
                        class: "vertical menu appCategory",
                        'data-accordion-menu': '',
                        'data-app-category': args.category
                    };

                    if (args.expandCategory) {
                        $menu.addClass('is-active');
                        // delete categoryArgs['data-accordion-menu'];
                        // categoryType = '<span/>';
                    }

                    var $category = $('<ul/>', categoryArgs).append(
                        $('<li/>', {
                            class: 'menu-text offCanvasShow'
                        }).append(
                            $('<a/>', {
                                text: args.category
                            })
                        ).append($menu)
                    ).appendTo($('#offCanvas'));

                    if (args.adminCategory) {
                        $category.hide();
                        centralAuth.google.on('signIn', function(info) {
                            if (info.admin) {
                                $category.show();
                            } else {
                                $category.hide();
                            }
                        }).on('signOut', function() {
                            $category.hide();
                        });
                    }
                }

                $menu = $menu.add('.appNav .menu.appMenu');
            }

            $menu.append(
                $('<li/>', {
                    class: 'menu-text'
                }).append(
                    $('<a/>', {
                        text: args.title,
                        href: '#' + id,
                        'data-close': ''
                    })
                )
            );
        };

        var $apps = $('div[data-app]');
        for (var i = 0; i < $apps.length; i++) {
            var $app = $($apps[i])
            var id = $app[0].id.split('-')[1];
            var $parent = $app.parent();
            register(id, {
                title: $app.data('app'),
                category: $parent.data('app-category'),
                expandCategory: (typeof($parent.data('app-category-collapse')) === 'undefined'),
                adminCategory: (typeof($parent.data('app-category-admin')) !== 'undefined')
            });
        }

        hashNav.bindNavApp(function(app, section, args) {
            var $app;
            if (app) {
                $app = $('#app-' + app);
            } else {
                app = $('body .defaultApp').get(0).id.split('-')[1];
                // Open off-canvas
                window.location.replace('#' + app);
                return;
            }

            if (typeof(apps[app]) === 'undefined') {
                if ($app.data('iframe')) {
                    pending[app] = $.Deferred();
                    dynCore.iframe(app, $app.data('iframe'), $app).done(
                        function(element) {
                            $(element).on('load', function() {
                                var links = this.contentWindow.document.getElementsByTagName('link');
                                for (var i = 0; i < links.length; i++) {
                                    if (links[i].getAttribute('rel') === 'icon') {
                                        this.contentWindow.favicon = links[i].getAttribute('href');
                                    }
                                }
                                pending[app].resolve(this.contentWindow);
                            });
                        }
                    );
                }
                appHub.loadApp(app, $app.data('namespace') || $app.data('ns'));
                return;
            }
            $('.app').hide();
            $app.show();

            dynCore.favicon(apps[app].favicon);
            $('title').text($app.data('app'));

            $('.appNav .menu-text a, .off-canvas .menu-text a').removeClass('active');
            $('.appNav a[href="#' + app + '"], .off-canvas a[href="#' + app + '"]').addClass('active');
        });

        hashNav.bindNavSection(function(app, section, args) {
            var $app = $('#app-' + app);
            var sectionSelector;
            if (app && section) {
                sectionSelector = '#' + app + '-' + section;
            } else {
                sectionSelector = '.defaultSection';
            }

            $app.find('.contentSection').hide();
            $app.find(sectionSelector).show();
        });

        $(document).foundation();
        hashNav.rehash();

        // Backwards compatibility
        hashNav.appInit = function(app, title) {
            title = title || app.title;
            apps[title] = app;
            $(document).foundation();
            var appPath = 'hub.' + title;
            if (pending[appPath]) {
                pending[appPath].resolve();
            }
            hashNav.rehash(true);
            return app;
        };
        hashNav.getPending = function(title) {
            return appHub.getPending(title);
        };
        hashNav.getApp = function(title) {
            return appHub.getApp(title);
        };

        return appHub.init;
    });
})(window.dynCore);