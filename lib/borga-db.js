'use strict'

module.exports = {
    rejectPromise,
    checkIfBadRequests,
    createGroup,
    editGroup,
    listAllGroups,
    deleteGroup,
    addGameToGroup,
    getGroupDetails,
    removeGameFromGroup,
    createUser,
    getUserByToken,
    getUserByUsername,
    deleteUserByToken,
    deleteUserByUsername
}

const crypto = require('crypto')
const {Game, Group, User} = require('./borga-data-classes')

const fetch = require('node-fetch')
const res = require('express/lib/response')

const velasticsearch_url = process.env.ELASTICSEARCH_URL

/**
 * 
 * @param {String} index 
 */
function getUrl(index) {
    return velasticsearch_url + index
}

/**
 * 
 * @param {Number} status 
 * @param {String} msg 
 * @returns {Promise<error>}
 */
 function rejectPromise(status, msg) {
    const error = Error(msg)
    error.status = status
    return Promise.reject(error)
}

/**
 * 
 * @param {User} user 
 */
function checkUser(user) {
    if(user === undefined || user === null) {
        return rejectPromise(400, 'Missing user')
    } else if(!getUserByToken(user.token)) {
        return rejectPromise(404, 'User not Found')
    }
    return Promise.resolve(undefined)
}

/**
 * 
 * @param {Array} requests 
 */
 function checkIfBadRequests(...requests) {
    for(let i = 0; i < requests.length; i++) {
        const request = requests[i]
        if(request === undefined || request === null) {
            return rejectPromise(400, 'Missing parameter')
        } 
    }

    return Promise.resolve(undefined)
}

/**
 * 
 * @param {String} groupId 
 * @returns {Promise<Array<games>>}
 */
 async function getGroupGames(groupId) {
    await checkIfBadRequests(groupId)

    const url = getUrl(`games/_search?q=groupId:${groupId}`)
    const fetchResult = await fetch(url)

    if (fetchResult.status === 404) return Promise.resolve([]) //404: bypass blanc database with no data
    if (checkStatus(fetchResult, 200)) {
        const response = await fetchResult.json()
        let games = new Array()
        games = response.hits.hits.map(res => {
            const game = new Game(
                res._source.groupId, 
                res._source.id, 
                res._source.name,
                res._source.description,
                res._source.mechanics, 
                res._source.categories, 
                res._source.img_url
            )
            game._id = res._id
            return game
        })
        return games
     }
}

function checkStatus(fetchResult, code, msg) {
    if(fetchResult.status === code) return true
    const err = msg
        ? Error(msg)
        : Error(fetchResult.statusText)
    err.status = fetchResult.status
    throw err
}

/**
 * 
 * @param {User} user
 * @param {String} name 
 * @param {String} description 
 * @returns {Promise<group>}
 */
async function createGroup(user, name, description) {
    await checkUser(user)
    await checkIfBadRequests(name, description)

    let group = await getGroupDetails(user, name)
    if (group) {
        return rejectPromise(409, 'Group Name already exists.')
    }

    const url = getUrl(`groups/_doc?refresh=true`)
    group = new Group(user.token, name, description)
    const sender = {
        method : 'post',
        headers: { 'Content-Type': 'application/json' },
        body : JSON.stringify(group)
    }
  
    const fetchResult = await fetch(url, sender)
    if (checkStatus(fetchResult, 201)) {
       const res = await fetchResult.json()
       group._id = res._id 
       return group
    }
}

/**
 * 
 * @param {User} user
 * @param {String} oldGroupName 
 * @param {String} newGroupName 
 * @param {String} description 
 * @returns {Promise<group>}
 */
async function editGroup (user, oldGroupName, newGroupName, description) {
    await checkUser(user)
    await checkIfBadRequests(oldGroupName, newGroupName, description)
    const oldGroup = await getGroupDetails(user, oldGroupName)
    if (!oldGroup) {
        return rejectPromise(404, 'Group not found')
    }

    await deleteGroup(user, oldGroupName)
    const newGroup = await createGroup(user, newGroupName, description)

    const group = newGroup
    return group

}

/**
 * 
 * @param {User} user
 * @returns {Promise<gamesGroup>}
 */
async function listAllGroups(user) {
    await checkUser(user)
    const url = getUrl(`groups/_search?q=owner:${user.token}`)
    const fetchResult = await fetch(url)

    if (fetchResult.status === 404)
        return Promise.resolve(new Array()) 
    if (checkStatus(fetchResult, 200)) {
        const response = await fetchResult.json()

        const groups = response.hits.hits.map(res => {
            const group = new Group(user.token, res._source.name, res._source.description)
            group._id = res._id
            return group
        })
        for(let i = 0; i < groups.length; i++) {
            groups[i].games = await getGroupGames(groups[i]._id)
        }
        return groups
    }
}

/**
 * 
 * @param {User} user
 * @param {String} groupName 
 * @returns {Promise<group>}
 */
async function deleteGroup(user, groupName) {
    await checkUser(user)
    await checkIfBadRequests(groupName)
    const group = await getGroupDetails(user, groupName)
    if (!group) {
        return rejectPromise(404, 'Group not found')
    }
    
    const url = getUrl(`groups/_doc/${group._id}?refresh=true`)
    const sender = {
        method : 'delete'
    }
    const fetchResult = await fetch(url, sender)

    if (checkStatus(fetchResult, 200)) {
        return group
    }
}

/**
 * 
 * @param {User} user
 * @param {String} groupName 
 * @returns {Promise<group>}
 */
