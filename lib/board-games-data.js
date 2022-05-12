'use strict'

const vclient_id = process.env.ATLAS_CLIENT_ID

if (!vclient_id){
    throw Error("ATLAS_CLIENT_ID not defined.")
}

const res = require('express/lib/response')
const fetch = require('node-fetch')
let url = `https://api.boardgameatlas.com/api/search?client_id=${vclient_id}`

module.exports = {
    getGamesByRank,
    getGamesStartWithName,
    getGameContainName,
    getGameWithExactName,
    getGameDetails
}

let categories = {}
let mechanics = {}

fillMechanics()
fillCategories()

async function fillMechanics(){
    const mechanics_url = `https://api.boardgameatlas.com/api/game/mechanics?client_id=${vclient_id}`
    const response = await fetch(mechanics_url)
    const json = await response.json()
    if (json.mechanics)
        json.mechanics.forEach(element => mechanics[element.id] = element.name)
}

async function fillCategories(){
    const categories_url = `https://api.boardgameatlas.com/api/game/categories?client_id=${vclient_id}`
    const response = await fetch(categories_url)
    const json = await response.json()
    if (json.categories)
        json.categories.forEach(element => categories[element.id] = element.name)
}

function cleanupGame(game) {
    if (game.description){
        game.description = game.description.replace(/<(.|\n)*?>/g, '');
    }
    if (game.mechanics){
        game.mechanics.forEach(async mechanic => {
            if (!mechanics[mechanic.id])
                await fillMechanics()
            mechanic["name"] = mechanics[mechanic.id] || ""
        })
    }
    if (game.categories){
        game.categories.forEach(async category => {
            if (!categories[category.id])
                await fillCategories()
            category["name"] = categories[category.id] || ""
        })
    }
}


/**
 * 
 * @param {Number} limit Maximum number of games to return
 * @returns json with games ordered by rank
 */
function getGamesByRank(limit) {
    return accessBORGApi('limit=' + limit + '&order_by=rank')
}

/**
 * 
 * @param {String} name Games name start with...
 * @param {Number} limit Maximum number of games to return
 * @returns json with games which name of the game start with name
 */
function getGamesStartWithName(name, limit) {
    return accessBORGApi('name=%27' + name + '%27&limit=' + limit)
}

/**
 * 
 * @param {String} name Games name that contains...
 * @param {Number} limit Maximum number of games to return
 * @returns json with games which name of the game contains name
 */
async function getGameContainName(name, limit) {
    return await accessBORGApi('name=%27' + name + '%27&fuzzy_match=true&limit=' + limit)
}

/**
 * 
 * @param {String} name Games name equal to...
 * @returns json with the first game found which name is equal to name
 */
function getGameWithExactName(name) {
    return accessBORGApi('name=' + name + '&exact=true&limit=1')
}

/**
 * 
 * @param {String} id Game unique identifier
 * @returns json with all game info
 */
 async function getGameDetails(id) {
    const response = await accessBORGApi('ids=' + id)
    const game = response.games[0]
    return game
}

/**
 * 
 * @param {String} search String with search parameters to attach in URL
 * @returns json Promise with games retrieved by search
 */
async function accessBORGApi(search) {
    const response = await fetch(`${url}&${search}`)
    const json = await response.json();
    if (response.status == 429) {
        const error = Error(json.message)
        error.status = response.status
        throw error
    }
    if (json.games)
        json.games.forEach(cleanupGame)
    return json
}
