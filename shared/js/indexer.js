(function() {
    window.dynCore.declare('indexer',
        window.dynCore.require([
            'propGet.js',
            'arraySort.js',
            'binarySearch.js'
        ], '../shared/js/'),
        function(modules) {
            var indexer = {
                arrays: [],

                compareSorted: function(a, b) {
                    return modules.propGet.compare({key: a}, b, 'key');
                },

                indexArray: function(array, prop, promise) {
                    promise = promise || $.Deferred();

                    var index = {};
                    for (var i = 0; i < array.length; i++) {
                        var value = modules.propGet.get(array[i], prop);
                        index[value] = index[value] || [];
                        index[value].push(i);
                    }

                    for (var i = 0; i < indexer.arrays.length; i++) {
                        if (indexer.arrays[i] && indexer.arrays[i].array === array) {
                            indexer.arrays[i].indices[prop] = index;
                            promise.resolve();
                            return promise;
                        }
                    }

                    var sorted = [];
                    for (var key in index) {
                        sorted.push({
                            key: key,
                            val: index[key]
                        });
                    }
                    sorted.sortBy('key');

                    var result = {
                        array: array,
                        indices: {},
                        sorted: {}
                    };

                    result.indices[prop] = index;
                    result.sorted[prop] = sorted;

                    indexer.arrays.push(result);
                    promise.resolve();
                    return promise;
                },

                filter: function(array, indices) {
                    var a = [];
                    for (var i = 0; i < indices.length; i++) {
                        a.push(array[indices[i]]);
                    }
                    return a;
                },

                search: function(array, prop, values) {
                    var results = [];
                    if (!Array.isArray(values)) {
                        values = [values]
                    }

                    for (var i = 0; i < indexer.arrays.length; i++) {
                        if (indexer.arrays[i] && indexer.arrays[i].array === array) {
                            var index = indexer.arrays[i].indices[prop];
                            for (var key in index) {
                                for (var n = 0; n < values.length; n++) {
                                    if (key.toString().toLocaleLowerCase().includes(
                                        values[n].toString().toLocaleLowerCase())) {
                                        
                                        results = results.concat(index[key]);
                                    }
                                }
                            }
                            break;
                        }
                    }

                    return results;
                },

                startsWith: function(array, prop, values) {
                    var results = [];
                    if (!Array.isArray(values)) {
                        values = [values]
                    }

                    values.sort();
                    for (var i = 0; i < indexer.arrays.length; i++) {
                        if (indexer.arrays[i] && indexer.arrays[i].array === array) {
                            for (var v = 0; v < values.length; v++) {
                                var arr = indexer.arrays[i].sorted[prop];
                                var n = modules.binarySearch(arr, values[v], indexer.compareSorted);
                                if (n < 0) {
                                    n = Math.abs(n);
                                }
                                
                                while (arr[n].key.startsWith(values[v])) {
                                    n--;
                                }
                                n++;
                                
                                while (arr[n].key.startsWith(values[v])) {
                                    results = results.concat(arr[n].val);
                                    n++;
                                }
                            }
                            break;
                        }
                    }

                    return results;
                },

                get: function(array, prop, values) {
                    var results = [];
                    if (!Array.isArray(values)) {
                        values = [values]
                    }

                    for (var i = 0; i < indexer.arrays.length; i++) {
                        if (indexer.arrays[i] && indexer.arrays[i].array === array) {
                            for (var n = 0; n < values.length; n++) {
                                results = results.concat(indexer.arrays[i].indices[prop][values[n]]);
                            }
                            break;
                        }
                    }

                    return results;
                }
            };

            return indexer;
        }
    );
})();