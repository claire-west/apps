(function(dynCore, hashNav) {
    dynCore.css('dndRef', '/hub/res/css/dndRef.css');

    dynCore.when(dynCore.html('dndRef'),
        dynCore.loadTemplate('ajaxLoader', '/shared/html/ajaxLoader.html'),
        dynCore.require([
            'hashNav.js',
            'indexer.js',
            'ajaxLoader.js',
            'ajaxError.js',
        ], '/shared/js/')
    ).done(function(modules) {
        hashNav.appInit(init(modules));
    });

    function init(modules) {
        var dndRef = {
            title: 'dndRef',
            favicon: null,
            bestiary: null,
            spellbook: null,
            spellLevels: null,
            pages: {},
            resourcePages: {},
            directory: null,

            cr: [
                '0', '1/8', '1/4', '1/2', '1',
                '2', '3', '4', '5', '6', '7', '8', '9',
                '10', '11', '12', '13', '14', '15', '16',
                '17', '18', '19', '20', '21', '22', '23',
                '24', '25', '26', '27', '28', '29', '30'
            ],

            xp: {
                '0': 10, '1/8': 25, '1/4': 50, '1/2': 100,
                '1': 200, '2': 450, '3': 700, '4': 1100,
                '5': 1800, '6': 2300, '7': 2900, '8': 3900,
                '9': 5000, '10': 5900, '11': 7200, '12': 8400,
                '13': 10000, '14': 11500, '15': 13000,
                '16': 15000, '17': 18000, '18': 20000,
                '19': 22000, '20': 25000, '21': 33000,
                '22': 41000, '23': 50000, '24': 62000,
                '25': 75000, '26': 90000, '27': 105000,
                '28': 120000, '29': 135000, '30': 155000 
            },

            signInOut: function() {
                dndRef.spellbook = null;
                dndRef.spellLevels = null;
                dndRef.pages = {};
                dndRef.resourcePages = {};
                dndRef.directory = null;
                if ($('#app-dndRef').is(':visible') &&
                    !$('#dndRef-bestiary').is(':visible')) {
                    hashNav.rehash();
                }
            },

            getCRs: function() {
                var min = $('#dndRef-bestiary .minCR').val();
                var max = $('#dndRef-bestiary .maxCR').val();
                var result = [];
                for (var i = min; i <= max; i++) {
                    result.push(dndRef.cr[i]);
                }
                return result;
            },

            getCRSelectors: function() {
                var selectors = [];

                var crs = dndRef.getCRs();
                for (var i = 0; i < crs.length; i++) {
                    selectors.push('[data-cr="' + crs[i] + '"]');
                }

                return selectors;
            },

            getMonsterSelector: function() {
                var selectors = dndRef.getCRSelectors();

                var name = $('#dndRef-bestiary .monsterName').val();
                if (name) {
                    var nameSelector = '[data-monster*="' + name.toLocaleLowerCase() + '"]';
                    for (var i = 0; i < selectors.length; i++) {
                        selectors[i] = selectors[i] + nameSelector;
                    }
                }

                var species = $('#dndRef-bestiary .species').val();
                if (species && species !== 'all') {
                    var speciesSelector = '[data-species="' + species.toLocaleLowerCase() + '"]';
                    for (var i = 0; i < selectors.length; i++) {
                        selectors[i] = selectors[i] + speciesSelector;
                    }
                }

                for (var i = 0; i < selectors.length; i++) {
                    selectors[i] = '#dndRef-bestiary .monster' + selectors[i];
                }

                return selectors.join(', ');
            },

            getSpellSelector: function() {
                var selector = '#dndRef-spellbook .spell';

                var name = $('#dndRef-spellbook .spellName').val();
                if (name) {
                    var nameSelector = '[data-spell*="' + name.toLocaleLowerCase() + '"]';
                    selector += nameSelector;
                }

                var category = $('#dndRef-spellbook .spellCategory').val();
                if (category && category !== 'all') {
                    var categorySelector = '[data-classes*="' + category.toLocaleLowerCase() + '"]';
                    selector += categorySelector;
                }

                var level = $('#dndRef-spellbook .spellLevel').val();
                if (level && level !== 'any') {
                    var levelSelector = '[data-level="' + level.toLocaleLowerCase() + '"]';
                    selector += levelSelector;
                }

                return selector;
            },

            getDirectorySearchSelector: function() {
                var search = $('#app-dndRef .dndRefDirectorySearch').val();
                if (search.length > 1) {
                    return '[data-keywords*="' + search.toLocaleLowerCase() + '"]';
                }
                return '';
            },

            getModifier: function(score) {
                var mod = Math.floor((score - 10) / 2);
                if (mod > -1) {
                    mod = '+' + mod;
                }
                return mod;
            },

            getXP: function(cr) {
                return dndRef.xp[cr];
            },

            getSortedOptions: function(arr) {
                var items = [];
                if (!Array.isArray(arr)) {
                    for (var key in arr) {
                        items.push(key);
                    }
                } else {
                    items = arr;
                }

                items.sort();
                var $options = [];
                for (var i = 0; i < items.length; i++) {
                    $options.push($('<option/>', {
                        text: items[i],
                        value: items[i].toLocaleLowerCase()
                    }));
                }

                return $options;
            },

            getSearchTerms: function(ext) {
                var terms = [];

                for (var i = 0; i < ext.length; i++) {
                    var obj = JSON.parse(ext[i]);
                }
            },

            mergeSearchTerms: function(data, ext) {
                return data;
                // TODO - Finish this
                var extTerms = dndRef.getSearchTerms(ext);
            },

            filter: {
                directory: function() {
                    $('#dndRef-directory .directorySearchCategory').hide();
                    var selector = dndRef.getDirectorySearchSelector();
                    var $category = $('#dndRef-directory .directorySearchCategory' + selector).show();
                    $category.find('.directorySearchItem').hide();
                    $category.find('.directorySearchItem' + selector).show();
                },

                bestiary: function() {
                    $('#dndRef-bestiary .monster').hide();
                    $(dndRef.getMonsterSelector()).show();
                },

                spellbook: function() {
                    $('#dndRef-spellbook .spell').hide();
                    $(dndRef.getSpellSelector()).show();
                }
            },

            filterPaths: {
                name: 'name',
                cr: 'attributes.Challenge Rating'
            },

            api: {
                resources: function(metaSuffix, name) {
                    var meta = 'dnd';
                    if (metaSuffix) {
                        meta += '-' + metaSuffix;
                    }
                    if (name) {
                        meta += '-' + name;
                    }
                    return $.ajax({
                        url: 'http://isaac-west.ca/nosql/resources/' + meta,
                        headers: modules.centralAuth.google.baseHeaders()
                    });
                },

                bestiary: function() {
                    return $.ajax('/shared/json/dnd/bestiary.json');
                },

                spellbook: function() {
                    return $.ajax('/shared/json/dnd/spells.json');
                },

                elementalEvilSpells: function() {
                    return $.ajax({
                        url: '/shared/json/dnd/ext/elemental evil spells.json'
                    });
                },

                spellLevels: function() {
                    return $.ajax('/shared/json/dnd/spellLevels.json');
                },

                page: function(name) {
                    return $.ajax('/shared/json/dnd/' + name + '.json');
                },

                extension: function(name) {
                    return $.ajax({
                        url: 'http://isaac-west.ca/nosql/resources/dnd-ext-' + name,
                        headers: modules.centralAuth.google.baseHeaders()
                    });
                },

                directory: function() {
                    return $.ajax('/shared/json/dnd/ext/directory.json');
                }
            },

            index: {
                bestiary: function() {
                    modules.indexer.indexArray(dndRef.bestiary, dndRef.filterPaths.name);
                    modules.indexer.indexArray(dndRef.bestiary, dndRef.filterPaths.cr);
                },

                spellbook: function() {
                    modules.indexer.indexArray(dndRef.spellbook, dndRef.filterPaths.name);
                }
            },

            load: {
                resources: function() {
                    return dndRef.api.resources('ref').done(function(data) {
                        dndRef.resourcePages.ref = {};
                        for (var i = 0; i < data.length; i++) {
                            var parts = data[i].Meta.split('-');
                            var name = parts[parts.length - 1];
                            var page = JSON.parse(data[i].Text);

                            dndRef.resourcePages.ref = dndRef.resourcePages.ref || {};
                            if (dndRef.resourcePages.ref[name]) {
                                dndRef.resourcePages.ref[name].sections =
                                    dndRef.resourcePages.ref[name].sections.concat(page.sections);
                            } else {
                                dndRef.resourcePages.ref[name] = page;
                            }
                        }
                    });
                },

                bestiary: function($content) {
                    if (dndRef.bestiary) {
                        return $.when();
                    }

                    var promise = $.Deferred();
                    modules.ajaxLoader(promise, $content);

                    dndRef.api.bestiary().done(function(data) {
                        if (modules.centralAuth.google.info) {
                            dndRef.load.extendedBestiary(data).always(function() {
                                promise.resolve(data);
                            });
                        } else {
                            dndRef.bestiary = data;
                            promise.resolve(data);
                            dndRef.index.bestiary();

                            var fn = function() {
                                modules.centralAuth.google.off('signIn', fn);
                                dndRef.load.extendedBestiary(dndRef.bestiary).done(function(ext) {
                                    if ($('#dndRef-bestiary').is(':visible')) {
                                        $content.append(dndRef.render.bestiary(ext));
                                    } else if ($('#dndRef-monster').is(':visible')) {
                                        $content.append(dndRef.render.monster());
                                    }
                                });
                            };

                            modules.centralAuth.google.on('signIn', fn);
                        }
                    }).fail(function() {
                        promise.reject();
                    });

                    return promise;
                },

                extendedBestiary: function(data) {
                    return dndRef.api.extension('bestiary').then(function(ext) {
                        var newData = [];
                        for (var i = 0; i < ext.length; i++) {
                            var extension = JSON.parse(ext[i].Text);
                            newData = newData.concat(extension);
                            data = data.concat(extension);
                        }

                        dndRef.bestiary = data;
                        dndRef.index.bestiary();

                        return $.Deferred().resolve(newData).promise();
                    });
                },

                spellbook: function($content) {
                    if (dndRef.spellbook) {
                        return $.when();
                    }

                    return modules.ajaxLoader($.when(
                            dndRef.api.spellbook(),
                            dndRef.api.elementalEvilSpells()
                        ), $content).done(function(data, ext) {
                            dndRef.spellbook = data[0].concat(ext[0]);
                            dndRef.index.spellbook();
                        }
                    );
                },

                resourcePage: function($content, meta, name) {
                    if (dndRef.resourcePages[meta] &&
                        dndRef.resourcePages[meta][name]) {
                        return $.when();
                    }
                    var promise = $.Deferred();
                    modules.ajaxLoader(promise, $content).fail(function() {
                        window.location.replace('#dndRef-directory');
                    });

                    dndRef.api.resources(meta, name).done(function(data) {
                        if (data.length < 1) {
                            promise.reject();
                        }
                        for (var i = 0; i < data.length; i++) {
                            var page = JSON.parse(data[i].Text);

                            dndRef.resourcePages[meta] = dndRef.resourcePages[meta] || {};
                            if (dndRef.resourcePages[meta][name]) {
                                dndRef.resourcePages[meta][name].sections =
                                    dndRef.resourcePages[meta][name].sections.concat(page.sections);
                            } else {
                                dndRef.resourcePages[meta][name] = page;
                            }
                            promise.resolve();
                        }
                    });

                    return promise;
                },

                extension: function(name) {
                    // TODO - cache so the same file isn't loaded twice
                    return dndRef.api.extension(name);
                },

                page: function($content, name) {
                    if (dndRef.pages[name]) {
                        return $.when();
                    }
                    var promise = $.Deferred();
                    modules.ajaxLoader(promise, $content).fail(function() {
                        window.location.replace('#dndRef-directory');
                    });;

                    dndRef.api.page(name).done(function(data) {
                        if (modules.centralAuth.google.info) {
                            dndRef.load.extension(name).done(function(ext) {
                                for (var i = 0; i < ext.length; i++) {
                                    var extension = JSON.parse(ext[i].Text);
                                    data.sections = data.sections.concat(extension.sections);
                                    if (extension.attributes &&
                                        extension.attributes.Source) {
                                        if (data.attributes['Additional Sources']) {
                                            data.attributes['Additional Sources'] += ', ' + extension.attributes.Source;
                                        }
                                        if (data.attributes['Additional Source']) {
                                            data.attributes['Additional Sources'] = data.attributes['Additional Source'] + ', ' + extension.attributes.Source;
                                            delete data.attributes['Additional Source'];
                                        } else {
                                            data.attributes['Additional Source'] = extension.attributes.Source;
                                        }
                                    }
                                }
                            }).always(function() {
                                dndRef.pages[name] = data;
                                promise.resolve(data);
                            });
                        } else {
                            dndRef.pages[name] = data;
                            promise.resolve(data);
                        }
                    }).fail(function() {
                        promise.reject();
                    });

                    return promise;
                },

                directory: function($content) {
                    if (dndRef.directory) {
                        return $.when();
                    }

                    var promise = $.Deferred();
                    modules.ajaxLoader(promise, $content);

                    dndRef.api.directory().done(function(data) {
                        if (modules.centralAuth.google.info) {
                            dndRef.api.resources().done(function(ext) {
                                data = dndRef.mergeSearchTerms(data, ext);
                                dndRef.directory = data;
                                promise.resolve(data);
                            });
                        } else {
                            dndRef.directory = data;
                            promise.resolve(data);

                            var fn = function() {
                                modules.centralAuth.google.off('signIn', fn);
                                dndRef.api.resources().done(function(ext) {
                                    console.log(ext)
                                    // TODO - merge with existing rendered
                                });
                            };

                            modules.centralAuth.google.on('signIn', fn);
                        }
                    }).fail(function() {
                        promise.reject();
                    });

                    return promise;
                }
            },

            render: {
                directory: function() {
                    var dirtyDLs = [];

                    for (var key in dndRef.resourcePages.ref) {
                        var page = dndRef.resourcePages.ref[key];
                        var category = page.attributes.Category.toLocaleLowerCase();

                        var $dl = $('#dndRef-directory dl[data-category="' + category + '"]')
                        $dl.append(
                            $('<dd/>', {
                                'data-ref': ''
                            }).append(
                                $('<a/>', {
                                    text: page.name,
                                    href: '#dndRef-page/ref/' + key
                                })
                            )
                        );

                        dirtyDLs.push($dl);
                    }

                    for (var i = 0; i < dirtyDLs.length; i++) {
                        var $dl = $(dirtyDLs[i]);

                        var items = $dl.children('dd').get();
                        items.sort(function(a, b) {
                           return $(a).text().toUpperCase().localeCompare($(b).text().toUpperCase());
                        });
                        $.each(items, function(i, item) {
                            $dl.append(item);
                        });
                    }
                },

                search: function(directory) {
                    var $directory = [];
                    for (var i = 0; i < directory.length; i++) {
                        var dataTags = {
                            'data-name': directory[i].name.toLocaleLowerCase(),
                            'data-keywords': directory[i].name.toLocaleLowerCase()
                        };
                        if (directory[i].tags) {
                            for (var n = 0; n < directory[i].tags.length; n++) {
                                dataTags['data-keywords'] += ',' +
                                    (directory[i].tags[n].text ||
                                    directory[i].tags[n].name ||
                                    directory[i].tags[n]).toLocaleLowerCase();
                            }
                        }

                        var $category = dynCore.makeFragment('dndRef.directory', {
                            '': dataTags,
                            'a': {
                                text: directory[i].name,
                                href: directory[i].url || ''
                            }
                        });

                        var args = directory[i].tags.map(function(obj) {
                            var name = obj.name || obj.text || obj;
                            var href = '';

                            if (directory[i].name === 'Spells') {
                                href = '#dndRef-spellbook/all/any/' + name;
                            } else if (directory[i].name === 'Bestiary') {
                                href = '#dndRef-monster/' + name;
                            }

                            var text = name;
                            if (obj.type) {
                                text += ' (' + obj.type + ')';
                            }

                            return {
                                '': {
                                    'data-keywords': name.toLocaleLowerCase()
                                },
                                'a': {
                                    text: text,
                                    href: href
                                }
                            }
                        });

                        var $items = dynCore.makeFragment('dndRef.directoryItem', args);
                        $items.find('a[href=""]').contents().unwrap();

                        $category.children('.keywords').append($items);
                        $directory.push($category);
                    }

                    return $directory;
                },

                bestiary: function(beasts) {
                    var specie = {};
                    var args = beasts.map(function(obj) {
                        specie[obj.attributes.Type] = true;
                        return {
                            '': {
                                'data-monster': obj.name.toLocaleLowerCase(),
                                'data-species': obj.attributes.Type.toLocaleLowerCase(),
                                'data-cr': obj.attributes['Challenge Rating']
                            },
                            'a': {
                                text: obj.name + ' (CR ' + obj.attributes['Challenge Rating'] + ')',
                                href: '#dndRef-monster/' + obj.name
                            }
                        };
                    });

                    $('#dndRef-bestiary .species').append($('<option/>', {
                        text: 'Any',
                        value: 'all'
                    }));
                    $('#dndRef-bestiary .species').append(dndRef.getSortedOptions(specie));

                    var $monsters = dynCore.makeFragment('dndRef.bestiary', args);
                    $($monsters[$monsters.length - 1]).addClass('end');
                    return $monsters;
                },

                monster: function(name) {
                    name = name || dndRef.nav.currentMonster;
                    var match = modules.indexer.get(dndRef.bestiary, dndRef.filterPaths.name, name);
                    var filtered = modules.indexer.filter(dndRef.bestiary, match);
                    var args = filtered.map(function(item) {
                        
                        var perception = null;
                        if (item.attributes.Skills) {
                            var skills = item.attributes.Skills.split(', ');
                            for (var i = 0; i < skills.length; i++) {
                                var index = skills[i].indexOf('Perception');
                                if (index > -1) {
                                    perception = 10 + parseInt(skills[i].substring(index + 12));
                                    break;
                                }
                            }
                        }

                        if (perception === null) {
                            perception = 10 + parseInt(dndRef.getModifier(item.attributes.WIS));
                        }
                        var senses = 'passive Perception ' + perception;
                        if (item.attributes.Senses) {
                            senses = item.attributes.Senses + ', ' + senses;
                        }

                        var immunities = '';
                        if (item.attributes.Immunities) {
                            immunities += item.attributes.Immunities;
                        }
                        if (item.attributes['Condition Immunities']) {
                            if (immunities) {
                                immunities += ', ';
                            }
                            immunities += item.attributes['Condition Immunities'];
                        }

                        return {
                            '.name': {
                                text: item.name
                            },
                            '.species': {
                                text: item.attributes.Size + ' ' + item.attributes.Type +
                                ', ' + item.attributes.Alignment
                            },
                            '.ac': {
                                text: item.attributes.AC
                            },
                            '.hp': {
                                text: item.attributes.HP
                            },
                            '.speed': {
                                text: item.attributes.Speed
                            },
                            '.str': {
                                text: item.attributes.STR + ' (' +
                                    dndRef.getModifier(item.attributes.STR) + ')'
                            },
                            '.dex': {
                                text: item.attributes.DEX + ' (' +
                                    dndRef.getModifier(item.attributes.DEX) + ')'
                            },
                            '.con': {
                                text: item.attributes.CON + ' (' +
                                    dndRef.getModifier(item.attributes.CON) + ')'
                            },
                            '.int': {
                                text: item.attributes.INT + ' (' +
                                    dndRef.getModifier(item.attributes.INT) + ')'
                            },
                            '.wis': {
                                text: item.attributes.WIS + ' (' +
                                    dndRef.getModifier(item.attributes.WIS) + ')'
                            },
                            '.cha': {
                                text: item.attributes.CHA + ' (' +
                                    dndRef.getModifier(item.attributes.CHA) + ')'
                            },
                            '.saves': {
                                text: item.attributes['Saving Throws'] || 'None'
                            },
                            '.skills': {
                                text: item.attributes.Skills || 'None'
                            },
                            '.resistances': {
                                text: item.attributes.Resistances || 'None'
                            },
                            '.immunities': {
                                text: immunities || 'None'
                            },
                            '.senses': {
                                text: senses
                            },
                            '.languages': {
                                text: item.attributes.Languages || 'None'
                            },
                            '.cr': {
                                text: item.attributes['Challenge Rating'] + ' (' +
                                    dndRef.getXP(item.attributes['Challenge Rating']) + ' XP)'
                            }
                        }
                    });

                    if (args.length < 1) {
                        return;
                    }

                    var $monster = dynCore.makeFragment('dndRef.monster', args);

                    var $sections = $monster.children('.sections')
                    var sections = filtered[0].sections;
                    for (var i = 0; i < sections.length; i++) {
                        var section = sections[i];
                        var $section = $('<div/>', { class: 'column' });

                        if (section.header) {
                            $section.append($('<h5/>', { text: section.header }));
                        }
                        for (var n = 0; n < section.items.length; n++) {
                            $section.append(
                                $('<p/>').append(
                                    $('<strong/>', {
                                        text: section.items[n].name + ' '
                                    })
                                ).append(
                                    $('<span/>', {
                                        text: section.items[n].text
                                    })
                                )
                            );
                        }

                        $sections.append($section);
                    }

                    return $monster;
                },

                spellbook: function() {
                    var levels = {};
                    var classes = {};
                    var args = dndRef.spellbook.map(function(obj) {
                        levels[obj.attributes.Level] = true;
                        if (obj.attributes.Classes) {
                            var spellClasses = obj.attributes.Classes.split(', ');
                            for (var j = 0; j < spellClasses.length; j++) {
                                classes[spellClasses[j]] = true;
                            }
                        }

                        var dataTags = {
                            'data-spell': obj.name.toLocaleLowerCase(),
                            'data-level': obj.attributes.Level
                        };
                        if (obj.attributes.Classes) {
                            dataTags['data-classes'] = obj.attributes.Classes.toLocaleLowerCase();
                        }

                        var components = {
                            text: obj.attributes.Components
                        };
                        if (obj.attributes.Material) {
                            components.text += ' (' + obj.attributes.Material + ')';
                        }

                        var school = 'Level ' + obj.attributes.Level + ' ' + obj.attributes.School;
                        if (obj.attributes.Ritual === 'Yes') {
                            school += ' (ritual)';
                        }

                        return {
                            '': dataTags,
                            '.name': {
                                text: obj.name
                            },
                            '.school': {
                                text: school
                            },
                            '.castTime': {
                                text: obj.attributes['Casting Time']
                            },
                            '.range': {
                                text: obj.attributes.Range
                            },
                            '.components': components,
                            '.duration': {
                                text: obj.attributes.Duration
                            }
                        };
                    });

                    var $spells = dynCore.makeFragment('dndRef.spell', args);
                    for (var i = 0; i < $spells.length; i++) {
                        var $spell = $($spells[i]);
                        var match = modules.indexer.get(
                            dndRef.spellbook,
                            dndRef.filterPaths.name,
                            $spell.children('.name').text()
                        );
                        var filtered = modules.indexer.filter(dndRef.spellbook, match);

                        var $sections = $spell.children('.sections')
                        var sections = filtered[0].sections;
                        
                        for (var n = 0; n < sections.length; n++) {
                            var section = sections[n];
                            var $section = $('<div/>');

                            if (section.header) {
                                $section.append($('<h5/>', { text: section.header }));
                            }
                            for (var n = 0; n < section.items.length; n++) {
                                $section.append(
                                    $('<p/>').append(
                                        $('<strong/>', {
                                            text: section.items[n].name + ' '
                                        })
                                    ).append(
                                        $('<span/>', {
                                            text: section.items[n].text
                                        })
                                    )
                                );
                            }

                            $sections.append($section);
                        }
                    }

                    $('#dndRef-spellbook .spellLevel').append($('<option/>', {
                        text: 'Any',
                        value: 'any'
                    }));
                    $('#dndRef-spellbook .spellLevel').append(dndRef.getSortedOptions(levels));

                    $('#dndRef-spellbook .spellCategory').append($('<option/>', {
                        text: 'All',
                        value: 'all'
                    }));
                    $('#dndRef-spellbook .spellCategory').append(dndRef.getSortedOptions(classes));

                    $($spells[$spells.length - 1]).addClass('end');
                    return $spells;
                },

                page: function(data) {
                    var $page = dynCore.makeFragment('dndRef.page');
                    var $sections = $page.children('.sections');
                    for (var s = 0; s < data.sections.length; s++) {
                        var section = data.sections[s];
                        var $section = $('<div/>', {
                            class: 'column'
                        });

                        if (section.type === 'table') {
                            var $table = $('<table/>', {
                                class: 'scroll'
                            }).appendTo($section);
                            if (section.header) {
                                if (section.header.startsWith('Table: ')) {
                                    section.header = section.header.substring(7);
                                }
                                $table.append(
                                    $('<caption/>', {
                                        text: section.header
                                    })
                                );
                            }

                            for (var n = 0; n < section.items.length; n++) {
                                var $item = $('<' + section.items[n].type + '/>');
                                var rows = section.items[n].rows;
                                if (rows) {
                                    for (var i = 0; i < rows.length; i++) {
                                        var $row = $('<tr/>');
                                        for (var x = 0; x < rows[i].length; x++) {
                                            var cell = rows[i][x];
                                            var $cell = $('<' + cell.type + '/>', {
                                                text: cell.text,
                                                style: cell.style
                                            });
                                            if (cell.colspan) {
                                                $cell.attr('colspan', cell.colspan);
                                            }
                                            if (cell.rowspan) {
                                                $cell.attr('rowspan', cell.rowspan);
                                            }
                                            $row.append($cell);
                                        }
                                        $item.append($row);
                                    }
                                }
                                $table.append($item);
                            }
                        } else {
                            if (section.header) {
                                $section.append($('<h' +
                                    Math.min(6, (parseInt(section.level) + 2)) +
                                    '/>', { text: section.header }));
                            }
                            for (var n = 0; n < section.items.length; n++) {
                                $section.append(
                                    $('<p/>').append(
                                        $('<strong/>', {
                                            text: section.items[n].name + ' '
                                        })
                                    ).append(
                                        $('<span/>', {
                                            text: section.items[n].text
                                        })
                                    )
                                );
                            }
                        }

                        $sections.append($section);
                    }

                    var $attributes = $page.find('.attributes');
                    if (data.attributes) {
                        $attributes.parent().prepend($('<caption/>', {
                            text: 'Attributes'
                        }));
                        for (var key in data.attributes) {
                            $attributes.append(
                                $('<tr/>').append([
                                    $('<th/>', {
                                        text: key
                                    }),
                                    $('<td/>', {
                                        text: data.attributes[key]
                                    })
                                ])
                            );
                        }
                    }

                    return $page;
                }
            },

            nav: {
                directorySearchRendered: false,
                directorySearch: null,
                directory: function(search) {
                    $('#app-dndRef .dndRefDirectorySearch').show();

                    if (modules.centralAuth.google.info && !search &&
                        (!dndRef.resourcePages || !dndRef.resourcePages.ref)) {
                        
                        $('#dndRef-directory dd[data-ref]').remove();
                        dndRef.load.resources().done(function() {
                            dndRef.render.directory();
                        });
                    }

                    if (search) {
                        $('#dndRef-directory .menu').hide();
                        $('#dndRef-directory .search').show();
                    } else {
                        $('#dndRef-directory .search').hide();
                        $('#dndRef-directory .menu').show();
                    }

                    dndRef.nav.directorySearch = search;

                    if (dndRef.nav.directorySearchRendered) {
                        var $search = $('#app-dndRef .dndRefDirectorySearch');
                        if (search !== $search.val()) {
                            $('#app-dndRef .dndRefDirectorySearch').val(search);
                        }
                        dndRef.filter.directory();
                        return;
                    }

                    var $content = $('#dndRef-directory .search .content');
                    $content.empty();

                    var template = dynCore.loadTemplate('dndRef.directory', '/hub/res/html/dndRefDirectory.html');
                    var itemTemplate = dynCore.loadTemplate('dndRef.directoryItem', '/hub/res/html/dndRefDirectoryItem.html');

                    dndRef.nav.directorySearchRendered = true;
                    $.when(dndRef.load.directory($content),
                        template, itemTemplate).done(function(data) {

                        $content.append(dndRef.render.search(data));
                        $('#app-dndRef .dndRefDirectorySearch').val(search);
                        dndRef.filter.directory();
                    }).fail(function() {
                        dndRef.nav.directorySearchRendered = false;
                    });
                },

                bestiaryRendered: false,
                bestiaryArgs: {},
                bestiary: function(category, minCR, maxCR, query) {
                    $('#app-dndRef .top-bar-right .input-group').show();
                    $('#app-dndRef .addToEncounter').hide();
                    if (!maxCR) {
                        var hash = '#dndRef-bestiary/' + (category ||
                            dndRef.nav.bestiaryArgs.category || 'all') + '/' +
                            (minCR || dndRef.nav.bestiaryArgs.minCR || '0') + '/' +
                            (maxCR || dndRef.nav.bestiaryArgs.maxCR || '33');
                        if (dndRef.nav.bestiaryArgs.query) {
                            hash += '/' + dndRef.nav.bestiaryArgs.query;
                        }
                        window.location.replace(hash);
                        return;
                    }
                    dndRef.nav.bestiaryArgs = {
                        category: category,
                        minCR: minCR,
                        maxCR: maxCR,
                        query: query
                    };

                    if (dndRef.nav.bestiaryRendered) {
                        $('#dndRef-bestiary .species').val(category);
                        $('#dndRef-bestiary .minCR').val(minCR);
                        $('#dndRef-bestiary .maxCR').val(maxCR);
                        $('#dndRef-bestiary .monsterName').val(query);
                        dndRef.filter.bestiary();
                        return;
                    }

                    var $content = $('#dndRef-bestiary .content');
                    $content.empty();

                    var template = dynCore.loadTemplate('dndRef.bestiary', '/hub/res/html/dndRefBestiary.html');
                    $.when(dndRef.load.bestiary($content), template).done(function() {
                        $content.append(dndRef.render.bestiary(dndRef.bestiary));
                        dndRef.nav.bestiaryRendered = true;

                        $('#dndRef-bestiary .species').val(category);
                        $('#dndRef-bestiary .minCR').val(minCR);
                        $('#dndRef-bestiary .maxCR').val(maxCR);
                        $('#dndRef-bestiary .monsterName').val(query);

                        dndRef.filter.bestiary();
                    });
                },

                currentMonster: null,
                monster: function(name) {
                    $('#app-dndRef .backToBestiary,' + 
                        '#app-dndRef .top-bar-right .input-group,' +
                        '#app-dndRef .addToEncounter').show();
                    if (name === dndRef.nav.currentMonster) {
                        return;
                    }
                    dndRef.nav.currentMonster = name;

                    var $content = $('#dndRef-monster');
                    $content.empty();

                    var template = dynCore.loadTemplate('dndRef.monster', '/hub/res/html/dndRefMonster.html');
                    $.when(dndRef.load.bestiary($content), template).done(function() {
                        $content.append(dndRef.render.monster(name));
                    });
                },

                spellbook: function(className, level, spell) {
                    if (!level) {
                        var hash = '#dndRef-spellbook/' + (className || 'all') +
                            '/' + (level || 'any');
                        window.location.replace(hash);
                        return;
                    }

                    if (dndRef.spellbook) {
                        $('#dndRef-spellbook .spellCategory').val(className);
                        $('#dndRef-spellbook .spellLevel').val(level);
                        $('#dndRef-spellbook .spellName').val(spell);
                        dndRef.filter.spellbook();
                        return;
                    }

                    var $content = $('#dndRef-spellbook .content');
                    $content.empty();

                    var template = dynCore.loadTemplate('dndRef.spell', '/hub/res/html/dndRefSpell.html');
                    $.when(dndRef.load.spellbook($content), template).done(function() {
                        $content.append(dndRef.render.spellbook());

                        $('#dndRef-spellbook .spellCategory').val(className);
                        $('#dndRef-spellbook .spellLevel').val(level);
                        $('#dndRef-spellbook .spellName').val(spell);

                        dndRef.filter.spellbook();
                    });
                },

                page: function(name, mod) {
                    if (!name) {
                        window.location.replace('#dndRef-directory');
                    }

                    var $header = $('#dndRef-page .pageHeader').text('');
                    var $content = $('#dndRef-page .content');
                    $content.empty();

                    var template = dynCore.loadTemplate('dndRef.page', '/hub/res/html/dndRefPage.html');
                    if (mod) {
                        if (modules.centralAuth.google.info) {
                            $.when(dndRef.load.resourcePage($content, name, mod), template).done(function() {
                                $header.text(dndRef.resourcePages[name][mod].name);
                                $content.append(dndRef.render.page(dndRef.resourcePages[name][mod]));
                            });
                        }
                    } else {
                        $.when(dndRef.load.page($content, name), template).done(function() {
                            $header.text(dndRef.pages[name].name);
                            $content.append(dndRef.render.page(dndRef.pages[name]));
                        });
                    }
                    
                }
            },

            rehash: {
                directory: function() {
                    var hash = '#dndRef-directory/' + $('#app-dndRef .dndRefDirectorySearch').val();
                    window.location.replace(hash);
                },

                bestiary: function() {
                    var hash = '#dndRef-bestiary/' +
                        $('#dndRef-bestiary .species').val() + '/' +
                        $('#dndRef-bestiary .minCR').val() + '/' +
                        $('#dndRef-bestiary .maxCR').val();

                    var query = $('#dndRef-bestiary .monsterName').val();
                    if (query) {
                        hash += '/' + query;
                    }

                    window.location.replace(hash);
                },

                spellbook: function() {
                    var hash = '#dndRef-spellbook/' +
                        $('#dndRef-spellbook .spellCategory').val() + '/' +
                        $('#dndRef-spellbook .spellLevel').val()

                    var query = $('#dndRef-spellbook .spellName').val();
                    if (query) {
                        hash += '/' + query;
                    }

                    window.location.replace(hash);
                }
            }
        };

        var $crSelects = $('#dndRef-bestiary .minCR, #dndRef-bestiary .maxCR');
        for (var i = 0; i < dndRef.cr.length; i++) {
            $crSelects.append(
                $('<option/>', {
                    text: dndRef.cr[i],
                    value: i
                })
            );
        }

        $('#dndRef-bestiary input').on('keyup', dndRef.rehash.bestiary);
        $('#dndRef-bestiary select').on('change', dndRef.rehash.bestiary);

        $('#dndRef-spellbook input').on('keyup', dndRef.rehash.spellbook);
        $('#dndRef-spellbook select').on('change', dndRef.rehash.spellbook);

        $('#app-dndRef .dndRefDirectorySearch').on('keyup', dndRef.rehash.directory);
        
        modules.centralAuth.google.on('signIn', dndRef.signInOut);
        modules.centralAuth.google.on('signOut', dndRef.signInOut);

        hashNav.bindNavApp(function(app, section, args) {
            if (app === 'dndRef') {
                if (!section) {
                    window.location.replace('#dndRef-directory');
                }
            }
        });

        hashNav.bindNavSection(function(app, section, args) {
            if (app === 'dndRef' && section) {
                $('#app-dndRef .backToBestiary,' +
                    '#app-dndRef .top-bar-right .input-group,' +
                    '#app-dndRef .dndRefDirectorySearch').hide();
                if (dndRef.nav[section]) {
                    dndRef.nav[section].apply(this, args);
                }
            }
        });

        return dndRef;
    };
})(window.dynCore, window.hashNav);