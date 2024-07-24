require("dotenv").config();
const {Bot, InlineKeyboard, GrammyError, HttpError} = require("grammy");
const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Bot is alive");
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

const bot = new Bot(process.env.TOKEN);
const user_id_to_chat = {};
function getMessageType(message) {
  if (message.text) return 'text';
  if (message.photo) return 'photo';
  if (message.voice) return 'voice';
  if (message.video) return 'video';
  if (message.sticker) return 'sticker';
  if (message.animation) return 'animation';
  if (message.video_note) return 'video_note';
  return 'Неизвестный тип';
}

bot.command("start", async (ctx) =>{
    let agr = ctx.message.text.split(" ")[1]
    if (agr == undefined){
      let user_id = ctx.from.id;
      let shareurl = (`https://t.me/share/url?url=t.me/questions_q7_bot?start=${user_id}`);
      const startKeyboard = new InlineKeyboard().url("Share", shareurl);
      await ctx.reply(`<i>Привет! Поделитесь этой <a href="t.me/questions_q7_bot?start=${user_id}">ссылкой</a>,\nчтобы получать анонимные сообщения!</i>`, {reply_markup: startKeyboard, parse_mode: 'HTML'});
    }else{
        let user_id = agr;
        user_id_to_chat[ctx.from.id] = user_id;
        await ctx.reply('<i>Отправьте анонимное сообщение.</i>', {parse_mode: 'HTML'})
    }
})

bot.callbackQuery(/^answer_(\d+)/, async (ctx) => {
  await ctx.answerCallbackQuery("Не забудь подписатся @tg_xen")
  const userId = Number(ctx.match[1]);
  user_id_to_chat[ctx.from.id] = userId;
  await ctx.reply('<i>Отправьте анонимный ответ!</i>', { parse_mode: 'HTML' });
});

bot.on('message', async (ctx)=>{
let msgtype = getMessageType(ctx.message)
if (user_id_to_chat[ctx.from.id]) {
  let target_id = user_id_to_chat[ctx.from.id];
  let user_id = ctx.from.id
  let builder = new InlineKeyboard().text('Ответить', `answer_${user_id}`)
  let caption = ctx.message.caption || '';
  switch (msgtype) {
    case 'text':
      await bot.api.sendMessage(target_id, `<i>Анонимное сообщение:</i>\n${ctx.message.text}`, {
        reply_markup: builder,
        parse_mode: 'HTML',
      });
      break;
    case 'video':
      await bot.api.sendVideo(target_id, ctx.message.video.file_id, {
        caption,
        reply_markup: builder,
      });
      break;
    case 'animation':
      await bot.api.sendAnimation(target_id, ctx.message.animation.file_id, {
        caption,
        reply_markup: builder,
      });
      break;
    case 'photo':
      await bot.api.sendPhoto(target_id, ctx.message.photo[ctx.message.photo.length-1].file_id, {
        caption,
        reply_markup: builder,
      });
      break;
    case 'voice':
      await bot.api.sendVoice(target_id, ctx.message.voice.file_id, {
        reply_markup: builder,
      });
      break;
    case 'sticker':
      await bot.api.sendSticker(target_id, ctx.message.sticker.file_id, {
        reply_markup: builder,
      });
      break;
    case 'video_note':
      await bot.api.sendVideoNote(target_id, ctx.message.video_note.file_id, {
        reply_markup: builder,
      });
      break;
  }
  await bot.api.sendMessage(ctx.message.from.id, '✅ <i>Анонимное сообщение отправлено</i>', { parse_mode: 'HTML' });
  delete user_id_to_chat[ctx.message.from.id];
}
})


bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
      console.error("Could not contact Telegram:", e);
    } else {
      console.error("Unknown error:", e);
    }
  });
module.exports = app;
bot.start()
