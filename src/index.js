const Classifier = require('natural').BayesClassifier;
const signale = require('signale');
const Table = require('cli-table');

module.exports = class IntentDesire
{
  constructor(samples = [], inputMsg = '')
  {
    this.samples = samples;
    this.sampleClassifier = new Classifier();
    samples.forEach( (sample, index) => {
      this.sampleClassifier.addDocument(sample, index);
    });
    this.sampleClassifier.train();
    this.used = inputMsg;
  }

  /**
    * Get utterance used based on input msg
    */
  get utterance()
  {
    return this.samples[this.sampleClassifier.classify(this.used)];
  }

  /**
    * Get start and end indexes of all slots as pairs
    */
  get slotPositions()
  {
      var match;
      let openingBracket = RegExp('{', 'g');
      let closingBracket = RegExp('}', 'g');
      let openingBrackets = [];
      let closingBrackets = [];

      while ((match = openingBracket.exec(this.utterance)) !== null) { openingBrackets.push(match.index); }
      while ((match = closingBracket.exec(this.utterance)) !== null) { closingBrackets.push(match.index + 1); }

      let positions = [];
      while (closingBrackets.length > 0) {
          positions.push([openingBrackets.shift(), closingBrackets.shift()])
      }
      return positions;
  }

  /**
    * Get start and end indexes of all slots values as pairs
    */
  get slotValuePositions()
  {
      let utteranceTable = new Table({ head: ['Slot pos', 'Estimated pos', 'Stop word', 'Slot name', 'Estimated value'] });
      let startPos = -1;
      let endPos = -1;
      let slotPositions = this.slotPositions;

      signale.pending(`Processing slot values`);
      signale.info(`Utterace: ${this.utterance}`);
      signale.info(`UtteranceUsed: ${this.used}`);
      let valuePositions = slotPositions.map( ([openingBracket, closingBracket]) => {
          var stopWord = this.stopWord([openingBracket, closingBracket]); // Find stop word
          startPos = endPos + 1 + openingBracket;
          endPos = (stopWord != '') ? ((this.used.slice(startPos).indexOf(stopWord) - 1) + startPos): this.used.length;

          var [start, end] = [startPos, endPos];

          utteranceTable.push([
              `${openingBracket},${closingBracket}`, `${startPos},${endPos}`, stopWord, this.utterance.slice(openingBracket, closingBracket), this.used.slice(start, end)
          ]);

          // Reset end position based on offset difference
          endPos = (endPos - closingBracket) - 1;

          return [start, end];
      });

      console.log( utteranceTable.toString() );
      return valuePositions;
  }

  /**
    * Find stop word after slot position
    */
  stopWord(slotPosition)
  {
      let [startPos, endPos] = slotPosition;
      let [stopWord] = this.utterance.slice(endPos + 1).trim().split(' ');
      return stopWord;
  }

  /**
    * Get slot names
    */
  get slotNames()
  {
      return this.slotPositions.map( ([startPos, endPos]) => {
          return this.utterance.slice(startPos, endPos).replace('{', '').replace('}', '');
      });
  }

  /**
    * Get slot input values
    */
  get slotInputValues()
  {
      return this.slotValuePositions.map( ([startPos, endPos]) => {
          return this.used.slice(startPos, endPos);
      });
  }

  /**
    * Get input values as key value pairs
    */
  get input()
  {
      let [keys, values] = [this.slotNames, this.slotInputValues];

      let input = {};
      keys.forEach( (key, index) => {
          input[key] = values[index];
      });
      return input;
  }
};
