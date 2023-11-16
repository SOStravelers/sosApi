// Import required AWS SDK clients and commands for Node.js.
import {
  PutObjectCommand,
  CreateBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { s3 } from "./awsClient.js";
import envar from "../config/envar.js";

export const AwsUploadFile = async (file) => {
  // Create an object and upload it to the Amazon S3 bucket.
  try {
    console.log("--upload bucket--");
    let params = {
      Bucket: envar().BUCKET_NAME_FILES,
      Key: file.fileName,
      Body: file.buffer,
    };
    console.log(params);
    const command = new PutObjectCommand(params);
    let results = await s3.send(command);
    // console.log(results)
    console.log(
      "Successfully created " +
        params.Key +
        " and uploaded it to " +
        params.Bucket +
        "/" +
        params.Key
    );
    let data = {
      results,
      url: `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`,
    };
    return data; // For unit tests.
  } catch (err) {
    console.log("Error", err);
  }
};
