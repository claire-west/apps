(function() {
    window.dynCore.declare('centralAuth', null, function() {
        var events = {};
        var initialized;
        var centralAuth = {
            google: {
                signIn: function(googleUser) {
                    var profile = googleUser.getBasicProfile();
                    var name = profile.getName();
                    var idToken = googleUser.getAuthResponse().id_token;
                    console.info('Google user ' + name + ' signed in.');
                    centralAuth.google.info = {
                        id: profile.getId(),
                        name: name,
                        imgUrl: profile.getImageUrl(),
                        email: profile.getEmail(),
                        token: idToken
                    };
                    $('.g-signin2').hide();
                    if (events.signIn) {
                        for (var i = 0; i < events.signIn.length; i++) {
                            events.signIn[i].call(this, centralAuth.google.info);
                        }
                    }
                    return $.Deferred().resolve(centralAuth.google.info);
                },
                signOut: function() {
                    var auth2 = window.gapi.auth2.getAuthInstance();
                    return auth2.signOut().then(function() {
                        console.warn('Google user signed out.');
                        delete centralAuth.google.info;
                        $('.g-signin2').show();
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
                    return centralAuth.google;
                },
                off: function(event, fn) {
                    if (event) {
                        if (fn) {
                            for (var i = 0; i < events[event].length; i++) {
                                if (events[event][i] === fn) {
                                    events[event].splice(i, 1);
                                    break;
                                }
                            }
                            
                        } else {
                            delete events[event];
                        }
                    }
                    return centralAuth.google;
                },
                baseHeaders: function() {
                    if (!centralAuth.google.info) {
                        return {};
                    }
                    return {
                        user: centralAuth.google.info.id,
                        auth: centralAuth.google.info.token
                    };
                },
                makeButton: function() {
                    return $('<div/>', {
                        class: 'g-signin2'
                    }).attr('data-onsuccess', 'googleSignIn')
                },
                // sign in buttons must be created before the api is loaded
                init: function() {
                    if (initialized) {
                        return initialized;
                    }
                    initialized = $.Deferred();

                    $('head').append(
                        $('<meta/>', {
                            name: 'google-signin-client_id',
                            content: '747138068474-uflnaifip3j1t0qbldd2rrojajodvlgu.apps.googleusercontent.com'
                        })
                    );
                    
                    var promise = initialized;
                    window.dynCore.require('https://apis.google.com/js/platform.js').done(function() {
                        initialized.resolve();
                    }).fail(function() {
                        initialized.reject();
                        initialized = null;
                    });

                    return promise;
                }
            }
        };

        window.googleSignIn = centralAuth.google.signIn;
        return centralAuth;
    });
})();
