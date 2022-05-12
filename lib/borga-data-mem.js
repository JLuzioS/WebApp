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
const {Group, User} = require('./borga-data-classes')

const users = {}

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
    } else if(!users[user.token]) {
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
 * @param {Array} gamesArray 
 * @param {String} gameId 
 */
function getGameIndex(gamesArray, gameId) {
    for(let i = 0; i < gamesArray.length; i++) {
        if(gamesArray[i].id === gameId) {
            return i
        }
    }
    return -1
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
    const group = user.addGroup(new Group(user.token, name, description))
    if (!group) {
        return rejectPromise(409, 'Group Name already exists.')
    }
    return group
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
    const oldGroup = user.groups[oldGroupName]
    if (!oldGroup) {
        return rejectPromise(404, 'Group not found')
    }

    const newGroup = new Group(user.token, newGroupName, description)
    user.removeGroup(oldGroup)
    user.addGroup(newGroup)

    const group = user.groups[newGroupName]
    return group
}

/**
 * 
 * @param {User} user
 * @returns {Promise<gamesGroup>}
 */
function listAllGroups(user) {
    return Promise.resolve(Object.values(user.groups))
}

/**
 * 
 * @param {User} user
 * @param {String} name 
 * @returns {Promise<group>}
 */
async function deleteGroup(user, name){
    await checkUser(user)
    await checkIfBadRequests(name)
    const group = user.groups[name]
    if (!group) {
        return rejectPromise(404, 'Group not found')
    }
    const retGroup = group
    user.removeGroup(group)
    return retGroup
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
    const group = user.groups[groupName]
    return group
}

/**
 * 
 * @param {User} user
 * @param {String} groupName 
 * @param {Game} game 
 * @returns {Promise<game>}
 */
async function addGameToGroup(user, groupName, game) {
    await checkUser(user)
    await checkIfBadRequests(groupName, game)
    const games = user.groups[groupName].games
    if (getGameIndex(games, game.id) !== -1) {
        return rejectPromise(409, 'Game already exists')
    }
    games.push(game)
    return game
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

    const games = user.groups[groupName].games
    const idx = getGameIndex(games, gameId)
    
    if(idx === -1) {
        return rejectPromise(404, 'Game not found')
    }

    const game = games[idx]
    games.splice(idx, 1)
    return game
}

/**
 * 
 * @param {String} username 
 * @param {String} password 
 * @returns {Promise<user>} 
 */
async function createUser(username, password) {
    await checkIfBadRequests(username)
    const user = new User(crypto.randomUUID(), username, password)
    users[user.token] = user
    return user
}

/**
 * 
 * @param {String} token 
 * @returns {Promise<user>} 
 */
async function getUserByToken(token) {
    await checkIfBadRequests(token)
    const user = users[token]
    await checkUser(user)
    return user
}


async function getUserByUsername(username) {
    await checkIfBadRequests(username)
    for (let i = 0; i < users.length; i++) {
        if (users[i].username == username)
            return users[i]
    }
}

async function deleteUserByUsername(username){
    users = users.map(element => {
        if (element.username != username)
            return element
    })
}

async function deleteUserByToken(token){
    const user = users[token]
    if (user)
        delete user[token]
}