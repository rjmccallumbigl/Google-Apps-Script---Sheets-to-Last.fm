/****************************************************************************************************************************************
*
* Run the function, with the default number of tracks per scrobble attempt. Upon failure, will keep trying with less tracks per attempt.
*
****************************************************************************************************************************************/

function primaryFunction() {

  // Limit on tracks to scrobble at one time (x - 1), URLFetchApp URL length cannot exceed the limit of 2KB or script will fail 
  // https://developers.google.com/apps-script/guides/services/quotas
  var numOfTracks = 16;

  // Name of the sheet with our Last.fm tracks
  var sheetName = "https://lastfm.ghan.nl/export/";

  // Declare variables for error messaging
  var errorString = "Scrobbling 1 track failed, check spreadsheet for broken track entry (maybe with the artist/album/track name)";
  var scriptProperties = PropertiesService.getScriptProperties();
  var currentRowProp = scriptProperties.getProperty("currentRow");

  // If currentRow prop doesn't exist, set to first row
  if (currentRowProp == null) {
    currentRowProp = scriptProperties.setProperty("currentRow", 1);
  }

  var currentRow = Number(currentRowProp);
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  var spreadsheetURL = spreadsheet.getUrl();
  var sheetGID = sheet.getSheetId();
  var rangeNotation = "A" + (currentRow + 1) + ":I" + (currentRow + 1);
  var trackURL = spreadsheetURL + "#gid=" + sheetGID + "&range=" + rangeNotation;
  var emailBody = "";
  var rangeA1 = sheet.getRange("A1");
  var rangeA1Value = rangeA1.getDisplayValue();
  var rangeA1Note = (rangeA1.getNote() ? rangeA1.getNote() : rangeA1.setNote("URL to last entry"));

  // Run our script, if it fails, retry with 10 tracks...then 1...then send an email asking for help if we need it
  try {
    scrobbleTracks(numOfTracks, scriptProperties);
    checkTrigger(scriptProperties, "minute");
  } catch (e) {
    console.log("Scrobbling " + (numOfTracks - 1) + " tracks failed, trying 10");
    console.log(e);
    checkTrigger(scriptProperties, "minute");
    try {
      scrobbleTracks(11, scriptProperties);
    } catch (e) {
      console.log("Scrobbling 10 tracks failed, trying 1");
      console.log(e);
      checkTrigger(scriptProperties, "minute");
      try {
        scrobbleTracks(2, scriptProperties);
      } catch (e) {
        // Log errors for manual fixing
        console.error(errorString);
        console.error(trackURL);
        console.error(e);

        /**
         * This error indicates the API failed to parse a track
         * ================================================================================
         * Exception: Request failed for http://ws.audioscrobbler.com returned code 
         * 400. Truncated server response: {"error":13,"message":"Invalid method 
         * signature supplied"} (use muteHttpExceptions option to examine full 
         * response) 
         * 
         * This error indicates you rate limited the API and have to wait a day to continue
         * ================================================================================
         * Exception: Request failed for http://ws.audioscrobbler.com returned code 
         * 429. Truncated server response: {"error":29,"message":"Rate Limit Exceeded 
         * - Too many scrobbles in a short period. Please try again later."} (use 
         * muteHttpExceptions option to examine full response) 
         * 
         **/
         
        // If reached API limit, automate trigger to wait 1 day to reset API limit
        if (String(e).indexOf('"error":29') > -1) {
          checkTrigger(scriptProperties, "day");
        }

        // Send email with the latest error
        emailBody = "Error: " + errorString + "\n\n" + "Track: " + sheet.getRange(rangeNotation).getDisplayValues().join(" | ") + "\n\n" + e + "\n\n" + trackURL;
        console.log(emailBody);

        // MailApp.sendEmail(Session.getEffectiveUser().getEmail(), "Error in the script for " + spreadsheet.getName(), emailBody);
        //ErrorMessage; // Actually log a failure via the Trigger by calling a not-defined function, commenting out for now
        // console.log("Sent email!");

        //  Skip broken track if something's up with the text, set property for next run by iterating the currentRow property
        if (String(e).indexOf('"error":13') > -1) {
          scriptProperties.setProperty("currentRow", currentRow + 1);
        }
      }
    }
  }

  // Update A1 with our last run track's hyperlink for easy direct access
  rangeA1.setValue('=HYPERLINK("' + trackURL + '", "' + rangeA1Value + '")');
}

