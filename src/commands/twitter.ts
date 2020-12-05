import { CommandClient, Message } from 'eris'
import { Twitter } from 'twit'

import r from '../config/redis'
import { stream, followedAccounts } from '../config/twitter'

export const followCommand = async (msg: Message): Promise<void> => {
  if (await r.sismember('subscriptions:channels', msg.channel.id) === 1) {
    await msg.channel.createMessage('This channel has already been subscribed!')
  } else {
    await r.sadd('subscriptions:channels', msg.channel.id)
    try {
      await msg.channel.createMessage('Successfully subscribed this channel to messages.')
    } catch (err) {
      const dmChannel = await msg.author.getDMChannel()
      try {
        await dmChannel.createMessage(`${msg.channel.mention} has been subscribed, but it looks like I don't have permission to send messages there. Update permissions to allow this or the channel will be automatically unsubscribed.`)
      } catch (err) {
        await r.srem('subscriptions:channels', msg.channel.id)
      }
    }
  }
}

export const unfollowCommand = async (msg: Message): Promise<void> => {
  if (await r.sismember('subscriptions:channels', msg.channel.id) === 1) {
    await r.srem('subscriptions:channels', msg.channel.id)
    try {
      await msg.channel.createMessage('Successfully removed this channel\'s subscription.')
    } catch (err) {}
  } else {
    try {
      await msg.channel.createMessage('This channel isn\'t subscribed!')
    } catch (err) {}
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
    console.log(`Tweet from ${tweet.user.screen_name}`)
    if (
      !followedAccounts.includes(tweet.user.id_str) ||
      tweet.in_reply_to_status_id !== null ||
      followedAccounts.includes(tweet.retweeted_status?.user.id_str)
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
