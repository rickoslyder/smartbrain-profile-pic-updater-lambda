'use strict';

const AWS = require('aws-sdk');
const parseMultipart = require('parse-multipart');
const parser = require('lambda-multipart-parser');
const mime = require('mime-types')

const BUCKET = process.env.BUCKET;

const s3 = new AWS.S3();

const allowedFiles = [".jpg", ".jpeg", ".png", ".gif", ".bmp"]
const regex = RegExp("([a-zA-Z0-9\s_\\.\-:])+(" + allowedFiles.join('|') + ")$");

module.exports.handle = async (event) => {
  try {
    // const { name, data } = extractFile(event)
    const result = await parser.parse(event);
    console.log('result', result)
    const { filename, content } = result.files[0]
    console.log('filename', filename)
    console.log('regex', filename.match(regex))
    if (event.queryStringParameters.userId) {
      const newFilename = `profile-pic-${event.queryStringParameters.userId}`
      const newFileExt = filename.match(regex)[2]
      const newFile = `${newFilename}${newFileExt}`
      await s3.putObject({ 
        Bucket: BUCKET, 
        Key: newFile, 
        ACL: 'public-read', 
        Body: content, 
        ContentType: mime.contentType(newFile)
      }).promise()
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, userId, Access-Control-Allow-Origin, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          link: `https://${BUCKET}.s3.amazonaws.com/${newFile}`,
          input: event
        }),
      };
    } else {
      await s3.putObject({ 
        Bucket: BUCKET, 
        Key: filename, 
        ACL: 'public-read', 
        Body: content,
        ContentType: mime.contentType(filename)
      }).promise()
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, userId, Access-Control-Allow-Origin, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token',
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          link: `https://${BUCKET}.s3.amazonaws.com/${filename}`,
          input: event
        }),
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, userId, Access-Control-Allow-Origin, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token',
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ 
        message: err.stack,
        input: event.body
       })
    }
  }
};

// const extractFile = (event) => {
//   if (event.headers['content-type']) {
//     const boundary = parseMultipart.getBoundary(event.headers['content-type'])
//     console.log('boundary', boundary)
//     const parts = parseMultipart.Parse(Buffer.from(event.body, 'base64'), boundary);
//     console.log('parts', parts)
//     const [{ filename, data }] = parts
  
//     return {
//       filename,
//       data
//     }
//   } else {
//     const boundary = parseMultipart.getBoundary(event.headers['Content-Type'])    
//     const parts = parseMultipart.Parse(Buffer.from(event.body, 'base64'), boundary);
//     const [{ filename, data }] = parts
  
//     return {
//       filename,
//       data
//     }
//   }

// }