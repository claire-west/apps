(function(dynCore, hashNav) {
    dynCore.css('resources', '/hub/res/css/resources.css');

    dynCore.when(dynCore.html('resources'),
        dynCore.loadTemplate('ajaxLoader', '/shared/html/ajaxLoader.html'),
        dynCore.require([
            'hashNav.js',
            'ajaxLoader.js',
            'ajaxError.js',
            'twoButtonDialog.js'
        ], '/shared/js/')
    ).done(function(modules) {
        hashNav.appInit(init(modules));
    });

    function init(modules) {
        var targetHash;
        var resources = {
            title: 'resources',
            favicon: null,
            pendingFile: null,
            resourceList: null,

            signIn: function(info) {
                if ($('#app-resources').is(':visible')) {
                    window.location.replace(targetHash || '#resources-manager');
                }
            },

            signOut: function() {
                if ($('#app-resources').is(':visible')) {
                    window.location.replace('#resources-unauthorized');
                }
            },

            updateSaveButton: function() {
                if (resources.pendingFile &&
                    $('#app-resources .resourceName').val() &&
                    $('#app-resources .metaSuffix').val()) {

                    $('#app-resources .resourceUploadButton').prop('disabled', false);
                } else {
                    $('#app-resources .resourceUploadButton').prop('disabled', true);
                }
            },

            api: {
                save: function(data, label, suffix) {
                    return $.ajax({
                        url: 'http://isaac-west.ca/nosql',
                        method: 'POST',
                        data: {
                            id: null,
                            json: data
                        },
                        headers: Object.assign({
                            label: label,
                            meta: 'resource-' + suffix
                        }, modules.centralAuth.google.baseHeaders())
                    });
                },

                list: function() {
                    return $.ajax({
                        url: 'http://isaac-west.ca/nosql/resources',
                        headers: Object.assign({
                            userId: modules.centralAuth.google.info.id
                        }, modules.centralAuth.google.baseHeaders())
                    });
                },

                delete: function(id, meta) {
                    return $.ajax({
                        url: 'http://isaac-west.ca/nosql/' + id,
                        method: 'DELETE',
                        headers: Object.assign({
                            meta: meta
                        }, modules.centralAuth.google.baseHeaders())
                    })
                }
            },

            load: {
                list: function($content) {
                    resources.resourceList = null;
                    return modules.ajaxLoader(resources.api.list(), $content).done(function(data) {
                        resources.resourceList = data;
                    });
                }
            },

            render: {
                list: function() {
                    var args = resources.resourceList.map(function(item) {
                        return {
                            '.label': {
                                text: item.Label
                            },
                            '.meta': {
                                text: item.Meta.substring(9)
                            },
                            '.delete': {
                                'data-id': item.Id,
                                'data-label': item.Label,
                                'data-meta': item.Meta
                            }
                        };
                    });

                    var listItems = dynCore.makeFragment('resources.listItem', args);
                    listItems.find('.delete').on('click', function() {
                        var $self = $(this);
                        var id = $self.data('id');
                        var meta = $self.data('meta');
                        var promise = modules.twoButtonDialog('Really delete ' + $self.data('label') + '?',
                            'This cannot be undone.', 'Delete', 'Cancel', true);

                        promise.done(function() {
                            resources.api.delete(id, meta).done(function() {
                                resources.refresh.list();
                            });
                        });
                    });

                    return listItems;
                }
            },

            refresh: {
                list: function() {
                    var $content = $('#resources-manager .resourceList');
                    $content.empty();

                    var template = dynCore.loadTemplate('resources.listItem', '/hub/res/html/resourcesListItem.html');
                    $.when(resources.load.list($content), template).done(function() {
                        $content.append(resources.render.list());
                    });
                }
            },

            nav: {
                manager: function() {
                    resources.refresh.list();
                }
            }
        };

        $('#app-resources .resourceFileButton').on('click', function() {
            $('#app-resources .resourceFile').trigger('click');
        });

        $('#app-resources .resourceUploadButton').on('click', function() {
            $('#app-resources .resourceUploadButton').prop('disabled', true)
                .children('.ajaxSpinner').show();
            resources.api.save(
                resources.pendingFile,
                $('#app-resources .resourceName').val(),
                $('#app-resources .metaSuffix').val()
            ).done(function() {
                resources.pendingFile = null;
                $('#app-resources .resourceName').val('');
                $('#app-resources .metaSuffix').val('');
                $('#app-resources .fileContent').text('Resource saved.');
                resources.refresh.list();
                resources.updateSaveButton();
            }).always(function() {
                $('#app-resources .resourceUploadButton .ajaxSpinner').hide();
            });
        });

        $('#app-resources .resourceName, #app-resources .metaSuffix').on('keyup', function() {
            resources.updateSaveButton();
        });

        $('#app-resources .resourceFile').on('change', function() {
            var file = $(this).get(0).files[0];
            if (file) {
                reader = new FileReader();
                reader.onload = function(e) {
                    resources.pendingFile = e.target.result;
                    try {
                        JSON.parse(resources.pendingFile);
                        $('#app-resources .fileContent').text(resources.pendingFile);
                    } catch (e) {
                        resources.pendingFile = null;
                        $('#app-resources .fileContent').text('Resource file must be in JSON format.');
                    }
                    resources.updateSaveButton();
                }
                reader.readAsText(file);
            } else {
                $('#app-resources .resourceUploadButton').prop('disabled', true);
                $('#app-resources .fileContent').text('');
            }
        });

        modules.centralAuth.google.on('signIn', resources.signIn);
        modules.centralAuth.google.on('signOut', resources.signOut);

        hashNav.bindNavApp(function(app, section, args) {
            if (app === 'resources') {
                if (!section) {
                    window.location.replace('#resources-manager');
                }
                targetHash = window.location.hash;
                if (!modules.centralAuth.google.info) {
                    window.location.replace('#resources-unauthorized');
                }
            }
        });

        hashNav.bindNavSection(function(app, section, args) {
            if (app === 'resources') {
                if (resources.nav[section] && modules.centralAuth.google.info) {
                    resources.nav[section].apply(this, args);
                }
            }
        });

        return resources;
    };
})(window.dynCore, window.hashNav);