'use strict'

class Game {
    /**
     * 
     * @param {String} groupId 
     * @param {String} id 
     * @param {String} name
     */
    constructor(groupId, id, name, description, mechanics, categories, img_url) {
        this.groupId = groupId
        this.id = id
        this.name = name
        this.description = description
        this.mechanics = mechanics
        this.categories = categories
        this.img_url = img_url
    }
}

class Group {
    /**
     * 
     * @param {String} owner
     * @param {String} name 
     * @param {String} description
     */
    constructor(owner, name, description) {
        this.owner = owner
        this.name = name
        this.description = description
        this.games = new Array()
    }
}

class User {
    constructor(token, name, password) {
        this.token = token
        this.name = name
        this.password = password
        this.groups = {}
    }

    addGroup(group) {
        if(this.groups[group.name]) {
            return undefined
        }

        this.groups[group.name] = group
        return group
    }

    removeGroup(group) {
        delete this.groups[group.name]
    }
}

module.exports = {Game, Group, User}