/****************************************************************************************************************************************
*
* Scrobble tracks from sheet to Last.FM.
*
* @params numOfTracks {Number} However many tracks we're attempting to scrobble at one time
* @params scriptProperties {Object} Current properties of script, persists per session until overwritten
*
* References
* https://www.last.fm/api/show/track.scrobble
* https://github.com/leemm/last.fm.api/blob/6f8222b800ee3827eb251aefb3153df18561c36c/examples/track.js
* https://github.com/chick-p/slack-nowplaying-lastfm-gas/blob/master/slack-nowplaying-lastfm-gas.gs
*
****************************************************************************************************************************************/

function scrobbleTracks(numOfTracks, scriptProperties) {

  // DEBUG
  // var scriptProperties = PropertiesService.getScriptProperties();
  // scriptProperties.setProperty("currentRow", 31);
  // console.log(Number(scriptProperties.getProperty("currentRow")))
  // var setScrobbleLimit = 2; // Do one at a time  
  // var currentRow = 1; //DEBUG

  //  Declare variables
  var setScrobbleLimit = numOfTracks;
  var sheetName = "https://lastfm.ghan.nl/export/";
  var currentRow = Number(scriptProperties.getProperty("currentRow"));
  console.log("Current row is " + currentRow);

var ryanmcslomo = { // Change if you'd like =D
    "username": "INSERT USERNAME HERE",
    "password": "INSERT PASSWORD HERE",
    "api_key": "INSERT API KEY HERE",
    "secret": "INSERT SECRET HERE"
  };

  //  Authenticate Last.FM session through API
  var lastFMAuth = getLastFMAuth(ryanmcslomo);
  console.log(lastFMAuth);

  //  Get the tracks that need to be scrobbled
  var gotTracks = getTracks(currentRow, sheetName);

  // Construct the URL to pass to the API 
  var urlFull = stringifyAPIURL(gotTracks, lastFMAuth, setScrobbleLimit);

  // Call the API to scrobble our tracks
  var response = UrlFetchApp.fetch(urlFull, { method: "POST" });

  // Get the returned output from our call to the API
  var responseText = response.getContentText();
  var responseTextJSON = JSON.parse(responseText);
  console.log(responseText);

  // See how many tracks were successfully scrobbled
  var success = responseTextJSON.scrobbles['@attr'].accepted;

  //  Set property for next run by iterating the currentRow property by however many successful passes to Last.FM API we had
  scriptProperties.setProperty("currentRow", currentRow + success);

  // Check the boxes for tracks passed to Last.FM API (whether or not they were successfully scrobbled)
  setCheckedBoxes(Number(currentRow), success, sheetName);
}

/****************************************************************************************************************************************
*
* Check the boxes for tracks passed to Last.FM API (whether or not they were successfully scrobbled)
*
* @param currentRow {Number} The row we started the current run on.
* @param success {Number} The number of tracks successfully passed to the Last.FM API (whether they were scrobbled or ignored is not my 
  worry at this time)
* @param sheetName {String} The name of the primary sheet with our Last.FM tracks.
*
****************************************************************************************************************************************/

function setCheckedBoxes(currentRow, success, sheetName) {

  //  Declare variables
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  var lastCol = sheet.getLastColumn();
  var sheetRange = sheet.getRange(currentRow + 1, lastCol, success, 1);

  // Create 2D array of TRUE values to check the boxes of parsed tracks
  var checkboxes = [];
  for (var i = 0; i < success; i++) {
    checkboxes[i] = [];
    for (var j = 0; j < 1; j++) {
      checkboxes[i][j] = true;
    }
  }

  // Set boxes to checked to indicate the track was sent to Last.FM
  var sheetValues = sheetRange.setValues(checkboxes).getA1Notation();
  var successfulMessage = "Checked " + success + " boxes in last column from row " + (currentRow + 1) + " to row " + (currentRow + success) + " (" + sheetValues + ")";
  console.log(successfulMessage);
}

