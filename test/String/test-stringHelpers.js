var assert = require('assert');
var stringHelpers = require('../../String/stringHelpers');

describe('string helpers test', () => {
  describe('#underscoreToCamel()', () => {
    it('should return a camel string for a underscore string', () => {
      assert.equal('testUnderscoreToCamel', stringHelpers.underscoreToCamel('test_underscore_to_camel'));
      assert.equal('testUnderscoreToCamel', stringHelpers.underscoreToCamel('TeSt_Underscore_to_Camel'));
    });
  });

  describe('#camelToUnderscore()', () => {
    it('should return a underscore string for a camel string', () => {
      assert.equal('test_camel_to_underscore', stringHelpers.camelToUnderscore('testCamelToUnderscore'));
      assert.equal('test_camel_to_underscore', stringHelpers.camelToUnderscore('TestCamelToUnderscore'));
    });
  });
});
