'use strict'

const express = require('express')
const swaggerUi = require('swagger-ui-express')
const openAPIDocument = require(process.cwd() + '/docs/borga-api-spec.json')
const {
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
    deleteUserByToken,
 } = require('./borga-services')

const router = express.Router()

setupRoutes(router)

/**
 * 
 * @param {express.Router} router 
 */
function setupRoutes(router) {
    router.use(require('cookie-parser')())
    
    router.use(express.json())

    router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openAPIDocument))

    router.get('/version', (_, res) => {
        res.sendFile(process.cwd() + "/version.json")
    })

    

    router.put('/users', async (req, res, next) => {
        try {
            const user = await createUser(req.body)
            res.status(200).send(user)
            next()
        } catch(e) {
            next(e)
        }
    })

    router.use('/users', validateAuthentication)

    router.delete('/users', async (req, res, next) => {
        try {
            await deleteUserByToken(req.user.token)
            res.status(200)
            .set('Content-Type',  'application/json')
            .send(JSON.stringify({ "message": err.message }))
            next()
        } catch(e) {
            next(e)
        }
    })
    
    router.get('/users', async (req, res, next) => {
        try {
            res.status(200).send(req.user)
            next()
        } catch(e) {
            next(e)
        }
    })

    router.use('/groups', validateAuthentication)
    
    router.get('/groups', async (req, res, next) => {
        try {
            const group = await getGroups(req.user)
            res.status(200).send(group)
            next()
        } catch(e) {
            next(e)
        }
    })

    router.post('/groups', async (req, res, next) => {
        try {
            const group = await createGroup(req.user, req.body)
            res.status(200).send(group)
            next()
        } catch(e) {
            next(e)
        }
    })

    router.use('/groups/:groupName', validateGroupAuthorization)

    router.get('/groups/:groupName', async (req, res, next) => {
        try {
            const group = await getGroup(req.user, req.params.groupName)
            res.status(200).send(group)
            next()
        } catch(e) {
            next(e)
        }
    })

    router.put('/groups/:groupName', async (req, res, next) => {
        try {
            const group = await editGroup(req.user, req.params.groupName, req.body)
            res.status(200).send(group)
            next()
        } catch(e) {
            next(e)
        }
    })

    router.delete('/groups/:groupName', async (req, res, next) => {
        try {
            const group = await deleteGroup(req.user, req.params.groupName)
            res.status(200).send(group)
            next()
        } catch(e) {
            next(e)
        }
    })

    router.post('/groups/:groupName/games', async (req, res, next) => {
        try {
            const game = await addGame(req.user, req.params.groupName, req.body)
            res.status(200).send(game)
            next()
        } catch(e) {
            next(e)
        }
    })
    
    router.delete('/groups/:groupName/games/:gameId', async (req, res, next) => {
        try {
            const game = await removeGame(req.user, req.params.groupName, req.params.gameId)
            res.status(200).send(game)
            next()
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
