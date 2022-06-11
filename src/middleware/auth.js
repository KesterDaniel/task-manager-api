const jwt = require("jsonwebtoken")
const User = require("../models/Usermodel")

const auth = async(req, res, next)=>{
    try {
        const token = req.header("Authorization").replace("Bearer ", "")
        const decode = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findOne({_id: decode._id, "tokens.token": token})

        if(!user){
            throw new Error()
        }

        req.token = token
        req.user = user
        next()
    } catch (error) {
        res.status(500).send({error: "Please Authenticate"})
    }
}

module.exports = auth