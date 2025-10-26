const config = {
  aws_remote_config: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    region: process.env.AWS_REGION || "ap-south-1" // or your region
  },
  aws_table_name: process.env.AWS_TABLE_NAME || "product_table"
};

export default config;
