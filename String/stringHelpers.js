module.exports = {
	camelToUnderscore: camelStr => {
    // turn first to lower case
    camelStr = camelStr.replace(camelStr.substr(0,1), camelStr.substr(0,1).toLowerCase());

    return camelStr.replace(/([a-z]*)([A-Z])/g, '$1_$2').toLowerCase();
  },

  underscoreToCamel: underscoreStr => {
    return underscoreStr.toLowerCase().replace(/(_)([a-z])/g, match => {
      return match.charAt(1).toUpperCase();
    });
  }
}
