(function() {
    window.dynCore.declare('actuallyRandom', null, function() {
        var apiKey = '3790c32c-d334-4a6f-a893-7f588efa6e45';
        var baseObject = {
            jsonrpc: "2.0",
            params: {
                apiKey: apiKey,
                n: 50
            },
            id: Math.floor(Math.random() * 90000 + 9999)
        };

        var pending = {
            uuid: [],
            integer: []
        };

        var cache = {
            uuid: [],
            integer: []
        };

        var getRandom = function(type, args, innerParams) {
            var promise = $.Deferred();

            $.when.apply(this, pending[type]).always(function() {
                var value = cache[type].shift();
                if (value) {
                    promise.resolve(value);
                } else {
                    Object.assign(args, baseObject)
                    if (innerParams) {
                        Object.assign(args.params, innerParams);
                    }

                    $.ajax({
                        url: 'https://api.random.org/json-rpc/1/invoke',
                        method: 'POST',
                        data: JSON.stringify(args)
                    }).done(function(data) {
                        if (data.error) {
                            promise.reject(data.error);
                        } else {
                            cache[type] = cache[type].concat(data.result.random.data);
                            promise.resolve(cache[type].shift());
                        }
                    }).fail(function() {
                        promise.reject.apply(this, arguments);
                    });
                }
            });

            pending[type].push(promise);

            return promise.always(function() {
                var index = pending[type].indexOf(promise);
                if (index > -1) {
                    pending[type].splice(index, 1);
                }
            });
        };

        var actuallyRandom = {
            uuid: function() {
                return getRandom('uuid', {
                    method: 'generateUUIDs'
                });
            },

            integer: function(min, max) {
                min = min || 0;
                if (typeof max !== 'number') {
                    max = 100;
                }

                return getRandom('integer', {
                    method: 'generateIntegers'
                }, {
                    min: min,
                    max: max
                });
            },

            setBatchSize: function(count) {
                baseObject.params.n = count;
            }
        };

        return actuallyRandom;
    });
})();