(function(dynCore) {
    dynCore.when(
        dynCore.require('hub.appHub'),
        dynCore.require('lib', [
            'centralAuth',
            'cors',
            'ajaxLoader',
            'ajaxError'
        ])
    ).done(function(modules, appHub, centralAuth, cors, ajaxLoader, ajaxError) {
        var targetHash;
        var url = dynCore.getResource('node');

        appHub('permissions', {
            model: {
                showIdentifierInput: false,
                toRole: function(scope) {
                    window.location.replace('#permissions-manager/' + scope);
                }
            },

            onInit: function() {
                var self = this;
                this.model.addIdentifier = function() {
                    var identifier = self.model.identifierText;
                    if (self.currentRole && identifier) {
                        var $self = $(this);
                        $self.addClass('disabled');

                        cors({
                            url: url + '/role/' + self.currentRole + '/' + identifier,
                            method: 'POST'
                        }).done(function() {
                            self.model._set('identifierText', '');
                            self.refreshList()
                        }).always(function() {
                            $self.removeClass('disabled');
                        });
                    }
                };

                this.model.removeIdentifier = function(identifier) {
                    var $self = $(this);
                    $self.addClass('disabled');

                    cors({
                        url: url + '/role/' + self.currentRole + '/' + identifier,
                        method: 'DELETE'
                    }).done(function() {
                        self.refreshList();
                    }).always(function() {
                        $self.removeClass('disabled');
                    });
                }
            },

            refreshList: function() {
                var promise = $.Deferred();
                var $content = $('#permissions-manager .roleList');

                var self = this;
                this.loadList($content).done(function(list) {
                    self.roles = list;

                    self.model.roles = [];
                    for (var role in self.roles) {
                        self.model.roles.push(role);
                    }
                    self.model._refresh();

                    if (self.currentRole) {
                        self.refreshIdentifiers(self.currentRole);
                    }

                    promise.resolve();
                }).fail(function() {
                    ajaxError($content, function() {
                        self.refreshList();
                    });
                    promise.reject();
                });

                return promise;
            },

            loadList: function($content) {
                return ajaxLoader(cors(url + '/role/'), $content);
            },

            refreshIdentifiers: function(role) {
                this.model.showIdentifierInput = true;
                this.model.identifiers = this.roles[role] || [];
                this.model._refresh();
            },

            onNav: {
                manager: function(role) {
                    if (centralAuth.google.info) {
                        if (role) {
                            this.currentRole = role;
                            if (this.roles) {
                                this.refreshIdentifiers(role);
                            } else {
                                var self = this;
                                this.refreshList();
                            }
                        } else {
                            this.currentRole = null;
                            this.model.showIdentifierInput = false;
                            this.model._set('identifiers', []);
                            this.refreshList();
                        }
                    } else {
                        window.location.replace('#permissions-unauthorized');
                    }
                }
            },

            onNavTo: function(app, section) {
                if (!section) {
                    window.location.replace('#permissions-manager');
                } else if (section !== 'unauthorized') {
                    this.targetHash = window.location.hash;
                }
            },

            onSignIn: function(info) {
                if ($('#app-permissions').is(':visible')) {
                    window.location.replace(this.targetHash || '#permissions-manager');
                }
            },

            onSignOut: function() {
                if ($('#app-permissions').is(':visible')) {
                    window.location.replace('#permissions-unauthorized');
                }
            }
        });
    });
})(window.dynCore);