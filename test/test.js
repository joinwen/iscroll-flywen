var assert = require("assert");
var mocha = require("mocha");
const describe = mocha.describe;
const it = mocha.it;

describe("Array", function () {
  describe("#indexOf()", function () {
    it("should return -1 when value is not present", function () {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});
