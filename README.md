# Google-Apps-Script---Sheets-to-Last.fm

Import tracks from a spreadsheet to your Last.FM

## Table of Contents

- [Use Case(s)](#Use-Case(s))
- [Work Flow](#Work-Flow)
- [Caveats](#Caveats)
- [Steps-for-Usage](#Steps-for-Usage)
- [Errors](#Errors)
- [TODO](#TODO)

## Use Case(s)

* Synchronize scrobbles between accounts
* Automate scrobbles to your Last.fm
* Link Google Sheets to your Last.fm via API

## Work Flow

1. Import Last.fm tracks you want scrobbled to Google Sheets (or create new Google Sheet).
2. Get access to Last.fm API.
3. Automatically scrobble these tracks to Last.fm.
4. The tracks get checked off in the Google Sheet as they get scrobbled.
5. [Optional] Receive an email on any failures with more details (error message, the row the failure occurred on, etc).

## Caveats

1. Your password is plainly saved in this script.
2. You can only scrobble so many songs at a time using this script because the URL length within the URLFetchApp function (used in the API call) cannot exceed the limit of 2KB or the script will fail. Right now 15 songs seems to be a good number (20 almost always fails, 16-19 is a crapshoot). When the URL string has too much data, the script will try 10 songs instead, and then 1 in hopes of passing the tracks generating all the extra data on to Last.fm via the API. Basically, if you have a lot of songs like I do, it may still take a long time to get them all scrobbled.
3. There is a daily limit to the number of total tracks scrobbled via API calls, I think it's 2800 as of Feb 2021.
4. The script occasionally failed generating a good API signature due to non-English characters in the track information (artist name, track name, etc). Thus, make sure you convert non-english characters to English and remove non-standard English text stuff (e.g. diacritics) manually:
   * The artist "緑" should be updatde to "Mr. Green"
   * The song "Project Pat (feat. Daz Léone)" by Supa Dupa Humble should be updated to "Project Pat (feat. Daz Leone)"
   
    ...and so forth. Looking for a good way to automate this, but for now I just did the following:
  
   1. In a new Google Doc, I inserted a bunch of special variations for each vowel using the "Insert special characters" functionality:

      * ĀāĂăĄąȀȁȂȃȦȧÀÁÃÄÅàáǡǠǟǞǎǍåäãâǺǻȺӐӑӒӓӔӕ
      * ĒēĔĕĖėĘęɘɇɆȩȨȇȆȅȄƐͤÈÉÊËèéêëĚěƎǝ
      * ĨĩȈȉÌÍÎÏìíîïĪīĬĭĮįǏǐȊȋ
      * ŐőȰȱÒÓÔÕÖØòóôõöøŌōŎŏƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȭȮȯОоӦӧӨөӪӫò
      * ŨũŰűȔȕȖȗÙÚÛÜùúûüŪūŬŭŮůƯưǓǔǕǖǗǘǙǚǛǜ

      Then in my primary Google Sheet, I did the following:

   1. Opened Find and Replace for the sheet with my tracks
   2. Made sure only "Search using regular expressions" was checked
   3. Searched each of the following, one by one:

       * [ĀāĂăĄąȀȁȂȃȦȧÀÁÃÄÅàáǡǠǟǞǎǍåäãâǺǻȺӐӑӒӓӔӕ]
       * [ĒēĔĕĖėĘęɘɇɆȩȨȇȆȅȄƐͤÈÉÊËèéêëĚěƎǝ]
       * [ĨĩȈȉÌÍÎÏìíîïĪīĬĭĮįǏǐȊȋ]
       * [ŐőȰȱÒÓÔÕÖØòóôõöøŌōŎŏƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȭȮȯОоӦӧӨөӪӫò]
       * [ŨũŰűȔȕȖȗÙÚÛÜùúûüŪūŬŭŮůƯưǓǔǕǖǗǘǙǚǛǜ]

        And replaced the finds with the respective vowel (a, e, i, o, u)

    4. If the script still fails because of the failed signature, that might require a manual update depending on what the issue was. For instance, the song "• CASTLEVANIA" by Jazz Cartier becomes "CASTLEVANIA", removing the bullet point, in order to be properly parsed by the API. It helps to filter your tracks' artists, albums and track names for blank spaces, weird characters, non-English text, etc. 

        * Yall artists need to standardize this madness! You're making it hell on the fans obsessed with coordinating their music library 😂.

## Steps for Usage

1. Export your scrobbles to a CSV using this wonderful site: https://lastfm.ghan.nl/export/. Import them into a new Google Sheet.
2. If you want to scrobble new tracks from a sheet instead, create a new sheet.
3. Create a new column to the right for checkboxes called **Scrobbled?** (the tracks will be checked off as the script operates). At this point, the column headers should be **uts, utc_time, artist, artist_mbid, album, album_mbid, track, track_mbid, and Scrobbled?**. _Working on a new sheet?_ Add these 9 items as column headers. Fill out the following required parameters (at minimum) for a track in the next line (each row is equal to one track): 
  - **artist**: name of the artist(s)
  - **track**: name of the track
  - **uts**: time the track started playing as a UTC UNIX timestamp. Examples: 
      - https://time.is/Unix_time_now
      - https://www.epochconverter.com/
      - `=("2/25/2021"-DATE(1970,1,1))*86400` or `=(now()-DATE(1970,1,1))*86400` on the Google Sheet. replace the date and/or add time as needed
4. Create a Last.fm API account for the account you want to use for automatic scrobbles: https://www.last.fm/api/account/create. Make sure it has a _Contact email, Application name, and Application description_. When you're finished, **save the API key and Shared secret somewhere**. Treat them like a password (as in, don't give them to a stranger, I'm aware it's crazy to put your password in this script as well). 
5. Create a new Google Script for your Google Sheet. Click Tools -> Script Editor and delete the script there. 
6. Paste the script here: https://github.com/rjmccallumbigl/Google-Apps-Script---Sheets-to-Last.fm/blob/main/lastfm/Code.gs
7. Create a new .gs script file called **deleteColumnsOrRows** and paste this script: https://github.com/rjmccallumbigl/Google-Apps-Script---Sheets-to-Last.fm/blob/main/lastfm/deleteColumnsOrRows.gs
8. Create a new .gs script file called **md5** and paste this script: https://github.com/rjmccallumbigl/Google-Apps-Script---Sheets-to-Last.fm/blob/main/lastfm/md5.gs
9. Create a new .gs script file called **Triggers** and paste this script: https://github.com/rjmccallumbigl/Google-Apps-Script---Sheets-to-Last.fm/blob/main/lastfm/Triggers.gs
10. Run the function **removeEmptyColumns()** to delete all the empty columns for your sheet(s). [Optional] Delete the empty rows too for maximum neatness.
11. Update the following object parameters in the **scrobbleTracks()** function, you will use your Last.fm account username & pw along with the api_key and secret you generated in step 4:
  ```javascript
  var ryanmcslomo = {  // Change if you'd like =D
    "username": "INSERT USERNAME HERE",
    "password": "INSERT PASSWORD HERE",
    "api_key": "INSERT API KEY HERE",
    "secret": "INSERT SECRET HERE"
  };
  ```
11. Change the variable `sheetName` to whatever the name of your sheet is. 
12. Run the function **primaryFunction()** to authenticate the script and confirm it works. Head to your Last.fm and confirm the scrobbles. Confirm the trigger was created so the script runs once a minute. Head to your sheet to see if the first few tracks got checked off. It should look something like this: 
![screenshot of my sheet](https://raw.githubusercontent.com/rjmccallumbigl/Google-Apps-Script---Sheets-to-Last.fm/main/screenshot.png)
13. If you don't want the script to run automatically on a trigger, you can comment out all calls to the **checkTrigger()** function in Code.gs. Then make sure your triggers are deleted by running **deleteTriggers()** in Triggers.gs.

## Errors

1. This error indicates the API failed to parse a track, possibly because [it couldn't pass the text through the API successfully](#Caveats).
    * `Exception: Request failed for http://ws.audioscrobbler.com returned code 400. Truncated server response: {"error":13,"message":"Invalid method signature supplied"} (use muteHttpExceptions option to examine full response)`

2. This error indicates you are rate limited by the API and have to wait a day to continue.
      * `Exception: Request failed for http://ws.audioscrobbler.com returned code 429. Truncated server response: {"error":29,"message":"Rate Limit Exceeded - Too many scrobbles in a short period. Please try again later."} (use muteHttpExceptions option to examine full response)`

## TODO

  * Possible fix for [error #1](#Errors) is to replace all non-ASCII characters with their standard equivalents automatically using RegEx
    - https://stackoverflow.com/questions/150033/regular-expression-to-match-non-ascii-characters
      - [^\x00-\x7F]+
      - [^\u0000-\u007F]+
      - [\u00C0-\u1FFF\u2C00-\uD7FF]
      - [\u00BF-\u1FFF\u2C00-\uD7FF]
      - [\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]
    - https://bytefreaks.net/programming-2/javascript/javasript-remove-all-non-printable-and-all-non-ascii-characters-from-text
      - [^ -~]+
    - https://stackoverflow.com/questions/20856197/remove-non-ascii-character-in-string
      - [\x00-\x08\x0E-\x1F\x7F-\uFFFF]
    - https://stackoverflow.com/questions/2668854/sanitizing-strings-to-make-them-url-and-filename-safe
      - Might be the best bet
        - https://stackoverflow.com/a/17186583/7954017
        - https://stackoverflow.com/a/7031325/7954017
        - https://stackoverflow.com/a/2727693/7954017
    - https://stackoverflow.com/questions/756567/regular-expression-for-excluding-special-characters/33966062
      - https://stackoverflow.com/a/1499398/7954017
    - https://stackoverflow.com/questions/2670037/how-to-remove-invalid-utf-8-characters-from-a-javascript-string
      - `var bytelike = unescape(encodeURIComponent(characters));`
      - `var characters = decodeURIComponent(escape(bytelike));`
