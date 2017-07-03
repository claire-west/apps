(function() {
    window.dynCore.declare('xml', null, function() {

        var parse = function(element) {

            var object = {
                $: {}
            };
            if (element.attributes) {
                for (var i = 0; i < element.attributes.length; i++) {
                    var attribute = element.attributes[i];
                    object.$[attribute.localName] = attribute.value;
                }
            }

            $(element).children().each(function(i, item) {
                var child = parse(item);
                var name = item.tagName.split(':').splice(1).join(':') || item.tagName;

                if (object[name] && !Array.isArray(object[name])) {
                    object[name] = [ object[name], child ];
                } else {
                    object[name] = child;
                }
            });

            return object;
        };

        var xmlToJson = function($doc) {
            return parse($doc.get(0));
        };

        var xml = {
            ajax: function() {
                var promise = $.Deferred();
                try {
                    $.ajax.apply(this, arguments).done(function(resp) {
                        var $doc = $(resp);
                        var object = xmlToJson($doc);
                        promise.resolve(object);
                    }).fail(function(resp, e) {
                        promise.reject(e);
                    });
                } catch (e) {
                    promise.reject(e);
                }
                return promise;
            }
        };

        return xml;
    });
})();