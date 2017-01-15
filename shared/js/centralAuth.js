(function() {
    var events = {};
    window.centralAuth = {
        google: {
            signIn: function(googleUser) {
                var profile = googleUser.getBasicProfile();
                var name = profile.getName();
                var idToken = googleUser.getAuthResponse().id_token;
                window.centralAuth.google.info = {
                    id: profile.getId(),
                    name: name,
                    imgUrl: profile.getImageUrl(),
                    email: profile.getEmail(),
                    token: idToken
                };
                $(".g-signin2").hide();
                if (events.signIn) {
                    for (var i = 0; i < events.signIn.length; i++) {
                        events.signIn[i].call(this, window.centralAuth.google.info);
                    }
                }
                return $.Deferred().resolve(window.centralAuth.google.info);
            },
            signOut: function() {
                var auth2 = window.gapi.auth2.getAuthInstance();
                return auth2.signOut().then(function() {
                    console.log("Google user signed out.");
                    delete window.centralAuth.google.info;
                    $(".g-signin2").show();
                    if (events.signOut) {
                        for (var i = 0; i < events.signOut.length; i++) {
                            events.signOut[i].call(this);
                        }
                    }
                });
            },
            on: function(event, fn) {
                if (event && fn) {
                    events[event] = events[event] || [];
                    events[event].push(fn);
                }
                return window.centralAuth.google;
            },
            off: function(event, fn) {
                if (event) {
                    if (fn) {
                        for (var i = 0; i < events[event].length; i++) {
                            if (events[event][i] === fn) {
                                events[event].splice(i);
                                break;
                            }
                        }
                        
                    } else {
                        delete events[event];
                    }
                }
                return window.centralAuth.google;
            },
            baseHeaders: function() {
                if (!window.centralAuth.google.info) {
                    return {};
                }
                return {
                    user: window.centralAuth.google.info.id,
                    auth: window.centralAuth.google.info.token
                };
            },
            makeButton: function() {
                return $("<div/>", {
                    class: "g-signin2"
                }).attr("data-onsuccess", "googleSignIn")
            },
            // sign in buttons must be created before the api is loaded
            init: function() {
                $('head').append(
                    $('<meta/>', {
                        name: 'google-signin-client_id',
                        content: '747138068474-uflnaifip3j1t0qbldd2rrojajodvlgu.apps.googleusercontent.com'
                    })
                );
                window.dynCore.require('https://apis.google.com/js/platform.js');
            }
        }
    };
    window.googleSignIn = window.centralAuth.google.signIn;
})();