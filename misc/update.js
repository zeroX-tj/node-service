function applyDiff(data, diff){
var obj = data;
if(diff.ppath.length){
    // sub-object
    diff.ppath.forEach((field)=>{
        obj = obj[field];
    });
}
switch(diff.type){
    case 'set':
        obj[diff.field] = diff.value;
        console.log('received set', diff.field, diff.value);
        //diff.path.push(diff.field);
        break;
    case 'push':
        obj[diff.field].push(diff.value[0]);
        console.log('received', diff.type, diff.field, diff.value);
        break;
    case 'unshift':
        obj[diff.field].unshift(diff.value[0]);
        console.log('received', diff.type, diff.field, diff.value);
        break;
    case 'pop':
        obj[diff.field].pop();
        console.log('received', diff.type, diff.field, diff.value);
        break;
    case 'shift':
        obj[diff.field].shift();
        console.log('received', diff.type, diff.field, diff.value);
        break;

}
}
exports.applyDiff = applyDiff;