/****************************************************************************************************************************************
*
* Push the tracks we need to scrobble into a single string to pass to the API.
*
* @param gotTracks {Object} The object with the last row we're on and our array of collected tracks.
* @param lastFMAuth {Object} Authenticated Last.FM session through API.
* @param setScrobbleLimit {Number} Tracks to scrobble at one time. Currently limited by URL size of API call, if script fails 
  because of this may have to shrink even more
*
* References
* https://github.com/theol93/LASTFM-REACT/blob/a1ef928c00334a94d54a76e1d2dbbdcdc1bdd59d/src/components/scroble/index.js#L33
*
****************************************************************************************************************************************/

function stringifyAPIURL(gotTracks, lastFMAuth, setScrobbleLimit) {

  // Construct parameters for each array entry 
  var params = {};
  var url = "http://ws.audioscrobbler.com/2.0/?method=track.scrobble";
  var api_key = "&api_key=" + lastFMAuth.api_key;
  var sk = "&sk=" + lastFMAuth.mobileSessionResponseText.session.key;
  var timestamp = +new Date() / 1000;
  var urlFull = url;

  //  Go through array one member at a time
  for (var x = 1; x < setScrobbleLimit; x++) {

    // Update variables for each track
    var artist = encodeURIComponent(gotTracks.arrayOfTracks[x].artist);
    var track = encodeURIComponent(gotTracks.arrayOfTracks[x].track);
    var album = encodeURIComponent(gotTracks.arrayOfTracks[x].album);
    var mbid = encodeURIComponent(gotTracks.arrayOfTracks[x].mbid);
    // var timestamp = Math.floor(gotTracks.arrayOfTracks[x].timestamp); // leaving out, counting timestamp too long ago ignores track - ignoredMessage:{"code":"1"}
    var arrayEntry = "[" + (x - 1) + "]"; // necessary for batch API calls

    // Construct parameters for API signature
    params.method = "track.scrobble";
    params.api_key = lastFMAuth.api_key;
    params.sk = lastFMAuth.mobileSessionResponseText.session.key;
    params["track" + arrayEntry] = gotTracks.arrayOfTracks[x].track;
    params["artist" + arrayEntry] = gotTracks.arrayOfTracks[x].artist;
    params["timestamp" + arrayEntry] = timestamp;
    // params.timestamp = gotTracks.arrayOfTracks[x].timestamp; // leaving out, counting timestamp too long ago ignores track - ignoredMessage:{"code":"1"}

    // Optional adds since the tracks may not have an album or mbid
    if (album) {
      params["album" + arrayEntry] = gotTracks.arrayOfTracks[x].album;
    }
    if (mbid) {
      params["mbid" + arrayEntry] = gotTracks.arrayOfTracks[x].mbid;
    }

    // Construct the URL component for this track
    urlFull += "&artist" + arrayEntry + "=" + artist + "&track" + arrayEntry + "=" + track + "&timestamp" + arrayEntry + "=" + encodeURIComponent(timestamp);

    // Optional adds since the tracks may not have an album or mbid
    if (album) {
      urlFull += "&album" + arrayEntry + "=" + album;
    }
    if (mbid) {
      urlFull += "&mbid" + arrayEntry + "=" + mbid;
    }
  }

  // Get API signature from constructed params then pass it to the final URL
  var api_sig = getApiSignature(params, lastFMAuth.secret);
  var api_sigStr = "&api_sig=" + api_sig;

  // Construct and return the final URL to pass to the API for scrobbling
  urlFull += api_key + api_sigStr + sk + "&format=json";
  console.log(urlFull);
  return urlFull;
}

/****************************************************************************************************************************************
*
* Get the next tracks to scrobble limited by Last.FM API maximum tracks per call (50 as of 2021).
*
* @param currentRow {Number} The number our row count should start at.
* @param sheetName {String} The name of the primary sheet with our Last.FM tracks.
* @return {Object} The object with the last row we're on and our array of collected tracks.
*
****************************************************************************************************************************************/

