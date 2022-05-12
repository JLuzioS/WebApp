'use strict'


const express = require('express')
const database = require('./borga-db')
const {
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
    deleteUserByToken
 } = require('./borga-services')

const router = express.Router()
const passport = require('passport')

setupRoutes(router)

/**
 * 
 * @param {express.Router} router 
 */
function setupRoutes(router) {

    router.use(require('cookie-parser')())
    router.use(require('express-session')({secret: 'keyboard cat', resave: true, saveUninitialized: true}))

    router.use(passport.initialize())
    router.use(passport.session())

    passport.serializeUser((user, done) => 
                            done(null, user.token))
    passport.deserializeUser(async function(userToken, done) {
        try {
            done(null, await database.getUserByToken(userToken))
        } catch {
            done(err)
        }
    })
    
    router.use(express.json())

    router.get('/', loginMenu)

    router.post('/login', async function(req, res, next) {
        try {
            const user = await database.getUserByUsername(req.body.name)
            if (user && user.password == req.body.password) {
                return req.logIn(user, err => {
                        res.cookie('BOrgaUserAuthorization', `Bearer ${user.token}`)
                        if(err){
                            next(err)
                        } else {
                            res.redirect('/groups')
                            next
                        }
                    })
                }
            else {
                const error = Error("Invalid user or password")
                error.status = 401
                next(error)
            }
        }
        catch (e) {
            next(e)
        }
    });


    router.delete('/logout', function(req, res, next) {
        res.clearCookie('BOrgaUserAuthorization')
        req.logout();
        res.redirect('/');
    });
    

    router.put('/users', async (req, res, next) => {
        try {
            const user = await createUser(req.body)
            return req.logIn(user, err => {
                if(err){
                    next(err)
                } else {
                    res.redirect('/groups')
                    next
                }
                
            })
        } catch(e) {
            next(e)
        }
    })

    router.delete('/users', async (req, res, next) => {
        try {
            const user = req.user
            await deleteUserByToken(user.token)  
            req.logout();
            res.redirect('/');
        } catch(e) {
            next(e)
        }
    })
    
    router.use('/groups', validateAuthentication)
    
    router.get('/groups', async (req, res, next) => {
        try {
            const user = req.user
            const group = await getGroups(user)
            res.status(200).render('groups', {user, group})
            //next()
        } catch(e) {
            next(e)
        }
    })

    router.post('/groups', async (req, res, next) => {
        try {
            const user = req.user
            await createGroup(user, req.body)
            res.redirect('/groups')
            next()
        } catch(e) {
            next(e)
        }
    })

    router.use('/groups/:groupName', validateGroupAuthorization)

    router.get('/groups/:groupName', async (req, res, next) => {
        try {
            const user = req.user
            const group = await getGroup(user, req.params.groupName)
            res.status(200).render('group', group)
            //next()
        } catch(e) {
            next(e)
        }
    })

    router.put('/groups/:groupName', async (req, res, next) => {
        try {
            const user = req.user
            const group = await editGroup(user, req.params.groupName, req.body)
            res.status(200).render('group', {group, "games" : group.games})
            next()
        } catch(e) {
            next(e)
        }
    })

    router.delete('/groups/:groupName', async (req, res, next) => {
        try {
            const user = req.user
            const group = await deleteGroup(user, req.params.groupName)
            res.status(200).render('group', group)
            next()
        } catch(e) {
            next(e)
        }
    })

    router.get('/groups/:groupName/games', async (req, res, next) => {
        const games = await getGamesFromName(req.query.name, req.query.limit)
        if (!games[0]){
            res.status(429).render('games', {"games" : []})
        } else {
            games.forEach(game => {
                game.groupName = req.params.groupName
            })
            
            res.status(200).render('games', {games : games})
        }
    })

    router.post('/groups/:groupName/games', async (req, res, next) => {
        try {
            const user = req.user
            const game = await addGame(user, req.params.groupName, req.body)
            res.redirect(`/groups/${req.params.groupName}`)
            next()
        } catch(e) {
            next(e)
        }
    })
    
    router.delete('/groups/:groupName/games/:gameId', async (req, res, next) => {
        try {
            const user = req.user
            const game = await removeGame(user, req.params.groupName, req.params.gameId)
            res.redirect(`/groups/${req.params.groupName}`)
            next()
        } catch(e) {
            next(e)
        }
    })

    router.get('/groups/:groupName/game/:gameId', async (req, res, next) => {
        try {
            const game = await getGameSite(req.params.gameId)
            game.groupName = req.params.groupName
            const games = []
            games.push(game)
            res.status(200).render('games', {games : games})
            //res.status(200).render('game', game)
            //next()
        } catch(e) {
            next(e)
        }
    })

    router.use((err, req, res, next) => {
        //console.log(err)
        if (!err.status) {
            err.status = 500
            err.message = "Something went wrong."
        }
        res.status(err.status)
        .set('Content-Type',  'application/json')
        .send(JSON.stringify({ "message": err.message }))
    })
}
module.exports = {
    router
}
