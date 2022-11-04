var pathutil:any = {};
 
pathutil.NextFreeChild = function(path, max=3) {
    for (var i = 1; i <= max; i++) {
        var child = `child_${i}_id`;
        if (path[child] == null)
            return child;
    }
    return null;
}

module.exports = pathutil;