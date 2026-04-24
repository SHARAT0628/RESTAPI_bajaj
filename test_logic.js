const { processHierarchy } = require('./backend/logic');

const testData = {
 "data": [
 "A->B", "A->C", "B->D", "C->E", "E->F",
 "X->Y", "Y->Z", "Z->X",
 "P->Q", "Q->R",
 "G->H", "G->H", "G->I",
 "hello", "1->2", "A->"
 ]
};

const result = processHierarchy(testData.data);
console.log(JSON.stringify(result, null, 2));
