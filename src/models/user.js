const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
// const auth =  require('../middleware/auth')
const jwt = require('jsonwebtoken')
const Task = require('../models/task')

const userSchema = new mongoose.Schema(
    {
    name:{
        type:String,
        trim:true,
        required:true
    },
    password:{
        type:String,
        trim:true,
        required:true,
        minlength:7,
        validate(value){
            if(value.includes('password')){
                throw new Error('Password cannot contain "password" in it ')
            }
        }

    },
    email:{
        type:String,
        unique: true,
        required:true,
        trim:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid!')
            }
        }
    },
    age:{
        type:Number,
        trim:true,
        default:0,
        validate(value){
            if(value<0){
                throw new Error('Age must be a Positive number')
            }
        }
    },
    tokens:[{
        token:{
            type:String,
            required: true
        }
    }],
    avatar:{
        type:Buffer
    }
}, {
    timestamps:true
}
)

userSchema.virtual('tasks',{
    ref:'Task',
    localField:'_id',
    foreignField:'owner'
})


userSchema.methods.toJSON = function (){
    const user = this
    // console.log("user===...", user);
    const userObject = user.toObject()
    // console.log("userObject===>",userObject);

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar


    return userObject

}

//GENERATING THE TOKEN ON THE INSTANCE WITH USERSCHEMA.METHOD
userSchema.methods.generateAuthToken = async function (){
    const user = this 
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token:token })
    await user.save()
    return token
}



///
userSchema.statics.findByCredential = async (email,password) =>{
    const user = await User.findOne({ email })
    if(!user){
        throw new Error('Unable to login')
    }
     const isMatch = await bcrypt.compare(password, user.password)

     if(!isMatch){
         throw new Error('Unable to login')
     }

     return user
}


//HASH THE PLAIN TEXT PASSWORD BEFOR SAVING
userSchema.pre('save', async function(next){
    const user = this 

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})

const User = mongoose.model('User', userSchema)
User.createIndexes();
module.exports = User