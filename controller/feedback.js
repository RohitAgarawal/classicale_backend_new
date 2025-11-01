import { FeatureRequest } from "../model/featureRequestSchema.js";
import { UserModel } from "../model/user.js";
import { sendEmail } from "../utils/sent_email.js";

// Feature Request Controllers
export const createFeatureRequest = async (req, res) => {
  try {
    const { title, description, userId } = req.body;
    const featureRequest = new FeatureRequest({
      title,
      statusMessage: description,
      userId,
    });
    await featureRequest.save();
    res.status(200).json({ success: true, data: featureRequest });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getAllFeatureRequests = async (req, res) => {
  try {
    const featureRequests = await FeatureRequest.aggregate([
      {
        $lookup: {
          from: "users", // Replace with your actual users collection name
          localField: "userId",
          foreignField: "_id",
          as: "userId",
        },
      },
      {
        $unwind: "$userId",
      },
      {
        $addFields: {
          "userId.fName": { $arrayElemAt: ["$userId.fName", -1] },
          "userId.lName": { $arrayElemAt: ["$userId.lName", -1] },
          "userId.mName": { $arrayElemAt: ["$userId.mName", -1] },
          "userId.profileImage": { $arrayElemAt: ["$userId.profileImage", -1] },
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
          status: 1,
          statusMessage: 1,
          "userId._id": 1,
          "userId.name": 1,
          "userId.email": 1,
          "userId.fName": 1,
          "userId.lName": 1,
          "userId.mName": 1,
          "userId.profileImage": 1,
        },
      },
    ]);

    res.status(200).json({ success: true, data: featureRequests });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch feature requests" });
  }
};

export const getFeatureRequestById = async (req, res) => {
  try {
    const featureRequest = await FeatureRequest.findById(
      req.params.id
    ).populate("userId", "name email");
    if (!featureRequest) {
      return res
        .status(404)
        .json({ success: false, error: "Feature request not found" });
    }
    res.status(200).json({ success: true, data: featureRequest });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateFeatureRequest = async (req, res) => {
  try {
    const featureRequest = await FeatureRequest.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        statusMessage: req.body.description,
      },
      { new: true }
    );
    if (!featureRequest) {
      return res
        .status(404)
        .json({ success: false, error: "Feature request not found" });
    }
    res.status(200).json({ success: true, data: featureRequest });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteFeatureRequest = async (req, res) => {
  try {
    const featureRequest = await FeatureRequest.findByIdAndDelete(
      req.params.id
    );
    if (!featureRequest) {
      return res
        .status(404)
        .json({ success: false, error: "Feature request not found" });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateFeatureRequestStatus = async (req, res) => {
  try {
    const { status, statusMessage } = req.body;

    // Validate status
    if (!["pending", "accepted", "declined"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be 'pending', 'accepted', or 'declined'",
      });
    }

    // Validate status message
    if (!statusMessage || statusMessage.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Status message is required",
      });
    }

    const featureRequest = await FeatureRequest.findByIdAndUpdate(
      req.params.id,
      { status, statusMessage },
      { new: true }
    );

    if (!featureRequest) {
      return res
        .status(404)
        .json({ success: false, error: "Feature request not found" });
    }

    // sent email to user about status update - TODO
    const user = await UserModel.findById(featureRequest.userId);
    if (user) {
      await sendEmail(
        user.email,
        "Feature Request Status Update",
        `Hello ${user.fName},\n\nYour feature request titled "${featureRequest.title}" has been ${status}.\n\nNote: ${statusMessage}\n\nThank you for your feedback!\n\nBest regards,\nSupport Team`
      );
    }

    res.status(200).json({ success: true, data: featureRequest });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
