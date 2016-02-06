(function(dynCore) {
    dynCore.when(
        dynCore.require('hub.appHub'),
        dynCore.require('lib', [
            'centralAuth',
            'cors',
            'nosql',
            'ajaxLoader',
            'ajaxError',
            'twoButtonDialog'
        ])
    ).done(function(modules, appHub, centralAuth, cors, nosql, ajaxLoader, ajaxError, twoButtonDialog) {
        var targetHash;
        appHub('resources', {
            pendingFile: null,
            resourceList: null,

            model: {
                allowSave: false,
                openFileBrowser: function() {
                    $('#app-resources .resourceFile').trigger('click');
                }
            },

            onInit: function() {
                var self = this;
                this.model.uploadResource = function() {
                    self.model._set('allowSave', false);
                    $('#app-resources .resourceUploadButton .ajaxSpinner').show();

                    self.api.save(
                        self.pendingFile,
                        self.model.newResource.label,
                        self.model.newResource.suffix
                    ).done(function() {
                        self.pendingFile = null;
                        self.model.newResource.label = '';
                        self.model.newResource.suffix = '';
                        self.model.filePreview = 'Resource saved.'
                        self.updateSaveButton();
                        self.refreshList();
                    }).always(function() {
                        $('#app-resources .resourceUploadButton .ajaxSpinner').hide();
                    });
                };

                this.model.updateSaveButton = function() {
                    self.updateSaveButton();
                };

                this.model.onFileSelect = function() {
                    var file = $(this).get(0).files[0];
                    if (file) {
                        reader = new FileReader();
                        reader.onload = function(e) {
                            self.pendingFile = e.target.result;
                            try {
                                JSON.parse(self.pendingFile);
                                self.model.filePreview = e.target.result;
                            } catch (e) {
                                self.pendingFile = null;
                                self.model.filePreview = 'Resource file must be in JSON format.';
                            }
                            self.model._refresh();
                            self.updateSaveButton();
                        }
                        reader.readAsText(file);
                    } else {
                        self.model.filePreview = '';
                        self.model._set('allowSave', false);
                    }
                };

                this.model.editResource = function(resource) {
                    var $self = $(this);
                    self.refreshDialog(resource);
                };

                this.model.removeResource = function(resource, e) {
                    e.stopPropagation();

                    var $self = $(this);
                    var promise = twoButtonDialog('Really delete ' + resource.Label + '?',
                        'This cannot be undone.', 'Delete', 'Cancel', true);

                    promise.done(function() {
                        self.api.delete(resource.Id, resource.Meta).done(function() {
                            self.refreshList();
                        });
                    });
                };

                this.model.addRole = function() {
                    var resource = self.model.editing;
                    if (resource && self.model.newRole) {
                        var $self = $(this).addClass('disabled');
                        var url = dynCore.getResource('node') + '/nosql/' + resource.Meta + '/' + resource.Id + '/roles/' + self.model.newRole;

                        cors({
                            url: url,
                            method: 'POST'
                        }).done(function() {
                            self.model._set('newRole', '');
                            self.refreshDialog(resource);
                        }).always(function() {
                            $self.removeClass('disabled');
                        });
                    }
                };

                this.model.removeRole = function(role) {
                    var $self = $(this).addClass('disabled');
                    var resource = self.model.editing;
                    var url = dynCore.getResource('node') + '/nosql/' + resource.Meta + '/' + resource.Id + '/roles/' + role;

                    cors({
                        url: url,
                        method: 'DELETE'
                    }).done(function() {
                        self.refreshDialog(resource);
                    }).always(function() {
                        $self.removeClass('disabled');
                    });
                };
            },

            updateSaveButton: function() {
                console.log(this.model._get('newResource.label'), this.model._get('newResource.suffix'))
                this.model._set('allowSave', this.pendingFile && this.model._get('newResource.label') && this.model._get('newResource.suffix'));
            },

            api: {
                save: function(data, label, suffix) {
                    return nosql.save('resource-' + suffix, {
                        Text: data,
                        Label: label
                    });
                },

                list: function() {
                    return nosql.resources();
                },

                delete: function(id, meta) {
                    return nosql.delete(meta, id);
                }
            },

            refreshList: function() {
                var $content = $('#resources-manager .resourceList');
                var self = this;
                ajaxLoader(this.api.list(), $content).done(function(list) {
                    self.model._set('resourceList', list);
                });
            },

            refreshDialog: function(resource) {
                this.model._set('editing', resource);
                $('#resources-manager-edit').foundation('open');
                var promise = nosql.get(resource.Meta, resource.Id, 'roles');

                var self = this;
                promise.done(function(roles) {
                    self.model._set('roles', roles);
                });
            },

            onNav: {
                '': function() {
                    window.location.replace('#resources-manager');
                },

                manager: function() {
                    if (centralAuth.google.info) {
                        this.refreshList();
                    } else {
                        window.location.replace('#resources-unauthorized');
                    }
                },

                unauthorized: function() {
                    targetHash = null;
                }
            },

            onNavTo: function(app, section) {
                targetHash = window.location.hash;
            },

            onSignIn: function(info) {
                if ($('#app-resources').is(':visible')) {
                    window.location.replace(targetHash || '#resources-manager');
                }
            },

            onSignOut: function() {
                if ($('#app-resources').is(':visible')) {
                    window.location.replace('#resources-unauthorized');
                }
            }
        });
    });
})(window.dynCore);