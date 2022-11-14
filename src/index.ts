import 'source-map-support/register'
import { CommandClient } from 'eris'

import twitter from './commands/twitter'

const bot = new CommandClient(process.env.TOKEN, {
  intents: ['guildMessages', 'directMessages']
}, {
  prefix: process.env.PREFIX.split(','),
  defaultHelpCommand: false
})

twitter.init(bot)

bot.on('ready', () => {
  console.log(`Connected to Discord as ${bot.user.username}#${bot.user.discriminator}`)
})

process.on('SIGTERM', () => {
  bot.disconnect({
    reconnect: false
  })
})

bot.connect()
  .catch(err => {
    console.error(err)
  })
