const express = require("express")
const User = require("../models/Usermodel")
const userRouter = new express.Router()
const auth = require('../middleware/auth')
const multer = require("multer")
const sharp = require("sharp")


userRouter.post("/users", async(req, res)=>{
    const newuser = new User(req.body)

    try {
        await newuser.save()
        const token = await newuser.generateAuthToken()
        res.send({newuser, token})
    } catch (error) {
        res.status(500).send(error)
    }
})

userRouter.post("/users/login", async(req, res)=>{
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.status(200).send({user, token}) 
    } catch (error) {
        res.status(400).send(error)
    }
})

userRouter.post("/users/logout", auth, async(req, res)=>{
    try {
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })

        await req.user.save()
        res.status(200).send("logged out")
    } catch (error) {
        res.status(500).send(error)
    }
})

userRouter.post("/users/logoutall", auth, async(req, res)=>{
    try {
        req.user.tokens = []
        await req.user.save()
        res.status(200).send("Logged out all sessions")
    } catch (error) {
        res.status(500).send(error)
    }    
})

userRouter.get("/users/me", auth, async(req, res)=>{
    res.status(200).send(req.user)
})

userRouter.patch("/users/me", auth, async(req, res)=>{
    
    const updates = Object.keys(req.body)
    const allowedupdates = ["name", "age", "password", "email"]
    const operationValid = updates.every((update)=>{
        return allowedupdates.includes(update)
    })

    if(!operationValid){
        return res.status(400).send("Invalid Update")
    }

    try {
        updates.forEach((update)=>{
            req.user[update] = req.body[update]
        })
        await req.user.save()
        res.status(200).send(req.user)
    } catch (error) {
        if(error.kind === "ObjectId"){
            return res.status(404).send("no user found")
        }
        res.status(500).send(error)
    }
})

userRouter.delete("/users/me", auth, async(req, res)=>{
    try {
        await req.user.remove()
        res.send(req.user)
        
    } catch (error) {
        res.send(error)
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(undefined, true)
        }

        cb(new Error("file type not supported"))
    }
})

userRouter.post("/users/me/avatar", auth, upload.single("avatar"), async(req, res)=>{
    const modBuffer = await sharp(req.file.buffer).resize({ height: 250, width: 250}).png().toBuffer()
    req.user.avatar = modBuffer
    await req.user.save()
    res.status(200).send("avatar uploaded sucessfully")
}, (error, req, res, next)=>{
    res.status(400).send({ error: error.message })
})

userRouter.delete("/users/me/avatar", auth, async(req, res)=>{
    try {
        req.user.avatar = undefined
        await req.user.save()
        res.status(200).send()
    } catch (error) {
        res.status(500).send(error)
    }
})

userRouter.get("/users/:id/avatar", async(req, res)=>{
    try {
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar){
            throw new Error()
        }

        res.set("Content-Type","image/png")
        res.status(200).send(user.avatar)
    } catch (error) {
        res.status(500).send("hbd")
    }
})

module.exports = userRouter