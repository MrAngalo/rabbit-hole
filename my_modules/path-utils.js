var pathutil = {};
pathutil.NextFreeChild = function (path, max) {
    if (max === void 0) { max = 3; }
    for (var i = 1; i <= max; i++) {
        var child = "child_" + i + "_id";
        if (path[child])
            return child;
    }
    return null;
};
module.exports = pathutil;
