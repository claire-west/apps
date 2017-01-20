(function() {
    window.dynCore.declare('isInt', null, function() {
        return function(value) {
            return !isNaN(value) && 
                parseInt(Number(value)) == value && 
                !isNaN(parseInt(value, 10));
        };
    });
})();