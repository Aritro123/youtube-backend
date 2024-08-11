import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.Model.js"
import jwt from "jsonwebtoken";


export const verifyJwt = asyncHandler(async (req, _, next)=>{
    try {
        const token = req.cookies?.accessToken || req.
        header("Authorization")?.replace("bearer", "")
    
        // console.log(req.cookies);
        // console.log("token:",token);
        
        if (!token) {
            throw next(new ApiError(401, "Unauthorized request"))
            
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).
        select("-password -refreshToken")

        if (!user) {
            //todo: check
            throw next(new ApiError(401, "Invalid access token"))
        }
        
        req.user = user;
        next()
    } catch (error) {

        console.log(error);
        throw new ApiError(401, "Invalid access token 2")
    }

})