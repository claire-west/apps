(function() {
    window.dynCore.declare('isInt', function() {
        return function(value) {
            return !isNaN(value) && 
                parseInt(Number(value)) == value && 
                !isNaN(parseInt(value, 10));
        };
    });
})();