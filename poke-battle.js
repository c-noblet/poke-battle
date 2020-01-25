require('isomorphic-fetch');
const CronJob = require('./node_modules/cron').CronJob;
const Twitter = require('twitter');
const Jimp = require('jimp');
const options = require('./options.json');
const fs = require('fs');
var utils = require('./utils');

//const cronJob = new CronJob('0 10,16 * * *', function() {
  var client = new Twitter(options);

  var font;
  var timestamp = Date.now();
  var stadiums = fs.readdirSync('./assets/stadiums/').sort();
  var pkmnsFront = fs.readdirSync('./assets/pkmns-front/4g/').sort();
  var trainersFront = fs.readdirSync('./assets/trainers-front/');
  var pkmnsBack = fs.readdirSync('./assets/pkmns-back/4g/').sort();
  var trainersBack = fs.readdirSync('./assets/trainers-back/').sort();

  var hash = utils.sha256(timestamp);
  var shinyDrop1 = Math.floor((Math.random() * 8192) + 1);
  var shinyDrop2 = Math.floor((Math.random() * 8192) + 1);
  var battle = {
    stadium: 'assets/stadiums/'+stadiums[(parseInt('0x' + hash.substring(0, 4)) % stadiums.length)],
    pkmnFront: 'assets/pkmns-front/4g/'+pkmnsFront[(parseInt('0x' + hash.substring(5, 13)) % pkmnsFront.length)],
    trainerFront: 'assets/trainers-front/'+trainersFront[(parseInt('0x' + hash.substring(14, 18)) % trainersFront.length)],
    pkmnBack: 'assets/pkmns-back/4g/'+pkmnsBack[(parseInt('0x' + hash.substring(19, 27)) % pkmnsBack.length)],
    trainerBack: 'assets/trainers-back/'+trainersBack[(parseInt('0x' + hash.substring(28, 32)) % trainersBack.length)],
  };
  console.log(battle);
  if(battle.pkmnFront.indexOf('_s') !== -1){
    battle.pkmnFront = battle.pkmnFront.replace('_s', '');
  }
  if(battle.pkmnBack.indexOf('_s') !== -1){
    battle.pkmnBack = battle.pkmnBack.replace('_s', '');
  }

  if(shinyDrop1 == 1){
    battle.pkmnFront = battle.pkmnFront.replace('.png', '_s.png');
  }
  if(shinyDrop2 == 1){
    battle.pkmnFront = battle.pkmnBack.replace('.png', '_s.png');
  }
  var frontPositionY;
  var fontPositionY;
  var backPositionX;
  if(battle.stadium.indexOf('gen3') !== -1){
    font = './assets/font/pokedex-white.fnt';
    frontPositionY = 74;
    fontPositionY = 334;
    backPositionX = 10;
  }else{
    font = './assets/font/pokedex-black.fnt'
    frontPositionY = 60;
    fontPositionY = 331;
    backPositionX = 3;
  }
  var trainerArray = battle.trainerFront.split('_');
  var trainerName;
  var trainerType;

  var gender = trainerArray[3].substr(0,1);

  if( gender == 'F' || gender == 'M'){
    trainerName = getUsername(gender);
    trainerType = trainerArray[2];
  }else{
    trainerName = trainerArray[2].replace('.png', '');
    trainerType = trainerArray[3].replace('.png', '');
  }
  var jimps = [];
  for(let i in battle){
    jimps.push(Jimp.read(battle[i]));
  }
  jimps.push(trainerName);
  jimps.push(trainerType);
  Promise.all(jimps).then(function(data) {
    return Promise.all(jimps);
  }).then(function(data) {
    data[1].scale(1.3);
    data[2].scale(1.3);
    data[3].scale(1.3);
    data[4].scale(1.3);
    data[0].composite(data[2], 310, frontPositionY);
    data[0].composite(data[1], 245, frontPositionY);
    data[0].composite(data[3], backPositionX+80, 189);
    data[0].composite(data[4], backPositionX, 189);
    trainerName = data[5];
    trainerType = data[6];
    Jimp.loadFont(font).then(font => {
      var battle = data[0];
      battle.scale(1.1);
      console.log(trainerName);
      battle.print(font, 25, fontPositionY, 'You  are  challenged  by  '+trainerType+'  '+trainerName+'!', 400);
      battle.write('assets/battle-pic.png', function() {
        var battlePic = fs.readFileSync('assets/battle-pic.png');
        tweetBattlePic(battlePic);
      });
    });
  });
  async function getUsername(gender){
    if(gender == 'F'){
      genderQuery = 'gender=female';
    }else{
      genderQuery = 'gender=male';
    }
    let response = fetch('https://randomuser.me/api/?inc=name&results=1&nat=us,gb&'+genderQuery)
    let data = await (await response).json()
    return data.results[0].name.first;
  }

  function tweetBattlePic(picture){
    var tweetOption = {
      media: picture
    }
    client.post('media/upload', tweetOption, function(error, media, response) {
      if(!error) {

        var status = {
          media_ids: media.media_id_string // Pass the media id string
        }

        client.post('statuses/update', status, function(error, tweet, response) {
          if (!error) {
            console.log('Battle Pic tweeted');
          }
        });
    }
    });
  }
  
//}, null, true, 'Europe/Paris');
//cronJob.start();