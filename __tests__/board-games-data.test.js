'use strict'

const {expect} = require('@jest/globals')
const tester = require('../lib/board-games-data')

test('Execute getGamesByRank (5 games)', async () => {
    let list = await tester.getGamesByRank(5)
    expect(list.games.length).toBe(5)
})

test('Execute getGamesStartWithName (War* , 10 games)', async () => {
    let list = await tester.getGamesStartWithName('War', 4)
    expect(list.games.length).toBeLessThanOrEqual(4)
    for(let i = 0; i < list.games.length; i++) {
        let str = list.games.map(e=>e.name)[i].toLowerCase()
        expect(str.startsWith('war')).toBe(true)
    }
})

test('Execute getGameContainName (*potatoes* , 10 games)', async () => {
    let list = await tester.getGameContainName('potatoes', 3)
    expect(list.games.length).toBeLessThanOrEqual(3)
    for(let i = 0; i < list.games.length; i++) {
        let str = list.games.map(e=>e.name)[i].toLowerCase()
        expect(str.includes('potatoes')).toBe(true)
    }
})

test('Execute getGameWithExactName (Zombicide)', async () => {
    let list = await tester.getGameWithExactName('Zombicide')
    expect(list.games.length).toBe(1)
    let str = list.games.map(e=>e.name)[0].toLowerCase()
    expect(str).toBe('zombicide')
})
