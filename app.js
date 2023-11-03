const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const express = require("express");
const sharp = require("sharp");

const app = express();
const PORT = 8080;
const HOST = "0.0.0.0";
const BASE_STORAGE_IMAGE_URL = "https://storage.googleapis.com";

const getImage = (path) =>
  fetch(path).then(async (r) => ({
    data: await r.arrayBuffer(),
    status: r.status,
  }));
const getFormat = (webp, avif) => {
  return webp ? "webp" : avif ? "avif" : "jpeg";
};

app.get("/healthy", (req, res) => {
  res.send("yep.");
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

    const { data, status } = await getImage(href);
    if (status > 399) {
      return res
        .status(415)
        .send("upstream server did not respond with a valid status code");
    }

    res
      .set("Cache-Control", "public, max-age=15552000")
      .set("Vary", "Accept")
      .type(`image/${format}`);

    sharp(data)
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
