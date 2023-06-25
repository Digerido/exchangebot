const { Extra, Markup, Scenes,Telegraf, session } = require('telegraf');
const dotenv = require('dotenv');
const selectValutesScenes = require('./scenes/exchange');
//const LocalSession = require('telegraf-session-local');
const TelegrafI18n = require('telegraf-i18n')

dotenv.config();

const i18n = new TelegrafI18n({
  defaultLanguage: 'ru',
  allowMissing: false, // Default true
  directory: './locales'
})

const token = process.env.BOT_TOKEN;
const bot = new Telegraf(token);
bot.use(session());
bot.use(i18n.middleware())
const stage = new Scenes.Stage([selectValutesScenes])
bot.use(stage.middleware())
bot.hears("/start", ctx => ctx.scene.enter("exchange"));

bot.launch()
