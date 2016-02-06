(function(dynCore) {
    dynCore.when(
        dynCore.require('lib', [
            'baseSection',
            'random',
            'roller'
        ]),
        dynCore.json('hub.json.swn.2e.names')
    ).done(function(modules, section, random, roller, names) {
        section('hub.frag.swn.names', {
            defaultCount: 10,

            model: {
                version: names.version,
                index: function() {
                    return Number(this.parent().attr('z--index')) + 1;
                }
            },

            onInit: function() {
                var self = this;
                this.model.plusOne = function() {
                    window.location.replace('#swn-names/' + (Number(self.count) + 1) + '/' + self.languages + '/' + self.seed);
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
                                window.location.hash = 'swn-names/' + self.count + '/' + self.languages + '/' + uuid;
                            });
                        }
                    }
                ];
            },

            onNavTo: function(count, languages, seed) {
                this.count = count;
                this.languages = languages;
                this.seed = seed;

                if (typeof(count) === 'undefined') {
                    window.location.replace('#swn-names/' + this.defaultCount);
                    return;
                }
                if (typeof(languages) === 'undefined') {
                    window.location.replace('#swn-names/' + count + '/all');
                    return;
                }
                if (seed) {
                    var self = this;
                    random.getRandom(seed).done(function(rng) {
                        self.gen(languages, count, rng.random);
                    });
                } else {
                    random.uuid().done(function(uuid) {
                        window.location.replace('#swn-names/' + count + '/' + languages + '/' + uuid);
                    });
                }

                if (this.model._parent._get('sectionMenu') !== this.sectionMenu) {
                    this.model._parent._set('sectionMenu', this.sectionMenu);
                }
            },

            gen: function(languages, count, random) {
                languages = languages.toLocaleLowerCase();
                var languageOptions = [];

                for (var language in names) {
                    if (names.hasOwnProperty(language) && typeof(names[language]) === 'object') {
                        if (languages.includes(language.toLocaleLowerCase()) || languages === 'all') {
                            languageOptions.push(language);
                        }
                    }
                }

                var items = [];
                for (var i = 0; i < count; i++) {
                    var language = roller(languageOptions, random);
                    var item = roller(names[language], random);
                    item.language = language;
                    items.push(item);
                }

                this.model._set('items', items);
            }
        });
    });
})(window.dynCore);