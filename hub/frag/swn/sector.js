(function(dynCore) {
    dynCore.when(
        dynCore.require('lib', [
            'baseSection',
            'random',
            'roller',
            'names',
            'download'
        ]),
        dynCore.jsonBundle('hub.json.swn', {
            name: 'sectorName',
            world: '2e.world',
            designation: 'stellarDesignation'
        }),
        dynCore.require('lib.messageBox'),
        dynCore.js('vendor.html2canvas')
    ).done(function(modules, section, random, roller, names, download, sector) {
        section('hub.frag.swn.sector', {
            worldCap: 36,
            columns: 8,
            rows: 10,
            minTL5: 0, //1,
            model: {
                concatTags: function(world) {
                    if (world) {
                        var tags = [];
                        for (var i = 0; i < world.Tags.length; i++) {
                            tags.push(world.Tags[i].Tag);
                        }
                        return tags.join(', ');
                    }
                },
                isHexSelected: function(selected, prev, coord) {
                    if (selected === coord) {
                        return true;
                    }
                }
            },

            onInit: function() {
                var self = this;
                this.saveImage = function() {
                    var div = self.$fragment.parent().get();
                    var $wrapper = $('.off-canvas-wrapper').css('overflow', 'visible');
                    html2canvas(div, {
                        onrendered: function(canvas) {
                            download(canvas.toDataURL(), self.model.name + ' (' + self.model.seed + ').png');
                            $wrapper.css('overflow', '');
                        }
                    });
                };
                this.model.onHexClick = function(hex, seed) {
                    if (self.model.rearrange) {
                        if (self.model.selectedHex) {
                            if (self.model.selectedHex !== hex.coord) {
                                var transform = self.model.selectedHex[1] + self.model.selectedHex[4] + 'x' + hex.coord[1] + hex.coord[4];
                                if (self.model.transforms) {
                                    transform = self.model.transforms + ',' + transform;
                                }
                                window.location.hash = 'swn-sector/' + seed + '/' + transform;
                            }
                            self.model._set('selectedHex', null)
                            self.find('.hex.selected').removeClass('selected');
                        } else {
                            self.model._set('selectedHex', hex.coord);
                            $(this).addClass('selected');
                        }
                    } else if (seed && hex && hex.coord && hex.worlds) {
                        window.location.hash = 'swn-sector/' + seed + '/' + self.model.transforms + '/' + hex.coord;
                    }
                };
                this.model.onWorldClick = function(world, hex, seed, e) {
                    if (seed && hex && hex.coord && hex.worlds && world && world.designation) {
                        e.stopPropagation();
                        window.location.hash = 'swn-sector/' + seed + '/' + self.model.transforms + '/' + hex.coord + '/' + world.designation;
                    }
                };
                this.model.worldHref = function(world, prev, hex, seed) {
                    if (world && hex) {
                        return '#swn-sector/' + seed + '/' + self.model.transforms + '/' + hex.coord + '/' + world.designation;
                    }
                };

                this.resetHexGridAction = {
                    title: 'Reset Hex Grid',
                    icon: 'fa-undo',
                    click: function() {
                        window.location.hash = 'swn-sector/' + self.model.seed;
                        self.toggleRearrangeMode.title = 'Swap Hexes';
                        self.toggleRearrangeMode.secondary = true;
                        self.toggleRearrangeMode.icon = 'fa-random';
                        self.resetHexGridAction.hidden = true;
                        self.model._set('selectedHex', null)
                        self.model._set('rearrange', false);
                    },
                    secondary: true,
                    hidden: true
                };

                this.toggleRearrangeMode = {
                    title: 'Swap Hexes',
                    icon: 'fa-random',
                    click: function() {
                        if (self.toggleRearrangeMode.secondary) {
                            self.toggleRearrangeMode.title = 'Stop Rearranging';
                            self.toggleRearrangeMode.secondary = false;
                            self.toggleRearrangeMode.icon = 'fa-ban';
                            self.resetHexGridAction.hidden = false;
                            self.model._set('rearrange', true);
                        } else {
                            self.toggleRearrangeMode.title = 'Swap Hexes';
                            self.toggleRearrangeMode.secondary = true;
                            self.toggleRearrangeMode.icon = 'fa-random';
                            self.resetHexGridAction.hidden = true;
                            self.model._set('selectedHex', null)
                            self.model._set('rearrange', false);
                        }
                    },
                    secondary: true
                };

                this.sectionMenu = [
                    {
                        title: 'Save Map as .png',
                        icon: 'fa-picture-o',
                        click: function() {
                            self.saveImage();
                        },
                        secondary: true
                    },
                    {
                        title: 'Export for Google Sheets/Excel',
                        icon: 'fa-download',
                        click: function() {
                            var content = '"Hex","Designation","World","Tech Level","Population","Atmosphere","Biosphere","Temperature","Tag (1)","Tag (2)"';
                            for (var x = 0; x < self.model.hexes.length; x++) {
                                for (var y = 0; y < self.model.hexes[x].length; y++) {
                                    var worlds = self.model.hexes[x][y].worlds;
                                    if (worlds) {
                                        for (var i = 0; i < worlds.length; i++) {
                                            var parts = [
                                                self.model.hexes[x][y].coord,
                                                worlds[i].fullDesignation,
                                                worlds[i].name,
                                                worlds[i]['Tech Level'].Level,
                                                worlds[i].Population,
                                                worlds[i].Atmosphere,
                                                worlds[i].Biosphere,
                                                worlds[i].Temperature,
                                                worlds[i].Tags[0].Tag,
                                                worlds[i].Tags[1].Tag
                                            ];
                                            content += '\n"' + parts.join('","') + '"';
                                        }
                                    }
                                }
                            }
                            var blob = new Blob(["\ufeff", content]);
                            var url = URL.createObjectURL(blob);
                            download(url, self.model.name + ' (' + self.model.seed + ').csv');
                        },
                        secondary: true
                    },
                    this.resetHexGridAction,
                    this.toggleRearrangeMode,
                    {
                        title: 'Sector Map',
                        icon: 'fa-map-o',
                        click: function() {
                            window.location.hash = '#swn-sector/' + self.model.seed + '/' + self.model.transforms;
                        }
                    },
                    {
                        title: 'List of Stars',
                        icon: 'fa-list',
                        click: function() {
                            window.location.hash = '#swn-sector/' + self.model.seed + '/' + self.model.transforms + '/stars';
                        }
                    }
                ];
            },

            onNavTo: function(seed, transforms, hex, designation) {
                if (typeof(seed) === 'undefined') {
                    window.location.replace('#swn');
                    return;
                }

                if (this.model.seed !== seed) {
                    this.model._set('seed', seed);
                    this.model._set('hexes', null);
                    this.model._set('flattenedArray', null);
                    this.generate();
                }
                transforms = transforms || '';
                if (this.model.transforms !== transforms) {
                    this.model._set('hexes', null);
                    this.model._set('flattenedArray', null);
                    this.generate();
                    this.model._set('transforms', transforms);
                    this.applied = [];
                    if (transforms) {
                        this.transform();
                    }
                }
                if (this.model.hex !== hex) {
                    this.model._set('hex', hex);
                }
                if (this.model.designation !== designation) {
                    this.model._set('designation', designation);
                }

                if (designation) {
                    this.sectionMenu[0].hidden = true;
                    if (this.model['@subsection'] === 'sector') {
                        this.model._set('hexHref', '#swn-sector/' + seed + '/' + this.model.transforms);
                    } else if (this.model['@subsection'] === 'list') {
                        this.model._set('hexHref', '#swn-sector/' + seed + '/' + this.model.transforms + '/stars');
                    } else {
                        this.model._set('hexHref', '#swn-sector/' + seed + '/' + this.model.transforms + '/' + hex);
                    }
                    this.model._set('@subsection', 'world');
                    this.model._set('currentHex', this.getHexByCoord(hex));
                    this.model._set('currentWorld', this.getWorldByDesignation(this.model.currentHex, designation));
                } else if (hex) {
                    this.sectionMenu[0].hidden = true;
                    if (hex === 'stars') {
                        this.model._set('@subsection', 'list');
                        var flattenedArray = [];
                        for (var i = 0; i < this.model.hexes.length; i++) {
                            flattenedArray = flattenedArray.concat(this.model.hexes[i].filter(function(hex) {
                                return !!hex.name;
                            }));
                        }
                        this.model._set('flattenedArray', flattenedArray);
                    } else {
                        if (this.model['@subsection'] === 'list') {
                            this.model._set('sectorHref', '#swn-sector/' + seed + '/' + self.model.transforms + '/stars');
                        } else if (!this.model.sectorHref) {
                            this.model._set('sectorHref', '#swn-sector/' + seed + '/' + self.model.transforms);
                        }
                        this.model._set('@subsection', 'hex');
                        this.model._set('currentHex', this.getHexByCoord(hex));
                    }
                } else if (transforms) {
                    this.sectionMenu[0].hidden = false;
                    this.model._set('sectorHref', '#swn-sector/' + seed + '/' + transforms);
                    this.model._set('@subsection', 'sector');
                } else {
                    this.sectionMenu[0].hidden = false;
                    this.model._set('sectorHref', '#swn-sector/' + seed);
                    this.model._set('@subsection', 'sector');
                }

                if (this.model._parent._get('sectionMenu') !== this.sectionMenu) {
                    this.model._parent._set('sectionMenu', this.sectionMenu);
                }
            },

            getHexByCoord: function(coord) {
                var coords = coord.split('.');
                var x = Number(coords[0]);
                var y = Number(coords[1]);
                return this.model.hexes[x][y];
            },

            getWorldByDesignation: function(hex, designation) {
                for (var i = 0; i < hex.worlds.length; i++) {
                    if (hex.worlds[i].designation === designation) {
                        return hex.worlds[i];
                    }
                }
                window.location.replace('#swn-sector/' + this.model.seed + '/' + self.model.transforms + '/' + this.model.hex);
            },

            generate: function() {
                var self = this;
                random.getRandom(this.model.seed).done(function(rng) {
                    var name = roller(sector.name, rng.random);
                    self.model._set('name', name.start + ' ' + name.end);
                    var stars = self.getStars(rng.random);
                    stars = self.getWorlds(stars, rng.random);
                    var hexes = self.coordinate(stars);
                    self.model._set('hexes', hexes);
                });
            },

            cosmicNameSets: names.get([
                'Ancient Greek (male)',
                'Arabic (female)',
                'Arabic (surnames)',
                'Gothic (words)',
                'Latin (words)',
                'Middle English (words)',
                'Modern Greek (surnames)',
                'Russian (places)',
                'Spanish (surnames)',
                'Viking (female)'
            ]),

            capitalizeFirstLetter: function(val) {
                return val.charAt(0).toLocaleUpperCase() + val.slice(1);
            },

            worldCounts: [
                {
                    value: 1,
                    weight: 5
                },
                {
                    value: 2,
                    weight: 3
                },
                {
                    value: 3,
                    weight: 2
                }
            ],

            makeCoordinate: function(x, y) {
                return ('00' + x).slice(-2) + '.' + ('00' + y).slice(-2);
            }, 

            getCoordinateList: function() {
                var coordList = [];

                for (var x = 0; x < this.columns; x++) {
                    for (var y = 0; y < this.rows; y++) {
                        coordList.push(this.makeCoordinate(x, y));
                    }
                }

                return coordList;
            },

            getStars: function(random) {
                var starCount = Math.floor(random() * 10) + 21;
                var totalWorlds = 0;
                var stars = [];

                var starNames = roller({
                    template: this.cosmicNameSets,
                    random: random,
                    count: starCount,
                    unique: true
                });

                var worldCounts = roller({
                    template: this.worldCounts,
                    random: random,
                    count: starCount
                });

                var coordList = roller({
                    template: this.getCoordinateList(),
                    random: random,
                    count: starCount,
                    unique: true
                });

                for (var i = 0; i < starCount; i++) {
                    var star = {
                        name: this.capitalizeFirstLetter(starNames[i]),
                        coord: coordList[i]
                    };

                    if (totalWorlds + worldCounts[i] + (starCount - (i + 1)) > this.worldCap) {
                        star.worlds = 1;
                    } else {
                        star.worlds = worldCounts[i];
                    }
                    totalWorlds += star.worlds;

                    stars.push(star);
                }

                return stars;
            },

            romanNumerals: [ 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII' ],

            getWorlds: function(stars, random) {
                var totalWorlds = 0;
                for (var i = 0; i < stars.length; i++) {
                    totalWorlds += stars[i].worlds;
                }

                var worldNames = roller({
                    template: this.cosmicNameSets,
                    random: random,
                    count: totalWorlds,
                    unique: true
                });

                for (var i = 0; i < stars.length; i++) {
                    var designations = roller({
                        template: sector.designation,
                        random: random,
                        count: stars[i].worlds,
                        unique: true
                    });

                    var worlds = roller({
                        template: sector.world,
                        random: random,
                        count: stars[i].worlds
                    });

                    for (var n = 0; n < worlds.length; n++) {
                        worlds[n].name = this.capitalizeFirstLetter(worldNames.shift());
                        worlds[n].designation = designations[n];
                        worlds[n].fullDesignation = stars[i].name + ' ' + designations[n];
                    }

                    var romanNumerals = this.romanNumerals;
                    worlds.sort(function(a, b) {
                        return romanNumerals.indexOf(a.designation) - romanNumerals.indexOf(b.designation);
                    });

                    stars[i].worlds = worlds;
                }

                var tech5count = 0;
                var tech4OrHigher = [];
                for (var i = 0; i < stars.length; i++) {
                    for (var n = 0; n < stars[i].worlds.length; n++) {
                        var level = stars[i].worlds[n]['Tech Level'].Level;
                        if (level > "3") {
                            tech4OrHigher.push(stars[i].worlds[n]);
                        }
                        if (level === "5") {
                            tech5count++;
                        }
                    }
                }

                if (tech5count < this.minTL5) {
                    var tl5;
                    for (var i = 0; i < world['Tech Level'].length; i++) {
                        var techLevel = world['Tech Level'][i].value;
                        if (techLevel.Level === "5") {
                            tl5 = techLevel;
                            break;
                        }
                    }
                    var index = Math.floor(random() * tech4OrHigher.length);
                    tech4OrHigher[index]['Tech Level'] = tl5;
                }

                return stars;
            },

            coordinate: function(stars) {
                var hexes = [];

                for (var x = 0; x < this.columns; x++) {
                    hexes[x] = [];
                    for (var y = 0; y < this.rows; y++) {
                        var coord = this.makeCoordinate(x, y);
                        for (var i = 0; i < stars.length; i++) {
                            if (stars[i].coord === coord) {
                                hexes[x][y] = stars[i];
                                stars.splice(i, 1);
                                break;
                            }
                        }

                        hexes[x][y] = hexes[x][y] || {
                            coord: coord
                        };
                    }
                }

                return hexes;
            },

            transform: function() {
                var applied = this.applied;
                var transforms = this.model.transforms.split(',');
                var hexes = this.model.hexes;

                for (var i = 0; i < transforms.length; i++) {
                    if (transforms[i] !== applied[i]) {
                        applied[i] = transforms[i];
                        var swap = transforms[i].split('x');
                        if (swap.length === 2) {
                            var first = '0' + swap[0][0] + '.' + '0' + swap[0][1];
                            var second = '0' + swap[1][0] + '.' + '0' + swap[1][1];
                            var hex1 = null;
                            var hex2 = null;
                            for (var x = 0; x < hexes.length; x++) {
                                for (var y = 0; y < hexes[x].length; y++) {
                                    if (hexes[x][y].coord === first) {
                                        hex1 = {
                                            x: x,
                                            y: y,
                                            world: hexes[x][y]
                                        };
                                    }
                                    if (hexes[x][y].coord === second) {
                                        hex2 = {
                                            x: x,
                                            y: y,
                                            world: hexes[x][y]
                                        };
                                    }
                                    if (hex1 && hex2) {
                                        break;
                                    }
                                }
                                if (hex1 && hex2) {
                                    break;
                                }
                            }
                            if (hex1 && hex2) {
                                hexes[hex1.x][hex1.y] = hex2.world;
                                hexes[hex2.x][hex2.y] = hex1.world;
                                var temp = hex2.world.coord;
                                hexes[hex1.x][hex1.y].coord = hex1.world.coord;
                                hexes[hex2.x][hex2.y].coord = temp;
                            }
                        }
                    }
                }

                this.model._refresh();
            },
        });
    });
})(window.dynCore);