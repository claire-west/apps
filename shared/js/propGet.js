(function() {
    window.dynCore.declare('propGet', function() {
        var propGet = {
            get: function(object, path) {
                var propArray = propGet.pathToArray(path);
                return propGet.propByPropArray(object, propArray);
            },

            pathToArray: function(properties) {
                var tempArray = properties.split("[").join(".").split("]").join(".").split(".");
                var propArray = [];
                for (var i = 0; i < tempArray.length; i++) {
                    if (tempArray[i] !== "") {
                        propArray.push(tempArray[i]);
                    }
                }
                return propArray;
            },

            propByPropArray: function(object, propArray, index) {
                if (!index) {
                    index = 0;
                }
                if (index === propArray.length - 1) {
                    return object[propArray[index]];
                }
                return propGet.propByPropArray(object[propArray[index]], propArray, ++index);
            },

            compare: function(a, b, properties) {
                var propArray = propGet.pathToArray(properties);
                var aVal = propGet.propByPropArray(a, propArray);
                var bVal = propGet.propByPropArray(b, propArray);
                if (typeof aVal === "string" && typeof bVal === "string") {
                    return aVal.toLocaleLowerCase().localeCompare(bVal.toLocaleLowerCase());
                }
                return bVal - aVal;
            }
        };

        return propGet;
    });
})();