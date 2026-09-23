const { getSchemes } = require('ffc-pay-schemes')
const db = require('./data')

const updateSchemesDatabase = async () => {
  console.log('Checking for updates to supported schemes')
  const schemes = getSchemes()

  for (const { schemeId, schemeName } of schemes) {
    const existingScheme = await db.scheme.findOne({
      where: { schemeId }
    })

    await db.scheme.upsert({
      schemeId,
      name: schemeName
    })

    const created = !existingScheme
    console.log(`${schemeName} ${created ? 'created' : 'updated'}`)
  }
}

module.exports = {
  updateSchemesDatabase
}
