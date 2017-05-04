(function(dynCore, hashNav) {
    dynCore.css('pinboard', '/hub/res/css/pinboard.css');

    dynCore.when(dynCore.html('pinboard'),
        dynCore.loadTemplate('ajaxLoader', '/shared/html/ajaxLoader.html'),
        dynCore.require([
            'hashNav.js',
            'centralAuth.js',
            'ajaxLoader.js',
            'ajaxError.js',
            'twoButtonDialog.js',
            'localUUID.js',
            'isMobile.js',
            'isInt.js'
        ], '/shared/js/'),
        dynCore.require([
            'https://cdn.jsdelivr.net/clamp.js/0.5.1/clamp.min.js',
            '/hub/res/js/Sortable.js'
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
            editPinDirty: false,
            
            signIn: {
                view: function(info) {
                    if ($('#app-pinboard .contextBar .boardActions').is(':visible')) {
                        pinboard.showBoardActions();
                    }
                    if ($('#app-pinboard .activeTile').length) {
                        $('#app-pinboard .contextBar .pinActions').show();
                    }
                    if (pinboard.userIsOwner()) {
                        if (pinboard.boardSortable) {
                            pinboard.boardSortable.option('disabled', false);
                        } else {
                            pinboard.makeSortable();
                        }
                    }
                },
                load: function(info) {
                    $('#pinboard-load .notSignedIn').hide();
                    $('#pinboard-load .signedIn').show().find('span').text(info.id);
                    $('#pinboard-load .yourBoards').show();

                    if ($('#pinboard-load').is(':visible')) {
                        $('#app-pinboard .top-bar-right .mainActions').show();
                    }
                    if (window.location.hash.includes('pinboard-load')) {
                        pinboard.refresh.privateBoards();
                    }
                }
            },

            signOut: {
                view: function(info) {
                    if ($('#app-pinboard .contextBar .boardActions').is(':visible')) {
                        pinboard.showBoardActions();
                    }
                    if (pinboard.boardSortable) {
                        pinboard.boardSortable.option('disabled', true);
                    }
                },
                load: function() {
                    $('#pinboard-load .yourBoards').hide();
                    $('#pinboard-load .signedIn').hide();
                    $('#pinboard-load .notSignedIn').show();
                    $('#app-pinboard .top-bar-right .mainActions').hide();
                }
            },

            userIsOwner: function() {
                try {
                    if (modules.centralAuth.google.info.id &&
                        pinboard.boards[pinboard.nav.currentView.id].UserId ===
                        modules.centralAuth.google.info.id) {

                        return true;
                    }
                } catch (e) {}
                return false;
            },

            onPinClick: function() {
                if (!$(this).hasClass('activeTile')) {
                    var pin = $(this).data('pin') || 
                        $('#app-pinboard .pinboardTile').index($(this));

                    window.location.href = '#pinboard-view/' +
                        pinboard.nav.currentView.id + '/' + pin;
                }
            },

            boardSortable: null,
            makeSortable: function() {
                if (modules.isMobile()) {
                    return;
                }
                pinboard.boardSortable = Sortable.create($('#app-pinboard .pinboard').get(0), {
                    draggable: '.pinboardTile',
                    onEnd: function(e) {
                        if (e.oldIndex !== e.newIndex) {
                            pinboard.saveCurrent();
                        }
                    }
                });
            },

            pinSortable: null,
            makePinSortable: function() {
                if ($('#app-pinboard .activeTile .content').get(0)) {
                    pinboard.pinSortable = Sortable.create($('#app-pinboard .activeTile .content').get(0), {
                        draggable: '.contentItem',
                        onEnd: function(e) {
                            if (e.oldIndex !== e.newIndex) {
                                pinboard.saveCurrent();
                            }
                        }
                    });
                }
            },

            exitEditMode: function() {
                $('#app-pinboard .pinActions .pinboardEditMode').prop('title', 'Enable Edit Mode').removeClass('success')
                    .children('span').text('Enable Edit Mode');
                $('#app-pinboard .pinboardTile .innerContent').off('click').removeClass('editMode');
                if (pinboard.pinSortable) {
                    pinboard.pinSortable.option('disabled', true);
                }
            },

            exitDeleteMode: function() {
                $('#app-pinboard .contextBar .alert').prop('title', 'Enable Delete Mode').removeClass('alert')
                    .children('span').text('Enable Delete Mode');
                $('#app-pinboard .deletable').off('click').removeClass('deletable');
            },

            makeDeletable: function($items, fnGetTitle, fnOnConfirm) {
                var $self = $(this).toggleClass('alert');
                $items.toggleClass('deletable');

                if ($self.hasClass('alert')) {
                    $self.prop('title', 'Disable Delete Mode')
                        .children('span').text('Disable Delete Mode');
                    $items.on('click', function(e) {
                        e.preventDefault();
                        var $clickedItem = $(this);
                        var title = fnGetTitle($clickedItem);
                        var promise = modules.twoButtonDialog('Really delete ' + title + '?',
                            'This cannot be undone.', 'Delete', 'Cancel', true);

                        promise.done(function() {
                            fnOnConfirm($clickedItem);
                        });
                    });
                } else {
                    $self.prop('title', 'Enable Delete Mode')
                        .children('span').text('Enable Delete Mode');
                    $items.off('click');
                }
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
                    var pinId = $pin.data('pin');
                    var content = pinboard.serializePin($background.find('.content').children('.contentItem'));

                    pins.push({
                        id: pinId,
                        background: background,
                        title: $pin.find('.title').text(),
                        description: $pin.find('.description').text(),
                        content: content
                    });
                });

                var boardImage = '';
                var customCSS = $('link[rel=stylesheet][data-app=pinboard-custom]').prop('href') || '';
                return {
                    id: pinboard.nav.currentView.id,
                    pins: pins,
                    label: [
                        $('#app-pinboard .pinboardTitle').text().split('|').join('&pipe;'),
                        boardImage.split('|').join('&pipe;'),
                        customCSS.split('|').join('&pipe;')
                    ].join('|')
                }
            },

            serializePin: function(children) {
                var content = [];
                children.each(function(i, item) {
                    var $item = $(item);
                    var element = $item.find('.innerContent').get(0);
                    
                    var classes = $item.attr('class').split(' ');
                    for (var i = 0; i < classes.length; i++) {
                        if (!classes[i].startsWith('content')) {
                            classes.splice(i, 1);
                            i--;
                        }
                    }
                    var contentType = classes.join(' ');

                    var contentArgs = {
                        '.innerContent': {}
                    };

                    if (element.innerHTML) {
                        contentArgs['.innerContent'].text = pinboard.serializeTags(element.innerHTML);
                    }
                    for (var i = 0; i < element.attributes.length; i++) {
                        var attr = element.attributes[i];
                        if (attr.specified == true && attr.name !== 'class') {
                            contentArgs['.innerContent'][attr.name] = attr.value;
                        }
                    }

                    content.push({
                        contentType: contentType,
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
                            '': {
                                'data-pin': pin.id
                            },
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

            setCustomCSS: function(url) {
                $('link[rel=stylesheet][data-app=pinboard-custom]').remove();
                if (url) {
                    dynCore.css('pinboard-custom', url);
                }
            },

            newPinId: function() {
                return modules.uuid().split('-')[0];
            },

            makeBoard: function(tileArgs) {
                if (tileArgs) {
                    var $board = $('#pinboard-view .pinboard');

                    var pinContent = [];
                    for (var i = 0; i < tileArgs.length; i++) {
                        pinContent.push(tileArgs[i].content)
                        delete tileArgs[i].content;
                        tileArgs[i][''] = tileArgs[i][''] || {};
                        tileArgs[i]['']['data-pin'] =
                            tileArgs[i]['']['data-pin'] || pinboard.newPinId();
                    }

                    var $pins = dynCore.makeFragment('pinboard.tile', tileArgs).appendTo($board);
                    
                    for (var i = 0; i < $pins.length; i++) {
                        if (pinContent[i] && pinContent[i].length) {
                            var $content = $($pins[i]).find('.content');
                            pinboard.makePinContent(null, $content, pinContent[i]);
                        }
                    }
                    
                    $('#app-pinboard .pinboardTile').on('click', pinboard.onPinClick)
                        .find('.description').each(function(i, element) {
                        
                        $clamp(element, { clamp: 3 });
                    });

                    if (pinboard.userIsOwner()) {
                        pinboard.makeSortable();
                    }
                }
            },

            selectPin: function(pin) {
                pinboard.nav.currentView.pin = pin;
                var $dataMatch = $('.pinboard').find('.pinboardTile[data-pin="' + pin + '"]').first();
                if ($dataMatch.length) {
                    pinboard.makePinActive($dataMatch);
                    return;
                }

                var $pins = $('.pinboard .pinboardTile');
                if (modules.isInt(pin) && pin < $pins.length) {
                    pinboard.makePinActive($pins.get(pin));
                } else {
                    pinboard.makePinActive();
                }
            },

            makePinActive: function(element) {
                $('#app-pinboard .pinboardTile').removeClass('activeTile').removeClass('inactiveTile');
                pinboard.exitDeleteMode();
                pinboard.exitEditMode();

                if ($(element).length) {
                    $(element).addClass('activeTile');
                    $('#app-pinboard .pinboardTile:not(.activeTile)').addClass('inactiveTile');
                
                    $('#app-pinboard .contextBar .boardActions').hide();
                    var $pinActions = $('#app-pinboard .top-bar .pinActions').show();
                    if (pinboard.userIsOwner()) {
                        $pinActions.children().show();
                        if (pinboard.boardSortable) {
                            pinboard.boardSortable.option('disabled', true);
                        }
                    } else {
                        $pinActions.children().hide();
                        $pinActions.children('.pinboardClosePin').show();
                    }
                } else {
                    window.location.href = '#pinboard-view/' + pinboard.nav.currentView.id;
                    pinboard.showBoardActions();
                }
            },

            showBoardActions: function() {
                $('#app-pinboard .contextBar .button-group').hide();
                var $boardActions = $('#app-pinboard .contextBar .boardActions');
                if (pinboard.userIsOwner()) {
                    $boardActions.children().show();
                    if (pinboard.boardSortable) {
                        pinboard.boardSortable.option('disabled', false);
                    }
                } else {
                    $boardActions.children().hide();
                    $boardActions.children('a[href="#pinboard-load"],' +
                        '.pinboardSearch, #pinboardSearchDropdown').show();
                }
                $boardActions.show();
            },

            saveStatus: {
                saved: function() {
                    var $indicators = $('#app-pinboard .contextBar .saveIndicator');
                    $indicators.off('click').removeClass('alert').removeClass('primary')
                        .addClass('disabled').addClass('success').prop('title', 'Board Saved');
                    $indicators.children('i').removeClass('fa-floppy-o').removeClass('fa-refresh')
                        .removeClass('fa-spin').addClass('fa-check-circle');
                    $indicators.children('span').text('Board Saved');
                },

                saving: function() {
                    var $indicators = $('#app-pinboard .contextBar .saveIndicator');
                    $indicators.off('click').removeClass('success').removeClass('alert')
                        .addClass('disabled').addClass('primary').prop('title', 'Saving...');
                    $indicators.children('i').removeClass('fa-check-circle').removeClass('fa-floppy-o')
                        .addClass('fa-spin').addClass('fa-refresh');
                    $indicators.children('span').text('Saving...');
                },

                error: function() {
                    var $indicators = $('#app-pinboard .contextBar .saveIndicator');
                    $indicators.removeClass('success').removeClass('primary')
                        .removeClass('disabled').addClass('alert').prop('title', 'Save Failed, Click to Retry');
                    $indicators.children('i').removeClass('fa-check-circle').removeClass('fa-refresh')
                        .removeClass('fa-spin').addClass('fa-floppy-o');
                    $indicators.children('span').text('Save Failed, Click to Retry');
                    $indicators.off('click').on('click', function() {
                        $(this).off('click');
                        pinboard.saveCurrent();
                    });
                }
            },

            api: {
                save: function(board, label) {
                    pinboard.saveStatus.saving();
                    return $.ajax({
                        url: 'http://isaac-west.ca/nosql',
                        method: 'POST',
                        data: {
                            id: board.id,
                            json: JSON.stringify(board.pins)
                        },
                        headers: Object.assign({
                            label: board.label,
                            public: $('#pinboard-view-options .boardPublicSetting').prop('checked'),
                            meta: 'pinboard'
                        }, modules.centralAuth.google.baseHeaders())
                    }).done(function(id) {
                        console.info('Saved board ' + id + '.');
                        pinboard.saveStatus.saved();
                        board.Id = id;
                    }).fail(function() {
                        pinboard.saveStatus.error();
                    });
                },

                delete: function(id) {
                    return $.ajax({
                        url: 'http://isaac-west.ca/nosql/' + id,
                        method: 'DELETE',
                        headers: Object.assign({
                            meta: 'pinboard'
                        }, modules.centralAuth.google.baseHeaders())
                    }).done(function(id) {
                        console.info('Deleted board ' + id + '.');
                        delete pinboard.boards[id];
                        for (let list in pinboard.lists) {
                            for (var i = 0; i < pinboard.lists[list].length; i++) {
                                if (pinboard.lists[list][i].Id === id) {
                                    pinboard.lists[list].splice(i);
                                    i--;
                                }
                            }
                        }
                    })
                },

                singleBoard: function(id) {
                    return $.ajax({
                        url: 'http://isaac-west.ca/nosql/' + id,
                        method: 'GET',
                        headers: Object.assign({
                            meta: 'pinboard'
                        }, modules.centralAuth.google.baseHeaders())
                    });
                },

                privateBoards: function() {
                    return $.ajax({
                        url: 'http://isaac-west.ca/nosql',
                        method: 'GET',
                        headers: Object.assign({
                            meta: 'pinboard'
                        }, modules.centralAuth.google.baseHeaders())
                    });
                },

                publicBoards: function(userId) {
                    return $.ajax({
                        url: 'http://isaac-west.ca/nosql',
                        method: 'GET',
                        headers: Object.assign({
                            meta: 'pinboard',
                            public: true,
                            userId: userId
                        }, modules.centralAuth.google.baseHeaders())
                    });
                }
            },

            refresh: {
                view: function(id, pin) {
                    var $board = $('#pinboard-view .pinboard');

                    var tileTemplate = dynCore.loadTemplate('pinboard.tile', '/hub/res/html/pinboardTile.html');
                    var contentTemplate = dynCore.loadTemplate('pinboard.pinContent', '/hub/res/html/pinboardTileContent.html');

                    var fnRetry = function() {
                        modules.ajaxError($board, function() {
                            pinboard.refresh.view(id, pin);
                        });
                    };

                    if (!id) {
                        var newBoard = modules.ajaxLoader(pinboard.api.save({ pins: [
                            {
                                background: 'background-color: #888;',
                                title: 'New Pin',
                                description: 'Click to get started.'
                            }
                        ], label: 'New Board' }), $board);

                        $.when(newBoard, tileTemplate, contentTemplate).done(function(board) {
                            window.location.replace('#pinboard-view/' + board[0]);
                        }).fail(fnRetry);

                    } else if (pinboard.nav.currentView.id === id) {
                        pinboard.selectPin(pin);
                        $('#app-pinboard .pinboardTitle').show();

                    } else {
                        $board.empty();

                        var board;
                        if (pinboard.boards[id]) {
                            board = $.Deferred().resolve([pinboard.boards[id]]).promise();
                        }
                        board = modules.ajaxLoader(pinboard.api.singleBoard(id), $board);

                        var fnWaitForAuth = function() {
                            var fn = function(info) {
                                modules.centralAuth.google.off('signIn', fn);
                                pinboard.refresh.view(id, pin);
                            }
                            modules.centralAuth.google.on('signIn', fn);
                        }

                        board.fail(function() {
                            if (!modules.centralAuth.google.info) {
                                fnWaitForAuth();
                                return;
                            }
                        });

                        $.when(board, tileTemplate, contentTemplate).done(function(resp) {
                            var board = resp[0];
                            if (!modules.centralAuth.google.info && !board.Public) {
                                fnWaitForAuth();
                                return;
                            }
                        
                            pinboard.nav.currentView.id = id;
                            pinboard.boards[id] = board;

                            $('#pinboard-view-options .boardPublicSetting').prop('checked', board.Public);
                            var boardSettings = board.Label.split('|');
                            $('#app-pinboard .pinboardTitle').text(boardSettings[0].split('&pipe;').join('|')).show();

                            pinboard.setCustomCSS(boardSettings[2]);
                            // label: [
                            //     $('#app-pinboard .pinboardTitle').text().split('|').join('&pipe;'),
                            //     $('#pinboard-view-options .boardImageSetting').val().split('|').join('&pipe;'),
                            //     $('#pinboard-view-options .boardCSSSetting').val().split('|').join('&pipe;')
                            // ].join('|')

                            pinboard.showBoardActions();
                            pinboard.makeBoard(pinboard.deserialize(board.Text));
                            pinboard.selectPin(pin);
                        }).fail(fnRetry);
                    }
                },

                privateBoards: function() {
                    delete pinboard.lists.private;

                    var $privateBoards = $('#pinboard-load .yourBoards');
                    $privateBoards.empty();

                    var boards = modules.ajaxLoader(pinboard.api.privateBoards(), $privateBoards);
                    var template = dynCore.loadTemplate('pinboard.boardListItem', '/hub/res/html/pinboardBoardListItem.html');
                    
                    $.when(boards, template).done(function(boards) {
                        pinboard.lists.private = boards[0];
                        var listArgs = pinboard.lists.private.map(function(board) {
                            return {
                                a: {
                                    href: '#pinboard-view/' + board.Id
                                },
                                h5: {
                                    text: board.Label.split('|')[0].split('&pipe;').join('|')
                                },
                                i: {
                                    class: board.Public ? '' : 'fa fa-lock'
                                }
                            }
                        });
                        $privateBoards.append(dynCore.makeFragment('pinboard.boardListItem', listArgs));
                    }).fail(function() {
                        modules.ajaxError($privateBoards, function() {
                            pinboard.refresh.privateBoards();
                        });
                    });
                },

                publicBoards: function(userId) {
                    delete pinboard.lists.public;
                    var $publicBoards = $('#pinboard-load .publicBoards');
                    $publicBoards.empty();

                    var boards = modules.ajaxLoader(pinboard.api.publicBoards(userId), $publicBoards);
                    var template = dynCore.loadTemplate('pinboard.boardListItem', '/hub/res/html/pinboardBoardListItem.html');
                    
                    $.when(boards, template).done(function(boards) {
                        pinboard.lists.public = boards[0];
                        var listArgs = pinboard.lists.public.map(function(board) {
                            return {
                                a: {
                                    href: '#pinboard-view/' + board.Id
                                },
                                h5: {
                                    text: board.Label.split('|')[0].split('&pipe;').join('|')
                                },
                                i: {
                                    class: board.Public ? '' : 'fa fa-lock'
                                }
                            }
                        });
                        $publicBoards.append(dynCore.makeFragment('pinboard.boardListItem', listArgs));
                    }).fail(function() {
                        modules.ajaxError($publicBoards, function() {
                            pinboard.refresh.publicBoards();
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

                        $('#app-pinboard .pinboardTitle').show();
                        if (id) {
                            if (typeof(pin) !== 'undefined') {
                                if (pinboard.userIsOwner) {
                                    $('#app-pinboard .top-bar .pinActions').show();
                                }
                            } else {
                                pinboard.showBoardActions();
                            }
                        }
                        return;
                    }

                    pinboard.refresh.view(id, pin);
                },

                load: function(publicOrPrivate, userId) {
                    if (!publicOrPrivate) {
                        window.location.replace('#pinboard-load/private');
                        return;
                    }

                    $('#pinboard-load .publicOrPrivate').val(publicOrPrivate);
                    $('#pinboard-load .public, #pinboard-load .private').addClass('show-for-medium');
                    $('#pinboard-load .' + publicOrPrivate).removeClass('show-for-medium');
                    $('#app-pinboard .contextBar .mainActions').show();

                    $('#app-pinboard .mainActions .pinboardDelete')
                        .prop('title', 'Enable Delete Mode').removeClass('alert')
                        .children('span').text('Enable Delete Mode');
                    $('#pinboard-load .yourBoards a').off('click');

                    if (modules.centralAuth.google.info) {
                        pinboard.signIn.load(modules.centralAuth.google.info);
                    } else {
                        $('#app-pinboard .top-bar-right .mainActions').hide();
                    }

                    if (publicOrPrivate === 'public' && userId) {
                        $('#pinboard-load .publicBoardUser .publicBoardUserId').val(userId);
                        pinboard.refresh.publicBoards(userId);
                    }
                }
            },

            serializeTags: function(html) {
                html = pinboard.serializeBold(html);
                html = pinboard.serializeStrike(html);
                html = pinboard.serializeTable(html);
                html = pinboard.serializeBreak(html);
                html = pinboard.serializeLink(html);

                return html;
            },

            parseTags: function($element) {
                $element = pinboard.parseBold($element);
                $element = pinboard.parseStrike($element);
                $element = pinboard.parseTable($element);
                $element = pinboard.parseBreak($element);
                $element = pinboard.parseLink($element);
                $element.html($element.html().split('&amp;').join('&'));
                
                return $element;
            },

            serializeBold: function(html) {
                return html.split('<strong>').join('*').split('</strong>').join('*');
            },

            parseBold: function($element) {
                while ($element.html() && $element.html().includes('*')) {
                    $element.html($element.html().replace('*', '<strong>'));
                    $element.html($element.html().replace('*', '</strong>'));
                }
                return $element;
            },

            serializeStrike: function(html) {
                return html.split('<span class="strikethrough">').join('{{').split('</span>').join('}}');
            },

            parseStrike: function($element) {
                if ($element.html()) {
                    $element.html($element.html().split('{{').join('<span class="strikethrough">'));
                    $element.html($element.html().split('}}').join('</span>'));
                }
                return $element;
            },

            serializeLink: function(html) {
                while (html.includes('<a')) {
                    var parts = [];

                    var left = html.indexOf('<a href="');
                    parts.push(html.substring(0, left) + '[[');

                    var hrefStart = left + 9;
                    var hrefEnd = html.substring(hrefStart).indexOf('"') + hrefStart;
                    var href = html.substring(hrefStart, hrefEnd);
                    parts.push(href);

                    var right = html.substring(left).indexOf('>') + left + 1;

                    var end = html.indexOf('</a>');
                    var text = html.substring(right, end);
                    if (text !== href) {
                        parts.push('|' + text);
                    }

                    parts.push(']]');
                    var after = html.substring(end + 4);
                    html = parts.join('') + after;
                }
                return html;
            },

            parseLink: function($element) {
                while ($element.html() && $element.html().includes('[[') && $element.html().includes(']]')) {
                    var left = $element.html().indexOf('[[') + 2;
                    var right = $element.html().substring(left).indexOf(']]');
                    var href = $element.html().substr(left, right);
                    var text;
                    if (href.includes('|')) {
                        var parts = href.split('|');
                        href = parts[0];
                        text = parts[1];
                    } else {
                        text = href;
                    }
                    $element.html($element.html().substring(0, left) + text + $element.html().substring(left + right));
                    $element.html($element.html().replace('[[', '<a href="' + href + '">'));
                    $element.html($element.html().replace(']]', '</a>'));
                }
                return $element;
            },

            serializeBreak: function(html) {
                html = html.split('<br>').join('\n');
                return html;
            },

            parseBreak: function($element) {
                if ($element.html()) {
                    $element.html($element.html().split('\n').join('<br>'));
                }
                return $element;
            },

            serializeTable: function(html) {
                html = html.split('<div class="row">').join('~--\n');
                html = html.split('<div class="row text-right">').join('--~\n');
                html = html.split('<div class="small-3 columns">').join('~////');
                html = html.split('<div class="small-4 columns">').join('~///');
                html = html.split('<div class="small-6 columns">').join('~//');
                html = html.split('</div>').join('//~');
                return html;
            },

            parseTable: function($element) {
                if ($element.html()) {
                    $element.html($element.html().split('~--\n').join('<div class="row">'));
                    $element.html($element.html().split('--~\n').join('<div class="row text-right">'));
                    $element.html($element.html().split('~////').join('<div class="small-3 columns">'));
                    $element.html($element.html().split('~///').join('<div class="small-4 columns">'));
                    $element.html($element.html().split('~//').join('<div class="small-6 columns">'));
                    $element.html($element.html().split('//~').join('</div>'));
                }
                return $element;
            },

            makePinContent: function(promise, $content, content) {
                promise = promise || $.Deferred();
                if (!Array.isArray(content)) {
                    content = [content];
                }

                var template = dynCore.loadTemplate('pinboard.pinContent', '/hub/res/html/pinboardTileContent.html');
                template.done(function() {
                    var $elements = [];
                    for (var i = 0; i < content.length; i++) {
                        var $element = dynCore.makeFragment('pinboard.pinContent', content[i].contentArgs)
                            .children('.' + content[i].contentType.replace(' ', '.')).first();
                        
                        pinboard.parseTags($element.find('.innerContent'));
                        $content.append($element);
                        $elements.push($element);
                    }
                    promise.resolve($elements);
                }).fail(function() {
                    promise.reject();
                });
                return promise;
            },

            newPinContent: {
                paragraph: function(promise, $activeTab) {
                    var $input = $activeTab.find('.contentValue');
                    var value = $input.val();
                    if (value) {
                        $content = $('#app-pinboard .activeTile .content');
                        pinboard.makePinContent(promise, $content, {
                            contentType: 'contentText',
                            contentArgs: {
                                '.innerContent': {
                                    text: value
                                }
                            }
                        }).done(function($elements) {
                            promise.resolve($elements);
                        }).fail(function() {
                            promise.reject();
                        });
                    } else {
                        promise.reject();
                    }
                    return promise;
                },

                image: function(promise, $activeTab) {
                    var $input = $activeTab.find('.contentValue');
                    var value = $input.val();
                    if (value) {
                        $content = $('#app-pinboard .activeTile .content');
                        pinboard.makePinContent(promise, $content, {
                            contentType: 'contentImg',
                            contentArgs: {
                                '.innerContent': {
                                    src: value
                                }
                            }
                        }).done(function($elements) {
                            promise.resolve($elements);
                        }).fail(function() {
                            promise.reject();
                        });
                    } else {
                        promise.reject();
                    }
                    return promise;
                },

                heading: function(promise, $activeTab) {
                    var $input = $activeTab.find('.contentValue');
                    var value = $input.val();
                    if (value) {
                        $content = $('#app-pinboard .activeTile .content');
                        pinboard.makePinContent(promise, $content, {
                            contentType: 'contentHeading',
                            contentArgs: {
                                '.innerContent': {
                                    text: value
                                }
                            }
                        }).done(function($elements) {
                            promise.resolve($elements);
                        }).fail(function() {
                            promise.reject();
                        });
                    } else {
                        promise.reject();
                    }
                    return promise;
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

        $('#pinboard-load .publicBoardUser .getPublicBoards').on('click', function() {
            window.location.hash = '#pinboard-load/public/' +
                $('#pinboard-load .publicBoardUser .publicBoardUserId').val();
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

        $('#app-pinboard .mainActions .pinboardDelete').on('click', function() {
            var $listItems = $('#pinboard-load .yourBoards a');
            pinboard.makeDeletable.call(this, $listItems, function($clickedItem) {
                return $clickedItem.find('h5').text();
            }, function($clickedItem) {
                var id = $clickedItem.prop('href').split('/');
                id = id[id.length - 1];
                if (id) {
                    pinboard.api.delete(id).done(function() {
                        $clickedItem.parent().remove();
                    });
                }
            });
        });

        $('#pinboard-view-settings .pinboardDeletePin').on('click', function() {
            var $active = $('#app-pinboard .activeTile');
            var $dialog = $('#pinboard-view-settings');
            var title = $dialog.find('.tileTitleSetting').val();

            $dialog.foundation('close');
            var promise = modules.twoButtonDialog('Really delete pin ' + title + '?',
                'This cannot be undone.', 'Delete', 'Cancel', true);

            promise.done(function() {
                $active.remove();
                window.location.href = '#pinboard-view/' + pinboard.nav.currentView.id;
                pinboard.saveCurrent();
            }).fail(function() {
                $('#pinboard-view-settings').foundation('open');
            });
        });

        $('#pinboard-view-settings .pinboardClonePin').on('click', function() {
            var $element = $('#app-pinboard .activeTile').clone().on('click', pinboard.onPinClick);
            var pinId = pinboard.newPinId();
            $element.attr('data-pin', pinId);
            var $board = $('#app-pinboard .pinboard');
            $board.append($element);
            window.location.href = '#pinboard-view/' + pinboard.nav.currentView.id + '/' + pinId;
            pinboard.saveCurrent();
        });

        $('#app-pinboard .pinActions .pinboardDeleteContent').on('click', function() {
            pinboard.exitEditMode();

            var $pins = $('#pinboard-view .activeTile .contentItem > .row');
            pinboard.makeDeletable.call(this, $pins, function() {
                return 'content';
            }, function($clickedItem) {
                $clickedItem.parent().remove();
                pinboard.saveCurrent();
            });
        });

        $('#app-pinboard .boardActions .boardOptions').on('click', function() {
            var title = $('#app-pinboard .pinboardTitle').text();
            var image = '';
            var css = $('link[rel=stylesheet][data-app=pinboard-custom]').prop('href');
            
            $('#pinboard-view-options .boardTitleSetting').val(title);
            $('#pinboard-view-options .boardImageSetting').val(image);
            $('#pinboard-view-options .boardCSSSetting').val(css);

            $('#pinboard-view-options .boardPublicSetting').prop('checked', pinboard.boards[pinboard.nav.currentView.id].Public);
        });

        $('#pinboard-view-options .saveBoardSettings').on('click', function() {
            var dirty = false;

            var newTitle = $('#pinboard-view-options .boardTitleSetting').val();
            var oldTitle = $('#app-pinboard .pinboardTitle').text();
            if (newTitle !== oldTitle) {
                $('#app-pinboard .pinboardTitle').text(newTitle);
                dirty = true;
            }

            var oldCss = $('link[rel=stylesheet][data-app=pinboard-custom]').prop('href');
            var newCss = $('#pinboard-view-options .boardCSSSetting').val();
            if (newCss !== oldCss) {
                pinboard.setCustomCSS(newCss);
                dirty = true;
            }

            var newPublic = $('#pinboard-view-options .boardPublicSetting').prop('checked');
            if (pinboard.boards[pinboard.nav.currentView.id].Public !== newPublic) {
                pinboard.boards[pinboard.nav.currentView.id].Public = newPublic;
                dirty = true;
            }

            if (dirty) {
                pinboard.saveCurrent();
            }
        });

        $('#app-pinboard .boardActions .pinboardSearchText').on('keyup', function() {
            var searchText = $(this).val().toLowerCase();
            if (searchText) {
                $('#app-pinboard .pinboardTile').each(function(i, tile) {
                    var $tile = $(tile);
                    if ($tile.find('.title').text().toLowerCase().includes(searchText) ||
                        $tile.find('.description').text().toLowerCase().includes(searchText)) {

                        $tile.show();
                    } else {
                        $tile.hide();
                    }
                });
            } else {
                $('#app-pinboard .pinboardTile').show();
            }
        });

        $('#app-pinboard .boardActions .pinboardAdd').on('click', function() {
            var pinId = pinboard.newPinId();
            var $element = dynCore.makeFragment('pinboard.tile', {
                '': {
                    'data-pin': pinId
                },
                '.background': {
                    style: 'background-color:#888;'
                }
            }).appendTo($('#pinboard-view .pinboard'));

            $element.on('click', pinboard.onPinClick);

            pinboard.saveCurrent();
        });

        $('#app-pinboard .pinActions .pinboardClosePin').on('click', function() {
            window.location.href = '#pinboard-view/' + pinboard.nav.currentView.id;
        });

        $('#app-pinboard .pinActions .pinOptions').on('click', function() {
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

        $('#app-pinboard .pinActions .pinboardNewContent').on('click', function() {
            pinboard.exitEditMode();
            pinboard.exitDeleteMode();
        });

        $('#pinboard-new-content .confirmPinContent').on('click', function() {
            var $activeTab = $('#pinboard-new-content .tabs-panel.is-active');
            var contentType = $activeTab.get(0).id.split('-')[3];
            var promise = $.Deferred();

            pinboard.newPinContent[contentType] && pinboard.newPinContent[contentType](promise, $activeTab);
            
            promise.done(function() {
                pinboard.saveCurrent();
                $('#pinboard-new-content').find('textarea, input').val('');
            });
        });

        $('#app-pinboard .pinActions .pinboardEditMode').on('click', function() {
            pinboard.exitDeleteMode();

            var $self = $(this);
            var $innerContents = $('#app-pinboard .activeTile .innerContent').toggleClass('editMode');
            $self.toggleClass('success');
            pinboard.editPinDirty = false;

            if ($self.hasClass('success')) {
                $self.prop('title', 'Disable Edit Mode')
                    .children('span').text('Disable Edit Mode');
                pinboard.makePinSortable();
                var $dialog = $('#pinboard-edit-content');
                $innerContents.on('click', function() {
                    var $clicked = $(this);
                    var value;
                    if ($clicked.prop('src')) {
                        value = $clicked.prop('src');
                    } else {
                        value = pinboard.serializeTags($clicked.html());
                    }
                    var $editValue = $dialog.find('.tileEditSetting');
                    $editValue.val(value);

                    $dialog.find('.confirmEditPinContent').off('click').on('click', function() {
                        var newValue = $editValue.val();
                        if ($clicked.prop('src')) {
                            $clicked.prop('src', newValue);
                        } else {
                            $clicked.text(newValue);
                            pinboard.parseTags($clicked);
                        }
                        if (newValue !== value) {
                            pinboard.saveCurrent();
                        }
                    });

                    $dialog.foundation('open');
                });
            } else {
                $self.prop('title', 'Enable Edit Mode')
                    .children('span').text('Enable Edit Mode');
                $innerContents.off('click');
                if (pinboard.pinSortable) {
                    pinboard.pinSortable.option('disabled', true);
                }
            }
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
