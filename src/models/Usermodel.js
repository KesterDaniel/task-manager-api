const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Task = require("./Taskmodel")

//Schema
const UserSchema = new mongoose.Schema({
    name:{
        type: String,
        trim: true,
        required: true
    },
    password:{
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value){
            if(value.toLowerCase().includes("password")){
                throw new Error("password cant include 'password'")
            }
        }
    },
    email:{
        type: String,
        unique: true,
        lowercase: true,
        required: true,
        trim:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Email not Valid..")
            }
        }
    },
    age:{
        type: Number,
        default: 0,
        validate(value){
            if(value < 0){
                throw new Error("Age must be a positive number..dumbass")
            }
        }
    },
    tokens:[{
        token:{
            type: String,
            required: true
        }
    }],
    avatar:{
        type: Buffer
    }
},{
    timestamps: true
})

UserSchema.virtual("tasks", {
    ref: "Task",
    localField: "_id",
    foreignField: "owner"
})

UserSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

UserSchema.methods.generateAuthToken = async function(){
    const user = this

    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({token})

    await user.save()
    return token
}

UserSchema.statics.findByCredentials= async(email, password)=>{
    const user = await User.findOne({ email})

    if(!user){
        throw new Error("Unable to login")
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch){
        throw new Error("Unable to login")
    }

    return user
}

UserSchema.pre("save", async function(next){
    const user = this

    if(user.isModified("password")){
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

UserSchema.pre("remove", async function(next){
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})

const User = mongoose.model("User", UserSchema) 
module.exports = User