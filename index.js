const axios = require('axios'); // Используйте axios или другую библиотеку для HTTP запросов
const { Extra, Markup, Scenes,Telegraf, session } = require('telegraf');
const dotenv = require('dotenv');
const exchange = require('./scenes/exchange');
const TelegrafI18n = require('telegraf-i18n');
const cron = require('node-cron');

dotenv.config();

const i18n = new TelegrafI18n({
  defaultLanguage: 'ru',
  allowMissing: false, // Default true
  directory: './locales'
});

const token = process.env.BOT_TOKEN;
const bot = new Telegraf(token);

let chatIds = new Set(); // Save the chat IDs to send messages to.

bot.use((ctx, next) => {
  chatIds.add(ctx.chat.id);
  return next();
});

bot.use(session());
bot.use(i18n.middleware());
const stage = new Scenes.Stage([exchange]);
bot.use(stage.middleware());
bot.start(ctx => ctx.scene.enter("exchange"));



cron.schedule('*/1 * * * *', async () => {
  let response = await getOrder();

  chatIds.forEach(chatId => {
    if (response.result.status === 3) {
      bot.telegram.sendMessage(chatId, 'Сделка автоматически отменена по истечению 30 минут');

    }
  });
});

bot.launch();
