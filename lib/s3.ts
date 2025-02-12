import AWS from "aws-sdk";
import { Readable } from "stream";
//axios是用来发送http请求的，所以需要pnpm add axios
import axios from "axios";
import fs from "fs";

//首先拿到配置，配置读的是配置文件里的内容
AWS.config.update({
  accessKeyId: process.env.AWS_AK,
  secretAccessKey: process.env.AWS_SK,
});

//创建一个s3的实例
const s3 = new AWS.S3();

//下载再上传图片，
export async function downloadAndUploadImage(
  imageUrl: string,
  bucketName: string,
  s3Key: string
) {
  try {
    //先下载图片，拿到文件流
    const response = await axios({
      method: "GET",
      url: imageUrl,
      responseType: "stream",
    });

    //再上传图片，拿到上传结果
    const uploadParams = {
      Bucket: bucketName,
      Key: s3Key,
      Body: response.data as Readable,
    };

    //上传图片，返回上传结果
    return s3.upload(uploadParams).promise();
  } catch (e) {
    console.log("upload failed:", e);
    throw e;
  }
}

//只下载。
export async function downloadImage(imageUrl: string, outputPath: string) {
  try {
    const response = await axios({
      method: "GET",
      url: imageUrl,
      responseType: "stream",
    });

    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      let error: Error | null = null;
      writer.on("error", (err) => {
        error = err;
        writer.close();
        reject(err);
      });

      writer.on("close", () => {
        if (!error) {
          resolve(null);
        }
      });
    });
  } catch (e) {
    console.log("upload failed:", e);
    throw e;
  }
}
