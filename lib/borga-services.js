'use strict'

module.exports = {
    loginMenu,
    createUser,
    validateAuthentication,
    getGroups,
    createGroup,
    validateGroupAuthorization,
    getGroup,
    editGroup,
    deleteGroup,
    addGame,
    removeGame,
    getGameSite,
    getGamesFromName,
    getUserByToken,
    getUserByUsername,
    deleteUserByToken,
    deleteUserByUsername
}

const database = require('./borga-db')
const express = require('express')
const {getGameDetails, getGameContainName} = require('./board-games-data')

/**
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @param {express.NextFunction} next 
 */
 async function loginMenu(req, res, next){
    res.render('index')
}


async function validateAuthentication(req, res, next) {
    let token = []
    const user = await req.user
    if(user) {
        res.cookie('BOrgaUserAuthorization', `Bearer ${user.token}`)
        next()
        return
    } 
    if(req.cookies && req.cookies.BOrgaUserAuthorization) {
        const cookie = req.cookies.BOrgaUserAuthorization
        if(!cookie) {
            const error = Error("Authorization header missing.")
            error.status = 401;
            next(error)
            return 
        }
        token = cookie.substring(7) // removing Bearer
        if (!token){
            const error = Error("Bearer token missing.")
            error.status = 401;
            next(error)
            return 
        }
    } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.substring(7)
    }
    else {
        const error = Error("Bearer token missing.")
        error.status = 401;
        next(error)
        return
    }

    try {
        const user = await database.getUserByToken(token)
        if (user === undefined || user === null) {
            const error = Error("Invalid token.")
            error.status = 401;
            next(error)
            return
        }
        req.user = user
        res.cookie('BOrgaUserAuthorization', `Bearer ${user.token}`)
    } catch (e) {
        const error = Error("Invalid token.")
        error.status = 401;
        next(error)
        return
    }
    next()
}

/**
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @param {express.NextFunction} next 
 */
async function validateGroupAuthorization(req, res, next) {
    try {
        const user = req.user
        const group = await database.getGroupDetails(user, req.params.groupName)
        if(!group) {
            const error = Error("User doesn't have the group requested.")
            error.status = 401
            next(error)
            return
        }
        next()
    } catch (e) {
        const error = Error("User doesn't have the group requested.")
        error.status = 401
        next(error)
    }
}

/**
 * 
 * @param {express.Request.body} body
 * @returns {User}
 */
async function createUser(body) {
    const user = await database.createUser(body.name, body.password)
    return user
}

/**
 * 
 * @param {User} user
 * @returns {group}
 */
 async function getGroups(user) {
    const group = await database.listAllGroups(user)
    return group
}

/**
 * 
 * @param {User} user
 * @param {express.Request.body} body
 * @returns {group}
 */
 async function createGroup(user, body) {
    const group = await database.createGroup(user, body.name, body.description)
    return group
}

/**
 * 
 * @param {User} user
 * @param {String} groupName
 * @returns {group}
 */
 async function getGroup(user, groupName) {
    const group = await database.getGroupDetails(user, groupName)
    return group
}

/**
 * 
 * @param {User} user
 * @param {String} oldGroupName
 * @param {express.Request.body} body
 * @returns {group}
 */
 async function editGroup(user, oldGroupName, body) {
    const group = await database.editGroup(user, oldGroupName, body.name, body.description)
    return group
}

/**
 * 
 * @param {User} user
 * @param {String} groupName
 * @returns {group}
 */
 async function deleteGroup(user, groupName) {
    const group = await database.deleteGroup(user, groupName)
    return group
}

/**
 * 
 * @param {User} user
 * @param {String} groupName
 * @param {express.Request.body} body
 * @returns {game}
 */
 async function addGame(user, groupName, body) {
    const gameData = await getGameSite(body.id);

    const game = await database.addGameToGroup(user, groupName, gameData)
    return game
}

/**
 * 
 * @param {User} user
 * @param {String} groupName
 * @param {String} gameId
 * @returns {game}
 */
 async function removeGame(user, groupName, gameId) {
    const game = await database.removeGameFromGroup(user, groupName, gameId)
    return game
}

/**
 * 
 * @param {String} gameId
 * @returns {Any}
 */
 async function getGameSite(gameId) {
    const game = await getGameDetails(gameId)
    return game
}

async function getGamesFromName(name, limit) {
    if (!limit) {
        limit = 10
    }
    const list = await getGameContainName(name, limit)
    return list.games
}


async function getUserByUsername(username, password) {
    const user = await database.getUserByUsername(username)
    if (user && user.password == password){
        return user
    } 
    const error = Error("Wrong Password")
    error.status = 401
    throw error
}

async function getUserByToken(token) {
    const user = database.getUserByToken(token)
    if (user){
        return user
    }
}

async function deleteUserByToken(token){
    return await database.deleteUserByToken(token)
}

async function deleteUserByUsername(username){
    await getUserByUsername(username)
    return await database.deleteUserByUsername(username)
}


function addAlert(title, kind, message) {
    req.session.alert = {title, kind, message}
}