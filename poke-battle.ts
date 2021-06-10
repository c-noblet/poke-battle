import * as dotenv from 'dotenv';
import * as Jimp from 'jimp';
import { readdirSync, readFileSync } from 'fs';
import Axios from 'axios';
import { ResponseData } from 'twitter';

dotenv.config();

const Twitter = require('twitter');

const path = process.env.ABSOLUTE_PATH;

class Battle {
  stadium: {
    asset: string;
    generation: number;
  } = {
    asset: '',
    generation: 0,
  };

  pkmnFront: {
    asset: string;
    shinyDrop: number;
  } = {
    asset: '',
    shinyDrop: 0,
  };

  trainerFront: {
    asset: string;
    name: string;
    type: string;
    gender: string;
  } = {
    asset: '',
    name: '',
    type: '',
    gender: '',
  };

  pkmnBack: {
    asset: string;
    shinyDrop: number;
  } = {
    asset: '',
    shinyDrop: 0,
  };

  trainerBack: {
    asset: string;
  } = {
    asset: '',
  };

  constructor() {
    this.getAssets();
  }

  /* Get all assets */
  getAssets = () => {
    function getRandom(files: Array<string>) {
      return Math.floor(Math.random() * Math.floor(files.length));
    }
    try {
      /* Lists of assets */
      const stadiums = readdirSync(`${path}/assets/stadiums/`).sort();
      const pkmnsFront = readdirSync(`${path}/assets/pkmns-front/4g/`).sort();
      const trainersFront = readdirSync(`${path}/assets/trainers-front/`).sort();
      const pkmnsBack = readdirSync(`${path}/assets/pkmns-back/4g/`).sort();
      const trainersBack = readdirSync(`${path}/assets/trainers-back/`).sort();

      /* Get the stadium asset */
      this.stadium.asset = `${path}/assets/stadiums/${stadiums[getRandom(stadiums)]}`;

      /* Set the stadium gen */
      if (this.stadium.asset.includes('gen3')) {
        this.stadium.generation = 3;
      } else if (this.stadium.asset.includes('gen4')) {
        this.stadium.generation = 4;
      } else {
        this.stadium.generation = 5;
      }

      /* Get pokemons and trainers asset */
      this.pkmnFront.asset = `${path}/assets/pkmns-front/4g/${pkmnsFront[getRandom(pkmnsFront)]}`;
      this.trainerFront.asset = `${path}/assets/trainers-front/${trainersFront[getRandom(trainersFront)]}`;
      this.pkmnBack.asset = `${path}/assets/pkmns-back/4g/${pkmnsBack[getRandom(pkmnsBack)]}`;
      this.trainerBack.asset = `${path}/assets/trainers-back/${trainersBack[getRandom(trainersBack)]}`;

      /* Determine opponent gender */
      this.trainerFront.gender = this.trainerFront.asset.split('_')[3].substr(0, 1);
      // eslint-disable-next-line prefer-destructuring
      this.trainerFront.type = this.trainerFront.asset.split('_')[2];

      /* If a pokemon asset is a shiny, set it to normal */
      if (this.pkmnFront.asset.includes('_s')) {
        this.pkmnFront.asset = this.pkmnFront.asset.replace('_s', '');
      }
      if (this.pkmnBack.asset.includes('_s')) {
        this.pkmnBack.asset = this.pkmnBack.asset.replace('_s', '');
      }

      /* Generate and get the shiny drop rate */
      this.pkmnFront.shinyDrop = Math.floor((Math.random() * 8192) + 1);
      this.pkmnBack.shinyDrop = Math.floor((Math.random() * 8192) + 1);

      if (this.pkmnFront.shinyDrop === 1) {
        this.pkmnFront.asset = this.pkmnFront.asset.replace('.png', '_s.png');
      }
      if (this.pkmnBack.shinyDrop === 1) {
        this.pkmnFront.asset = this.pkmnBack.asset.replace('.png', '_s.png');
      }
    } catch (error) {
      console.log(error);
    }
  }

