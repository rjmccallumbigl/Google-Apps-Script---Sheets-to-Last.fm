# Google-Apps-Script---Sheets-to-Last.fm
Import tracks from a spreadsheet to your Last.FM

## Use case

* Synchronize scrobbles between accounts
* Automate scrobbles to your Last.fm
* Link Google Sheets to your Last.fm via API

## Work flow
1. Import Last.fm tracks you want scrobbled to Google Sheets.
2. Get access to Last.fm API.
3. Automatically scrobble these tracks to Last.fm.
4. The tracks get checked off in the Google Sheet as they get scrobbled.
5. Receive an email on any failures with more details (error message, the row the failure occurred on, etc).

## Caveats

1. You can only scrobble so many songs at a time using this script because the URL length within the URLFetchApp function (used in the API call) cannot exceed the limit of 2KB or the script will fail. Right now 15 songs seems to be a good number (20 almost always fails, 16-19 is a crapshoot). When the URL string has too much data, the script will try 10 songs instead, and then 1 in hopes of passing the tracks generating all the extra data on to Last.fm via the API. Basically, if you have a lot of songs like I do, it may still take a long time to get them all scrobbled.
2. There is a daily limit to the number of total tracks scrobbled via API calls, I think it's 2800 as of Feb 2021.
3. The script occasionally failed generating a good API signature due to non-English characters in the track information (artist name, track name, etc). Thus, make sure you convert non-english characters to English and remove weird text stuff manually:
   * The artist "緑" becomes "Mr. Green"
   * The song "Project Pat (feat. Daz Léone)" by Supa Dupa Humble becomes "Project Pat (feat. Daz Leone)"
   
    ...and so forth. Looking for a good way to automate this, but for now I just did the following:
  
   1. In a new Google Doc, I inserted special variations for each vowel using the "Insert special characters" functionality:

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
1. Export your scrobbles to a CSV using this wonderful site: https://lastfm.ghan.nl/export/
2. Import them into a new Google Sheet.
3. Create a new column for checkmarks (the tracks will be checked off as the script operates). At this point, the column headers should be **uts, utc_time, artist, artist_mbid, album, album_mbid, track, track_mbid, and Scrobbled**.
4. Create a Last.fm API account for the account you want to use for automatic scrobbles: https://www.last.fm/api/account/create. Make sure it has a _Contact email, Application name, and Application description_. When you're finished, **save the API key and Shared secret somewhere**. Treat them like a password.
5. Create a new Google Script for your Google Sheet. Click Tools -> Script Editor and delete the script there. 
6. Paste the script here: https://github.com/rjmccallumbigl/Google-Apps-Script---Sheets-to-Last.fm/blob/main/lastfm/Code.gs
7. Create a new .gs script file and paste this script: https://github.com/rjmccallumbigl/Google-Apps-Script---Sheets-to-Last.fm/blob/main/lastfm/deleteColumnsOrRows.gs
8. Create a new .gs script file and paste this script: https://github.com/rjmccallumbigl/Google-Apps-Script---Sheets-to-Last.fm/blob/main/lastfm/md5.gs
9. Run the function removeEmptyColumns() to delete all the empty columns for your sheet.
10. Update the following object parameters in the scrobbleTracks() function, you will use your Last.fm account user & pw along with the api_key and secret you generated in step 4:
  ```javascript
  var ryanmcslomo = {  // Change if you'd like =D
    "username": "INSERT USERNAME HERE",
    "password": "INSERT PASSWORD HERE",
    "api_key": "INSERT API KEY HERE",
    "secret": "INSERT SECRET HERE"
  };
  ```
11. Change the variable `sheetName` to whatever the name of your sheet is. 
12. Run the function primaryFunction() to authenticate the script and confirm it works. Head to your Last.fm and confirm the scrobbles. Head to your sheet to see if the first few tracks got checked off. It should look something like this: 
![screenshot of my sheet](https://raw.githubusercontent.com/rjmccallumbigl/Google-Apps-Script---Sheets-to-Last.fm/main/screenshot.png)
13. Create a new trigger with the following parameters: **primaryFunction(), Time-driven, Minutes timer, Every minute**. Now the script will run once a minute. You can delete this trigger if you need to troubleshoot without receiving a new email every minute.
14. TODO: will automate the part with the trigger.
