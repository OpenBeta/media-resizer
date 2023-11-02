const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const express = require("express");
const sharp = require("sharp");

const app = express();
const PORT = 8080;
const HOST = "0.0.0.0";
const BASE_STORAGE_IMAGE_URL = "https://storage.googleapis.com";

const getImage = (path) => fetch(path).then((res) => res.arrayBuffer());
const getFormat = (webp, avif) => {
  return avif ? "avif" : webp ? "webp" : "jpeg";
};

app.get("/healthy", (req, res) => {
  res.send("yes");
});

app.get("*", async (req, res) => {
  try {
    const { searchParams, pathname, href } = new URL(
      `${BASE_STORAGE_IMAGE_URL}${req.url}`,
    );

    if (!/\.(jpe?g|png|gif|webp)$/i.test(pathname)) {
      return res.status(400).send("Disallowed file extension");
    }

    const webp = req.headers.accept?.includes("image/webp");
    const avif = req.headers.accept?.includes("image/avif");
    const quality = Number(searchParams.get("q")) || 90;
    const width = Number(searchParams.get("w")) || undefined;
    const height = Number(searchParams.get("h")) || undefined;
    const format = getFormat(webp, avif);

    const i = await getImage(href);
    const processedImage = await sharp(i)
      .rotate()
      .resize({ width, height })
      .toFormat(format, { quality });

    console.log(pathname, href);

    return res
      .set("Cache-Control", "public, max-age=15552000")
      .set("Vary", "Accept")
      .type(`image/${format}`)
      .send(await processedImage.toBuffer());
  } catch (e) {
    res.status(500).send(JSON.stringify(e));
  }
});

const port = parseInt(process.env.PORT) || PORT;
app.listen(port, HOST, () => {
  console.log(`Running on http://${HOST}:${port}`);
});
