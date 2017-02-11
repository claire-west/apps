(function(dynCore, hashNav) {
    dynCore.css('dndRef', 'res/css/dndRef.css');

    dynCore.when(dynCore.html('dndRef'),
        dynCore.loadTemplate('ajaxLoader', '../shared/html/ajaxLoader.html'),
        dynCore.require([
            'hashNav.js',
            'indexer.js',
            'ajaxLoader.js',
            'ajaxError.js',
        ], '../shared/js/')
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

            filter: {
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
                bestiary: function() {
                    return $.ajax({
                        url: '../shared/json/dnd/bestiary.json'
                    });
                },

                spellbook: function() {
                    return $.ajax({
                        url: '../shared/json/dnd/spells.json'
                    });
                },

                spellLevels: function() {
                    return $.ajax({
                        url: '../shared/json/dnd/spellLevels.json'
                    });
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
                bestiary: function($content) {
                    if (dndRef.bestiary) {
                        return $.when();
                    }

                    return modules.ajaxLoader(dndRef.api.bestiary(), $content).done(function(data) {
                        dndRef.bestiary = data;
                        dndRef.index.bestiary();
                    });
                },

                spellbook: function($content) {
                    if (dndRef.spellbook && dndRef.spellLevels) {
                        return $.when();
                    }

                    return modules.ajaxLoader($.when(
                            dndRef.api.spellbook(),
                            dndRef.api.spellLevels()),
                        $content).done(function(data) {
                            dndRef.spellbook = data[0];
                            dndRef.spellLevels = data[1];
                            dndRef.index.spellbook();
                        }
                    );
                }
            },

            render: {
                bestiary: function($content) {
                    var specie = {};
                    var args = dndRef.bestiary.map(function(obj) {
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
                                text: item.attributes['Condition Immunities'] || 'None'
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

                        return {
                            '': dataTags,
                            '.name': {
                                text: obj.name
                            },
                            '.school': {
                                text: 'Level ' + obj.attributes.Level + ' ' + obj.attributes.School
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
                }
            },

            nav: {
                bestiaryRendered: false,
                bestiaryArgs: {},
                bestiary: function(category, minCR, maxCR, query) {
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
                        $('#dndRef-bestiary .mosnterName').val(query);
                        dndRef.filter.bestiary();
                        return;
                    }

                    var $content = $('#dndRef-bestiary .content');
                    $content.empty();

                    var template = dynCore.loadTemplate('dndRef.bestiary', 'res/html/dndRefBestiary.html');
                    $.when(dndRef.load.bestiary($content), template).done(function() {
                        $content.append(dndRef.render.bestiary());
                        dndRef.nav.bestiaryRendered = true;

                        $('#dndRef-bestiary .species').val(category);
                        $('#dndRef-bestiary .minCR').val(minCR);
                        $('#dndRef-bestiary .maxCR').val(maxCR);
                        $('#dndRef-bestiary .mosnterName').val(query);

                        dndRef.filter.bestiary();
                    });
                },

                currentMonster: null,
                monster: function(name) {
                    $('#app-dndRef .backToBestiary').show();
                    if (name === dndRef.nav.currentMonster) {
                        return;
                    }
                    dndRef.nav.currentMonster = name;

                    var $content = $('#dndRef-monster');
                    $content.empty();

                    var template = dynCore.loadTemplate('dndRef.monster', 'res/html/dndRefMonster.html');
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

                    var template = dynCore.loadTemplate('dndRef.spell', 'res/html/dndRefSpell.html');
                    $.when(dndRef.load.spellbook($content), template).done(function() {
                        $content.append(dndRef.render.spellbook());

                        $('#dndRef-spellbook .spellCategory').val(className);
                        $('#dndRef-spellbook .spellLevel').val(level);
                        $('#dndRef-spellbook .spellName').val(spell);

                        dndRef.filter.spellbook();
                    });
                }
            },

            rehash: {
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

        hashNav.bindNavSection(function(app, section, args) {
            if (app === 'dndRef') {
                $('#app-dndRef .backToBestiary').hide();
                if (dndRef.nav[section]) {
                    dndRef.nav[section].apply(this, args);
                }
            }
        });

        return dndRef;
    };
})(window.dynCore, window.hashNav);