  /* Set a firstname for a basic opponent or the unique trainer name and type */
  getOpponentName = async () => {
    try {
      /* If the opponent is a basic trainer */
      if (this.trainerFront.gender === 'F' || this.trainerFront.gender === 'M') {
        let genderQuery = 'gender=female';

        if (this.trainerFront.gender === 'M') {
          genderQuery = 'gender=male';
        }
        const response = await Axios.get(`https://randomuser.me/api/?inc=name&results=1&nat=us,gb&${genderQuery}`);
        this.trainerFront.name = response.data.results[0].name.first;
      } else {
        /* If the opponent is unique trainer */
        this.trainerFront.name = this.trainerFront.asset.split('_')[2].replace('.png', '');
        this.trainerFront.type = this.trainerFront.asset.split('_')[3].replace('.png', '');
      }
    } catch (error) {
      console.log(error);
    }
  }

  makePicture = async () => {
    try {
      /* Transfom assets to Jimp object */
      const stadiumAsset = await Jimp.read(this.stadium.asset);
      const pkmnFrontAsset = await Jimp.read(this.pkmnFront.asset);
      const trainerFrontAsset = await Jimp.read(this.trainerFront.asset);
      const pkmnBackAsset = await Jimp.read(this.pkmnBack.asset);
      const trainerBackAsset = await Jimp.read(this.trainerBack.asset);

      /* Set up the font and all assets positions */
      let font:string = `${path}/assets/font/pokedex-black.fnt`;
      let fontPositionY:number = 298;

      let opponentLine:Array<number> = [240, 60];
      let backLine:Array<number> = [-10, 189];
      let opponentOffset = 80;
      let backLineOfsset = 80;

      if (this.stadium.generation === 3) {
        font = `${path}/assets/font/pokedex-white.fnt`;
        fontPositionY = 365;

        opponentLine = [300, 108];
        backLine = [25, 248];
        opponentOffset = 80;
        backLineOfsset = 90;

        stadiumAsset.scale(1.2);
      } else if (this.stadium.generation === 5) {
        opponentLine = [240, 55];
        backLine = [10, 189];
        opponentOffset = 80;
        backLineOfsset = 100;
      }

      /* Resize assets */
      pkmnFrontAsset.scale(1.3);
      trainerFrontAsset.scale(1.3);
      pkmnBackAsset.scale(1.3);
      trainerBackAsset.scale(1.3);

      /* Merge the pokemons assets and the trainers assets to the stadium asset */
      stadiumAsset.composite(trainerFrontAsset, opponentLine[0] + opponentOffset, opponentLine[1]);
      stadiumAsset.composite(pkmnFrontAsset, opponentLine[0], opponentLine[1]);
      stadiumAsset.composite(pkmnBackAsset, backLine[0] + backLineOfsset, backLine[1]);
      stadiumAsset.composite(trainerBackAsset, backLine[0], backLine[1]);

      /* Print the battle text */
      const fontPic = await Jimp.loadFont(font);
      stadiumAsset.print(fontPic, 25, fontPositionY, `You  are  challenged  by  ${this.trainerFront.type.toUpperCase()}  ${this.trainerFront.name.toUpperCase()}!`, 390);

      /*  Save the picture */
      await stadiumAsset.writeAsync(`${path}/assets/battle-pic.png`);
    } catch (error) {
      console.log(error);
    }
  }

  tweet = async () => {
    /* Twitter authentication */
    const client = new Twitter({
      consumer_key: process.env.CONSUMER_KEY ? process.env.CONSUMER_KEY : '',
      consumer_secret: process.env.CONSUMER_SECRET ? process.env.CONSUMER_SECRET : '',
      access_token_key: process.env.ACCESS_TOKEN_KEY ? process.env.ACCESS_TOKEN_KEY : '',
      access_token_secret: process.env.ACCESS_TOKEN_SECRET ? process.env.ACCESS_TOKEN_SECRET : '',
    });

    /* Get the picture */
    const picture = readFileSync(`${path}/assets/battle-pic.png`);

    /*  Upload the picture */
    client.post('media/upload', { media: picture }, (uploadError:any, media:ResponseData) => {
      if (uploadError) throw uploadError;

      /* Tweet the picture */
      client.post('statuses/update', { media_ids: media.media_id_string }, (updateError:any) => {
        if (updateError) throw updateError;
      });
    });
  }
}

/* Running code */
(async () => {
  /* Get battle informations */
  const battlePic = await new Battle();
  /* get Opponent name */
  await battlePic.getOpponentName();
  /* Make the battle picture */
  await battlePic.makePicture();
  /* Tweet the picture */
  await battlePic.tweet();
})();
