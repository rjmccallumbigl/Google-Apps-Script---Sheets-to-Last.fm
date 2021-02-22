# Google-Apps-Script---Sheets-to-Last.fm
Import tracks from a spreadsheet to your Last.FM

## Use case

Last.fm does not allow you to change your username. I wanted my online accounts to synchronize, user name wise. My old Last.fm account has been saving streams since 2006 (150k+ tracks scrobbled). I wanted to move the streams to my newest account. This is not natively supported.  I thought I could export all of my scrobbles to a spreadsheet and import them into the new account. I was using a fantastic freeware app called [Last.fm-Scrubbler-WPF](https://github.com/SHOEGAZEssb/Last.fm-Scrubbler-WPF) to handle this, but Last.FM has a limit on the number of tracks you can import in a day. I couldn't automate the daily scrobbles using this tool. Thus, this Google Apps Script helps me automate this process.

## Caveats

1. You can only scrobble so many songs at a time using this script because the URL length within the URLFetchApp function (used in the API call) cannot exceed the limit of 2KB or the script will fail. Right now 15 songs seems to be a good number (20 almost always fails, 16-19 is a crapshoot). When the URL string has too much data, the script will try 10 songs instead, and then all the way down to 1 in hopes of passing the tracks generating all the extra data on to Last.fm via the API. Basically, if you have a lot of songs like I do, it may still take a long time to get them all scrobbled.
2. There is a daily limit to the number of total tracks scrobbled via API calls, I think it's 2800 as of Feb 2021.

## Steps for Usage
