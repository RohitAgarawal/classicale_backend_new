import { UserModel } from "../model/user.js";
import AdminModel from "../model/admin.js";
import mongoose, { Model } from "mongoose";
import nodemailer from "nodemailer";
import { SubProductTypeModel } from "../model/sub_product_type.js";
import { ProductTypeModel } from "../model/product_type.js";
import { BikeModel } from "../model/bike.js";
import { CarModel } from "../model/car.js";
import { BookSportHobbyModel } from "../model/book_sport_hobby.js";
import { ElectronicModel } from "../model/electronic.js";
import { FurnitureModel } from "../model/furniture.js";
import { JobModel } from "../model/job.js";
import { PetModel } from "../model/pet.js";
import { ServicesModel } from "../model/services.js";
import { SmartPhoneModel } from "../model/smart_phone.js";
import { OtherModel } from "../model/other.js";
import { PropertyModel } from "../model/property.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { saveBase64Image } from "../utils/image_store.js";

// Fix __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const addProduct_remove = async (req, res) => {
  try {
    // 🔍 Find the user
    const user = await UserModel.findOne({ userId: req.user?.userId });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const productData = { ...req.body };

    // 🖼️ Handle image uploads
    if (req.files?.images) {
      if (!Array.isArray(req.files.images)) {
        req.files.images = [req.files.images];
      }
      productData.images = req.files.images.map(
        (img) => `/public/images/${img.filename}`
      );
    } else {
      productData.images = [];
    }

    if (req.files?.pdfResume && req.files.pdfResume.length > 0) {
      const pdfFilePath = `/public/pdfs/${req.files.pdfResume[0].filename}`;
      console.log("✅ Uploaded PDF Path:", pdfFilePath);
      productData.pdfResume = pdfFilePath;
    } else {
      console.log("❌ No PDF uploaded.");
    }
    console.log("PDF Path:", productData.pdfResume);

    console.log("PDF Path:", productData.pdfResume);

    // 🗂️ Set other product data
    // productData.userId = req.user.userId;
    productData.addProductUserId = user._id;
    productData.createdTime = Date.now();
    productData.updatedTime = Date.now();
    productData.location = {
      state: user.state || "Unknown",
      district: user.district || "Unknown",
      locationName: user.locationName || "Unknown",
    };

    // 🆕 Create and save the new product
    const newProduct = new ProductModel(productData);
    await newProduct.save();

    // 📄 Send PDF link in response
    res.status(201).json({
      message: "Product added successfully!",
      productId: newProduct._id,
      product: newProduct,
      //pdfLink: `${req.protocol}://${req.get("host")}${productData.pdfResume}`, // 📄 PDF link
    });
  } catch (error) {
    console.log("Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

export const showProduct = async (req, res) => {
  try {
    // Query parameters ko decode karein
    const state = decodeURIComponent(req.query.state || "").trim();
    const district = decodeURIComponent(req.query.district || "").trim();
    const locationName = decodeURIComponent(
      req.query.locationName || ""
    ).trim();
    const searchQuery = decodeURIComponent(req.query.search || "").trim();

    // Special characters ko escape karein
    const escapeRegex = (str) => {
      return str.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, "\\$&");
    };

    // Default query: isDeleted false hone chahiye
    const query = { isDeleted: false };

    // ✅ Location-based filters (अगर यूज़र ने फ़िल्टर दिए हैं)
    if (state) {
      query["location.state"] = { $regex: new RegExp(escapeRegex(state), "i") };
    }
    if (district) {
      query["location.district"] = {
        $regex: new RegExp(escapeRegex(district), "i"),
      };
    }
    if (locationName) {
      query["location.locationName"] = {
        $regex: new RegExp(escapeRegex(locationName), "i"),
      };
    }
    if (searchQuery) {
      query["$or"] = [
        { productType: { $regex: new RegExp(escapeRegex(searchQuery), "i") } },
        {
          subProductType: { $regex: new RegExp(escapeRegex(searchQuery), "i") },
        },
        { productName: { $regex: new RegExp(escapeRegex(searchQuery), "i") } },
        { description: { $regex: new RegExp(escapeRegex(searchQuery), "i") } },
        { category: { $regex: new RegExp(escapeRegex(searchQuery), "i") } },
        { brand: { $regex: new RegExp(escapeRegex(searchQuery), "i") } },
        { title: { $regex: new RegExp(escapeRegex(searchQuery), "i") } },
        {
          "location.state": {
            $regex: new RegExp(escapeRegex(searchQuery), "i"),
          },
        },
        {
          "location.district": {
            $regex: new RegExp(escapeRegex(searchQuery), "i"),
          },
        },
        {
          "location.locationName": {
            $regex: new RegExp(escapeRegex(searchQuery), "i"),
          },
        },
      ];
    }

    console.log("Constructed Query:", JSON.stringify(query, null, 2));
    const products = await ProductModel.find(query);

    if (!products.length) {
      return res.status(404).json({
        message: `No products found for search: ${searchQuery}, district: ${district}, state: ${state}`,
      });
    }

    res.status(200).json(products);
  } catch (err) {
    console.error("Error in showProduct:", err);
    res.status(500).send("Internal Server Error");
  }
};

export const showUserAddProduct = async (req, res) => {
  const { addProductUserId } = req.body;

  if (!addProductUserId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    // Fetch products associated with the given userId
    const products = await ProductModel.find({
      addProductUserId: addProductUserId,
    });
    console.log("produts:----", products);

    // Return both the products and the count of products
    res.json({
      products,
      productCount: products.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getProductsWithUserDetails = async (req, res) => {
  try {
    // Fetch all products and populate user details
    const products = await ProductModel.find().populate(
      "userId",
      "firstName email profileImage"
    );

    console.log(products.firstName);
    console.log("dart");

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    return res.status(200).json(products);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const softDeleteProduct = async (req, res) => {
  try {
    const { productId, addProductUserId } = req.body;

    // Find the product by its ID
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the user who owns the product is the one requesting the deletion
    if (product.addProductUserId.toString() !== addProductUserId) {
      return res
        .status(403)
        .json({ message: "You can only delete your own products." });
    }

    // Mark the product as deleted (soft delete)
    product.isDeleted = true;
    product.deletedAt = new Date();

    // Save the changes
    await product.save();

    return res.status(200).json({ message: "Product successfully deleted" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const requestPdfAccess = async (req, res) => {
  const { uploaderId, receiverEmail, pdfUrl, pdfName, requesterName } =
    req.body;

  try {
    // 🟢 Uploader User खोजें
    const uploader = await UserModel.findById(uploaderId);
    if (!uploader) {
      return res.status(404).json({ message: "Uploader not found" });
    }

    // 🟢 Nodemailer Setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "ttsnikol89@gmail.com",
        pass: "qkrn wlbu wnft qzgn",
      },
    });

    // 🟢 Email Options
    const mailOptions = {
      from: '"Support Team" <support@yourdomain.com>',
      to: uploader.email,
      subject: "PDF Access Request",
    };

    // 🟢 Email Send करें
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Access request email sent to uploader." });
  } catch (error) {
    console.error("Error sending PDF access request:", error);
    res.status(500).json({ message: "Failed to send access request email." });
  }
};

const productModels = {
  Bike: BikeModel,
  Car: CarModel,
  book_sport_hobby: BookSportHobbyModel,
  electronic: ElectronicModel,
  furniture: FurnitureModel,
  Job: JobModel,
  pet: PetModel,
  smart_phone: SmartPhoneModel,
  services: ServicesModel,
  other: OtherModel,
  property: PropertyModel,
};
//add Product
export const addProduct = async (req, res) => {
  try {
    let { data } = req.body;
    console.log(data);
    console.log("++++++++");
    if (!data.userId) {
      console.log("missing UserId", userId);
      return res.status(400).json({ message: "UserId is required" });
    }

    if (!data.productType) {
      console.log("missing product type");
      return res.status(400).json({ message: "Product Type is required" });
    }
    if (!data.subProductType) {
      console.log("missing sub-product type");
      return res.status(400).json({ message: "Sub-Product Type is required" });
    }

    // ✅ Validate if productType exists
    const _productType = await ProductTypeModel.findById(data.productType);
    if (!_productType) {
      console.log("product type not found in db");
      return res.status(404).json({ message: "Product Type not found" });
    }

    // ✅ Validate if subProductType exists under the correct productType
    const _subProductType = await SubProductTypeModel.findOne({
      _id: data.subProductType,
      productType: data.productType,
    });

    if (!_subProductType) {
      console.log("Sub Product Type not found");
      return res.status(404).json({
        message:
          "SubProduct Type not found or does not belong to this Product Type",
      });
    }
    let productImages = data.productImages;
    let imagePaths = [];
    // 🛠 Handle case where productImages is a JSON string instead of an array
    if (typeof productImages === "string") {
      try {
        productImages = JSON.parse(productImages);
      } catch (err) {
        console.error("❌ Failed to parse productImages:", err);
        productImages = [];
      }
    }

    for (const base64Image of productImages) {
      const imagePath = saveBase64Image(
        base64Image,
        "productImages",
        "product"
      );
      imagePaths.push(imagePath);
    }
    data.images = imagePaths; // Add saved image paths to the data object
    // }
    console.log("++++++++++++++++++++++++++++++++++++++++++++++++");
    console.log(imagePaths);
    // ✅ Dynamically get the correct model
    const Model = productModels[_productType.modelName];
    if (!Model) {
      console.log("model not found ");
      return res.status(400).json({ message: "Invalid Model Name" });
    }

    const product = new Model(data);
    await product.save();

    return res.status(200).json({
      message: `${_productType.name} added successfully`,
      product,
    });
  } catch (error) {
    console.log("❌ Server Error:", error.message);
    res.status(500).json({ message: "Server error!", error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { userId, productId, productType, subProductType, ...data } =
      req.body;

    if (!productId)
      return res.status(400).json({ message: "Product ID is required" });

    if (!productType)
      return res.status(400).json({ message: "Product Type is required" });

    const _productType = await ProductTypeModel.findById(productType);
    if (!_productType)
      return res.status(404).json({ message: "Product Type not found" });

    if (!subProductType)
      return res.status(400).json({ message: "Sub-Product Type is required" });

    const _subProductType = await SubProductTypeModel.findOne({
      _id: subProductType,
      productType,
    });
    if (!_subProductType)
      return res.status(404).json({
        message:
          "SubProduct Type not found or does not belong to this Product Type",
      });

    const Model = productModels[_productType.modelName];
    if (!Model) return res.status(400).json({ message: "Invalid Model Name" });

    const product = await Model.findById(productId)
      .populate({
        path: "productType",
      })
      .populate({
        path: "subProductType",
        select: "-modelName -productType",
      })
      .populate({
        path: "userId",
        select:
          "fName lName mName email phone profileImage state district country area ", // Only pull the fName of the user
      });
    if (!product) return res.status(404).json({ message: "Product not found" });

    // ✅ Parse and Save New Images (if sent)
    let productImages = req.body.productImages;
    let imagePaths = [];

    if (typeof productImages === "string") {
      try {
        productImages = JSON.parse(productImages);
      } catch (err) {
        console.error("❌ Failed to parse productImages:", err);
        productImages = [];
      }
    }

    if (Array.isArray(productImages) && productImages.length > 0) {
      // Preserve the first image and push new ones
      for (const base64Image of productImages) {
        const imagePath = saveBase64Image(
          base64Image,
          "productImages",
          "product"
        );
        imagePaths.push(imagePath);
      }

      // Add new images to the existing ones without replacing the 0th index
      product.images = product.images; // Preserve the 0th index image
      product.images.push(...imagePaths);
    }

    // ✅ Update fields with history tracking (similar to updateUser)
    for (const key in data) {
      if (Array.isArray(product[key]) && typeof data[key] === "string") {
        // If the field is an array and the new value is a string
        product[key] = [product[key][1] || product[key][0] || "", data[key]];
      } else if (Array.isArray(product[key]) && Array.isArray(data[key])) {
        // If both the field and new value are arrays
        product[key] = [product[key][1] || product[key][0] || "", data[key][0]];
      } else if (data[key]) {
        // For non-array fields or when the new value is not an array
        product[key] = data[key];
      }
    }

    // Log the updated product for debugging
    console.log("Product updated with history tracking");

    await product.save();

    return res.status(200).json({
      message: `${_productType.name} updated successfully`,
      product,
    });
  } catch (error) {
    console.error("❌ Server Error:", error.message);
    res.status(500).json({ message: "Server error!", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { productId, productType } = req.params; // ✅ FIXED

    if (!productId || !productType) {
      return res
        .status(400)
        .json({ message: "Product ID and Product Type are required" });
    }

    const _productType = await ProductTypeModel.findById(productType);
    if (!_productType) {
      return res.status(404).json({ message: "Product Type not found" });
    }

    const Model = productModels[_productType.modelName];
    if (!Model) {
      return res.status(400).json({ message: "Invalid product type model" });
    }

    const product = await Model.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Mark as soft-deleted
    product.isDeleted = true;
    await product.save();

    return res
      .status(200)
      .json({ message: "Product deleted successfully (soft delete)" });
  } catch (error) {
    console.error("❌ Delete Error:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const addFavoriteProduct = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        message: "User ID and Product ID are required.",
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if product already exists in favorites
    const existingIndex = user.favorite.findIndex(
      (fav) => fav.productId.toString() === productId.toString()
    );

    if (existingIndex !== -1) {
      // ✅ Product already in favorites —> remove it
      user.favorite.splice(existingIndex, 1);
      await user.save();
      return res.status(200).json({
        message: "Product removed from favorites.",
        favorite: user.favorite,
      });
    }

    // 🔍 Find the model name dynamically
    let foundModelName = null;
    for (const [modelName, Model] of Object.entries(productModels)) {
      const product = await Model.findById(productId);
      if (product) {
        foundModelName = modelName;
        break;
      }
    }

    if (!foundModelName) {
      return res
        .status(404)
        .json({ message: "Product not found in any model." });
    }

    // ➕ Add to favorites
    user.favorite.push({ productId, modelName: foundModelName });
    await user.save();

    return res.status(200).json({
      message: "Product added to favorites.",
      favorite: user.favorite,
    });
  } catch (err) {
    console.error("❌ Error in addFavoriteProduct:", err.message);
    return res.status(500).json({
      message: "Server error.",
      error: err.message,
    });
  }
};

export const getFavoriteProducts = async (req, res) => {
  try {
    const userId = req.params.userId || req.query.userId;
    console.log(userId);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const favoriteProducts = [];

    for (const favoriteItem of user.favorite) {
      const { productId, modelName } = favoriteItem;

      const ProductModel = productModels[modelName];
      if (ProductModel) {
        const product = await ProductModel.findById(productId)
          .populate({
            path: "productType",
          })
          .populate({
            path: "subProductType",
            select: "-modelName -productType",
          })
          .populate({
            path: "userId", // Correct field to populate
            select:
              "fName lName mName email phone profileImage state district country area ", // Only pull the fName of the user
          });
        if (product) {
          favoriteProducts.push({
            ...product._doc,
            modelName, // For frontend reference
          });
        }
      }
    }
    console.log("Favorites from DB:", user.favorite);

    return res.status(200).json({
      message: "Favorite products fetched successfully.",
      products: favoriteProducts,
    });
  } catch (err) {
    console.error("❌ Error in getFavoriteProducts:", err.message);
    return res.status(500).json({
      message: "Server error.",
      error: err.message,
    });
  }
};

// add other product
export const addOtherProduct = async (req, res) => {
  try {
    let { data } = req.body;
    // ✅ Assign user ID
    if (!data.userId) {
      console.log("missing UserId", userId);
      return res.status(400).json({ message: "UserId is required" });
    }
    // ✅ Convert type string to number
    if (typeof data.type === "string") {
      switch (data.type.toLowerCase()) {
        case "other":
          data.type = 0;
          break;
        case "job":
          data.type = 1;
          break;
        case "service":
          data.type = 2;
          break;
        default:
          return res.status(400).json({
            message: "Invalid type. Must be 'nil', 'job', or 'service'",
          });
      }
    }
    console.log(data.price);
    console.log(data.title);
    console.log(data.description);
    console.log(data.productType);
    console.log(data.subProductTypeName);
    if (!data?.productType) {
      console.log("❌ Missing product type");
      return res.status(400).json({ message: "Product Type is required" });
    }

    // 🔁 Handle subProductType or create a new one
    if (!data.subProductType) {
      if (!data.subProductTypeName) {
        console.log("❌ Missing sub-product type name");
        return res
          .status(400)
          .json({ message: "Sub-Product Name is required" });
      }

      const existingSub = await SubProductTypeModel.findOne({
        name: data.subProductTypeName,
      });

      console.log(existingSub);

      if (existingSub) {
        return res
          .status(400)
          .json({ message: "Product Type already exists." });
      }

      const subProductType = new SubProductTypeModel({
        name: data.subProductTypeName,
        productType: data.productType,
      });

      await subProductType.save();
      data.subProductType = subProductType._id;
    }

    // 🔍 Validate Product Type
    const productTypeDoc = await ProductTypeModel.findById(data.productType);
    if (!productTypeDoc) {
      return res.status(404).json({ message: "Product Type not found" });
    }

    // 🔍 Validate SubProduct Type
    const subProductTypeDoc = await SubProductTypeModel.findOne({
      _id: data.subProductType,
      productType: data.productType,
    });

    if (!subProductTypeDoc) {
      return res.status(404).json({
        message: "SubProduct Type not found or not linked to the Product Type",
      });
    }

    // 🖼️ Handle product images
    let productImages = data.productImages;
    console.log("---------------------------->");
    console.log(productImages.length);
    console.log("---------------------------->");
    let imagePaths = [];

    if (typeof productImages === "string") {
      try {
        productImages = JSON.parse(productImages);
      } catch (err) {
        console.error("❌ Failed to parse productImages:", err);
        productImages = [];
      }
    }

    if (Array.isArray(productImages)) {
      for (const base64Image of productImages) {
        const imagePath = await saveBase64Image(
          base64Image,
          "productImages",
          "product"
        );
        console.log(imagePath);
        imagePaths.push(imagePath);
      }
    }

    data.images = imagePaths;
    console.log(data.images);
    // ✅ Save the product
    const product = new OtherModel(data);
    await product.save();

    return res.status(200).json({
      message: `${productTypeDoc.name} added successfully`,
      product,
    });
  } catch (error) {
    console.error("❌ Server Error:", error.message);
    return res
      .status(500)
      .json({ message: "Server error!", error: error.message });
  }
};

const MIN_FOUND_PRODUCTS = 1;

export const getAllProducts = async (req, res) => {
  try {
    const { userId } = req.query;
    const { area, city, state, country } = req.headers;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }
    

    const user = await UserModel.findById(userId);
    const userCategory = user?.userCategory;

    const categoryMap = {
      α: ["D"],
      β: ["E"],
      A: ["A", "B", "D", "E"],
      B: ["B", "C", "D", "E"],
    };

    const categoryFilter = categoryMap[userCategory];
    if (!categoryFilter) {
      return res.status(400).json({ message: "Invalid user category" });
    }

    let allProducts = {};
    let found = false;

    // ------------------------
    // Helper: Build aggregation pipeline
    // ------------------------
    const buildPipeline = () => {
      const pipeline = [];

      // ✅ Base match conditions
      const baseMatch = {
        isActive: true,
        isDeleted: false,
        categories: { $in: categoryFilter },
      };

      // ✅ Implement location hierarchy
      if (area) {
        baseMatch.areaLatest = area;
      } else if (city) {
        baseMatch.cityLatest = city;
      } else if (state) {
        baseMatch.stateLatest = state;
      } else if (country) {
        baseMatch.countryLatest = country;
      }

      pipeline.push({ $match: baseMatch });

      // Lookup user (with filter + projection)
      pipeline.push({
        $lookup: {
          from: "users",
          let: { userId: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$userId"] },
                isActive: true,
                isDeleted: false,
              },
            },
            {
              $project: {
                fName: 1,
                lName: 1,
                email: 1,
                phone: 1,
                profileImage: 1,
                state: 1,
                district: 1,
                country: 1,
                area: 1,
              },
            },
          ],
          as: "userId",
        },
      });
      pipeline.push({ $unwind: "$userId" });

      // Lookup productType
      pipeline.push({
        $lookup: {
          from: "producttypes",
          localField: "productType",
          foreignField: "_id",
          as: "productType",
        },
      });
      pipeline.push({ $unwind: "$productType" });

      // Lookup subProductType
      pipeline.push({
        $lookup: {
          from: "subproducttypes",
          localField: "subProductType",
          foreignField: "_id",
          as: "subProductType",
        },
      });
      pipeline.push({
        $unwind: { path: "$subProductType", preserveNullAndEmptyArrays: true },
      });

      // Limit (for performance)
      pipeline.push({ $limit: 50 });

      return pipeline;
    };

    // ------------------------
    // Search using location hierarchy
    // ------------------------
    let tempProducts = {};
    let totalFound = 0;

    for (const [key, Model] of Object.entries(productModels)) {
      const pipeline = buildPipeline();
      const results = await Model.aggregate(pipeline);
      if (results.length > 0) {
        tempProducts[key] = results;
        totalFound += results.length;
      }
    }

    if (totalFound >= MIN_FOUND_PRODUCTS) {
      allProducts = tempProducts;
      found = true;
    }

    return res.status(200).json({
      message: found ? "✅ Products found." : "❌ No products found.",
      products: allProducts,
    });
  } catch (error) {
    console.error("❌ Server Error:", error.message);
    return res.status(500).json({
      message: "Server error!",
      error: error.message,
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { productId, model } = req.query;

    // Validate input
    if (!productId || !model) {
      return res
        .status(400)
        .json({ message: "Product ID and Type are required" });
    }

    // Find the correct model
    const Model = productModels[model];
    if (!Model) {
      return res.status(400).json({ message: "Invalid Product Type" });
    }

    // Fetch the product
    const product = await Model.findById(productId)
      .populate({
        path: "productType",
      })
      .populate({
        path: "subProductType",
        select: "-modelName -productType",
      })
      .populate({
        path: "userId",
        select:
          "fName lName mName email phone profileImage state district country area ", // Only pull the fName of the user
      });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ message: "Server error!", error: error.message });
  }
};

export const getProductByCategory = async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    let allProducts = [];

    // Loop through all product models
    for (const modelKey in productModels) {
      const Model = productModels[modelKey];

      const products = await Model.find({ categories: category })
        .populate({
          path: "productType",
        })
        .populate({
          path: "subProductType",
          select: "-modelName -productType",
        })
        .populate({
          path: "userId",
          select:
            "fName lName mName email phone profileImage state district country area ", // Only pull the fName of the user
        });

      allProducts = allProducts.concat(products);
    }

    return res.status(200).json({
      message: "Products fetched successfully",
      products: allProducts,
    });
  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ message: "Server error!", error: error.message });
  }
};

// GET /api/products/by-user/:userId
export const getProductsByUser = async (req, res) => {
  try {
    const { userId } = req.query;
    const reqUser = req.user;
    console.log({reqUser});

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    // ✅ Check if reqUser exists
    if (!reqUser || !reqUser._id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let userCategoryList = [];
    
    // ✅ Check if the requesting user is an admin or a regular user
    if (reqUser.role === "admin") {
      // 🔑 Verify admin exists in database before granting full access
      const adminUser = await AdminModel.findById(reqUser._id);
      
      if (!adminUser || adminUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Invalid admin credentials." });
      }
      
      console.log("✅ Verified admin requesting user products - full access granted");
      userCategoryList = ["A", "B", "C", "D", "E", "α", "β"]; // All categories
    } else {
      // 👤 Regular user - check their read/write permissions
      const reqUserData = await UserModel.findById(reqUser._id.toString());
      console.log({reqUserData});
      
      if (!reqUserData) {
        return res.status(404).json({ message: "Requesting user not found" });
      }
      
      const userReadCategoryList = reqUserData.read || [];
      const userWriteCategoryList = reqUserData.write || [];
      userCategoryList = [...userReadCategoryList, ...userWriteCategoryList];
    }

    let allUserProducts = [];
    console.log(userCategoryList);

    for (const key in productModels) {
      const Model = productModels[key];
      const products = await Model.find({
        userId,
        categories: { $in: userCategoryList },
      })
        .populate({
          path: "productType",
        })
        .populate({
          path: "subProductType",
          select: "-modelName -productType",
        })
        .populate({
          path: "userId",
          select:
            "fName lName mName email phone profileImage state district country area ", // Only pull the fName of the user
        });

      allUserProducts.push(...products);
    }
    console.log(allUserProducts);

    return res.status(200).json({
      count: allUserProducts.length,
      products: allUserProducts,
    });
  } catch (error) {
    console.error("❌ Error in getProductsByUserId:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const searchableFields = [
  "adTitle",
  "description",
  "price",
  "brand",
  "model",
  "bhk",
  "address1",
  "facing",
  "area",
  "productType",
  "subProductType",
];

export const searchProduct = async (req, res) => {
  try {
    const {
      keyword = "",
      categories,
      productType,
      subProductType,
      latitude,
      longitude,
      area,
      city,
      state,
    } = req.query;

    const regex = new RegExp(keyword, "i");

    // 🔍 Get productType/subProductType matches by name
    const matchingProductTypes = await ProductTypeModel.find({
      name: regex,
    }).select("_id");
    const matchingSubProductTypes = await SubProductTypeModel.find({
      name: regex,
    }).select("_id");

    const queryConditions = {
      isActive: true,
      isDeleted: false,
    };

    // ✅ Geo filtering (20km)
    if (latitude && longitude) {
      queryConditions.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: 20000, // 20 km
        },
      };
    }

    // ✅ Field filters
    if (categories) queryConditions.categories = categories;
    if (productType) queryConditions.productType = productType;
    if (subProductType) queryConditions.subProductType = subProductType;

    // ✅ Location field filters
    if (area)
      queryConditions["location.area"] = { $regex: area, $options: "i" };
    if (city)
      queryConditions["location.city"] = { $regex: city, $options: "i" };
    if (state)
      queryConditions["location.state"] = { $regex: state, $options: "i" };

    const populateOptions = [
      { path: "productType", select: "_id name modelName" },
      { path: "subProductType", select: "_id name" },
      {
        path: "userId",
        select:
          "fName lName mName email phone state district country area profileImage _id",
      },
    ];

    const results = [];

    for (const [modelName, Model] of Object.entries(productModels)) {
      const orConditions = [
        { adTitle: regex },
        { description: regex },
        { price: regex },
        { brand: regex },
        { model: regex },
        { bhk: regex },
        { facing: regex },
        { area: regex }, // ✅ include area in search
        { city: regex }, // optional: city in search
        { state: regex }, // optional: state in search
      ];

      if (matchingProductTypes.length > 0) {
        orConditions.push({
          productType: { $in: matchingProductTypes.map((p) => p._id) },
        });
      }

      if (matchingSubProductTypes.length > 0) {
        orConditions.push({
          subProductType: { $in: matchingSubProductTypes.map((s) => s._id) },
        });
      }

      const modelResults = await Model.find({
        ...queryConditions,
        $or: orConditions,
      })
        .populate(populateOptions)
        .lean();

      results.push(...modelResults.map((p) => ({ ...p, type: modelName })));
    }

    if (!results.length) {
      return res.status(201).json({
        message: "No products found",
        count: 0,
        data: [],
      });
    }

    res.status(200).json({
      message: "Search results",
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("❌ Error in searchProduct:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const filterProduct = async (req, res) => {
  try {
    const { productType, subProductType, maxPrice, minPrice, categories } =
      req.query;

    if (subProductType && !productType) {
      return res.status(400).json({
        message: "productType is required when subProductType is provided",
      });
    }

    const filter = { isActive: true, isDeleted: false };

    let modelName = null;

    if (productType) {
      const pt = await ProductTypeModel.findById(productType);
      if (!pt) return res.status(400).json({ message: "Invalid productType" });
      filter.productType = pt._id;
      modelName = pt.modelName;
    }

    if (subProductType) {
      const spt = await SubProductTypeModel.findById(subProductType);
      if (!spt)
        return res.status(400).json({ message: "Invalid subProductType" });
      filter.subProductType = spt._id;
    }

    if (categories) {
      filter.categories = { $in: categories };
    }

    const populateOptions = [
      { path: "productType", select: "_id name modelName" },
      { path: "subProductType", select: "_id name" },
      {
        path: "userId",
        select:
          "fName lName mName email phone state district country area profileImage _id",
      },
    ];

    let allProducts = [];

    const fetchFromModel = async (Model, name) => {
      const items = await Model.find(filter).populate(populateOptions).lean();
      return items.map((i) => ({ ...i, type: name }));
    };

    if (modelName && productModels[modelName]) {
      allProducts = await fetchFromModel(productModels[modelName], modelName);
    } else {
      const results = await Promise.all(
        Object.entries(productModels).map(([name, Model]) =>
          fetchFromModel(Model, name)
        )
      );
      allProducts = results.flat();
    }

    if (minPrice || maxPrice) {
      allProducts = allProducts.filter((p) => {
        const prices = p.price;
        if (!Array.isArray(prices) || !prices.length) return true;

        const last = parseFloat(prices[prices.length - 1]);
        return (
          (!minPrice || last >= parseFloat(minPrice)) &&
          (!maxPrice || last <= parseFloat(maxPrice))
        );
      });
    }

    res.status(200).json({
      message: allProducts.length
        ? "Products fetched successfully"
        : "No products found",
      count: allProducts.length,
      data: allProducts,
    });
  } catch (error) {
    console.error("❌ Error in filterProduct:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteProductImage = async (req, res) => {
  const { imagePath, productId, modelName } = req.body;

  if (!imagePath) {
    return res.status(400).json({ message: "Image path is required" });
  }
  if (!productId) {
    return res.status(400).json({ message: "Product ID is required" });
  }
  if (!modelName) {
    return res.status(400).json({ message: "Model name is required" });
  }

  try {
    // Remove the image path from the database
    const Model = productModels[modelName];
    if (!Model) {
      return res.status(400).json({ message: "Invalid Model Name" });
    }

    const product = await Model.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Create the full path to the image
    const imageFilePath = path.join(__dirname, "..", imagePath);

    // Delete the image file from the server
    if (fs.existsSync(imageFilePath)) {
      fs.unlinkSync(imageFilePath);
      console.log("Image deleted from server");
    } else {
      console.log("Image file not found");
    }

    // Update the product document to remove the image path
    product.images = product.images.filter((img) => img !== imagePath);
    await product.save();
    console.log("Image path removed from database");

    return res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    return res.status(500).json({ message: "Failed to delete image" });
  }
};

//product active-inactive
export const toggleProductVisibility = async (req, res) => {
  try {
    const { productId, productType } = req.body;

    // if (!productId || !productType || typeof isActive !== "boolean") {
    //   return res.status(400).json({ message: "Missing required fields" });
    // }

    // Get model dynamically
    const _productType = await ProductTypeModel.findById(productType);
    if (!_productType) {
      return res.status(404).json({ message: "Invalid product type" });
    }

    const Model = productModels[_productType.modelName];
    if (!Model) {
      return res.status(400).json({ message: "Invalid model" });
    }

    const product = await Model.findById(productId)
      .populate({
        path: "productType",
      })
      .populate({
        path: "subProductType",
        select: "-modelName -productType",
      })
      .populate({
        path: "userId",
        select:
          "fName lName mName email phone profileImage state district country area ", // Only pull the fName of the user
      });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    // Toggle visibility
    const isActive = !product.isActive;
    product.isActive = isActive;
    await product.save();

    return res.status(200).json({
      message: `Product ${isActive ? "enabled" : "disabled"} successfully`,
      product,
    });
  } catch (error) {
    console.log("❌ Error toggling visibility:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getProductType = async (req, res) => {
  try {
    const productTypes = await ProductTypeModel.find();
    const typeCountsMap = {};

    // Iterate over each product model and count based on productType
    for (const Model of Object.values(productModels)) {
      const items = await Model.aggregate([
        {
          $match: {
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: "$productType",
            count: { $sum: 1 },
          },
        },
      ]);

      items.forEach(({ _id, count }) => {
        if (_id) {
          if (!typeCountsMap[_id]) {
            typeCountsMap[_id] = 0;
          }
          typeCountsMap[_id] += count;
        }
      });
    }

    // Merge count with product types
    const productTypesWithCount = productTypes.map((productType) => ({
      ...productType._doc,
      count: typeCountsMap[productType._id?.toString()] || 0,
    }));

    return res.status(200).json({
      message: "Product types fetched successfully",
      data: productTypesWithCount,
    });
  } catch (error) {
    console.error("Error in getProductType:", error);
    res.status(500).json({ message: "Error fetching product types", error });
  }
};

export const getSubProductType = async (req, res) => {
  try {
    const { productSubTypeId } = req.params;
    console.log("productSubTypeId", productSubTypeId);
    if (!productSubTypeId) {
      return res.status(400).json({ message: "Product Type ID is required" });
    }

    const subProductTypes = await SubProductTypeModel.find({
      productType: productSubTypeId,
    });
    return res.status(200).json({
      message: "Sub Product Types fetched successfully",
      data: subProductTypes,
    });
  } catch (error) {
    console.log("Error in getSubProductType:", error);
    res
      .status(500)
      .json({ message: "Error fetching sub product types", error });
  }
};

export const getProductTypesWithSubCategories = async (req, res) => {
  try {
    const result = await ProductTypeModel.aggregate([
      {
        $lookup: {
          from: "subproducttypes", // should match the actual MongoDB collection name (lowercase & plural)
          localField: "_id",
          foreignField: "productType",
          as: "subCategory",
        },
      },
      {
        $project: {
          name: 1,
          modelName: 1,
          subCategory: {
            $map: {
              input: "$subCategory",
              as: "sub",
              in: {
                _id: "$$sub._id",
                name: "$$sub.name",
              },
            },
          },
        },
      },
    ]);

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching product types:", error);
    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
};

//track view count product

export const trackProductView = async (req, res) => {
  try {
    const { productId, modelName, userId } = req.body;

    if (!productId || !modelName || !userId) {
      return res
        .status(400)
        .json({ message: "Product ID, model name, and user ID are required" });
    }

    const Model = productModels[modelName];
    if (!Model) {
      return res.status(400).json({ message: "Invalid model name" });
    }

    const product = await Model.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ Skip if user is the product owner
    if (userId === product.userId.toString()) {
      return res.status(200).json({
        message: "Owner's view is not tracked",
        totalViewCount: product.view_count.length,
      });
    }

    // ✅ Skip if user already viewed
    if (product.view_count.some((id) => id.toString() === userId)) {
      return res.status(200).json({
        message: "User has already viewed this product",
        totalViewCount: product.view_count.length,
      });
    }

    // ✅ Add user ID to view_count
    product.view_count.push(userId);
    await product.save();

    return res.status(200).json({
      message: "Product view tracked successfully",
      totalViewCount: product.view_count.length,
    });
  } catch (error) {
    console.error("❌ Error in trackProductView:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
