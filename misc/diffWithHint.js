var differ = require("deep-diff");

module.exports = function diffWithHint(lhs, rhs, hint){
    var lhsWithHint = lhs;
    var rhsWithHint = rhs;
    var i = 0;

    while(i < hint.length){
        // Stop if add or delete.
        if (!(hint in lhsWithHint) || !(hint in rhsWithHint)){
            break
        }

        lhsWithHint = lhsWithHint[hint[i]];
        rhsWithHint = rhsWithHint[hint[i]];
        i++;
    }

    var hintUsed = hint.slice(0,i);

    var diffs = differ(lhs, rhs);
    diffs.forEach(function(diff){
        diff.path = hintUsed.concat(diff.path);
    });

    return diffs;
};