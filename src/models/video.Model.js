import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
        videoFile : {
            type : String, //cloudinary
            required : true,

        },
        thumnail : {
            type : String, 
            required : true,

        },
        title : {
            type : String, 
            required : true,

        },
        description : {
            type : String, 
            required : true,

        },
        duration : {
            type : Number, //cloudinary
            required : true,

        },
        views : {
            type : String,
            default : 0

        },
        isPublishsed : {
            type : Boolean,
            default : true

        },
        owner : {
            type : Schema.Types.ObjectId,
            ref : " User"
        }
},{timestamps : true,})


videoSchema.plugin(mongooseAggregatePaginate)


export const Video  = mongoose.model("Video",videoSchema)