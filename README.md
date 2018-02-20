# overwatch-league-skill
<p align="center">
  <b>The Overwatch League Alexa Skill</b><br>
  <a href="https://www.overwatchleague.com">Overwatch League Website</a> |
  <a href="#">Future Link To Alexa Skill Page</a>
  <br><br>
  <img src="https://bnetcmsus-a.akamaihd.net/cms/blog_thumbnail/xf/XFBEYMDR8ITH1512405756014.jpg">
</p>

## What the Skill Does?
The Overwatch League Skill gives information about the overwatch league game schedule and scores. 

Here is a list of current features:

1. Ask Alexa when any team plays next.
   - Ex. "Alexa open Overwatch League and ask "When does the {**team name**} play next? Team names being Outlaws, Dynasty, etc.
   
   Alexa will respond with the date and time of the requested teams game. Provided you granted access to your location the times should be time zone adjusted to your time zone.


## Acknowledgements
Overwatch League is a brand and trademark of Blizzard Entertainment. Thank you to Blizzard and the Overwatch League Devs for providing/allowing the use of the API. It has been a fun side project working on this! 

We hope to add more features as time goes on.

# Setting Up a Local Test Environment
1. Clone the Repo.
2. Run ```npm init``` and follow the node pacakge setup.
3. Install the alexa-sdk dependency, ```npm install --save alexa-sdk```.
4. Copy main.js, context.json and event.json from alexasim to the same level as your working code (index.js).
   Note: The alexasim directory contains the minimum amount of code (barring the alexa-sdk module) needed to
   create a local Alexa test enviorment.
5. Modify the event.json to match the Alexa request/responses format (you can use the Alexa
   documentation, templates from Amazon and modify them or capture json requests from an Alexa
   simulator).
6. Run ```node main.js```
