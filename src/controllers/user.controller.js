import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.Model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler(async (req, res)=>{
    //take data from user
    const { fullname, username, email, password } = req.body 
    console.log("email:",email);
    
    //validation -not empty
    if (
        [fullname, username, email, password].some((field)=>field?.trim() === "")
    ) {
        throw new ApiError(400,"All fields is required")
    }
    
    //check if user already exists : username, email
    const existedUser = User.findOne({
        $or : [{ email }, { username }]
    })
    if (existedUser) {
        throw new ApiError(409,"User Already Exists")
    }

    //check avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    
    if (avatarLocalPath) {
        throw new ApiError(400, "AvatarImage is required")
    }
    
    //upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (avatar) {
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
export {registerUser}