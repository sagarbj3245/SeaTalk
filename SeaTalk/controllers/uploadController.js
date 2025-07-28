
const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

exports.getPresignedUrl = async (req, res) => {
  const { fileName, fileType } = req.body;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${Date.now()}_${fileName}`,
    Expires: 60 * 5,
    ContentType: fileType,
   
  };

  try {
    const url = await s3.getSignedUrlPromise('putObject', params);
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    res.json({ uploadUrl: url, fileUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not generate URL' });
  }
};
