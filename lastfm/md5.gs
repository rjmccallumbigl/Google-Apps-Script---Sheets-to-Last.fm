/***************************************************************************************************************************************
*
* Return API signature for all parameters with the secret appended. 
* https://github.com/theol93/LASTFM-REACT/blob/a1ef928c00334a94d54a76e1d2dbbdcdc1bdd59d/src/components/scroble/index.js#L33
*
* @param params {Object} All values that need to be hashed.
* @param secret {String} The secret that needs to be hashed.
* @return {Array} The formatted JSON array.
*
****************************************************************************************************************************************/

function getApiSignature(params, secret) {
		let keys = Object.keys(params);
		let string = "";
		keys.sort();
		keys.forEach(function (key) {
			string += key + params[key];
		});
		string += secret;
		return md5(string);
	}
  
/**
 * ------------------------------------------
 * https://gist.github.com/KEINOS/78cc23f37e55e848905fc4224483763d
 *   MD5 function for GAS(GoogleAppsScript)
 *
 * You can get a MD5 hash value and even a 4digit short Hash value of a string.
 * ------------------------------------------
 * Usage1:
 *   `=MD5("YourStringToHash")`
 *     or
 *   `=MD5( A1 )` with the same string at A1 cell
 *   result:
 *     `FCE7453B7462D9DE0C56AFCCFB756193`.
 *     For your sure-ness you can verify it in your terminal as below.
 *     `$ md5 -s "YourStringToHash"`
 * Usage2:
 *   `=MD5("YourStringToHash", true)` for short Hash
 *    result:
 *     `6MQH`
 *     Note that it has more conflict probability.
 *
 * How to install:
 *   Copy the scipt, pase it at [Tools]-[Script Editor]-[<YourProject>]
 *   or go https://script.google.com and paste it.
 *   For more details go:
 *     https://developers.google.com/apps-script/articles/
 * Latest version:
 *   https://gist.github.com/dotysan/36b99217fdc958465b62f84f66903f07
 * Author/Collaborator/Contributor:
 *   KEINOS @ https://github.com/keinos
 *   Alex Ivanov @ https://github.com/contributorpw
 +   Curtis Doty @ https://github.com/dotysan
 * Reference and thanks to:
 *   https://stackoverflow.com/questions/7994410/hash-of-a-cell-text-in-google-spreadsheet
 *   https://gist.github.com/KEINOS/78cc23f37e55e848905fc4224483763d#gistcomment-3129967
 *   https://gist.github.com/dotysan/36b99217fdc958465b62f84f66903f07
 *   https://developers.google.com/apps-script/reference/utilities/utilities#computedigestalgorithm-value
 *   https://cloud.google.com/dataprep/docs/html/Logical-Operators_57344671
 * ------------------------------------------
 *
 * @param {(string|Bytes[])} input The value to hash.
 * @param {boolean} isShortMode Set true for 4 digit shortend hash, else returns usual MD5 hash.
 * @return {string} The hashed input
 * @customfunction
 *
 */
function md5( input, isShortMode )
{
    var isShortMode = !!isShortMode; // Be sure to be bool
    var txtHash = '';
    var rawHash = Utilities.computeDigest(
                      Utilities.DigestAlgorithm.MD5,
                      input );
 
    if ( ! isShortMode ) {
        for ( i = 0; i < rawHash.length; i++ ) {

            var hashVal = rawHash[i];

            if ( hashVal < 0 ) {
                hashVal += 256;
            };
            if ( hashVal.toString( 16 ).length == 1 ) {
                txtHash += '0';
            };
            txtHash += hashVal.toString( 16 );
        };
    } else {
        for ( j = 0; j < 16; j += 8 ) {

            hashVal = ( rawHash[j]   + rawHash[j+1] + rawHash[j+2] + rawHash[j+3] )
                    ^ ( rawHash[j+4] + rawHash[j+5] + rawHash[j+6] + rawHash[j+7] );

            if ( hashVal < 0 ) {
                hashVal += 1024;
            };
            if ( hashVal.toString( 36 ).length == 1 ) {
                txtHash += "0";
            };

            txtHash += hashVal.toString( 36 );
        };
    };

    // change below to "txtHash.toUpperCase()" if needed
    return txtHash;

}
