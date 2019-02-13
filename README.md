# overwatch-league-skill
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/jpburnett/overwatch-league-skill/master/LICENSE)
<p align="center">
  <b>The Overwatch League Alexa Skill</b><br>
  <a href="https://www.overwatchleague.com">Overwatch League Website</a> |
  <a href="https://www.amazon.com/Parker-Burnett-Overwatch-League/dp/B079T6GPXD/ref=sr_1_2?s=digital-skills&ie=UTF8&qid=1519791836&sr=1-2&keywords=Overwatch+League">Link To Enable Alexa Skill</a> | 
  <a href="http://alexa.parkerburnett.com">Privacy Policy Page</a>
  <br><br>
  <img src="https://bnetcmsus-a.akamaihd.net/cms/blog_thumbnail/sk/SK64HITB0XB41544562348016.jpg">
  
  <p align="center" font="32pt"> WELCOME TO SEASON 2! </p>
  
</p>

## What Does the Skill Do?
The Overwatch League Skill gives information about the overwatch league game schedule and scores. 

Here is a list of current features that you can ask Alexa:

1. When a team plays next:
   - Ex. "Alexa open Overwatch League and ask When does the {**team name**} play next?" Team names being Outlaws, Dynasty, etc.
   
   Alexa will respond with the date and time of the requested teams game. Provided you granted access to your location the times should be time zone adjusted to your time zone.
   
2. Who plays today/tonight:
   - Ex. "Alexa open Overwatch League and ask who plays today/tonight". 
  
    Alexa will give you a list of the teams that will be playing that night and give the times of the scheduled games.
    
3. Who the top teams are:
   - Ex. "Alexa open Overwatch League and ask who the top team is". 
   
   This will tell you the number one team in the league with their wins and losses.
   - Ex. "Alexa open Overwatch League and ask who the top teams are". 
   
   This will default with giving you the Top three teams in the league.
   - Ex. "Alexa open Overwatch League and ask who the top {**any number**} teams are". 
   
   This case depends on how many number of teams you ask for. It can be any number from 1 to 12. You are welcome to try other numbers :wink:
   
4. A teams record:
   - Ex. "Alexa open Overwatch League and tell me the record of the {**team name**}"
   
   Or
   - Ex. "Alexa open Overwatch League and tell me what's the record for the {**team name**}"
   
   Alexa will give you the record of wins and losses of the requested team. There are other variations as to how you could phrase this question, hopefully we covered them all. 


## Acknowledgements
Overwatch League is a brand and trademark of Blizzard Entertainment. Thank you to Blizzard and the Overwatch League Devs for providing/allowing the use of the API. It has been a fun side project working on this! 

We hope to add more features as time goes on.

# When deploying code for the Alexa Skill, make sure to do the following 4 steps:

1. ```pip install -r py/requirements.txt -t skill_env```

2. ```cp -r py/* skill_env/```

3. Zip the contents of the skill_env folder. Zip the contents of the folder and NOT the folder itself. If you zip the folder it will not work

4. Upload the .ZIP file to the AWS Lambda console
