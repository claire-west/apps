(function(dynCore) {
    dynCore.when(
        dynCore.require('lib', [
            'baseSection',
            'random',
            'roller'
        ]),
        dynCore.jsonBundle('hub.json.swn', {
            person: '1e.person',
            npc: '2e.npc',
            patron: '2e.patron',
            pointOfInterest: '2e.pointOfInterest',
            worldRelations: '2e.worldRelations',
            society: '1e.society',
            societalConflict: '1e.societalConflict',
            alien: '1e.alien',
            creature: '1e.creature',
            corp: '1e.corporation',
            religion: '1e.religion',
            heresy: '1e.heresy',
            politicalParty: '1e.politicalParty',
            architecture: '1e.architecture',
            room: '1e.roomDressing'
        })
    ).done(function(modules, section, random, roller, bundle) {
        section('hub.frag.swn.gen', {
            defaultCount: 10,

            model: {
                get: function(object, prev, column) {
                    if (object) {
                        return object[column];
                    }
                },
                index: function() {
                    return Number(this.parent().attr('z--index')) + 1;
                }
            },

            onInit: function() {
                var self = this;
                this.model.plusOne = function() {
                    window.location.replace('#swn-gen/' + self.entity + '/' + (Number(self.count) + 1) + '/' + self.seed);
                };

                this.sectionMenu = [
                    {
                        title: 'Plus One',
                        icon: 'fa-plus',
                        click: this.model.plusOne
                    },
                    {
                        title: 'Reseed',
                        icon: 'fa-refresh',
                        click: function() {
                            random.uuid().done(function(uuid) {
                                window.location.hash = 'swn-gen/' + self.entity + '/' + self.count + '/' + uuid;
                            });
                        }
                    }
                ];
            },

            onNavTo: function(entity, count, seed) {
                this.entity = entity;
                this.count = count;
                this.seed = seed;

                if (typeof(entity) === 'undefined' || !bundle[entity]) {
                    window.location.replace('#swn');
                    return;
                }
                if (this.model._get('@subsection') !== entity) {
                    this.model._set('@subsection', entity);
                    this.model._set('header', this.header[entity]);
                    this.model._set('items', null);
                    this.model._set('columns', this.columns[entity]);
                }
                if (typeof(count) === 'undefined') {
                    window.location.replace('#swn-gen/' + entity + '/' + this.defaultCount);
                    return;
                }
                if (seed) {
                    var self = this;
                    random.getRandom(seed).done(function(rng) {
                        self.genFromBundle(entity, count, rng.random);
                    });
                } else {
                    random.uuid().done(function(uuid) {
                        window.location.replace('#swn-gen/' + entity + '/' + count + '/' + uuid);
                    });
                }

                if (this.model._parent._get('sectionMenu') !== this.sectionMenu) {
                    this.model._parent._set('sectionMenu', this.sectionMenu);
                }
            },

            header: {
                person: 'People',
                npc: 'NPCs',
                patron: 'Patrons',
                pointOfInterest: 'Points of Interest',
                worldRelations: 'Same-star World Relations',
                society: 'Societies',
                societalConflict: 'Societal Conflicts',
                alien: 'Aliens',
                creature: 'Creatures',
                corp: 'Corporations',
                religion: 'Religions',
                heresy: 'Heresies',
                politicalParty: 'Political Parties',
                architecture: 'Architectural Elements',
                room: 'Room Dressing'
            },

            filters: {
                corp: function(corps) {
                    for (var i = 0; i < corps.length; i++) {
                        corps[i].Name = corps[i].Name + ' ' + corps[i].Organization;
                    }
                    return corps;
                },
                politicalParty: function(parties) {
                    for (var i = 0; i < parties.length; i++) {
                        parties[i].Name = parties[i]['Name (prefix)'] + ' ' + parties[i]['Name (suffix)'];
                    }
                    return parties;
                }
            },

            columns: {
                person: [
                    'Age',
                    'Sex',
                    'Height',
                    'Problem',
                    'Job Motivation',
                    'Noticeable Quirk'
                ],
                npc: [
                    'Background',
                    'Role in Society',
                    'Biggest Problem',
                    'Age',
                    'Greatest Desire',
                    'Obvious Trait'
                ],
                patron: [
                    'Trustworthiness',
                    'Challenge of the Job',
                    'Countervailing Force',
                    'Eagerness to Hire',
                    'Potential Non-cash Rewards',
                    'Complication'
                ],
                pointOfInterest: [
                    'Type',
                    'Occupied By',
                    'Situation'
                ],
                worldRelations: [
                    'Origin',
                    'Relationship',
                    'Contact'
                ],
                society: [
                    'Reason for Colonization',
                    'Government',
                    'Trait (1)',
                    'Trait (2)',
                    'Evolution'
                ],
                societalConflict: [
                    'Root',
                    'Detail',
                    'Constraint',
                    'Change'
                ],
                alien: [
                    'Body Type',
                    'Psychology/Lens',
                    'Social Structure'
                ],
                creature: [
                    'Type',
                    'Trait'
                ],
                corp: [
                    'Name',
                    'Business',
                    'Reputation and Rumors'
                ],
                religion: [
                    'Evolution',
                    'Leadership',
                    'Origin Tradition'
                ],
                heresy: [
                    'Founder',
                    'Major Heresy',
                    'Attitude towards Orthodoxy',
                    'Quirk'
                ],
                politicalParty: [
                    'Group Leadership',
                    'Economic Policy',
                    'Important Issues',
                    'Name'
                ],
                architecture: [
                    'Architectural Element'
                ],
                room: [
                    'Room and Features'
                ]
            },

            generators: {
                pointOfInterest: function(template, count, random) {
                    var items = [];

                    for (var i = 0; i < count; i++) {
                        var item = Object.assign({}, roller(template.Type, random));
                        item['Occupied By'] = roller(item['Occupied By'], random);
                        item['Situation'] = roller(item['Situation'], random);
                        item.version = template.version;
                        items.push(item);
                    }

                    return items;
                },
                society: function(template, count, random) {
                    var items = [];

                    for (var i = 0; i < count; i++) {
                        var item = Object.assign({}, roller(template, random));
                        item['Government'] = item['Type']['Government'];
                        item['Evolution'] = roller(item['Type']['Evolution'], random);
                        item['Trait (1)'] = item['Societal Traits'][0];
                        item['Trait (2)'] = item['Societal Traits'][1];
                        item.version = template.version;
                        items.push(item);
                    }

                    return items;
                },
                societalConflict: function(template, count, random) {
                    var items = [];

                    for (var i = 0; i < count; i++) {
                        var item = Object.assign({}, roller(template.Conflict, random));
                        item['Detail'] = roller(item['Detail'], random);
                        item['Constraint'] = roller(item['Constraint'], random);
                        item['Change'] = roller(item['Change'], random);
                        item.version = template.version;
                        items.push(item);
                    }
                    
                    return items;
                },
                creature: function(template, count, random) {
                    var items = [];

                    var hybridTemplate = [].concat(template['Body Type']);
                    hybridTemplate.pop();
                    for (var i = 0; i < count; i++) {
                        var item = Object.assign({}, roller(template['Body Type'], random));
                        if (item.Type === 'Hybrid') {
                            var type = roller({
                                template: hybridTemplate,
                                random: random,
                                count: 2,
                                unique: true
                            });
                            var traits = [];
                            for (var i = 0; i < type.length; i++) {
                                traits.push(roller(type[i]['Trait'], random));
                            }
                            item['Trait'] = traits.join(', ');
                        } else {
                            item['Trait'] = roller(item['Trait'], random);
                        }
                        item.version = template.version;
                        items.push(item);
                    }

                    return items;
                }
            },

            genFromBundle: function(entity, count, random) {
                var template = bundle[entity];
                delete template.page;

                var items;
                if (this.generators[entity]) {
                    items = this.generators[entity](template, count, random);
                } else {
                    items = roller({
                        template: template,
                        random: random,
                        count: count
                    });
                }

                if (this.filters[entity]) {
                    items = this.filters[entity](items);
                }

                this.model._set('items', items);
            }
        });
    });
})(window.dynCore);