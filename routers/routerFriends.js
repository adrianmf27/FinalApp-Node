const express = require('express');

const routerFriends = express.Router();
const database = require("../database")

routerFriends.post("/", async(req, res) => {
    let friendEmail = req.body.email

    if (!friendEmail || friendEmail == undefined || friendEmail == null || friendEmail == "") {
        return res.status(400).json({ error: "Friend email is required" });
    }

    database.connect()
    let insertedFriend = null;

    try
    {
        let existingFriend = await database.query('SELECT COUNT(*) FROM friends' 
            + 'WHERE emailUser == ? AND emailFriend == ?', [req.infoInApiKey.email, friendEmail])

        if(existingFriend?.length < 1)
        {
            return res.status(400).json({error: "Already an existing friend"})
        }

        insertedFriend = await database.query("INSERT INTO FRIENDS VALUES (?, ?)", 
            [req.infoInApiKey.email, friendEmail])
    }
    catch (error)
    {
        database.disConnect();
        return res.status(400).json({error: e})
    }
    
    database.disConnect();
    res.json({inserted: insertedUser})
})

routerFriends.get("/", async (req, res) => {
    let userEmail = req.infoInApiKey.email

    if (!userEmail) {
        return res.status(400).json({ error: "User not found" });
    }

    database.connect()
    let friends = []

    try
    {
        friends = await database.query("SELECTT * FROM friends where emailUser = ?", [userEmail])

        if(friends.length < 1)
        {
            return res.status(400).json({error: "This user has no friends"})
        }
    }
    catch (error)
    {
        database.disConnect()
        return res.status(400).json({error: e})
    }

    database.disConnect()
    res.send(friends)
})

routerFriends.delete("/:email", async (req, res) => {
    let email = req.params.email
    let userEmail = req.infoInApiKey.email

    if (!email) {
        return res.status(400).json({ error: "Friend email is required" });
    }

    database.connect()
    try
    {
        await database.query('DELETE FROM friends' 
            + 'WHERE emailUser == ? AND emailFriend == ?', [userEmail, email])
    }
    catch (error)
    {
        database.disConnect()
        return res.status(400).json({error: e})
    }

    database.disConnect()
    res.json({deleted: true})
})

module.exports = routerFriends