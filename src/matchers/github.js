const { GITHUB_REPOSITORY } = require('../env')

const
  REGEX = /^\!repo/i,
  REPLY = `You can find my source code at ${ GITHUB_REPOSITORY }`,
  NAME = 'Repo'

exports.name = NAME

exports.regex = REGEX

exports.process = msg => msg.channel.send(REPLY)