import { CommandClient, Message } from 'eris'
import { Twitter } from 'twit'

import r from '../config/redis'
import { stream, followedAccounts } from '../config/twitter'

export const followCommand = async (msg: Message): Promise<void> => {
  if (await r.sismember('subscriptions:channels', msg.channel.id) === 1) {
    await msg.channel.createMessage('This channel has already been subscribed!')
  } else {
    await r.sadd('subscriptions:channels', msg.channel.id)
    await msg.channel.createMessage('Successfully subscribed this channel to messages.')
  }
}

export const unfollowCommand = async (msg: Message): Promise<void> => {
  if (await r.sismember('subscriptions:channels', msg.channel.id) === 1) {
    await r.srem('subscriptions:channels', msg.channel.id)
    await msg.channel.createMessage('Successfully removed this channel\'s subscription.')
  } else {
    await msg.channel.createMessage('This channel isn\'t subscribed!')
  }
}

export const init = async (bot: CommandClient): Promise<void> => {
  bot.registerCommand('subscribe', followCommand, {
    requirements: {
      permissions: {
        manageChannels: true
      }
    }
  })
  bot.registerCommand('unsubscribe', unfollowCommand, {
    requirements: {
      permissions: {
        manageChannels: true
      }
    }
  })

  stream.on('tweet', (tweet: Twitter.Status) => {
    if (
      !followedAccounts.includes(tweet.user.id_str) ||
      tweet.in_reply_to_status_id !== null
    ) {
      return
    }
    r.smembers('subscriptions:channels')
      .then(async channels => {
        const failedChannels: string[] = []
        const proms: Array<Promise<any>> = []
        for (const channel of channels) {
          proms.push(bot.createMessage(
            channel,
            `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
          ).catch(() => {
            failedChannels.push(channel)
          }))
        }
        await Promise.all(proms)
        if (failedChannels.length > 0) {
          await r.srem('subscriptions:channels', ...failedChannels)
        }
      })
      .catch(err => { console.error(err) })
  })

  if (await r.exists('subscriptions:channels') === 0) {

  }
}

export default {
  init
}
