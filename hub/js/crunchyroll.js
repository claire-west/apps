(function(dynCore, hashNav) {
    dynCore.css('crunchyroll', '/hub/css/crunchyroll.css');

    dynCore.when(dynCore.html('crunchyroll'),
        dynCore.require([
            'uuid',
            'isMobile',
            'arraySort',
            'hashNav'
        ], 'lib')
    ).done(function(modules) {
        hashNav.appInit(init(modules));
    });

    function init(modules) {
        var crunchyroll = {
            title: 'crunchyroll',
            favicon: 'http://www.crunchyroll.com/favicon.ico',
            accountData: JSON.parse(localStorage.getItem('crunchyroll.account')),

            baseRequest: {
                locale: 'enUS',
                device_id: localStorage.getItem('uuid'),
                device_type: 'com.crunchyroll.crunchyroid',
                access_token: 'Scwg9PRRZ19iVwD',
                version: 66
            },

            setAccountData: function(data) {
                crunchyroll.baseRequest.auth = data.auth;
                crunchyroll.accountData = data;
                localStorage.setItem('crunchyroll.account', JSON.stringify(data));
            },

            clearAccountData: function() {
                delete crunchyroll.baseRequest.auth;
                delete crunchyroll.accountData;
                localStorage.removeItem('crunchyroll.account');
            },

            livestreamerHref: function(url) {
                var quality = $('#crunchyrollQuality').val();
                return 'livestreamer:' + url + ' ' + quality + ' --player-passthrough hls';
            },

            validateAjax: function(resp, textStatus, jqXHR) {
                if (resp.error) {
                    return $.Deferred().reject(jqXHR, resp).promise();
                }
                return resp;
            },

            ajaxLoader: function(promise, id) {
                var $elements = $(id).children().hide();
                var $ajaxLoader = $('#crunchyroll-loading').show();
                return promise.always(function() {
                    $ajaxLoader.hide();
                    $elements.show();
                });
            },

            api: {
                media: {
                    anime: 'anime'
                },

                sort: {
                    popular: 'popular',
                    simulcast: 'simulcast',
                    updated: 'updated',
                    alpha: 'alpha',
                    newest: 'newest',
                    asc: 'asc',
                    desc: 'desc'
                },

                login: function(auth) {
                    var promise = $.ajax({
                        url: 'https://api.crunchyroll.com/login.0.json',
                        data: Object.assign({
                            account: auth.account,
                            password: auth.password
                        }, crunchyroll.baseRequest)
                    }).then(crunchyroll.validateAjax).done(function(resp) {
                        crunchyroll.setAccountData(resp.data);
                        $('#crunchyrollAccountDropdown').foundation('close');
                        $('#crunchyrollAccountDropdown input[name=password]').val(null);
                    });

                    delete auth.password;

                    return promise;
                },

                logout: function() {
                    return $.ajax({
                        url: 'https://api.crunchyroll.com/logout.0.json',
                        data: crunchyroll.baseRequest
                    }).then(crunchyroll.validateAjax).done(function(resp) {
                        crunchyroll.clearAccountData();
                    });
                },

                authenticate: function() {
                    var expiry = new Date(crunchyroll.accountData.expires);
                    var now = new Date();
                    if (expiry > (now.getDate() + 1)) {
                        console.warn('Over 24 hours before expiry, will not renew session.');
                        return;
                    }

                    return $.ajax({
                        url: 'https://api.crunchyroll.com/authenticate.0.json',
                        data: crunchyroll.baseRequest
                    }).then(crunchyroll.validateAjax).done(function(resp) {
                        crunchyroll.setAccountData(resp.data);
                    });
                },

                seriesList: function(sorting, page) {
                    return $.ajax({
                        url: 'https://api.crunchyroll.com/list_series.0.json',
                        data: Object.assign({
                            media_type: 'anime',
                            filter: sorting,
                            limit: 50,
                            offset: -50 + 50 * (page || 1)
                        }, crunchyroll.baseRequest)
                    }).then(crunchyroll.validateAjax);
                },

                seriesInfo: function(seriesId) {
                    return $.ajax({
                        url: 'https://api.crunchyroll.com/info.0.json',
                        data: Object.assign({
                            series_id: seriesId
                        }, crunchyroll.baseRequest)
                    }).then(crunchyroll.validateAjax);
                },

                seasonInfo: function(collectionId) {
                    return $.ajax({
                        url: 'https://api.crunchyroll.com/info.0.json',
                        data: Object.assign({
                            collection_id: collectionId
                        }, crunchyroll.baseRequest)
                    }).then(crunchyroll.validateAjax);
                },

                episodes: function(seriesId, sorting) {
                    return $.ajax({
                        url: 'https://api.crunchyroll.com/list_media.0.json',
                        data: Object.assign({
                            series_id: seriesId,
                            sort: sorting,
                            limit: 9999,
                            offset: 0
                        }, crunchyroll.baseRequest)
                    }).then(crunchyroll.validateAjax);
                },

                episodeInfo: function(mediaId) {
                    return $.ajax({
                        url: 'https://api.crunchyroll.com/info.0.json',
                        data: Object.assign({
                            media_id: mediaId
                        }, crunchyroll.baseRequest)
                    }).then(crunchyroll.validateAjax);
                },

                queue: function() {
                    return $.ajax({
                        url: 'https://api.crunchyroll.com/queue.0.json',
                        data: crunchyroll.baseRequest
                    }).then(crunchyroll.validateAjax);
                },

                addToQueue: function(seriesId) {
                    return $.ajax({
                        url: 'https://api.crunchyroll.com/add_to_queue.0.json',
                        data: Object.assign({
                            series_id: seriesId
                        }, crunchyroll.baseRequest)
                    }).then(crunchyroll.validateAjax);
                },

                removeFromQueue: function(seriesId) {
                    return $.ajax({
                        url: 'https://api.crunchyroll.com/remove_from_queue.0.json',
                        data: Object.assign({
                            series_id: seriesId
                        }, crunchyroll.baseRequest)
                    }).then(crunchyroll.validateAjax);
                },

                error: function(fnRetry) {
                    $('#crunchyroll-error').empty().show().append(
                        $('<div/>', {
                            class: 'medium-4 medium-centered columns'
                        }).append(
                            $('<h5/>', {
                                text: 'Error retrieving data.'
                            })
                        ).append(
                            $('<a/>', {
                                text: 'Retry',
                                class: 'button expanded'
                            }).on('click', function() {
                                $('#crunchyroll-error').empty().hide();
                                fnRetry();
                            })
                        )
                    );
                }
            },

            refresh: {
                seriesList: function(sorting, page) {
                    var shows = crunchyroll.ajaxLoader(crunchyroll.api.seriesList(sorting, page), '#crunchyroll-browse');
                    var template = dynCore.loadTemplate('crunchyroll.showTile', '/hub/frag/crunchyrollShowTile.html');
                    
                    var $tiles = $('#crunchyroll-browse .showTiles');
                    $tiles.empty();

                    $.when(shows, template).done(function(shows) {
                        var tileArgs = shows.data.map(function(show) {
                            return {
                                '.tileImage': {
                                    href: "#crunchyroll-episodes/" + show.series_id,
                                    title: show.name
                                },
                                '.tileImage img': {
                                    src: show.portrait_image.large_url
                                },
                                '.tileHeader': {
                                    title: show.name
                                },
                                '.tileHeader a': {
                                    href: "#crunchyroll-episodes/" + show.series_id,
                                    text: show.name
                                }
                            };
                        });
                        $tiles.append(dynCore.makeFragment('crunchyroll.showTile', tileArgs));
                        $tiles.find('div.columns:last-child').addClass('end');
                        $tiles.find('p.truncate-line-wrap').on('click', function() {
                            $(this).toggleClass('truncate-line-wrap');
                        });
                        window.Foundation.reInit('equalizer');
                        $(window).resize(function() {
                            if (window.location.hash.indexOf('crunchyroll-browse') > -1) {
                                window.Foundation.reInit('equalizer');
                            }
                        });
                    }).fail(function() {
                        crunchyroll.api.error(function() {
                            crunchyroll.nav.seriesList(sorting, page);
                        });
                    });
                },

                episodes: function(series, sorting) {
                    var info = crunchyroll.api.seriesInfo(series);
                    var episodes = crunchyroll.ajaxLoader(crunchyroll.api.episodes(series, sorting), '#crunchyroll-episodes');
                    var template = dynCore.loadTemplate('crunchyroll.episodeTile', '/hub/frag/crunchyrollEpisodeTile.html');
                    var headerTemplate = dynCore.loadTemplate('crunchyroll.seasonHeader', '/hub/frag/crunchyrollSeasonHeader.html');
                    
                    var $section = $('#crunchyroll-episodes');
                    var $tiles = $section.find('.episodes');
                    $tiles.empty();

                    $.when(info, episodes, template, headerTemplate).done(function(info, episodes) {
                        $section.find('.seriesName').text(info.data.name).prop('title', info.data.name).prop('href', info.data.url);
                        $section.find('.seriesImgPort').prop('src', info.data.portrait_image.full_url);
                        $section.find('.seriesImgLand').prop('src', info.data.landscape_image.full_url);
                        $section.find('.seriesDescription').text(info.data.description);

                        var quality = $('#crunchyrollQuality').val();

                        var collections = {};

                        for (var i = 0; i < episodes.data.length; i++) {
                            var episode = episodes.data[i];
                            var collectionId = episode.collection_id;
                            collections[collectionId] = collections[collectionId] || [];

                            var episodeNumber = 'Episode ' + episode.episode_number;
                            var episodeText = episodeNumber + ': ' + episode.name;
                            collections[collectionId].push({
                                '.tileImage': {
                                    href: episode.url,
                                    title: episodeText
                                },
                                '.tileImage img': {
                                    src: episode.screenshot_image.large_url
                                },
                                '.tileHeader': {
                                    text: episodeNumber,
                                    title: episodeNumber
                                },
                                '.tileDescription': {
                                    text: episode.name,
                                    title: episode.name
                                },
                                '.tileLaunchButton': {
                                    href: crunchyroll.livestreamerHref(episode.url)
                                }
                            });
                        }

                        var promises = [];
                        for (var collectionId in collections) {
                            let id = collectionId;
                            promises.push(crunchyroll.api.seasonInfo(id));
                        }

                        $.when.apply(this, promises).done(function() {
                            var seasons = [];
                            for (var i = 0; i < arguments.length; i++) {
                                seasons.push(arguments[i]);
                            }
                            seasons.sort(function(a, b) {
                                if (a.data.season === b.data.season) {
                                    return new Date(a.data.created) > new Date(b.data.created);
                                }
                                return a.data.season > b.data.season;
                            });

                            if (sorting === 'desc') {
                                seasons.reverse();
                            }

                            for (var i = 0; i < seasons.length; i++) {
                                var id = seasons[i].data.collection_id;
                                $tiles.append(
                                    $('<div/>', {
                                        class: 'seasonTiles row'
                                    }).append(
                                        dynCore.makeFragment('crunchyroll.seasonHeader', {
                                            '.seasonName': {
                                                text: 'Season ' + seasons[i].data.season + ': ' + seasons[i].data.name
                                            }
                                        })
                                    ).append(dynCore.makeFragment('crunchyroll.episodeTile', collections[id]))
                                );
                            }

                            if (modules.lib.isMobile()) {
                                $tiles.find('.tileLaunchButton').hide();
                            }
                            $tiles.find('.seasonTiles div.columns:last-child').addClass('end');
                            $tiles.find('p.truncate-line-wrap').on('click', function() {
                                $(this).toggleClass('truncate-line-wrap');
                            });
                        });
                    }).fail(function() {
                        crunchyroll.api.error(function() {
                            crunchyroll.refresh.episodes(series, sorting);
                        });
                    });
                },

                queue: function() {
                    var info = crunchyroll.ajaxLoader(crunchyroll.api.queue(), '#crunchyroll-queue');
                    var template = dynCore.loadTemplate('crunchyroll.queueTile', '/hub/frag/crunchyrollQueueTile.html');

                    var $section = $('#crunchyroll-queue');
                    var $tiles = $section.find('.queueTiles');
                    $tiles.empty();

                    $.when(info, template).done(function(resp) {
                        var tileArgs = resp.data.map(function(show) {
                            var episode = 'Episode ' + show.most_likely_media.episode_number + ':';
                            var launchHref;
                            if (!modules.lib.isMobile()) {
                                launchHref = crunchyroll.livestreamerHref(show.most_likely_media.url);
                            } else {
                                launchHref = show.most_likely_media.url
                            }

                            return {
                                '.tileHeader': {
                                    title: show.series.name
                                },
                                '.tileHeader a': {
                                    href: '#crunchyroll-episodes/' + show.series.series_id,
                                    text: show.series.name
                                },
                                '.tileDescription strong': {
                                    title: episode,
                                    text: episode
                                },
                                '.tileDescription a': {
                                    href: show.most_likely_media.url,
                                    title: show.most_likely_media.name,
                                    text: show.most_likely_media.name
                                },
                                '.tileLongText': {
                                    title: show.most_likely_media.description,
                                    text: show.most_likely_media.description
                                },
                                '.tileImageShow': {
                                    href: '#crunchyroll-episodes/' + show.series.series_id,
                                    title: show.series.name
                                },
                                '.tileImageShow img': {
                                    src: show.series.landscape_image.full_url
                                },
                                '.tileImageEpisode a': {
                                    href: launchHref,
                                    title: show.most_likely_media.name
                                },
                                '.tileImageEpisode a img': {
                                    src: show.most_likely_media.screenshot_image.full_url
                                }
                            };
                        });
                        $tiles.append(dynCore.makeFragment('crunchyroll.queueTile', tileArgs));
                        $tiles.find('p.truncate-line-wrap').on('click', function() {
                            $(this).toggleClass('truncate-line-wrap');
                        });
                    }).fail(function() {
                        crunchyroll.api.error(function() {
                            crunchyroll.nav.queue();
                        });
                    });
                }
            },

            nav: {
                currentBrowseSorting: null,
                currentBrowsePage: 0,
                browse: function(sorting, page) {
                    page = Math.round(page);
                    if (sorting && page > 0) {
                        if (sorting !== crunchyroll.nav.currentBrowseSorting ||
                            page !== crunchyroll.nav.currentSeriesPage) {

                            $('#crunchyroll-browse .showSort').val(sorting);
                            crunchyroll.nav.currentBrowseSorting = sorting;
                            crunchyroll.nav.currentSeriesPage = page;
                            crunchyroll.refresh.seriesList(sorting, page);
                        }
                    } else {
                        window.location.replace('#crunchyroll-browse/' +
                            (sorting || $('#crunchyroll-browse .showSort').val()) +
                            '/' + (page || 1));
                    }
                },
                currentSeries: null,
                currentEpisodeSorting: null,
                episodes: function(series, sorting) {
                    if (series) {
                        if (sorting) {
                            $('#crunchyroll-episodes .episodeSort').val(sorting);
                            if (series !== crunchyroll.nav.currentSeries) {
                                crunchyroll.nav.currentSeries = series;
                                crunchyroll.nav.currentEpisodeSorting = sorting;
                                crunchyroll.refresh.episodes(series, sorting);
                            } else if (sorting !== crunchyroll.nav.currentEpisodeSorting) {
                                crunchyroll.nav.currentEpisodeSorting = sorting;
                                var $episodes = $('#crunchyroll-episodes .episodes');
                                $episodes.children().each(function(i, season) {
                                    var $season = $(season);
                                    $season.children().each(function(n, episode) {
                                        $season.prepend(episode);
                                    })
                                    $season.prepend($season.find('.crunchyrollOuterSeasonHeader'));
                                    $episodes.prepend(season);
                                });
                                $episodes.find('.seasonTiles div.columns:last-child').addClass('end');
                            }
                        } else {
                            window.location.replace('#crunchyroll-episodes/' +
                                series + '/' +
                                (sorting || $('#crunchyrollEpisodeSorting').val()));
                        }
                    } else {
                        window.location.replace('#crunchyroll-browse');
                    }
                },
                queue: function() {
                    crunchyroll.refresh.queue();
                }
            }
        };

        $('a[href^="#"]').on('click', function(e) {
            if (window.location.hash.indexOf($(this).prop('href').split('#')[1]) > -1) {
                e.preventDefault();
            }
        });

        $('#app-crunchyroll .ajaxLoader').hide();
        $('#app-crunchyroll p.truncate-line-wrap').on('click', function() {
            $(this).toggleClass('truncate-line-wrap');
        });

        $('#crunchyroll-episodes .episodeSort').on('change', function() {
            window.location.hash = 'crunchyroll-episodes/' +
                crunchyroll.nav.currentSeries + '/' + $(this).val();
        });

        $('#crunchyroll-browse .showSort').on('change', function() {
            window.location.hash = 'crunchyroll-browse/' +
                $(this).val() + '/' + 1;
        });

        if (localStorage.getItem('crunchyroll.quality')) {
            $('#crunchyrollQuality').val(localStorage.getItem('crunchyroll.quality'));
        }

        $('#crunchyrollQuality').on('change', function() {
            var quality = $(this).val();
            localStorage.setItem('crunchyroll.quality', quality);
        });

        if (localStorage.getItem('crunchyroll.episodeSort')) {
            $('#crunchyrollEpisodeSorting').val(localStorage.getItem('crunchyroll.episodeSort'));
        }

        $('#crunchyrollEpisodeSorting').on('change', function() {
            var sorting = $(this).val();
            localStorage.setItem('crunchyroll.episodeSort', sorting);
        })

        $('#useLiveQueue').on('change', function() {
            var useLiveQueue = $(this).is(':checked');
            if (useLiveQueue) {
                localStorage.setItem('crunchyroll.useLiveQueue', useLiveQueue);
            } else {
                localStorage.removeItem('crunchyroll.useLiveQueue');
            }
        });

        if (localStorage.getItem('crunchyroll.useLiveQueue')) {
            $("#useLiveQueue").prop("checked", true);
        }

        $('#app-crunchyroll .importQueueButton').on('click', function() {
            $('#crunchyrollAccountDropdown').foundation('open');
        });

        if (crunchyroll.accountData) {
            crunchyroll.baseRequest.auth = crunchyroll.accountData.auth;
            crunchyroll.api.authenticate();
            $('#crunchyrollAccountDropdown input[name=account]').val(crunchyroll.accountData.user.email);
        }

        $('#crunchyrollAccountDropdown .login').on('click', function() {
            var $text = $(this).find('span').hide();
            var $ajaxLoader = $(this).find('.ajaxLoader').show();

            crunchyroll.api.login({
                account: $('#crunchyrollAccountDropdown input[name=account]').val(),
                password: $('#crunchyrollAccountDropdown input[name=password]').val()
            }).always(function() {
                $ajaxLoader.hide();
                $text.show();
            });
        });

        hashNav.bindNavApp(function(app, section, args) {
            if (app === 'crunchyroll') {
                if (!section) {
                    window.location.replace('#crunchyroll-browse');
                }
            }
        });

        hashNav.bindNavSection(function(app, section, args) {
            if (app === 'crunchyroll') {
                if (crunchyroll.nav[section]) {
                    crunchyroll.nav[section].apply(this, args)
                }
            }
        });

        return crunchyroll;
    };
})(window.dynCore, window.hashNav);