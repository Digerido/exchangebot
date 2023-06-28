const axios = require('axios');
const { Extra, Markup, Scenes, Telegraf, session } = require('telegraf');
const dotenv = require('dotenv');
const exchange = require('./scenes/exchange');
const TelegrafI18n = require('telegraf-i18n');


dotenv.config();

const i18n = new TelegrafI18n({
  defaultLanguage: 'ru',
  allowMissing: false,
  directory: './locales'
});

const token = process.env.BOT_TOKEN;
const bot = new Telegraf(token);

let chatIds = new Set();

bot.use((ctx, next) => {
  chatIds.add(ctx.chat.id);
  return next();
});

bot.use(session());
bot.use(i18n.middleware());
const stage = new Scenes.Stage([exchange]);
bot.use(stage.middleware());
bot.start(ctx => ctx.scene.enter("exchange"));

bot.launch();
