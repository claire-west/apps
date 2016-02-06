(function(dynCore) {
    dynCore.when(
        dynCore.require('hub.appHub'),
        dynCore.require('lib', [
            'centralAuth',
            'cors',
            'globalModel',
            'isMobile',
            'arraySort'
        ])
    ).done(function(modules, appHub, centralAuth, cors, globalModel, isMobile) {
        var twitchClientId = 'Mm9iNWY1a25qMHZvd25nN2o4aHM5YzVvemw1a2Ntaw==';
        var url = dynCore.getResource('node');

        var templates = {
            liveFollows: {
                title: 'Followed Streams',
                emptyMessage: 'No Channels Live',
                criteria: {
                    stream_type: 'live'
                }
            },
            premieres: {
                title: 'Premieres',
                emptyMessage: 'No Premieres',
                criteria: {
                    stream_type: 'premiere'
                }
            },
            reruns: {
                title: 'Reruns',
                emptyMessage: 'No Reruns',
                criteria: {
                    stream_type: 'rerun'
                }
            }
        };

        var refreshInterval;

        appHub('twitch2', {
            model: {
                quality: localStorage.getItem('twitchStream.quality') || 'best',
                autoRefresh: localStorage.getItem('twitchStream.autoRefresh') === 'true',
                twelveHour: localStorage.getItem('twitchStream.twelveHour') === 'true',
                username: localStorage.getItem('twitchStream.currentUser'),

                toggleLineWrap: function() {
                    $(this).toggleClass('truncate-line-wrap');
                },

                openChat: function(self, href, e) {
                    e.preventDefault();
                    window.open(href + "?popout=", "_blank", "resizable=yes, scrollbars=yes, titlebar=yes, width=400, height=600");
                }
            },

            onInit: function() {
                var self = this;
                this.model.onRefresh = function() {
                    self.refresh();
                };

                this.model.onSaveUsername = function() {
                    localStorage.setItem('twitchStream.currentUser', self.model.username);
                    self.refresh();
                },

                this.model._track('quality', function(val) {
                    localStorage.setItem('twitchStream.quality', val);
                });

                this.model._track('autoRefresh', function(val) {
                    localStorage.setItem('twitchStream.autoRefresh', val);
                });

                this.startAutoRefresh();

                this.model._track('twelveHour', function(val) {
                    localStorage.setItem('twitchStream.twelveHour', val);
                });
            },

            startAutoRefresh: function() {
                this.stopAutoRefresh();
                if (this.model.autoRefresh) {
                    var self = this;
                    refreshInterval = setInterval(function() {
                        self.refresh();
                    }, 1000 * 60 * 2);
                }
            },

            stopAutoRefresh: function() {
                clearInterval(refreshInterval);
            },

            refresh: function() {
                if (!this.model.username) {
                    return;
                }

                this.model._set('lastRefresh', 'loading...');
                var self = this;
                var promise = $.Deferred().done(function() {
                    self.updateRefreshTimestamp();
                }).fail(function() {
                    self.model._set('lastRefresh', 'Error');
                });

                this.getFollowedChannels().done(function(follows) {
                    self.getFollowedStreams(follows).done(function(resp) {
                        resp.streams.sortBy("channel.display_name");
                        self.model._set('streams', self.makeStreamModel(resp.streams, [
                            templates.liveFollows,
                            templates.premieres,
                            templates.reruns
                        ]));

                        var counts = [];
                        for (var i = 0; i < self.model.streams.length; i++) {
                            counts.push(self.model.streams[i].channels.length);
                        }

                        var $title = $('title');
                        if ($title.text().startsWith('Twitch')) {
                            $title.text('Twitch (' + (counts.join('/') || 0) + ')');
                        }

                        promise.resolve();
                    }).fail(promise.reject);
                }).fail(promise.reject);

                return promise;
            },

            getFollowedChannels: function(next, total) {
                if (typeof(total) === 'undefined') {
                    total = 0;
                }
                var promise = $.Deferred();
                var url = next || "https://api.twitch.tv/kraken/users/" + this.model.username + "/follows/channels";

                var self = this;
                $.ajax({
                    url: url,
                    headers: {
                       'Client-ID': atob(twitchClientId)
                    },
                    cache: false
                }).done(function(resp) {
                    if (resp.follows.length && resp.follows.length + total < resp._total && resp._links && resp._links.next) {
                        self.getFollowedChannels(resp._links.next, resp.follows.length + total).done(function(follows) {
                            promise.resolve(resp.follows.concat(follows))
                        }).fail(promise.reject);
                    } else {
                        promise.resolve(resp.follows);
                    }
                }).fail(promise.reject);

                return promise;
            },

            getFollowedStreams: function(follows) {
                var channels = [];
                for (var i = 0; i < follows.length; i++) {
                    channels.push(follows[i].channel.display_name);
                }

                var url = "https://api.twitch.tv/kraken/streams?channel=" + channels.join(',');
                return $.ajax({
                    url: url,
                    headers: {
                        'Client-ID': atob(twitchClientId)
                    },
                    cache: false
                });
            },

            makeStreamModel: function(streams, templates) {
                var result = [];
                for (var n = 0; n < templates.length; n++) {
                    result[n] = {
                        title: templates[n].title,
                        emptyMessage: templates[n].emptyMessage,
                        channels: []
                    };

                    for (var i = 0; i < streams.length; i++) {
                        if (this.matchCriteria(streams[i], templates[n].criteria)) {
                            result[n].channels.push({
                                channel: streams[i].channel.display_name,
                                streamTitle: streams[i].channel.status,
                                game: streams[i].game,
                                viewers: streams[i].viewers,
                                channelLink: 'http://www.twitch.tv/' + streams[i].channel.display_name,
                                profileLink: 'http://www.twitch.tv/' + streams[i].channel.display_name + '/profile',
                                previewSrc: streams[i].preview.medium + '?' + Date.now(),
                                chatLink: 'https://www.twitch.tv/' + streams[i].channel.name + '/chat',
                                launchLink: 'livestreamer:twitch.tv/' + streams[i].channel.display_name + ' ' + this.model.quality
                            });
                        }
                    }
                }

                return result;
            },

            matchCriteria: function(target, criteria) {
                for (var key in criteria) {
                    if (target[key] !== criteria[key]) {
                        return false;
                    }
                }
                return true;
            },

            updateRefreshTimestamp: function() {
                var now = new Date();
                var hours = now.getHours();
                if (this.model.twelveHour) {
                    if (hours > 12) {
                        hours -= 12;
                    } else if (hours === 0) {
                        hours = 12;
                    }
                }
                var minutes = now.getMinutes();
                if (minutes < 10) {
                    minutes = "0" + minutes;
                }
                this.model._set('lastRefresh', hours + ":" + minutes);
            },

            onNav: {
                '': function() {
                    this.refresh();
                }
            },

            onNavTo: function(app, section) {
                this.startAutoRefresh();
            },

            onExit: function(app, section) {
                this.stopAutoRefresh();
            },

            onSignIn: function(info) {

            },

            onSignOut: function() {

            }
        });
    });
})(window.dynCore);