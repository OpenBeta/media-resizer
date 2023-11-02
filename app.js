const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const express = require("express");
const sharp = require("sharp");

const app = express();
const PORT = 8080;
const HOST = "0.0.0.0";
const BASE_STORAGE_IMAGE_URL = "https://storage.googleapis.com/openbeta-prod/u";

const getImage = (path) => fetch(path).then((res) => res.arrayBuffer());
const getFormat = (webp, avif) => {
  return avif ? "avif" : webp ? "webp" : "jpeg";
};

app.get("/healthy", (req, res) => {
  res.send("yes");
});
app.get("*", async (req, res) => {
  console.log(req.url);
  const { searchParams, pathname } = new URL(`http://noop.com${req.url}`);
  console.log(searchParams, pathname);

  if (!/\.(jpe?g|png|gif|webp)$/i.test(pathname)) {
    return res.status(400).send("Disallowed file extension");
  }

  const webp = req.headers.accept?.includes("image/webp");
  const avif = req.headers.accept?.includes("image/avif");
  const quality = Number(searchParams.get("q")) || 90;
  const width = Number(searchParams.get("w")) || undefined;
  const height = Number(searchParams.get("h")) || undefined;
  const format = getFormat(webp, avif);

  console.log("webp:", webp);
  console.log("avif:", avif);
  console.log("quality:", quality);
  console.log("width:", width);
  console.log("height:", height);

  const i = await getImage(`${BASE_STORAGE_IMAGE_URL}${pathname}`);
  const processedImage = await sharp(i)
    .resize({ width, height })
    .toFormat(format, { quality });
  return res
    .set("Cache-Control", "public, max-age=15552000")
    .set("Vary", "Accept")
    .type(`image/${format}`)
    .send(await processedImage.toBuffer());
});

const port = parseInt(process.env.PORT) || PORT;
app.listen(port, HOST, () => {
  console.log(`Running on http://${HOST}:${port}`);
});
