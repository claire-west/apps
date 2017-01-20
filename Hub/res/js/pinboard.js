(function(dynCore, hashNav) {
    dynCore.css('pinboard', 'res/css/pinboard.css');

    dynCore.when(dynCore.html('pinboard'),
        dynCore.require([
            'hashNav.js',
            'centralAuth.js',
            'ajaxLoader.js',
            'ajaxError.js',
            'twoButtonDialog.js',
            'localUUID.js',
            'arrayMove.js',
            'isInt.js'
        ], '../shared/js/'),
        dynCore.require([
            'https://cdn.jsdelivr.net/clamp.js/0.5.1/clamp.min.js',
            'res/js/Sortable.js'
        ])
    ).done(function(modules) {
        hashNav.appInit(init(modules));
    });

    function isEmpty(obj) {
        for(var key in obj) {
            if(obj.hasOwnProperty(key))
                return false;
        }
        return true;
    }

    function init(modules) {
        var pinboard = {
            title: 'pinboard',
            favicon: null,
            lists: {},
            boards: {},
            
            signIn: {
                load: function(info) {
                    $('#pinboard-load .notSignedIn').hide();
                    $('#pinboard-load .yourBoards').show();
                    if (window.location.hash.includes('pinboard-load')) {
                        pinboard.refresh.privateBoards();
                    }
                }
            },

            signOut: {
                load: function() {
                    $('#pinboard-load .yourBoards').hide();
                    $('#pinboard-load .notSignedIn').show();
                }
            },

            userIsOwner: function() {
                try {
                    if (pinboard.boards[pinboard.nav.currentView.id].UserId ===
                        modules.centralAuth.google.info.id) {

                        return true;
                    }
                } catch (e) {}
                return false;
            },

            makeSortable: function() {
                Sortable.create($('#app-pinboard .pinboard').get(0), {
                    draggable: '.pinboardTile',
                    //draggable: '.pinboardTile:not(.activeTile):not(.inactiveTile)',
                    onEnd: function(e) {
                        if (e.oldIndex !== e.newIndex) {
                            pinboard.saveCurrent();
                        }
                    }
                });
            },

            saveCurrent: function() {
                pinboard.api.save(pinboard.serializeCurrent());
            },

            serializeCurrent: function() {
                var pins = [];
                $('#app-pinboard .pinboardTile').each(function(i, pin) {
                    var $pin = $(pin);
                    var $background = $pin.find('.background');
                    var background = 'background-image:' + $background.css('background-image') +';' +
                        'background-color:' + $background.css('background-color') +';';

                    var content = pinboard.serializePin($background.find('.content').children());

                    pins.push({
                        background: background,
                        title: $pin.find('.title').text(),
                        description: $pin.find('.description').text(),
                        content: content
                    });
                });

                return {
                    id: pinboard.nav.currentView.id,
                    pins: pins,
                    label: $('#app-pinboard .pinboardTitle').text()
                }
            },

            serializePin: function(children) {
                var content = [];
                children.each(function(i, content) {
                    var $content = $(content);
                    var element = $content.find('.innerContent').get(0);
                    
                    var contentType = $content.attr('class');
                    var contentArgs = {};
                    contentArgs[contentType] = {};

                    if (element.innerHTML) {
                        contentArgs.text = element.innerHTML;
                    }
                    for (var i = 0; i < element.attributes.length; i++) {
                        var attr = element.attributes[i];
                        if (attr.specified == true) {
                            contentArgs[attr.name] = attr.value;
                        }
                    }

                    content.push({
                        contentType: $content.attr('class'),
                        contentArgs: contentArgs
                    });
                });
                return content;
            },

            deserialize: function(json) {
                var contents = JSON.parse(json);
                if (!contents) {
                    return null;
                }

                if (!Array.isArray(contents) &&
                    !isEmpty(contents)) {
                    contents = [contents];
                }

                if (contents.length) {
                    return contents.map(function(pin) {
                        return {
                            '.background': {
                                style: pin.background
                            },
                            '.title': {
                                text: pin.title
                            },
                            '.description': {
                                text: pin.description
                            },
                            content: pin.content
                        };
                    });
                }
            },

            makeBoard: function(tileArgs) {
                if (tileArgs) {
                    var $board = $('#pinboard-view .pinboard');

                    var pinContent = [];
                    for (var i = 0; i < tileArgs.length; i++) {
                        pinContent.push(tileArgs[i].content)
                        delete tileArgs[i].content;
                    }

                    var $pins = dynCore.makeFragment('pinboard.tile', tileArgs).appendTo($board);
                    console.log($pins, pinContent);
                    // if (content) {
                    //         var $content = $tile.find('.content');
                    //         for (var i = 0; i < content.length; i++) {
                    //             $content.append(dynCore.makeFragment('pinboard.pinContent', content[i].contentArgs).children(content[i].contentType));
                    //         }
                    //     }

                    $('#app-pinboard .pinboardTile').on('click', function() {
                        if (!$(this).hasClass('activeTile')) {
                            var pin = $(this).data('pin') || 
                                $('#app-pinboard .pinboardTile').index($(this));

                            window.location.href = '#pinboard-view/' +
                                pinboard.nav.currentView.id + '/' + pin;
                        }
                    }).find('p').each(function(i, element) {
                        $clamp(element, { clamp: 3 });
                    });
                }
            },

            selectPin: function(pin) {
                pinboard.nav.currentView.pin = pin;
                if (modules.isInt(pin)) {
                    pinboard.makePinActive($('.pinboard .pinboardTile').get(pin));
                } else {
                    pinboard.makePinActive($('.pinboard').find('.pinboardTile[data-pin="' + pin + '"]').first());
                }
            },

            makePinActive: function(element) {
                $('#app-pinboard .pinboardTile').removeClass('activeTile').removeClass('inactiveTile');

                if ($(element).length) {
                    $(element).addClass('activeTile');
                    $('#app-pinboard .pinboardTile:not(.activeTile)').addClass('inactiveTile');
                
                    $('#app-pinboard .contextBar .boardActions').hide();
                    if (pinboard.userIsOwner()) {
                        $('#app-pinboard .top-bar .pinActions').show();
                    }
                } else {
                    window.location.href = '#pinboard-view/' + pinboard.nav.currentView.id;

                    $('#app-pinboard .top-bar .pinActions').hide();
                    if (pinboard.userIsOwner()) {
                        $('#app-pinboard .contextBar .boardActions').show();
                    }
                }
            },

            api: {
                save: function(board, label) {
                    return $.ajax({
                        url: '/nosql',
                        method: 'POST',
                        data: {
                            id: board.id,
                            json: JSON.stringify(board.pins)
                        },
                        headers: Object.assign({
                            label: board.label,
                            meta: 'pinboard'
                        }, modules.centralAuth.google.baseHeaders())
                    }).done(function(id) {
                        board.Id = id;
                    });
                },

                singleBoard: function(id) {
                    return $.ajax({
                        url: '/nosql/' + id,
                        method: 'GET',
                        headers: Object.assign({
                            meta: 'pinboard'
                        }, modules.centralAuth.google.baseHeaders())
                    });
                },

                privateBoards: function() {
                    return $.ajax({
                        url: '/nosql',
                        method: 'GET',
                        headers: Object.assign({
                            meta: 'pinboard'
                        }, modules.centralAuth.google.baseHeaders())
                    });
                },

                publicBoards: function() {
                    return $.ajax({
                        url: '/nosql',
                        method: 'GET',
                        headers: Object.assign({
                            meta: 'pinboard',
                            public: true
                        }, modules.centralAuth.google.baseHeaders())
                    });
                }
            },

            refresh: {
                view: function(id, pin) {
                    if (!modules.centralAuth.google.info) {
                        var fn = function(info) {
                            modules.centralAuth.google.off('signIn', fn);
                            pinboard.refresh.view(id, pin);
                        }
                        modules.centralAuth.google.on('signIn', fn);

                        return;
                    }
                    var $board = $('#pinboard-view .pinboard');

                    var tileTemplate = dynCore.loadTemplate('pinboard.tile', 'res/html/pinboardTile.html');
                    var contentTemplate = dynCore.loadTemplate('pinboard.pinContent', 'res/html/pinboardTileContent.html');

                    var fnRetry = function() {
                        modules.ajaxError($board, function() {
                            pinboard.refresh.view(id);
                        });
                    };

                    if (!id) {
                        var newBoard = modules.ajaxLoader(pinboard.api.save({ pins: {}, label: 'New Board' }), $board);
                        $('#app-pinboard .contextBar .boardActions').show();

                        $.when(newBoard, tileTemplate, contentTemplate).done(function(board) {
                            pinboard.boards[board[0]] = {
                                Id: board[0],
                                Label: 'New Board',
                                Text: '[]'
                            };
                            window.location.replace('#pinboard-view/' + board[0]);
                        }).fail(fnRetry);

                    } else if (pinboard.nav.currentView.id === id) {
                        pinboard.selectPin(pin);
                        $('#app-pinboard .pinboardTitle').show();
                    } else {
                        $board.empty();
                        pinboard.nav.currentView.id = id;

                        var board;
                        if (pinboard.boards[id]) {
                            board = $.Deferred().resolve([pinboard.boards[id]]).promise();
                        }
                        board = modules.ajaxLoader(pinboard.api.singleBoard(id), $board);

                        $.when(board, tileTemplate, contentTemplate).done(function(resp) {
                            var board = resp[0];
                            pinboard.boards[id] = board;

                            $('#app-pinboard .pinboardTitle').text(board.Label).show();

                            if (!board.Public) {
                                $('#app-pinboard .contextBar .boardActions').show();
                            }
                            
                            pinboard.makeBoard(pinboard.deserialize(board.Text));
                            pinboard.selectPin(pin);
                        }).fail(fnRetry);
                    }

                    pinboard.makeSortable();
                },

                privateBoards: function() {
                    delete pinboard.lists.private;

                    var $privateBoards = $('#pinboard-load .yourBoards');
                    $privateBoards.empty();

                    var boards = modules.ajaxLoader(pinboard.api.privateBoards(), $privateBoards);
                    var template = dynCore.loadTemplate('pinboard.boardListItem', 'res/html/pinboardBoardListItem.html');
                    
                    $.when(boards, template).done(function(boards) {
                        pinboard.lists.private = boards;
                    }).fail(function() {
                        modules.ajaxError($privateBoards, function() {
                            pinboard.refresh.privateBoards();
                        });
                    });
                }
            },

            nav: {
                currentView: {
                    id: null,
                    pin: null
                },
                view: function(id, pin) {
                    if (id === pinboard.nav.currentView.id &&
                        pin === pinboard.nav.currentView.pin) {
                        return;
                    }
                    pinboard.refresh.view(id, pin);
                },

                load: function(publicOrPrivate) {
                    if (!publicOrPrivate) {
                        window.location.replace('#pinboard-load/private');
                        return;
                    }

                    $('#pinboard-load .publicOrPrivate').val(publicOrPrivate);
                    $('#pinboard-load .public, #pinboard-load .private').addClass('show-for-medium');
                    $('#pinboard-load .' + publicOrPrivate).removeClass('show-for-medium');
                    $('#app-pinboard .contextBar .mainActions').show();

                    if (modules.centralAuth.google.info) {
                        pinboard.signIn.load(modules.centralAuth.google.info);
                    }
                }
            }
        };

        modules.centralAuth.google.on('signIn', function(info) {
            for (let e in pinboard.signIn) {
                pinboard.signIn[e](info);
            }
        });

        modules.centralAuth.google.on('signOut', function() {
            for (let e in pinboard.signOut) {
                pinboard.signOut[e]();
            }
        });

        $('#pinboard-load .publicOrPrivate').on('change', function() {
            window.location.hash = '#pinboard-load/' + $(this).val();
        });

        $('#app-pinboard .pinboardTitle').on('click', function() {
            if (pinboard.userIsOwner()) {
                var $self = $(this);
                var oldText = $self.text();

                var $input = $('<input/>', {
                    value: oldText
                }).on('blur', function() {
                    var text = $(this).val();
                    $(this).remove();
                    $self.text(text).show();
                    if (text !== oldText) {
                        pinboard.saveCurrent();
                    }
                });

                $self.hide().after($input);
                $input.select();
            }
        });

        $('#app-pinboard .pinActions .pinboardClosePin').on('click', function() {
            window.location.href = '#pinboard-view/' + pinboard.nav.currentView.id;
        });

        $('#app-pinboard .pinActions .pinboardOptions').on('click', function() {
            var $settings = $('#pinboard-view-settings');
            var $active = $('#app-pinboard .activeTile');

            $settings.find('.tileTitleSetting').val($active.find('.title').text());
            $settings.find('.tileDescSetting').val($active.find('.description').text());

            var $background = $active.children('.background');
            var imageCss = $background.css('background-image');
            if (imageCss) {
                imageCss = imageCss.substring(imageCss.indexOf('(') + 1, imageCss.lastIndexOf(')'));
                if (imageCss[0] === '"') {
                    imageCss = imageCss.substring(1);
                }
                if (imageCss[imageCss.length - 1]) {
                    imageCss = imageCss.substring(0, imageCss.length - 1);
                }
            }

            if (imageCss) {
                $settings.find('.tileImageSetting').val(imageCss);
            } else {
                $settings.find('.tileImageSetting').val('');
            }

            $settings.find('.tileColorSetting').val($background.css('background-color'));

            $settings.foundation('open');
        });

        $('#pinboard-view-settings .saveTileSettings').on('click', function() {
            var $settings = $('#pinboard-view-settings');
            var $active = $('#app-pinboard .activeTile');

            var dirty = false;

            var $oldTitle = $active.find('.title');
            var $newTitle = $settings.find('.tileTitleSetting');
            if ($oldTitle.text() !== $newTitle.val()) {
                $oldTitle.text($newTitle.val());
                dirty = true;
            }

            var $oldDesc = $active.find('.description');
            var $newDesc = $settings.find('.tileDescSetting');
            if ($oldDesc.text() !== $newDesc.val()) {
                $oldDesc.text($newDesc.val());
                dirty = true;
            }

            var $background = $active.children('.background');

            var newImage = $settings.find('.tileImageSetting').val();
            newImage = 'url("' + newImage + '")';
            if ($background.css('background-image') !== newImage) {
                $background.css('background-image', newImage);
                dirty = true;
            }

            var newColor = $settings.find('.tileColorSetting').val();
            if ($background.css('background-color') !== newColor) {
                $background.css('background-color', newColor);
                dirty = true;
            }

            if (dirty) {
                pinboard.saveCurrent();
            }
        });

        hashNav.bindNavApp(function(app, section, args) {
            if (app === 'pinboard') {
                if (!section) {
                    window.location.replace('#pinboard-load/private');
                }
            }
        });

        hashNav.bindNavSection(function(app, section, args) {
            if (app === 'pinboard') {
                $('#app-pinboard .pinboardTitle').hide();
                $('#app-pinboard .contextBar .button-group').hide();
                if (pinboard.nav[section]) {
                    pinboard.nav[section].apply(this, args);
                }
            }
        });

        return pinboard;
    }
})(window.dynCore, window.hashNav);