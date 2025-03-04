import createError from "http-errors";
import { closeAuction } from "../lib/closeAuction.js";
import { getEndedAuctions } from "../lib/getEndedAuctions.js";


async function processAuctions(event, context) {
  console.log("Processing the auctions");
  try {
    const auctionsToClose = await getEndedAuctions();
    console.log(auctionsToClose);
    const close = auctionsToClose.map((auction) => closeAuction(auction));
    await Promise.all(close);
    return { closed: close.length };
  } catch (err) {
    throw new createError.InternalServerError(err);
  }
}

export const handler = processAuctions;
