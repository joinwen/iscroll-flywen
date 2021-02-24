import { startsWith } from "../src/utils/strUtil";
const { describe, it } = require("mocha");
const assert = require("assert");

describe("Babel usage suite", () => {
  it("should starts with me", () => {
    let res = startsWith("meta", "me");
    assert.equal(res, true);
  });
});
