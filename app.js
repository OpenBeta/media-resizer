const express = require("express");
const sharp = require("sharp");
const { Storage, ApiError } = require("@google-cloud/storage");

const storage = new Storage();
const app = express();

const PORT = 8080;
const HOST = "0.0.0.0";
const BASE_STORAGE_IMAGE_URL = "https://storage.googleapis.com/";
const BUCKET = process.env.STORAGE_BUCKET || "openbeta-prod";

const getFormat = (webp, avif) => {
  return webp ? "webp" : avif ? "avif" : "jpeg";
};

app.get("/healthy", (req, res) => {
  res.send("yep.");
});

app.get("/version", (req, res) => {
  res.send(process.env.APP_VERSION);
});

app.get("*", async (req, res) => {
  try {
    if (!/\.(jpe?g|png|gif|webp)$/i.test(req.path)) {
      return res.status(400).send("Disallowed file extension");
    }

    const webp = req.headers.accept?.includes("image/webp");
    const avif = req.headers.accept?.includes("image/avif");
    const quality = Number(req.query.q) || 90;
    const width = Number(req.query.w) || undefined;
    const height = Number(req.query.h) || undefined;
    const format = getFormat(webp, avif);

    res
      .set("Cache-Control", "public, max-age=15552000")
      .set("Vary", "Accept")
      .type(`image/${format}`);

    const pipeline = sharp();

    storage
      .bucket(BUCKET)
      .file(req.path.slice(1)) // remove leading slash
      .createReadStream()
      .on("error", function (e) {
        if (e instanceof ApiError) {
          if (e.message?.includes("No such object"))
            return res.status(404).end();
        }
        return res.status(500).send(JSON.stringify(e));
      })
      .pipe(pipeline);

    pipeline
      .rotate()
      .resize({ width, height })
      .toFormat(format, { effort: 3, quality, progressive: true })
      .pipe(res);
  } catch (e) {
    return res.status(500).send(JSON.stringify(e));
  }
});

const port = parseInt(process.env.PORT) || PORT;
app.listen(port, HOST, () => {
  console.log(`Running on http://${HOST}:${port}`);
});
