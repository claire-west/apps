(function(dynCore) {
    dynCore.css('twitch', '/hub/css/twitch.css');

    dynCore.when(dynCore.html('twitch'),
        dynCore.require([
            'isMobile',
            'arraySort',
            'hashNav'
        ], 'lib')
    ).done(function(modules) {
        window.hashNav.appInit(init(modules));
    });

    function init(modules) {
        var twitchClientId = 'Mm9iNWY1a25qMHZvd25nN2o4aHM5YzVvemw1a2Ntaw==';
        var twitchStream = {
            title: 'twitch',
            favicon: 'http://www.twitch.tv/favicon.ico',
            currentUser: localStorage.getItem("twitchStream.currentUser"),
            quality: localStorage.getItem("twitchStream.quality"),
            autoRefresh: localStorage.getItem("twitchStream.autoRefresh"),
            twelveHour: localStorage.getItem("twitchStream.twelveHour"),
            includeVodcasts: localStorage.getItem("twitchStream.includeVodcasts"),
            activePlaylist: localStorage.getItem("twitchStream.activePlaylist"),
            gamePlaylists: JSON.parse(localStorage.getItem("twitchStream.gamePlaylists")),
            playlistData: JSON.parse(localStorage.getItem("twitchStream.playlistData")),

            showSection: function(sectionId) {
                var section = $("#twitch-" + sectionId);
                if (section.is(":visible")) {
                    window.location.hash = 'twitch-' + 'currentStreams';
                } else {
                    window.location.hash = 'twitch-' + sectionId;
                }
            },

            refresh: function() {
                if (twitchStream.activePlaylist === "game") {
                    $("#refresh i").addClass("fa-spin");
                    twitchStream.getGames(twitchStream.playlistData.title, twitchStream.getGameTitle);
                } else if (twitchStream.activePlaylist === "custom") {
                    //TODO
                } else if (twitchStream.currentUser) {
                    $("#refresh i").addClass("fa-spin");
                    if (twitchStream.activePlaylist === "followed") {
                        twitchStream.getFollowed(twitchStream.currentUser);
                    } else if (twitchStream.activePlaylist === "hosts") {
                        twitchStream.getHosts(twitchStream.currentUser);
                    }
                } else {
                    $("#twitch-currentStreams").empty();
                    $("#twitch-currentStreams").append(
                        $("<h5/>", {
                            text: "Enter a Username",
                            class: "text-center",
                            style: "font-style:italic;"
                        })
                    );
                    $("#lastRefresh").addClass("hide");
                }
            },

            useTemporaryPlaylist: function() {
                $("#refresh i").addClass("fa-spin");
                $("#playlistsTemporary").show();
                twitchStream.setValue("activePlaylist", twitchStream.temporaryPlaylist.type);
                twitchStream.setValue("playlistData", twitchStream.temporaryPlaylist.data);
                twitchStream.refresh();
                if (twitchStream.activePlaylist === "game") {
                    $("#temporaryPlaylistName").text("Game: " + twitchStream.playlistData.title);
                } else if (twitchStream.activePlaylist === "custom") {
                    //TODO
                }
                $("#temporarySwitch").prop("checked", true);
            },

            getFollowed: function(username) {
                var url = "https://api.twitch.tv/kraken/users/" + username + "/follows/channels";
                $.ajax({
                    url: url,
                    headers: {
                       'Client-ID': atob(twitchClientId)
                    },
                    cache: false,
                    success: function(result) {
                        twitchStream.getStreams(result);
                    },
                    error: function() {
                        $("#refresh i").removeClass("fa-spin");
                        $("#lastRefreshTime").text("Error");
                    }
                });
            },

            getStreams: function(followedStreams) {
                $("#twitch-currentStreams").empty();
                if (followedStreams.follows.length < 1) {
                    $("#twitch-currentStreams").append(twitchStream.rendering.error("No Followed Channels"));
                } else {
                    var url = "https://api.twitch.tv/kraken/streams?channel=";

                    followedStreams.follows.forEach(function(item) {
                        url += item.channel.display_name + ",";
                    });

                    url = url.substring(0, url.length - 1);

                    $.ajax({
                        url: url,
                        headers: {
                            'Client-ID': atob(twitchClientId)
                        },
                        cache: false,
                        success: function(result) {
                            result.streams.sortBy("channel.display_name");
                            twitchStream.renderStreams(result.streams, "Followed Streams");
                        },
                        error: function() {
                            $("#refresh i").removeClass("fa-spin");
                            $("#lastRefreshTime").text("Error");
                        }
                    });
                }
            },

            renderStreams: function(streams, title) {
                var vodcasts = 0;
                if (!twitchStream.includeVodcasts) {
                    for (var i = 0; i < streams.length; i++) {
                        if (streams[i].stream_type === 'watch_party') {
                            vodcasts++;
                        }
                    }
                }

                var $title = $('title');
                if ($title.text().startsWith('Twitch')) {
                    $title.text('Twitch (' + (streams.length - vodcasts) + ')');
                }
                if (streams.length < 1) {
                    $("#twitch-currentStreams").append(twitchStream.rendering.error("No Channels Live"));
                } else {
                    $("#twitch-currentStreams").append(twitchStream.rendering.title(title));

                    var now = Date.now();
                    streams.forEach(function(item) {
                        if (item.stream_type === 'live' ||
                            (item.stream_type === 'watch_party' && twitchStream.includeVodcasts)) {
                            $("#twitch-currentStreams").append(
                                twitchStream.rendering.renderFollow(
                                    item.channel.display_name,
                                    item.channel.status,
                                    item.preview.medium,
                                    item.game,
                                    item.viewers,
                                    now
                                )
                            );
                        }
                    });

                    if (vodcasts > 0) {
                        $("#twitch-currentStreams").append(
                            $("<div/>", {
                                class: "large-3 medium-4 small-12 columns"
                            }).append(
                                $("<div/>", {
                                    class: "callout secondary",
                                    style: "padding: 0.75rem"
                                }).append(
                                    $("<p/>", {
                                        text: "...and " + vodcasts + " vodcast" + (vodcasts !== 1 ? "s" : "")
                                    })
                                )
                            )
                        );
                    }

                    $("#twitch-currentStreams > div.columns:last-child").addClass("end");
                }

                twitchStream.finishRefresh();
            },

            getHosts: function(username) {
                $("#twitch-currentStreams").empty();
                var url = "http://api.twitch.tv/api/users/" + username + "/followed/hosting?callback=?";
                $.getJSON(url, function(data) {
                    twitchStream.renderHosts(data.hosts);
                });
            },

            renderHosts: function(hosts) {
                if (hosts.length < 1) {
                    $("#twitch-currentStreams").append(twitchStream.rendering.error("No Live Hosts"));
                } else {
                    hosts.sortBy("target.viewers");

                    $("#twitch-currentStreams").append(twitchStream.rendering.title("Live Hosts"));

                    var now = Date.now();
                    hosts.forEach(function(item) {
                        $("#twitch-currentStreams").append(
                            twitchStream.rendering.renderHost(
                                item.display_name,
                                item.target.channel.name,
                                item.target.preview,
                                item.target.title,
                                item.target.meta_game,
                                item.target.viewers,
                                now
                            )
                        );
                    });

                    $("#twitch-currentStreams > div.columns:last-child").addClass("end");
                }

                twitchStream.finishRefresh();
            },

            getGames: function(fragment, success, error) {
                var url = "https://api.twitch.tv/kraken/search/games?q=" + fragment + "&type=suggest&live=true";
                $.ajax({
                    url: url,
                    headers: {
                        'Client-ID': atob(twitchClientId)
                    },
                    cache: false,
                    success: function(result) {
                        success(result.games);
                    },
                    error: function() {
                        if (error) {
                            error();
                        }
                    }
                });
            },

            getGameTitle: function(games) {
                $("#twitch-currentStreams").empty();
                if (games.length < 1) {
                    $("#twitch-currentStreams").append(twitchStream.rendering.error("No Games Found"));
                } else {
                    twitchStream.getGameStreams(games[0].name);
                }
            },

            getGameStreams: function(title) {
                var url = "https://api.twitch.tv/kraken/streams?game=" + title;
                $.ajax({
                    url: url,
                    headers: {
                        'Client-ID': atob(twitchClientId)
                    },
                    cache: false,
                    success: function(result) {
                        result.streams.sortBy("viewers");
                        twitchStream.renderStreams(result.streams, title);
                    },
                    error: function() {
                        $("#refresh i").removeClass("fa-spin");
                        $("#lastRefreshTime").text("Error");
                    }
                });
            },

            finishRefresh: function() {
                twitchStream.updateRefreshTimestamp();
                $("#lastRefresh").removeClass("hide");
                $("#refresh i").removeClass("fa-spin");
                $("#twitch-currentStreams h6").on("click", function() {
                    $(this).toggleClass("truncate-line-wrap");
                });
            },

            updateRefreshTimestamp: function() {
                var now = new Date();
                var hours = now.getHours();
                if (twitchStream.twelveHour) {
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
                $("#lastRefreshTime").text(hours + ":" + minutes);
            },

            initAutoRefresh: function() {
                if (twitchStream.autoRefreshInterval) {
                    clearInterval(twitchStream.autoRefreshInterval);
                }
                if (twitchStream.autoRefresh) {
                    twitchStream.autoRefreshInterval = setInterval(function() {
                            twitchStream.refresh();
                        }, 1000 * 60 * 2
                    );
                }
            },

            setValue: function(key, value) {
                twitchStream[key] = value;
                if (typeof value === "object") {
                    value = JSON.stringify(value);
                }
                localStorage.setItem("twitchStream." + key, value);
            },

            getValue: function(key) {
                if (!twitchStream[key]) {
                    var value = localStorage.getItem("twitchStream." + key);
                    if (value.substring(0, 1) === "{" ||
                        value.substring(0, 1) === "[") {
                        value = JSON.parse(value);
                    }
                    twitchStream[key] = value;
                }
                return twitchStream[key];
            },

            clearValue: function(key) {
                localStorage.removeItem("twitchStream." + key);
                delete twitchStream[key];
            },

            rendering: {
                title: function(title) {
                    var $div = $("<div/>", {
                        class: "column"
                    });

                    var $h4 = $("<h4/>");
                    if (twitchStream.activePlaylist !== "followed") {
                        $h4.append(
                            $("<i/>", {
                                title: "Back to Followed Streams",
                                class: "fa fa-arrow-left",
                                style: "cursor:pointer;"
                            }).on("click", function() {
                                twitchStream.setValue("activePlaylist", "followed");
                                $("#twitch-currentStreams").empty();
                                twitchStream.refresh();
                                $("#playlistsTemporary").hide();
                                $("#followedSwitch").prop("checked", true);
                            })
                        ).append("&nbsp;");
                    }

                    $h4.append(document.createTextNode(title));
                    $div.append($h4);
                    return $div;
                },

                error: function(error) {
                    $("#refresh i").removeClass("fa-spin");
                    return $("<div/>", {
                        class: "column"
                    }).append(
                        $("<h5/>", {
                            text: error,
                            class: "text-center",
                            style: "font-style:italic;margin-top:0.4375rem;"
                        })
                    );
                },

                gamePlaylists: function() {
                    var $playlistsSection = $("#playlistsGames");
                    $playlistsSection.empty();
                    var index = 0;
                    twitchStream.gamePlaylists.forEach(function(item) {
                        $playlistsSection.append(
                            twitchStream.rendering.playlistRow("Game", item, item, index++, true)
                        );
                    });
                },

                playlistRow: function(type, name, key, index, editDisabled) {
                    var $div = $("<div/>", {
                        class: "row playlist-row"
                    });

                    var $deleteButton = $("<button/>", {
                        class: "button hollow secondary topbar-button-fa"
                    }).append(
                        $("<i/>", {
                            class: "fa fa-trash-o"
                        })
                    ).append(
                        $("<span/>", {
                            text: "Delete Playlist",
                            class: "show-for-sr"
                        })
                    ).on("click", function() {
                        twitchStream.playlists.deletePlaylist("game", key);
                    });

                    var $editButton = $("<button/>", {
                        class: "button hollow topbar-button-fa"
                    }).append(
                        $("<i/>", {
                            class: "fa fa-edit"
                        })
                    ).append(
                        $("<span/>", {
                            text: "Edit Playlist",
                            class: "show-for-sr"
                        })
                    );

                    if (editDisabled) {
                        $editButton.addClass("disabled");
                    } else {
                        //TODO
                    }

                    $("<div/>", {
                        class: "small-2 columns"
                    }).append(
                        $("<div/>", {
                            class: "button-group"
                        }).append($deleteButton)
                        .append($editButton)
                    ).appendTo($div);

                    $("<div/>", {
                        class: "small-2 columns"
                    }).append(
                        $("<span/>", {
                            text: type
                        })
                    ).appendTo($div);

                    $("<div/>", {
                        class: "small-6 columns"
                    }).append(
                        $("<span/>", {
                            text: name
                        })
                    ).appendTo($div);

                    var $radio = $("<input/>", {
                        type: "radio",
                        id: "gameSwitch" + index,
                        class: "switch-input",
                        name: "activePlaylist",
                        value: key
                    }).on("change", function() {
                        if ($(this).is(":checked")) {
                            $("#playlistsTemporary").hide();
                            twitchStream.setValue("activePlaylist", "game");
                            twitchStream.setValue("playlistData", { title: name });

                            $("#twitch-currentStreams").empty();
                            twitchStream.showSection("currentStreams");
                            twitchStream.refresh();
                        }
                    });

                    $("<div/>", {
                        class: "small-2 columns"
                    }).append(
                        $("<div/>", {
                            class: "switch text-center"
                        }).append($radio)
                        .append(
                            $("<label/>", {
                                class: "switch-paddle",
                                for: "gameSwitch" + index
                            }).append(
                                $("<span/>", {
                                    text: name,
                                    class: "show-for-sr"
                                })
                            )
                        )
                    ).appendTo($div);

                    return $div;
                },

                outerDiv: function() {
                    return $("<div/>", {
                        class: "large-3 medium-4 small-12 columns"
                    });
                },

                panel: function() {
                    return $("<div/>", {
                        class: "callout secondary",
                        style: "padding:0.75rem;"
                    });
                },

                preview: function(channelName, src, gameTitle, now) {
                    return $("<a/>", {
                        href: "http://www.twitch.tv/" + channelName
                    }).append(
                        $("<img/>", {
                            src: src + "?" + now,
                            title: gameTitle,
                            style: "margin-bottom:0.5rem;width:100%;height:100%;"
                        })
                    );
                },

                status: function(status) {
                    return $("<h6/>", {
                        text: status,
                        title: status,
                        class: "truncate-line-wrap",
                        style: "margin-bottom:0;"
                    });
                },

                viewers: function(viewers) {
                    return $("<p/>", {
                        text: viewers + " watching ",
                        class: "truncate-line-wrap",
                        style: "margin-bottom:0.5rem;text-align:right;"
                    });
                },

                profileLink: function(channelName) {
                    return $("<a/>", {
                        text: channelName,
                        href: "http://www.twitch.tv/" + channelName + "/profile"
                    });
                },

                buttonsRow: function(channelName) {
                    var $buttonsRow = $("<div/>", {
                        class: "row collapse"
                    });

                    var chatlink = "https://www.twitch.tv/" + channelName.toLocaleLowerCase() + "/chat";

                    $("<div/>", {
                        class: "small-3 columns"
                    }).appendTo($buttonsRow).append(
                        $("<a/>", {
                            href: chatlink,
                            target: "_blank",
                            class: "button hollow expanded secondary",
                            style: "margin-bottom:0;padding:0.3rem 1rem;"
                        }).on("click", function (e) {
                            e.preventDefault();
                            window.open(chatlink + "?popout=", "_blank", "resizable=yes, scrollbars=yes, titlebar=yes, width=400, height=600");
                        }).append(
                            $("<i/>", {
                                class: "fi-comments",
                                style: "color:#333;font-size:1.7rem;"
                            })
                        )
                    );

                    $("<div/>", {
                        class: "small-9 columns"
                    }).appendTo($buttonsRow).append(
                        $("<a/>", {
                            text: "Launch",
                            href: "livestreamer:twitch.tv/" + channelName + " " + twitchStream.quality,
                            class: "button expanded",
                            style: "margin-bottom:0;"
                        })
                    );

                    return $buttonsRow;
                },

                renderFollow: function(channelName, status, preview, gameTitle, viewers, now) {
                    var $div = twitchStream.rendering.outerDiv();
                    var $panel = twitchStream.rendering.panel().appendTo($div);

                    twitchStream.rendering.preview(
                        channelName,
                        preview,
                        gameTitle,
                        now
                    ).appendTo($panel);
                    
                    twitchStream.rendering.status(
                        status
                    ).appendTo($panel);

                    twitchStream.rendering.viewers(
                        viewers
                    ).appendTo($panel)
                        .append(twitchStream.rendering.profileLink(channelName)
                    );

                    if (!modules.lib.isMobile()) {
                        twitchStream.rendering.buttonsRow(
                            channelName
                        ).appendTo($panel);
                    } else {
                        $panel.append(
                            $('<p/>', {
                                text: 'Playing ' + gameTitle,
                                class: 'truncate-line-wrap text-right',
                                style: 'margin-top:-0.5rem;margin-bottom:-0.5rem;'
                            })
                        )
                    }

                    return $div;
                },

                renderHost: function(hostName, targetName, preview, status, gameTitle, viewers, now) {
                    var $div = twitchStream.rendering.outerDiv();
                    var $panel = twitchStream.rendering.panel().appendTo($div);

                    twitchStream.rendering.preview(
                        targetName,
                        preview,
                        gameTitle,
                        now
                    ).appendTo($panel);
                    
                    twitchStream.rendering.status(
                        hostName + " hosting " + targetName + " - " + status
                    ).appendTo($panel);

                    twitchStream.rendering.viewers(
                        viewers
                    ).appendTo($panel)
                        .append(twitchStream.rendering.profileLink(targetName)
                    );

                    twitchStream.rendering.buttonsRow(
                        targetName
                    ).appendTo($panel);

                    return $div;
                }
            },

            singleStream: {
                checkStream: function(channelName) {
                    $("#checkSingleStream span").hide();
                    $("#checkSingleStream img").show();
                    $.ajax({
                        url: "https://api.twitch.tv/kraken/streams?channel=" + channelName,
                        headers: {
                            'Client-ID': atob(twitchClientId)
                        },
                        cache: false,
                        success: function(result) {
                            twitchStream.singleStream.updateButton(channelName, result);
                        },
                        error: function() {
                            $("#checkSingleStream")
                                .removeClass("success")
                                .removeClass("primary")
                                .addClass("alert")
                                .removeAttr("href");
                            $("#checkSingleStream span").text("Error").show();
                            $("#checkSingleStream img").hide();
                        }
                    });                    
                },

                updateButton: function(channelName, stream) {
                    if (stream.streams.length > 0) {
                        $("#checkSingleStream")
                            .removeClass("primary")
                            .addClass("success")
                            .prop("href", "livestreamer:" + channelName + " " + twitchStream.quality);
                        $("#checkSingleStream span").text("Launch Stream").show();
                        $("#checkSingleStream img").hide();
                        if (twitchStream.singleStream.timeout) {
                            clearTimeout(twitchStream.singleStream.timeout);
                        }
                        twitchStream.singleStream.timeout = setTimeout(function() {
                                var $button = $("#checkSingleStream");
                                if ($button.hasClass("success")) {
                                    $button.removeClass("success")
                                        .addClass("primary")
                                        .removeAttr("href");
                                    $("#checkSingleStream span").text("Check Stream");
                                }
                            },
                            1000 * 30
                        );
                    } else {
                        $("#checkSingleStream")
                                .removeClass("success")
                                .removeClass("primary")
                                .addClass("alert")
                                .removeAttr("href");
                            $("#checkSingleStream span").text("Not Live").show();
                            $("#checkSingleStream img").hide();
                    }
                }
            },

            playlists: {
                selectActive: function () {
                    if (twitchStream.activePlaylist) {
                        if (twitchStream.activePlaylist === "game") {
                            var index = twitchStream.gamePlaylists.indexOf(twitchStream.playlistData.title);
                            $("#gameSwitch" + index).prop("checked", "checked");
                        } else {
                            $("#" + twitchStream.activePlaylist + "Switch").prop("checked", "checked");
                        }
                    } else {
                        $("#followedSwitch").prop("checked", "checked");
                        twitchStream.setValue("activePlaylist", "followed");
                    }
                },

                searchGames: function() {
                    $("#checkPlaylistGame span").hide();
                    $("#checkPlaylistGame img").show();

                    twitchStream.getGames($("#gamePlaylistTitle").val(),
                        twitchStream.playlists.showGameResults,
                        function() {
                            $("#checkPlaylistGame img").hide();
                            $("#checkPlaylistGame span").show();
                        }
                    );
                },

                showGameResults: function(games) {
                    $("#checkPlaylistGame img").hide();
                    $("#checkPlaylistGame span").show();
                    
                    var $div = $("#gamePlaylistResults");
                    $div.empty();

                    games.forEach(function(item) {
                        var $row = $("<div/>", {
                            class: "row playlist-row"
                        }).appendTo($div);

                        $("<div/>", {
                            class: "small-8 medium-9 large-10 columns media-object",
                            style: "margin-bottom:0;"
                        }).append(
                            $("<div/>", {
                                class: "media-object-section"
                            }).append(
                                $("<img/>", {
                                    src: item.box.medium,
                                    alt: item.name,
                                    style: "height:5rem;"
                                })
                            )
                        ).append(
                            $("<div/>", {
                                class: "media-object-section"
                            }).append(
                                $("<h6/>", {
                                    text: item.name,
                                    style: "line-height:5rem;margin-bottom:0;"
                                })
                            )
                        ).appendTo($row);

                        var $button = $("<button/>", {
                            text: "Select Game",
                            class: "button expanded",
                            style: "margin-top:1rem;"
                        });

                        $("<div/>", {
                            class: "small-4 medium-3 large-2 columns"
                        }).append(
                            $button
                        ).appendTo($row);

                        $button.on("click", function() {
                            twitchStream.playlists.newGamePlaylist(item.name);
                        });
                    });
                },

                newGamePlaylist: function(gameTitle) {
                    if (!twitchStream.gamePlaylists) {
                        twitchStream.gamePlaylists = [];
                    }
                    if (twitchStream.gamePlaylists.indexOf(gameTitle) === -1) {
                        twitchStream.gamePlaylists.push(gameTitle);
                        twitchStream.gamePlaylists.sort(function(a, b) {
                            return a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase());
                        });
                        twitchStream.setValue("gamePlaylists", twitchStream.gamePlaylists);
                        twitchStream.rendering.gamePlaylists();
                    }
                    var index = twitchStream.gamePlaylists.indexOf(gameTitle);
                    $("#gameSwitch" + index).prop("checked", "checked");
                    $("#gamePlaylistTitle").val(null);
                    twitchStream.showSection("playlists");

                    twitchStream.setValue("activePlaylist", "game");
                    twitchStream.setValue("playlistData", { title: gameTitle });
                    twitchStream.refresh();
                },

                deletePlaylist: function(type, name) {
                    if (type === "game") {
                        var index = twitchStream.gamePlaylists.indexOf(name);
                        if (index !== -1) {
                            if ($("#gameSwitch" + index).is(":checked")) {
                                twitchStream.setValue("activePlaylist", "followed");
                                twitchStream.refresh();
                            }
                            twitchStream.gamePlaylists.splice(index, 1);
                            twitchStream.setValue("gamePlaylists", twitchStream.gamePlaylists);
                            
                            twitchStream.rendering.gamePlaylists();
                            twitchStream.playlists.selectActive();
                        }
                    } else if (type === "custom") {
                        //TODO
                    }
                }
            }
        };

        $("#playlistsTemporary").hide();
        $("#twitch-singleEntry img, #checkPlaylistGame img").hide();

        if (!twitchStream.gamePlaylists) {
            twitchStream.setValue("gamePlaylists", []);
        }

        twitchStream.rendering.gamePlaylists();

        if (twitchStream.currentUser) {
            $("#username").val(twitchStream.currentUser);
            $("#usernameTopbar").val(twitchStream.currentUser);
        }

        if (twitchStream.quality) {
            $("#quality").val(twitchStream.quality);
        } else {
            $("#quality").val("best");
            twitchStream.setValue("quality", "best");
        }

        if (twitchStream.autoRefresh) {
            $("#autoRefresh").prop("checked", true);
            twitchStream.initAutoRefresh();
        }

        if (twitchStream.twelveHour) {
            $("#twelveHour").prop("checked", true);
        }

        if (twitchStream.includeVodcasts) {
            $("#includeVodcasts").prop("checked", true);
        }

        twitchStream.playlists.selectActive();

        $("#app-twitch [data-section]").on("click", function() {
            twitchStream.showSection($(this).data("section"));
        });

        $("#usernameButton").on("click", function() {
            $("#usernameDropdown").foundation("close");
        });

        $("#usernameButton, #usernameButtonTopbar").on("click", function() {
            var username = $("#username").val();
            twitchStream.setValue("currentUser", username);
            twitchStream.refresh();
            twitchStream.initAutoRefresh();
        });

        $("#username").on("keyup", function() {
            if (Foundation.Keyboard.parseKey(event) === "ENTER") {
                $("#usernameButton").trigger("click");
                return;
            }
            $("#usernameTopbar").val($(this).val());
        });

        $("#usernameTopbar").on("keyup", function() {
            if (Foundation.Keyboard.parseKey(event) === "ENTER") {
                $("#usernameButtonTopbar").trigger("click");
                return;
            }
            $("#username").val($(this).val());
        });

        $("#quality").on("change", function() {
            var quality = $(this).val();
            twitchStream.setValue("quality", quality);
            twitchStream.refresh();
            twitchStream.initAutoRefresh();
        });

        $("#autoRefresh").on("change", function() {
            var autoRefresh = $(this).is(":checked");
            if (autoRefresh) {
                localStorage.setItem("twitchStream.autoRefresh", autoRefresh);
            } else {
                localStorage.removeItem("twitchStream.autoRefresh");
            }
            twitchStream.autoRefresh = autoRefresh;
            if (autoRefresh) {
                twitchStream.initAutoRefresh();
                twitchStream.refresh();
            } else {
                clearInterval(twitchStream.autoRefreshInterval);
            }
        });

        $("#twelveHour").on("change", function() {
            var twelveHour = $(this).is(":checked");
            if (twelveHour) {
                localStorage.setItem("twitchStream.twelveHour", twelveHour);
            } else {
                localStorage.removeItem("twitchStream.twelveHour");
            }
            twitchStream.twelveHour = twelveHour;
            if (!$("#lastRefresh").hasClass("hide")) {
                twitchStream.updateRefreshTimestamp();
            }
        });

        $("#includeVodcasts").on("change", function() {
            var includeVodcasts = $(this).is(":checked");
            if (includeVodcasts) {
                localStorage.setItem("twitchStream.includeVodcasts", includeVodcasts);
            } else {
                localStorage.removeItem("twitchStream.includeVodcasts");
            }
            twitchStream.includeVodcasts = includeVodcasts;
            if (!$("#lastRefresh").hasClass("hide")) {
                twitchStream.refresh();
            }
        });

        $("#channelName").on("keyup", function(event) {
            if (Foundation.Keyboard.parseKey(event) === "ENTER") {
                $("#checkSingleStream").trigger("click");
                return;
            }

            $("#checkSingleStream")
                .removeClass("success")
                .removeClass("alert")
                .addClass("primary")
                .removeAttr("href");
            $("#checkSingleStream span").text("Check Stream").show();
            $("#checkSingleStream img").hide();

            if ($(this).val() === "") {
                $("#checkSingleStream").addClass("disabled");
            } else {
                $("#checkSingleStream").removeClass("disabled");
            }
        });

        $("#checkSingleStream").on("click", function() {
            var $button = $("#checkSingleStream");
            if ($button.hasClass("primary") || $button.hasClass("alert")) {
                twitchStream.singleStream.checkStream($("#channelName").val());
            }
        });

        $("#gameTitle").on("keyup", function() {
            if (Foundation.Keyboard.parseKey(event) === "ENTER") {
                $("#checkGame").trigger("click");
                return;
            }
            if ($(this).val() === "") {
                $("#checkGame").addClass("disabled");
            } else {
                $("#checkGame").removeClass("disabled");
            }
        });

        $("#checkGame").on("click", function() {
            twitchStream.temporaryPlaylist = {
                type: "game",
                data: {
                    title: $("#gameTitle").val()
                }
            };
            $("#twitch-currentStreams").empty();
            twitchStream.showSection("currentStreams");
            twitchStream.useTemporaryPlaylist();
        });

        $("#temporarySwitch").on("click", function(event) {
            event.preventDefault();
        });

        $("#playlistsDefault input[name=activePlaylist]").on("change", function() {
            var activePlaylist = $(this).val();
            $("#playlistsTemporary").hide();
            twitchStream.setValue("activePlaylist", activePlaylist);

            $("twitch-#currentStreams").empty();
            twitchStream.showSection("currentStreams");
            twitchStream.refresh();
        });

        $("#gamePlaylistTitle").on("keyup", function() {
            if (Foundation.Keyboard.parseKey(event) === "ENTER") {
                $("#checkPlaylistGame").trigger("click");
                return;
            }
            if ($(this).val() === "") {
                $("#checkPlaylistGame").addClass("disabled");
            } else {
                $("#checkPlaylistGame").removeClass("disabled");
            }
        });

        $("#checkPlaylistGame").on("click", function() {
            if ($("#checkPlaylistGame img").is(":hidden")) {
                twitchStream.playlists.searchGames();
            }
        });

        $("#refresh").on("click", function() {
            twitchStream.initAutoRefresh();
            twitchStream.refresh();
            if ($("twitch-#currentStreams").is(":hidden")) {
                $("twitch-#currentStreams").empty();
                twitchStream.showSection("currentStreams");
            }
        });

        twitchStream.refresh();

        return twitchStream;
    };
})(window.dynCore);