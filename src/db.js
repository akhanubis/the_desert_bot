const { ACCOUNTS_LIST } = require('./constants')
const { BEANSTALK, MATCHES_TABLE } = require('./env')

exports.saveMatch = match => {
  let match_common_data = { ...match, players: undefined },
      promises = match.players.map(p => global.db.put({
        TableName: MATCHES_TABLE,
        Item: {
          ...match_common_data,
          ...p
        }
      }).promise())
  return Promise.all(promises)
  .then(_ => console.log(`${ match.map } saved`))
}

/* dont save in dev */
if (!BEANSTALK)
  exports.saveMatch = match => {
    console.log(`[Dev] Storing ${ match.map }`)
    return Promise.resolve()
  }

exports.populateLastSr = last_sr => {
  console.log('Fetching initial latest SR data...')
  let promises = Object.values(ACCOUNTS_LIST).map(acc => global.db.query({
    TableName: MATCHES_TABLE,
    KeyConditionExpression: 'account = :a',
    ExpressionAttributeValues: { ':a': acc },
    Limit: 1,
    ScanIndexForward: false,
    ProjectionExpression: 'account, sr.#end',
    ExpressionAttributeNames: { '#end': 'end' }
  }).promise())
  return Promise.all(promises)
  .then(responses => {
    for (let response of responses) {
      let last_match = response.Items[0]
      if (last_match)
        last_sr[last_match.account] = last_match.sr.end
    }
  })
}

exports.matchesByAccount = async acc => {
  let last_evaluated_key,
      out = [],
      params = {
        TableName: MATCHES_TABLE,
        KeyConditionExpression: 'account = :a',
        ExpressionAttributeValues: { ':a': acc }
      }
  while(true) {
    params.ExclusiveStartKey = last_evaluated_key
    data = await global.db.query(params).promise()
    last_evaluated_key = data.LastEvaluatedKey
    out = [...out, ...data.Items]
    if (!last_evaluated_key)
      break
  }
  return out
}