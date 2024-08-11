import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.Model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Somthing went wrong while generating access and refresh tokens")
    }
}


const registerUser = asyncHandler(async (req, res)=>{
    //take data from user
    const { fullname, username, email, password } = req.body 
    // console.log("email:",email);
    
    //validation -not empty
    if ([fullname, username, email, password].some((field)=>field?.trim() === "")
    ) {
        throw new ApiError(400,"All fields is required")
    }
    
    //check if user already exists : username, email
    const existedUser = await User.findOne({
        $or : [{ email }, { username }]
    })
    if (existedUser) {
        throw new ApiError(409,"User Already Exists")
    }

    //check avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "AvatarImage is required")
    }
    
    //upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "AvatarImage is required in cloudinary")
    }

    //create user object - create entry in db
    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage.url || "",
        email,
        password,
        username

    })

    //check for user creation 
    //remove pass and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "somthing went wrong while registering user")
    }

    //return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Register Successfully")
    )
})


// login user
const loginUser = asyncHandler(async (req, res) =>{
    // take req -data
    console.log(req.body);
    
    const {username, email, password} = req.body

    // username or email
    if ( ! (username || email) ) {
        throw new ApiError(400, "Username or email is required")
    }

    //find user
    const user = await User.findOne({
        $or : [{username},{email}]
    })
    if (!user) {
        throw new ApiError(404,"User or email not exist")
    }

    //password check
    const isPasswordValid = await user.isPasswordCorrect(password)
    if ( !isPasswordValid ) {
        throw new ApiError(401, "Password is Incorrect")
    }

    //access and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
    const logedInUser = await User.findById(user._id).select("-password -refreshToken")
    // console.log(logedInUser);
    
    
    //send cookies
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user : logedInUser,
                accessToken,
                refreshToken
            },
            "user Login Successfully"
        )
    )

})


const logOutUser = asyncHandler(async (req, res)=>{
    console.log(req.user._id);
    
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: undefined,
            }
        },
        {
            new: true,
        }
    )
    
    const options = {
        httpOnly: true,
        secure: true,
        expires: new Date(0)
    }
    return res.status(200)
    .cookie("accessToken","", options)
    .cookie("refreshToken","", options)
    .json({
        message: "Logged out successfully",
    });
})


export {
    registerUser,
    loginUser,
    logOutUser
}