async function getGroupDetails(user, groupName) {
    await checkUser(user)
    await checkIfBadRequests(groupName)

    const url = getUrl(`groups/_search?default_operator=AND&q=name:${groupName}+owner:${user.token}`)
    const fetchResult = await fetch(url)
    if (fetchResult.status === 404) return //404: bypass blanc database with no data
    if (checkStatus(fetchResult, 200)) {
        const response = await fetchResult.json()
        if(response.hits.total.value > 0) {
            const res = response.hits.hits[0]
            const group = new Group(user.token, res._source.name, res._source.description)
            group._id = res._id
            group.games = await getGroupGames(group._id)
            return group
        }
     }
}

/**
 * 
 * @param {String} groupId 
 * @param {String} gameId 
 * @returns {Promise<game>}
 */
 async function getGame(groupId, gameId) {
    await checkIfBadRequests(groupId, gameId)

    const url = getUrl(`games/_search?default_operator=AND&q=groupId:${groupId}+id:${gameId}`)
    const fetchResult = await fetch(url)

    if (fetchResult.status === 404) return //404: bypass blanc database with no data
    if (checkStatus(fetchResult, 200)) {
        const response = await fetchResult.json()

        return response.hits.hits.map(res => {
            const game = new Game(
                res._source.groupId, 
                res._source.id, 
                res._source.name,
                res._source.description,
                res._source.mechanics, 
                res._source.categories, 
                res._source.img_url)
            game._id = res._id
            return game
        })[0]
     }
}

/**
 * 
 * @param {User} user
 * @param {String} groupName 
 * @param {Game} gameObj 
 * @returns {Promise<undefined>}
 */
async function addGameToGroup(user, groupName, gameObj) {
    await checkUser(user)
    await checkIfBadRequests(groupName, gameObj)

    const group = await getGroupDetails(user, groupName)
    let game = await getGame(group._id, gameObj.id)
    if(game) {
        return rejectPromise(409, 'Game already exists')
    }

    const url = getUrl(`games/_doc?refresh=true`)
    game = new Game(
        group._id, 
        gameObj.id, 
        gameObj.name, 
        gameObj.description, 
        gameObj.mechanics,
        gameObj.categories, 
        gameObj.thumb_url
    )
    const sender = {
        method : 'post',
        headers: { 'Content-Type': 'application/json' },
        body : JSON.stringify(game)
    }
    const fetchResult = await fetch(url, sender)
    
    if (checkStatus(fetchResult, 201)) {
       return game
    }
}

/**
 *
 * @param {User} user
 * @param {String} groupName 
 * @param {String} gameId 
 * @returns {gamesArray}
 */
async function removeGameFromGroup(user, groupName, gameId) {
    await checkUser(user)
    await checkIfBadRequests(groupName, gameId)

    const group = await getGroupDetails(user, groupName)
    const game = await getGame(group._id, gameId)
    if(game === undefined || game === null) {
        return rejectPromise(404, 'Game not found')
    }

    const url = getUrl(`games/_doc/${game._id}?refresh=true`)
    const sender = {
        method : 'delete'
    }
    const fetchResult = await fetch(url, sender)

    if (checkStatus(fetchResult, 200)) {
        return game
    }
}

/**
 * 
 * @param {String} username 
 * @returns {Promise<User>} 
 */
async function createUser(username, password) {
    await checkIfBadRequests(username)
    try{
        const user = await getUserByUsername(username)
        if (user)
            return rejectPromise(409 , "User already exists.")
    } catch (e) {
        
    }
    const url = getUrl(`users/_doc?refresh=true`)
    const user = new User(crypto.randomUUID(), username, password)
    const sender = {
        method : 'post',
        headers: { 'Content-Type': 'application/json' },
        body : JSON.stringify(user)
    }

    const fetchResult = await fetch(url, sender)

    if (checkStatus(fetchResult, 201)) {
       return user
    }
}

/**
 * 
 * @param {String} token 
 * @returns {Promise<user>} 
 */
async function getUserByToken(token) {
    await checkIfBadRequests(token)
    const url = getUrl(`users/_search?q=token:${token}`)
    const fetchResult = await fetch(url)

    if (checkStatus(fetchResult, 200)) {
        const response = await fetchResult.json()
        if (response.hits.total.value == 0)
            return rejectPromise(400 ,"User does not exist.")
        const source = response.hits.hits[0]._source
        return new User(source.token, source.name, source.password)
    }
}

/**
 * 
 * @param {String} username 
 * @returns {Promise<user>} 
 */
 async function getUserByUsername(username) {
    await checkIfBadRequests(username)
    const url = getUrl(`users/_search?q=name:${username}`)
    const fetchResult = await fetch(url)

    if (checkStatus(fetchResult, 200)) {
        const response = await fetchResult.json()
        if (response.hits.total.value == 0)
            return rejectPromise(400 ,"User does not exist.")
        const source = response.hits.hits[0]._source
        return new User(source.token, source.name, source.password)
    }
}

async function deleteUserByUsername(username) {
    await checkIfBadRequests(username)
    const url = getUrl(`users/_delete_by_query?q=name:${username}`)
    const fetchResult = await fetch(url, {
        method: "POST"
    })

    if (checkStatus(fetchResult, 200)) {
        const response = await fetchResult.json()
        if (response.deleted == 0)
            return rejectPromise(400 ,"User does not exist.")
        return
    } 
    return rejectPromise(fetchResult.status,"Failed to delete username.")
}

async function deleteUserByToken(token) {
    await checkIfBadRequests(token)
    const url = getUrl(`users/_delete_by_query?q=token:${token}`)
    const fetchResult = await fetch(url, {
        method: "POST"
    })

    if (checkStatus(fetchResult, 200)) {
        const response = await fetchResult.json()
        if (response.deleted == 0)
            return rejectPromise(400, "User does not exist.")
        return
    } 
    return rejectPromise(fetchResult.status, "Failed to delete username.")
}