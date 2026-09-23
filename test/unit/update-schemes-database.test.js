jest.mock('ffc-pay-schemes', () => ({
  getSchemes: jest.fn()
}))
const { getSchemes: mockGetSchemes } = require('ffc-pay-schemes')

jest.mock('../../app/data', () => ({
  scheme: {
    findOne: jest.fn(),
    upsert: jest.fn()
  }
}))
const db = require('../../app/data')

const { updateSchemesDatabase } = require('../../app/update-schemes-database')

describe('update schemes database', () => {
  let consoleLogSpy

  beforeEach(() => {
    jest.clearAllMocks()
    db.scheme.findOne.mockReset()
    db.scheme.upsert.mockReset()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  test('should get the schemes', async () => {
    mockGetSchemes.mockReturnValue([])
    db.scheme.findOne.mockResolvedValue(null)

    await updateSchemesDatabase()

    expect(mockGetSchemes).toHaveBeenCalledTimes(1)
  })

  test('should check whether a scheme already exists before upserting', async () => {
    const scheme = {
      schemeId: 1,
      schemeName: 'Sustainable Farming Incentive 22'
    }

    mockGetSchemes.mockReturnValue([scheme])
    db.scheme.findOne.mockResolvedValue(null)
    db.scheme.upsert.mockResolvedValue([{}, true])

    await updateSchemesDatabase()

    expect(db.scheme.findOne).toHaveBeenCalledWith({
      where: { schemeId: scheme.schemeId }
    })
  })

  test('should create a record for a new scheme', async () => {
    const scheme = {
      schemeId: 1,
      schemeName: 'Sustainable Farming Incentive 22'
    }

    mockGetSchemes.mockReturnValue([scheme])
    db.scheme.findOne.mockResolvedValue(null)
    db.scheme.upsert.mockResolvedValue([{}, true])

    await updateSchemesDatabase()

    expect(db.scheme.upsert).toHaveBeenCalledWith({
      schemeId: scheme.schemeId,
      name: scheme.schemeName
    })

    expect(consoleLogSpy).toHaveBeenCalledWith(
      `${scheme.schemeName} created`
    )
  })

  test('should update an existing scheme record', async () => {
    const scheme = {
      schemeId: 1,
      schemeName: 'Updated scheme name'
    }

    mockGetSchemes.mockReturnValue([scheme])
    db.scheme.findOne.mockResolvedValue({ schemeId: scheme.schemeId })
    db.scheme.upsert.mockResolvedValue([{}, false])

    await updateSchemesDatabase()

    expect(db.scheme.upsert).toHaveBeenCalledWith({
      schemeId: scheme.schemeId,
      name: scheme.schemeName
    })

    expect(consoleLogSpy).toHaveBeenCalledWith(
      `${scheme.schemeName} updated`
    )
  })

  test('should upsert every scheme', async () => {
    const schemes = [
      {
        schemeId: 1,
        schemeName: 'Scheme one'
      },
      {
        schemeId: 2,
        schemeName: 'Scheme two'
      }
    ]

    mockGetSchemes.mockReturnValue(schemes)
    db.scheme.findOne.mockResolvedValue(null)
    db.scheme.upsert.mockResolvedValue([{}, true])

    await updateSchemesDatabase()

    expect(db.scheme.findOne).toHaveBeenCalledTimes(schemes.length)
    expect(db.scheme.upsert).toHaveBeenCalledTimes(schemes.length)

    for (const scheme of schemes) {
      expect(db.scheme.upsert).toHaveBeenCalledWith({
        schemeId: scheme.schemeId,
        name: scheme.schemeName
      })
    }
  })

  test('should log that it is checking for updates', async () => {
    mockGetSchemes.mockReturnValue([])
    db.scheme.findOne.mockResolvedValue(null)

    await updateSchemesDatabase()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Checking for updates to supported schemes'
    )
  })

  test('should process schemes sequentially', async () => {
    const schemes = [
      {
        schemeId: 1,
        schemeName: 'Scheme one'
      },
      {
        schemeId: 2,
        schemeName: 'Scheme two'
      }
    ]

    const calls = []

    mockGetSchemes.mockReturnValue(schemes)
    db.scheme.findOne.mockResolvedValue(null)
    db.scheme.upsert.mockImplementation(async ({ schemeId }) => {
      calls.push(schemeId)
      return [{}, true]
    })

    await updateSchemesDatabase()

    expect(calls).toEqual([1, 2])
  })

  test('should reject if scheme lookup fails', async () => {
    const error = new Error('Lookup error')

    mockGetSchemes.mockReturnValue([{
      schemeId: 1,
      schemeName: 'Scheme one'
    }])
    db.scheme.findOne.mockRejectedValue(error)

    await expect(updateSchemesDatabase()).rejects.toBe(error)
  })

  test('should reject if upsert fails', async () => {
    const error = new Error('Database error')

    mockGetSchemes.mockReturnValue([{
      schemeId: 1,
      schemeName: 'Scheme one'
    }])
    db.scheme.findOne.mockResolvedValue(null)
    db.scheme.upsert.mockRejectedValue(error)

    await expect(updateSchemesDatabase()).rejects.toBe(error)
  })
})
