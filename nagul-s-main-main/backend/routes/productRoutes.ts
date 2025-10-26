import AWS from "aws-sdk";
import express, { Request, Response } from "express";
import config from "../config/dev";

const router = express.Router();

/* ----------------------------------------------------------------
   ✅ Step 1: Validate AWS Config Values


/* ----------------------------------------------------------------
   ✅ Step 2: Configure AWS SDK
---------------------------------------------------------------- */
AWS.config.update({
  region: config.aws_remote_config.region?.trim(),
  accessKeyId: config.aws_remote_config.accessKeyId?.trim(),
  secretAccessKey: config.aws_remote_config.secretAccessKey?.trim(),
});

/* ----------------------------------------------------------------
   ✅ Step 3: Verify AWS Credentials
---------------------------------------------------------------- */
const sts = new AWS.STS({
  region: config.aws_remote_config.region,
  accessKeyId: config.aws_remote_config.accessKeyId,
  secretAccessKey: config.aws_remote_config.secretAccessKey,
});



/* ----------------------------------------------------------------
   ✅ Step 4: Initialize DynamoDB Document Client with Credentials
---------------------------------------------------------------- */
const docClient = new AWS.DynamoDB.DocumentClient({
  region: config.aws_remote_config.region,
  accessKeyId: config.aws_remote_config.accessKeyId,
  secretAccessKey: config.aws_remote_config.secretAccessKey,
});

const table = config.aws_table_name;

/* ----------------------------------------------------------------
   ✅ Fetch All Products
---------------------------------------------------------------- */
router.get("/fetch", async (_req: Request, res: Response) => {
  try {
    const params = { TableName: table };
    const data = await docClient.scan(params).promise();
    res.json({ products: data.Items || [] });
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ message: "Error fetching products", error: err });
  }
});

/* ----------------------------------------------------------------
   ✅ Add a New Product
---------------------------------------------------------------- */
router.post("/add", async (req: Request, res: Response) => {
  try {
    let item = req.body;

    if (!item.product_id) {
      item.product_id = Date.now(); // Auto ID
    }

    if (Array.isArray(item.variants)) {
      item.variants = item.variants.map((v: any, i: number) => ({
        id: v.id ?? i + 1,
        ...v,
      }));
    }

    if (item.images && Array.isArray(item.images)) {
      // keep as is
    } else if (typeof item.image === "string" && item.image.length) {
      item.images = [item.image];
    } else {
      item.images = [];
    }
    delete item.image;

    item.lastUpdated = new Date().toISOString();

    const params = {
      TableName: table,
      Item: item,
    };

    await docClient.put(params).promise();
    res.json({ message: "✅ Product added successfully!", product: item });
  } catch (err) {
    console.error("❌ Error adding product:", err);
    res.status(500).json({ message: "Error adding product", error: err });
  }
});

/* ----------------------------------------------------------------
   ✅ Update Product
---------------------------------------------------------------- */
router.put("/update/:product_id", async (req: Request, res: Response) => {
  try {
    const { product_id } = req.params;
    const updatedData = req.body;

    let images: string[] = [];
    if (Array.isArray(updatedData.images)) {
      images = updatedData.images;
    } else if (typeof updatedData.image === "string" && updatedData.image.length) {
      images = [updatedData.image];
    }

    const params = {
      TableName: table,
      Key: { product_id: Number(product_id) },
      UpdateExpression: `
        set #n = :name,
            category = :category,
            images = :images,
            description = :desc,
            #s = :status,
            variants = :variants,
            lastUpdated = :lu
      `,
      ExpressionAttributeNames: {
        "#n": "name",
        "#s": "status",
      },
      ExpressionAttributeValues: {
        ":name": updatedData.name,
        ":category": updatedData.category,
        ":images": images,
        ":desc": updatedData.description,
        ":status": updatedData.status,
        ":variants": updatedData.variants,
        ":lu": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    };

    const data = await docClient.update(params).promise();
    res.json({ message: "✅ Product updated!", product: data.Attributes });
  } catch (err) {
    console.error("❌ Error updating product:", err);
    res.status(500).json({ message: "Error updating product", error: err });
  }
});

/* ----------------------------------------------------------------
   ✅ Delete Product
---------------------------------------------------------------- */
router.delete("/delete/:product_id", async (req: Request, res: Response) => {
  try {
    const { product_id } = req.params;

    if (!product_id || isNaN(Number(product_id))) {
      return res.status(400).json({ message: "Valid product_id is required" });
    }

    const params = {
      TableName: table,
      Key: { product_id: Number(product_id) },
    };

    await docClient.delete(params).promise();
    res.json({
      message: `✅ Product with product_id ${product_id} deleted successfully!`,
    });
  } catch (err) {
    console.error("❌ Error deleting product:", err);
    res.status(500).json({ message: "Error deleting product", error: err });
  }
});

/* ----------------------------------------------------------------
   ✅ Delete Specific Variant from a Product
---------------------------------------------------------------- */
router.delete("/:productId/variant/:variantId", async (req: Request, res: Response) => {
  const { productId, variantId } = req.params;

  try {
    const getParams = {
      TableName: table,
      Key: { product_id: Number(productId) },
    };

    const productData = await docClient.get(getParams).promise();

    if (!productData.Item) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updatedVariants = (productData.Item.variants || []).filter(
      (v: any) => v.id !== Number(variantId)
    );

    const updateParams = {
      TableName: table,
      Key: { product_id: Number(productId) },
      UpdateExpression: "set variants = :v, lastUpdated = :lu",
      ExpressionAttributeValues: {
        ":v": updatedVariants,
        ":lu": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    };

    const result = await docClient.update(updateParams).promise();
    res.json({
      message: `✅ Variant ${variantId} deleted from product ${productId}`,
      product: result.Attributes,
    });
  } catch (err) {
    console.error("❌ Error deleting variant:", err);
    res.status(500).json({ message: "Error deleting variant", error: err });
  }
});

export default router;
