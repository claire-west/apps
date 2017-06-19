(function () {
    var currentId;

    var handleError = function(error) {
        console.log(error);
    };
    
    rp.core.signOut = function() {
        var auth2 = gapi.auth2.getAuthInstance();
        auth2.signOut().then(function() {
            // console.log("User signed out.");
        });
        delete rp.core.auth;
        $(this).hide();
        $(".g-signin2").show();
    };

    var $signOut = $("<div/>", {
        id: "signOut"
    }).append($("<span/>")
    ).append($("<a/>", {
        text: "(sign out)"
    })).prependTo($("body")).hide().on("click", rp.core.signOut);

    rp.core.getBaseHeaders = function() {
        if (!this.auth) {
            return {};
        }
        return {
            user: this.auth.id,
            auth: this.auth.token,
            meta: 'dynamicSheet'
        };
    };
    rp.core.signIn = function(googleUser) {
        var profile = googleUser.getBasicProfile();
        var name = profile.getName();
        var idToken = googleUser.getAuthResponse().id_token;
        rp.core.auth = {
            id: profile.getId(),
            name: name,
            imgUrl: profile.getImageUrl(),
            email: profile.getEmail(),
            token: idToken
        };

        cancel();
        $signOut.find("span").first().text(name);
        $(".g-signin2").hide();
        $signOut.show();
    };

    var $toolbar = $("#rpToolbar");
    var $tools = $toolbar.children().first();
    var $save = $("<button/>", {
        text: "Online Storage",
        class: "expand"
    }).on("click", function() {
        showTool(0);
    });
    var $loadButton = $("<button/>", {
        text: "Local Storage",
        class: "expand"
    }).on("click", function() {
        showTool(1);
    });
    var $templateButton = $("<button/>", {
        text: "Load Template",
        class: "expand"
    }).on("click", function() {
        showTool(2);
    });
    var tools = [];
    var $io = $("<div/>", {
        id: "rpIo",
        class: "rpRow"
    }).hide().insertAfter($toolbar);

    var refreshLocalCharacterSelect = function() {
        $loadLocalCharacterSelect.empty();
        for (var key in localStorage) {
            if (key.substr(0, 3) === "rp." &&
                localStorage.hasOwnProperty(key)) {
                $loadLocalCharacterSelect.append(
                    $("<option/>", {
                        text: key.substr(3),
                        value: key
                    })
                );
            }
        }
        if ($loadLocalCharacterSelect.children().length) {
            $loadLocalCharacterSelect.prop("disabled", false)
                .next().children().first().prop("disabled", false)
                .next().prop("disabled", false);
        } else {
            $loadLocalCharacterSelect.prop("disabled", true)
                .next().children().first().prop("disabled", true)
                .next().prop("disabled", true);
            $loadLocalCharacterSelect.append(
                $("<option/>", {
                    text: "No Characters"
                })
            );
        }
    };
    var refreshCharacterSelect = function() {
        $loadCharacterSelect.empty().append(
            $("<option/>", {
                text: "Refreshing..."
            })
        ).prop("disabled", true);
        $loadCharacterSelect.prop("disabled", true)
            .next().children().first().prop("disabled", true)
            .next().prop("disabled", true);
        var headers = rp.core.getBaseHeaders();
        $.ajax({
            url: "http://api.isaac-west.ca/nosql",
            method: "GET",
            headers: headers,
            success: function(data) {
                if (data.length) {
                    $loadCharacterSelect.empty();
                    for (var i = 0; i < data.length; i++) {
                        $loadCharacterSelect.append(
                            $("<option/>", {
                                text: data[i].Label || data[i].Id,
                                value: data[i].Id
                            })
                        );
                    }
                    $loadCharacterSelect.prop("disabled", false)
                        .next().children().first().prop("disabled", false)
                        .next().prop("disabled", false);
                } else {
                    $loadCharacterSelect.empty().append(
                        $("<option/>", {
                            text: "No Characters"
                        })
                    );
                }
            },
            error: function(error) {
                $loadCharacterSelect.empty().append(
                    $("<option/>", {
                        text: "Error Loading Characters"
                    })
                );
            }
        });
    };
    var showTool = function(i) {
        $toolbar.hide();
        $io.show();
        if (i === 0 &&
            !rp.core.auth) {
            tools[0].hide();
            tools[1].hide();
            tools[2].hide();
            tools[3].show();
        } else {
            tools[i].show();
            tools[(i + 1) % 3].hide();
            tools[(i + 2) % 3].hide();
            tools[3].hide();
            if (i === 0) {
                refreshCharacterSelect();
            } else if (i === 1) {
                refreshLocalCharacterSelect();
            }
        }
    };
    var cancel = function() {
        $io.hide();
        $toolbar.show();
    };
    rp.core.cancel = cancel;

    var saveCurrent = function() {
        var headers = rp.core.getBaseHeaders();
        headers.label = $saveCharacterLabel.val() || Date.now();
        var data = {
            id: currentId,
            json: rp.core.getSerialized()
        };
        $.ajax({
            url: "http://api.isaac-west.ca/nosql",
            method: "POST",
            headers: headers,
            data: data,
            success: function(response) {
                cancel();
            },
            error: handleError
        });
    };
    var saveCurrentToLocal = function() {
        localStorage.setItem("rp." + ($saveLocalCharacterLabel.val() || Date.now()), rp.core.getSerialized());
        $("#rpToolbar").parent().hide();
        cancel();
    };

    var loadCharacter = function(data) {
        rp.core.initialize(data);
        rp.core.render();
        $("#rpToolbar").parent().hide();
        cancel();
    };
    var loadCharacterFromLocal = function() {
        loadCharacter(JSON.parse(localStorage.getItem($loadLocalCharacterSelect.val())));
        $saveLocalCharacterLabel.val($loadLocalCharacterSelect.find('option:selected').text());
    };
    var loadCharacterFromRemote = function() {
        var id = $loadCharacterSelect.val();
        if (id) {
            var headers = rp.core.getBaseHeaders();
            $.ajax({
                url: "http://api.isaac-west.ca/nosql/" + id,
                method: "GET",
                headers: headers,
                success: function (data) {
                    loadCharacter(JSON.parse(data.Text));
                    currentId = data.Id;
                    $saveCharacterLabel.val($loadCharacterSelect.find('option:selected').text());
                },
                error: handleError
            });
        }
    };

    var deleteLocal = function() {
        localStorage.removeItem($loadLocalCharacterSelect.val());
        cancel();
    };
    var deleteRemote = function() {
        var id = $loadCharacterSelect.val();
        if (id) {
            var headers = rp.core.getBaseHeaders();
            $.ajax({
                url: "http://api.isaac-west.ca/nosql/" + id,
                method: "DELETE",
                headers: headers,
                success: cancel,
                error: handleError
            });
        }
    };

    var loadTemplate = function() {
        $.getJSON($(this).prev().val(), function(data) {
            loadCharacter(data);
        });
    };
    $tools.append($save).append($loadButton).append($templateButton);

    var $loadCharacterSelect = $("<select/>").prop("disabled", true);
    var $saveCharacterLabel = $("<input/>");
    tools[0] = $("<div/>").append(
        $("<div/>", {
            class: "rpS2 rpCol"
        }).append(
            $("<button/>", {
                text: "Cancel",
                class: "expand"
            }).on("click", cancel)
        )
    ).append(
        $("<div/>", {
            class: "rpS5 rpCol"
        }).append(
            $loadCharacterSelect
        ).append(
            $("<div/>").append(
                $("<button/>", {
                    text: "X",
                    class: "delete"
                }).prop("disabled", true).on("click", deleteRemote)
            ).append(
                $("<button/>", {
                    text: "Load",
                    class: "expand"
                }).prop("disabled", true).on("click", loadCharacterFromRemote)
            )
        )
    ).append(
        $("<div/>", {
            class: "rpS5 rpCol"
        }).append(
            $saveCharacterLabel
        ).append(
            $("<button/>", {
                text: "Save Online",
                class: "expand"
            }).on("click", saveCurrent)
        )
    );

    var $loadLocalCharacterSelect = $("<select/>").prop("disabled", true);
    var $saveLocalCharacterLabel = $("<input/>");
    tools[1] = $("<div/>").append(
        $("<div/>", {
            class: "rpS2 rpCol"
        }).append(
            $("<button/>", {
                text: "Cancel",
                class: "expand"
            }).on("click", cancel)
        )
    ).append(
        $("<div/>", {
            class: "rpS5 rpCol"
        }).append(
            $loadLocalCharacterSelect
        ).append(
            $("<div/>").append(
                $("<button/>", {
                    text: "X",
                    class: "delete"
                }).prop("disabled", true).on("click", deleteLocal)
            ).append(
                $("<button/>", {
                    text: "Load",
                    class: "expand"
                }).prop("disabled", true).on("click", loadCharacterFromLocal)
            )
        )
    ).append(
        $("<div/>", {
            class: "rpS5 rpCol"
        }).append(
            $saveLocalCharacterLabel
        ).append(
            $("<button/>", {
                text: "Save Local",
                class: "expand"
            }).on("click", saveCurrentToLocal)
        )
    );

    tools[2] = $("<div/>").append(
        $("<div/>", {
            class: "rpS2 rpCol"
        }).append(
            $("<button/>", {
                text: "Cancel",
                class: "expand"
            }).on("click", cancel)
        )
    ).append(
        $("<div/>", {
            class: "rpS5 rpCol"
        }).append(
            $("<select/>").append(
                $("<option/>", {
                    text: "Dungeons & Dragons 5e",
                    value: "/hub/res/rp.dnd.json"
                })
            )
        ).append(
            $("<button/>", {
                text: "Load Preset",
                class: "expand"
            }).on("click", loadTemplate)
        )
    ).append(
        $("<div/>", {
            class: "rpS5 rpCol"
        }).append(
            $("<input/>")
        ).append(
            $("<button/>", {
                text: "Load from URL",
                class: "expand"
            }).on("click", loadTemplate)
        )
    );
    tools[3] = $("<div/>").append(
        $("<div/>", {
            class: "rpS2 rpCol"
        }).append(
            $("<button/>", {
                text: "Cancel",
                class: "expand"
            }).on("click", cancel)
        )
    ).append(
        $("<div/>", {
            class: "rpS10 rpCol"
        }).append(
            $("<div/>", {
                class: "g-signin2"
            }).attr("data-onsuccess", "signIn")
        )
    );
    $io.append(tools);
})();