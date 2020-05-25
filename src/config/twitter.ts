import Twit from 'twit'

export const twit = new Twit({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_KEY,
  access_token_secret: process.env.ACCESS_SECRET
})

export const followedAccounts = [
  '2839430431', // pokemongoapp
  '631577690', // NianticLabs
  '849344094681870336' // NianticHelp
]

export const stream = twit.stream('statuses/filter', {
  follow: followedAccounts
})
