const IntentDesire = require('./src/index');
const Table = require('cli-table');

let samples = [
  'how much for {ProductName}'
];
let utterance = 'how much for Book';

console.log(new IntentDesire(samples, utterance).input);
