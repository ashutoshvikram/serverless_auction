import AWS from "aws-sdk";
import validator from "@middy/validator";
import commonMiddleware from "../lib/commonMiddleware.js";
import createError from "http-errors";
import getAuctionSchema from "../lib/schemas/getAuctionSchema.js";
import { transpileSchema} from '@middy/validator/transpile'
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuctions(event, context) {
  let auctions;
  const { status } = event.queryStringParameters;
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: "statusAndEndDate",
    KeyConditionExpression: "#status=:status",
    ExpressionAttributeValues: {
      ":status": status,
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
  };
  try {
    const result = await dynamodb.query(params).promise();

    auctions = result.Items;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }
  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
}

export const handler = commonMiddleware(getAuctions).use(
  validator({ eventSchema: transpileSchema(getAuctionSchema), useDefaults: true })
);