function getTracks(currentRow, sheetName) {

  //  Declare variables
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  var lastRow = 50; // API limited by 50
  var lastCol = sheet.getLastColumn();
  var headerRow = 1;
  var endRow = currentRow + lastRow;
  var sheetRange = sheet.getRange(headerRow + currentRow, 1, lastRow, lastCol);
  var sheetValues = sheetRange.getDisplayValues();
  var headerRowRange = sheet.getRange(headerRow, 1, 1, lastCol);
  var headerRowValues = headerRowRange.getDisplayValues();
  var arrayOfTracks = "";

  //  Turn into a JSON array for API
  if (headerRow + currentRow > 1) {

    // If the array doesn't already include the header row, throw it in there for our JSON array
    arrayOfTracks = getArrayofTracks(headerRowValues.concat(sheetValues));
  } else {
    arrayOfTracks = getArrayofTracks(sheetValues);
  }

  //  Return the value of the last row we're on and our array of collected tracks
  return {
    "endRow": endRow,
    "arrayOfTracks": arrayOfTracks
  };
}

/***************************************************************************************************************************************
*
* Build an object of the requested tracks to be parsed by the API.
*
* @param sheetValues {Array} The array of sheet values that will be parsed by the function.
* @return {Array} The formatted JSON array.
*
****************************************************************************************************************************************/

function getArrayofTracks(sheetValues) {

  //  Declare variables
  var trackingArray = [];

  //  Return column headers
  var uts = sheetValues[0].indexOf("uts");
  var utc_time = sheetValues[0].indexOf("utc_time"); // not parsed by track.scrobble method
  var artist = sheetValues[0].indexOf("artist");
  var artist_mbid = sheetValues[0].indexOf("artist_mbid"); // not parsed by track.scrobble method
  var album = sheetValues[0].indexOf("album");
  var album_mbid = sheetValues[0].indexOf("album_mbid"); // not parsed by track.scrobble method
  var track = sheetValues[0].indexOf("track");
  var track_mbid = sheetValues[0].indexOf("track_mbid");

  //  Format variables as objects pushing to an array of tracks for this session
  for (var row = 0; row < sheetValues.length; row++) {
    trackingArray.push(
      {
        "artist": sheetValues[row][artist],
        "track": sheetValues[row][track],
        "timestamp": sheetValues[row][uts],
        "album": sheetValues[row][album],
        "mbid": sheetValues[row][track_mbid]
      }
    );
  }

  // Return for parsing
  return trackingArray;
}

/***************************************************************************************************************************************
*
* Authenticate current Last.FM session
*
* @param ryanmcslomo {Object} The user object with related variables.
*
* References
* https://www.last.fm/api/mobileauth
* https://www.last.fm/api/desktopauth
* https://www.last.fm/api/webauth
* https://www.last.fm/api/authspec
*
****************************************************************************************************************************************/

function getLastFMAuth(ryanmcslomo) {

  //  Set option parameters
  var options = {
    "method": "POST",
    "muteHttpExceptions": true,
  };

  // Fetch a session key for our user 
  ryanmcslomo.mobile_api_sig = md5("api_key" + ryanmcslomo.api_key + "methodauth.getMobileSessionpassword" + ryanmcslomo.password + "username" + ryanmcslomo.username + ryanmcslomo.secret);

  //  Construct URL, connect API
  var mobileSessionURL = "https://ws.audioscrobbler.com/2.0/?method=auth.getMobileSession&password=" + ryanmcslomo.password + "&username=" + ryanmcslomo.username + "&api_key=" +
    ryanmcslomo.api_key + "&api_sig=" + ryanmcslomo.mobile_api_sig + "&format=json";
  var mobileSessionResponse = UrlFetchApp.fetch(mobileSessionURL, options);
  ryanmcslomo.mobileSessionResponseText = JSON.parse(mobileSessionResponse.getContentText());

  // return authenticated user session object
  return ryanmcslomo;
}
