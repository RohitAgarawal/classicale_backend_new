import mongoose from "mongoose";
const ReportProductSchema = new mongoose.Schema({

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    productId: { type: mongoose.Schema.Types.ObjectId},
    desctiption: { type: String },
    image: { type: String },
    modelName: { type: String },
    isActive: {type: Boolean, default: true},
    status: {
        type: String,
        enum: ["pending", "decline", "resolve"],
        default: "pending",
    },
    note: { type: String },
},
    {
        timestamps: true,
    }
)

export const ReportProductModel = mongoose.model("report_product", ReportProductSchema);